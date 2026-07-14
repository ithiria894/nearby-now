-- Manual QA script: run against Supabase after applying migration 20260519000000
-- Each statement should succeed or fail as documented

-- ============================================================
-- 1. CHECK constraints — should REJECT invalid values
-- ============================================================

-- Should fail: invalid status
INSERT INTO activities (creator_id, title_text, status, gender_pref)
VALUES ('00000000-0000-0000-0000-000000000001', 'test', 'banana', 'any');
-- Expected: ERROR: new row violates check constraint "chk_activities_status"

-- Should fail: invalid gender_pref
INSERT INTO activities (creator_id, title_text, status, gender_pref)
VALUES ('00000000-0000-0000-0000-000000000001', 'test', 'open', 'aliens');
-- Expected: ERROR: new row violates check constraint "chk_activities_gender_pref"

-- Should fail: title too long (>200 chars)
INSERT INTO activities (creator_id, title_text, status, gender_pref)
VALUES ('00000000-0000-0000-0000-000000000001', repeat('x', 201), 'open', 'any');
-- Expected: ERROR: new row violates check constraint "chk_title_text_length"

-- Should fail: empty title
INSERT INTO activities (creator_id, title_text, status, gender_pref)
VALUES ('00000000-0000-0000-0000-000000000001', '', 'open', 'any');
-- Expected: ERROR: new row violates check constraint "chk_title_text_length"

-- Should fail: display_name too long
UPDATE profiles SET display_name = repeat('x', 101) WHERE id = auth.uid();
-- Expected: ERROR: new row violates check constraint "chk_display_name_length"

-- Should fail: chat message too long (>5000 chars)
-- (requires being a member first)
-- INSERT INTO room_events (activity_id, user_id, type, content)
-- VALUES ('<activity_id>', auth.uid(), 'message', repeat('x', 5001));
-- Expected: ERROR: new row violates check constraint "chk_content_length"

-- Should fail: invalid event type
-- INSERT INTO room_events (activity_id, user_id, type, content)
-- VALUES ('<activity_id>', auth.uid(), 'invalid_type', 'hello');
-- Expected: ERROR: new row violates check constraint "chk_room_events_type"

-- ============================================================
-- 2. Trigger: enforce_activity_expires_at — auto-compute on INSERT
-- ============================================================

-- Insert without expires_at → should auto-compute (30 days from now)
-- INSERT INTO activities (creator_id, title_text, gender_pref)
-- VALUES (auth.uid(), 'Auto Expiry Test', 'any')
-- RETURNING expires_at;
-- Expected: expires_at ~ now() + 30 days

-- Insert WITH expires_at → should keep the provided value
-- INSERT INTO activities (creator_id, title_text, gender_pref, expires_at)
-- VALUES (auth.uid(), 'Manual Expiry Test', 'any', '2026-12-31T00:00:00Z')
-- RETURNING expires_at;
-- Expected: expires_at = '2026-12-31T00:00:00Z'

-- ============================================================
-- 3. Trigger: enforce_capacity — should block join when full
-- ============================================================

-- Create activity with capacity=1, join as member, then try second join
-- Second join should fail with 'Activity is full (capacity: 1)'

-- ============================================================
-- 4. Trigger: enforce_closed_by — auto-set closed_by on close
-- ============================================================

-- Update activity set status='closed' → closed_by should = auth.uid(), closed_at = now()

-- ============================================================
-- 5. RPC limit cap — get_room_events_page
-- ============================================================

-- SELECT * FROM get_room_events_page('<activity_id>', 999999);
-- Should return at most 200 rows (LEAST(999999, 200))

-- ============================================================
-- 6. Anon access — should be denied
-- ============================================================

-- As anon role:
-- SELECT * FROM activities; → should return 0 rows (RLS blocks, no anon policy)
-- SELECT * FROM get_room_events_page(...); → should fail (REVOKE EXECUTE)
