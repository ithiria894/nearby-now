-- Fix: chk_room_events_type allowed the wrong values.
--
-- The 20260519 security_hardening migration added
--   CHECK (type IN ('message', 'system'))
-- but the app's canonical RoomEventType (lib/domain/room.ts) is:
--   'chat'   -> a chat message
--   'quick'  -> a quick status update (IM_HERE / LATE_10 / CANCEL)
--   'system' -> a system event (e.g. "X joined the lobby")
-- 'message' is never used by the app. So every 'chat' and 'quick' insert failed
-- ("new row ... violates check constraint chk_room_events_type") and the room
-- was unusable — only 'system' events got through. Realign the constraint to the
-- actual domain type.
ALTER TABLE public.room_events DROP CONSTRAINT IF EXISTS chk_room_events_type;

ALTER TABLE public.room_events
  ADD CONSTRAINT chk_room_events_type
  CHECK (type IN ('chat', 'quick', 'system'));
