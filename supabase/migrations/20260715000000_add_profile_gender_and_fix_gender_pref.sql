-- Feature: gender preference.
-- (1) Self-declared gender on the profile (NOT verified).
-- (2) H3 fix: align activities.gender_pref CHECK with the app's real vocabulary.
--
-- The 20260519 security_hardening migration set chk_activities_gender_pref to
-- ('any','men','women','non-binary'), but the app (components/InviteForm.tsx:16)
-- only ever emits 'any' | 'female' | 'male'. Every "Women only" / "Men only"
-- invite was therefore REJECTED by the DB (same class as the earlier
-- chk_room_events_type drift). Realign the constraint to what the app sends.
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS chk_activities_gender_pref;
ALTER TABLE public.activities
  ADD CONSTRAINT chk_activities_gender_pref
  CHECK (gender_pref IN ('any', 'female', 'male'));

-- Self-declared gender on the profile. Nullable = not set. NOT verified — this
-- is a declared preference field, not identity proof. Join-time enforcement is
-- intentionally deferred (see .docs/SECURITY_AUDIT.md, pre-launch phase).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_profiles_gender;
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_gender
  CHECK (gender IS NULL OR gender IN ('female', 'male', 'other'));
