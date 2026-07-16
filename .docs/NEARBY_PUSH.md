# Spec — "附近有人開咗局" push (nearby new-activity notification)

When someone creates a new open activity, notify people **physically nearby** so they
can join. This is a different trigger from the existing room-message push
(`20260715150000`, fires on `room_events`); this one fires on `activities` INSERT.

## The core problem

The pg_net trigger runs **inside Postgres**, not on any device. To answer "who is
nearby?" the server must know each recipient's location. Today it does **not** —
`activities` has `lat/lng` (the activity's location) but `profiles`/`push_tokens`
store no user location; "nearby" in `browse` is loose (server returns all open
activities ordered by `created_at`; no radius filter, `distance_km` is a declared
field only). So this feature **must add server-side user-location storage**.

## Data model

Add to `public.push_tokens` (location is per-device, same grain as the token):

| column                | type             | meaning                        |
| --------------------- | ---------------- | ------------------------------ |
| `lat`                 | double precision | device last-known latitude     |
| `lng`                 | double precision | device last-known longitude    |
| `location_updated_at` | timestamptz      | when lat/lng were last written |

Partial index `push_tokens_loc_idx (lat, lng) where location_updated_at is not null`
for the bounding-box scan. No new RLS needed — the existing `*_own` policies already
scope every row to `auth.uid()`.

## Trigger — `notify_nearby_new_activity()` (SECURITY DEFINER, AFTER INSERT on activities)

Parameters (named constants at top of the function, each justified; **none are
benchmarked — this is a fresh feature, tune post-launch**):

| const         | value                | why                                                                                                                                                                                                            |
| ------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v_radius_km` | `10.0`               | "nearby" reach. No existing radius to match (browse has none). 10 km ≈ a short drive. Tunable.                                                                                                                 |
| `v_max_age`   | `interval '30 days'` | only notify tokens whose location is plausibly current. Active users refresh location every time browse opens, so this mainly excludes long-dormant devices. Generous for a small first cohort; tighten later. |

Logic:

1. Guard: fire only when `new.status = 'open'` AND `new.lat IS NOT NULL` AND
   `new.lng IS NOT NULL`. Else `return new` (no-op).
2. Recipient tokens = `push_tokens pt` where:
   - `pt.location_updated_at > now() - v_max_age` (skip stale/unknown location)
   - **bounding-box pre-filter** (index-friendly):
     `pt.lat between new.lat ± v_radius_km/111.0`
     `pt.lng between new.lng ± v_radius_km/(111.0 * greatest(cos(radians(new.lat)), 0.01))`
     (the `greatest(...,0.01)` caps the longitude span near the poles so we never
     divide by ~0.)
   - **exact haversine** ≤ `v_radius_km` (the bbox is a fast superset; haversine is
     the correctness gate). `acos` argument clamped with `least(1, greatest(-1, …))`
     against float rounding.
   - `pt.user_id <> new.creator_id` (never notify the creator).
   - **block filter**: no row in `user_blocks` in either direction between
     `new.creator_id` and `pt.user_id`.
   - `pt.token like 'ExponentPushToken%'`.
   - `array_agg(distinct pt.token)` to dedup.
3. If no tokens → `return new`.
4. `net.http_post` to `https://exp.host/--/api/v2/push/send`:
   - `to`: the token array (Expo fans out one request to all)
   - `title`: the activity title (coalesce → `'NearbyNow'`)
   - `body`: `'Just opened near you — tap to join'`
   - `data`: `{ activityId: new.id, type: 'nearby' }`

`SECURITY DEFINER` so the trigger reads every recipient's token past `push_tokens`
RLS (same pattern as the room-message sender). pg_net is async → never blocks the
insert.

## Client

Two write paths, **neither adds a new permission prompt**:

- **Browse open (silent, already-granted users)** — the `browse.tsx` mount effect calls
  `getDeviceLocationIfGranted()`, which returns coords ONLY if foreground location is
  already granted (it never prompts). If so → fire-and-forget `updatePushLocation`. This
  is what keeps an opted-in user reachable on every app open.
- **First grant (manual)** — `setAreaFromDevice()` ("use my location" ◎ tap) calls
  `requestDeviceLocation()` (which may prompt); on `granted` it also fires
  `updatePushLocation`. The consent point for users who haven't granted yet.

`updatePushLocation(lat,lng)` (`lib/push/updateLocation.ts`) resolves the current user id
best-effort and calls `backend.push.setTokenLocation(uid, lat, lng)`, which
`UPDATE push_tokens SET lat,lng,location_updated_at WHERE user_id = uid` (allowed by the
`*_update_own` RLS). No-op if the user has no token row yet (web / perm denied / not
registered) — no token, no push anyway.

**Coverage limit (by design):** a user who has NEVER granted location is never matched
(we don't know where they are) and is NOT prompted on open. Driving that first grant — a
one-time prompt or a banner on browse — is a **product/UX decision for Nicole + fd**, not
built here. `registerForPush` is unchanged. One user = one current location (the
multi-device-far-apart case is negligible for v1).

## Deliberately deferred (flagged, not built)

- **gender_pref targeting** — a women-only activity arguably should only push women.
  Tied to the deferred gender-enforcement / security phase.
- **location privacy** — storing coarse exact location server-side is new. Pre-launch:
  consider rounding to a ~1 km grid so precise coordinates are never stored.
- **spam / cooldown** — a dense area means many recipients per new activity. Acceptable
  for a small first cohort; add a per-recipient cooldown if it gets noisy.
- **antimeridian (±180° lng)** — the bbox pre-filter doesn't wrap around the date line,
  so a handful of candidates within radius but across ±180° are missed. Haversine stays
  correct for everyone the bbox does pass. Negligible; not fixed.
- **push copy i18n** — the DB trigger can't easily localize per recipient; body is
  English for v1.

## Verification plan

- `tsc --noEmit` = 0, `jest` green.
- Apply migration to cloud; **transaction-rollback E2E**: insert a nearby dummy token
  - insert an open activity nearby → assert exactly the right POST is queued in
    `net.http_request_queue` (to `exp.host`, `to` contains the near token, excludes the
    creator/far/stale tokens) → **ROLLBACK** (never really send, no fake data left).
- Adversarial workflow: verify the trigger SQL from independent angles (proximity math,
  RLS/security-definer, pg_net payload shape, dedup, block join, edge cases).
