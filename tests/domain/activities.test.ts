jest.mock("../../lib/backend", () => ({
  backend: {
    activities: {},
    roomEvents: {},
  },
}));

import {
  isExpiredOrClosed,
  isActiveActivity,
  isJoinableActivity,
  type ActivityCardActivity,
} from "../../lib/domain/activities";

function makeActivity(
  overrides: Partial<ActivityCardActivity> = {}
): ActivityCardActivity {
  return {
    id: "test-id",
    creator_id: "creator-1",
    title_text: "Test Activity",
    place_name: null,
    place_address: null,
    expires_at: null,
    gender_pref: "any",
    capacity: null,
    status: "open",
    ...overrides,
  };
}

describe("isExpiredOrClosed", () => {
  it("returns false for open activity with no expiry", () => {
    const a = makeActivity({ status: "open", expires_at: null });
    expect(isExpiredOrClosed(a)).toBe(false);
  });

  it("returns true for closed activity", () => {
    const a = makeActivity({ status: "closed" });
    expect(isExpiredOrClosed(a)).toBe(true);
  });

  it("returns true for expired activity", () => {
    const pastDate = new Date(Date.now() - 60_000).toISOString();
    const a = makeActivity({ status: "open", expires_at: pastDate });
    expect(isExpiredOrClosed(a)).toBe(true);
  });

  it("returns false for activity expiring in the future", () => {
    const futureDate = new Date(Date.now() + 3_600_000).toISOString();
    const a = makeActivity({ status: "open", expires_at: futureDate });
    expect(isExpiredOrClosed(a)).toBe(false);
  });
});

describe("isActiveActivity", () => {
  it("returns true for open activity with no expiry", () => {
    const a = makeActivity({ status: "open", expires_at: null });
    expect(isActiveActivity(a)).toBe(true);
  });

  it("returns false for closed activity", () => {
    const a = makeActivity({ status: "closed" });
    expect(isActiveActivity(a)).toBe(false);
  });

  it("returns false for expired activity", () => {
    const pastDate = new Date(Date.now() - 60_000).toISOString();
    const a = makeActivity({ status: "open", expires_at: pastDate });
    expect(isActiveActivity(a)).toBe(false);
  });

  it("returns true for future expiry", () => {
    const futureDate = new Date(Date.now() + 3_600_000).toISOString();
    const a = makeActivity({ status: "open", expires_at: futureDate });
    expect(isActiveActivity(a)).toBe(true);
  });

  it("handles invalid date string gracefully", () => {
    const a = makeActivity({ status: "open", expires_at: "not-a-date" });
    expect(isActiveActivity(a)).toBe(true);
  });
});

describe("isJoinableActivity", () => {
  it("returns true for open, non-expired activity", () => {
    const futureDate = new Date(Date.now() + 3_600_000).toISOString();
    const a = makeActivity({ status: "open", expires_at: futureDate });
    expect(isJoinableActivity(a, new Set())).toBe(true);
  });

  it("returns false for closed activity", () => {
    const a = makeActivity({ status: "closed" });
    expect(isJoinableActivity(a, new Set())).toBe(false);
  });

  it("returns false for expired activity", () => {
    const pastDate = new Date(Date.now() - 60_000).toISOString();
    const a = makeActivity({ status: "open", expires_at: pastDate });
    expect(isJoinableActivity(a, new Set())).toBe(false);
  });

  it("returns true when no expiry set", () => {
    const a = makeActivity({ status: "open", expires_at: null });
    expect(isJoinableActivity(a, new Set())).toBe(true);
  });
});
