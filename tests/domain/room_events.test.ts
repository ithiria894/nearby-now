jest.mock("../../lib/backend", () => ({
  backend: {
    roomEvents: {
      getRoomEventsPageRpc: jest.fn(),
      getRoomEventByIdRpc: jest.fn(),
    },
  },
}));

import { getRoomEventsPage, getRoomEventById } from "../../lib/domain/room_events";
import { backend } from "../../lib/backend";

const mockGetPage = backend.roomEvents.getRoomEventsPageRpc as jest.Mock;
const mockGetById = backend.roomEvents.getRoomEventByIdRpc as jest.Mock;

afterEach(() => jest.clearAllMocks());

describe("getRoomEventsPage", () => {
  it("maps RPC rows to domain rows with profiles", async () => {
    mockGetPage.mockResolvedValue({
      data: [
        {
          id: "evt-1",
          activity_id: "act-1",
          user_id: "user-1",
          type: "message",
          content: "hello",
          created_at: "2026-01-01T00:00:00Z",
          display_name: "Alice",
        },
      ],
      error: null,
    });

    const result = await getRoomEventsPage({
      activityId: "act-1",
      limit: 50,
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].profiles).toEqual({ display_name: "Alice" });
    expect(result.rows[0].id).toBe("evt-1");
  });

  it("maps null display_name to null profiles", async () => {
    mockGetPage.mockResolvedValue({
      data: [
        {
          id: "evt-2",
          activity_id: "act-1",
          user_id: "user-2",
          type: "system",
          content: "joined",
          created_at: "2026-01-01T00:01:00Z",
          display_name: null,
        },
      ],
      error: null,
    });

    const result = await getRoomEventsPage({
      activityId: "act-1",
      limit: 50,
    });

    expect(result.rows[0].profiles).toBeNull();
  });

  it("throws on error", async () => {
    const err = new Error("db error");
    mockGetPage.mockResolvedValue({ data: null, error: err });

    await expect(
      getRoomEventsPage({ activityId: "act-1", limit: 50 })
    ).rejects.toThrow("db error");
  });

  it("returns empty rows and no cursor for empty result", async () => {
    mockGetPage.mockResolvedValue({ data: [], error: null });

    const result = await getRoomEventsPage({
      activityId: "act-1",
      limit: 50,
    });

    expect(result.rows).toEqual([]);
    expect(result.nextCursor).toBeNull();
    expect(result.hasMore).toBe(false);
  });

  it("computes hasMore when result count equals limit", async () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      id: `evt-${i}`,
      activity_id: "act-1",
      user_id: "user-1",
      type: "message",
      content: `msg ${i}`,
      created_at: `2026-01-01T00:0${i}:00Z`,
      display_name: "Bob",
    }));

    mockGetPage.mockResolvedValue({ data: rows, error: null });

    const result = await getRoomEventsPage({
      activityId: "act-1",
      limit: 10,
    });

    expect(result.hasMore).toBe(true);
  });
});

describe("getRoomEventById", () => {
  it("returns mapped event when found", async () => {
    mockGetById.mockResolvedValue({
      data: [
        {
          id: "evt-1",
          activity_id: "act-1",
          user_id: "user-1",
          type: "message",
          content: "hi",
          created_at: "2026-01-01T00:00:00Z",
          display_name: "Carol",
        },
      ],
      error: null,
    });

    const evt = await getRoomEventById("evt-1");
    expect(evt).not.toBeNull();
    expect(evt!.id).toBe("evt-1");
    expect(evt!.profiles).toEqual({ display_name: "Carol" });
  });

  it("returns null when not found", async () => {
    mockGetById.mockResolvedValue({ data: [], error: null });
    const evt = await getRoomEventById("nonexistent");
    expect(evt).toBeNull();
  });

  it("throws on error", async () => {
    mockGetById.mockResolvedValue({
      data: null,
      error: new Error("not found"),
    });
    await expect(getRoomEventById("evt-1")).rejects.toThrow("not found");
  });
});
