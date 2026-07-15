-- Vibe system (see .docs/VIBE_SYSTEM.md): a per-hangout energy / social-texture
-- signal, ORTHOGONAL to the activity-type tag (which says WHAT you'll do; vibe
-- says HOW it'll feel). 5 fixed vibes on two axes + a default:
--   chill <-> hype   (energy level)
--   deep  <-> playful(emotional register)
--   open             (default / go-with-the-flow)
-- Nullable so old rows + a not-yet-picked create still render (app treats
-- null/unset as 'open'). Same pattern as gender_pref.
alter table public.activities
  add column if not exists vibe text;

alter table public.activities drop constraint if exists chk_activities_vibe;
alter table public.activities
  add constraint chk_activities_vibe
  check (vibe is null or vibe in ('chill', 'hype', 'deep', 'playful', 'open'));
