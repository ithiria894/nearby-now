# Unread messages — backend migration handoff

> ✅ **IMPLEMENTED (2026-07-15).** Migration `20260715120000_unread_read_tracking.sql`
> added `activity_members.last_read_at` + `mark_room_read()` + `unread_counts()`
> (both SECURITY DEFINER, `SET search_path=public`, authenticated-only grants) —
> applied to cloud + behaviourally verified (unread 6 → mark_room_read → 0).
> **The §4 app-side swap is DONE too:** `lib/domain/reads.ts` and
> `lib/repo/room_summaries.ts` now call the server RPCs via the `backend.roomReads`
> facade (AsyncStorage fake removed). Public API unchanged, so joined/created/room
> consumers were not touched. Watermark now syncs across devices + uses `joined_at`
> baseline. Nothing left to do on the backend side.

The app now shows **unread counts** (Lobby/Created list badges) and a **"New
messages" divider** in each room. Until the backend supports read-tracking, the
"how far have I read" watermark lives **locally on-device** (AsyncStorage), so it
doesn't sync across devices and resets if storage is cleared.

This doc is what the backend needs so we can swap the local fake for the real
thing. The app-side code is deliberately isolated to **two files** — once the
server pieces below exist, only those two change.

---

## 1. Schema: a per-member read watermark

Add one nullable column to `activity_members`:

```sql
alter table public.activity_members
  add column last_read_at timestamptz;
```

- One row per (activity_id, user_id) already exists — this just records how far
  that member has read.
- Nullable = "never read". Treat a null baseline as `joined_at` (see §3) so a
  member isn't shown their whole pre-join history as unread.

## 2. RPC: mark a room read

Called when a user opens a room (and as new messages arrive while it's open).

```sql
create or replace function public.mark_room_read(p_activity_id uuid, p_at timestamptz)
returns void
language sql
security definer
as $$
  update public.activity_members
     set last_read_at = greatest(coalesce(last_read_at, 'epoch'), p_at)
   where activity_id = p_activity_id
     and user_id = auth.uid();
$$;
```

- `greatest(...)` so the watermark never moves backwards.
- `auth.uid()` scopes it to the caller — no user can mark another's read state.

## 3. RPC: unread counts for a set of rooms

Powers the Lobby/Created badges in one round-trip. Unread = real messages
(`type in ('chat','quick')`) newer than the caller's watermark, **not authored by
the caller**. Baseline for never-read rooms is `joined_at`.

```sql
create or replace function public.unread_counts(p_activity_ids uuid[])
returns table(activity_id uuid, unread_count int)
language sql
security definer
as $$
  select m.activity_id,
         count(e.*) filter (
           where e.type in ('chat','quick')
             and e.user_id <> m.user_id
             and e.created_at > greatest(m.last_read_at, m.joined_at, 'epoch')
         )::int as unread_count
    from public.activity_members m
    left join public.room_events e on e.activity_id = m.activity_id
   where m.user_id = auth.uid()
     and m.activity_id = any(p_activity_ids)
   group by m.activity_id;
$$;
```

(A "last message per room" batch is also useful so the list preview doesn't need
one `get_room_events_page` call per room — optional; the app currently fetches
per room and is fine for small lobbies.)

---

## 4. App-side swap (our side, once the above ships)

Only two files reference the local store:

- **`lib/domain/reads.ts`** — the AsyncStorage fake. Repoint:
  - `markRead(userId, activityId, atMs)` → call `mark_room_read(activityId, atMs)`.
  - `getLastReadMap` / `getLastRead` → keep for the divider, or drop once
    `unread_counts` + a per-room `last_read_at` fetch replace them.
- **`lib/repo/room_summaries.ts`** — `getRoomSummaries()` currently scans the
  tail of each room client-side to count unread. Replace the client-side count
  with a single `unread_counts(activityIds)` call; keep the last-message preview.

Consumers (`app/(tabs)/joined.tsx`, `app/(tabs)/created.tsx`,
`app/room/[id].tsx`) call those helpers and won't need to change.

## 5. Behaviour notes / decisions baked into the fake

- **System events don't count as unread** (joins, invite edits) — only
  `chat`/`quick`. Keep this server-side (the filter above).
- **Your own messages don't count** — the `e.user_id <> m.user_id` filter.
- **Never-read rooms show 0 unread** in the local fake (no watermark yet). The
  server version improves on this by using `joined_at` as the baseline, so a room
  you were added to but never opened correctly shows unread since you joined.
- The room's **"New messages" divider** is placed at the read watermark captured
  when the room opens; it only appears when there's ≥1 unread message from
  someone else.
