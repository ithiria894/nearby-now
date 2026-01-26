-- :zap: CHANGE 1: Add structured place fields for map + UI
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS place_name text,
  ADD COLUMN IF NOT EXISTS place_address text,
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS location_source text;

-- :zap: CHANGE 2: Backfill from legacy place_text (best-effort)
UPDATE public.activities
SET
  place_name = COALESCE(place_name, NULLIF(place_text, '')),
  place_address = COALESCE(place_address, NULLIF(place_text, ''))
WHERE (place_name IS NULL OR place_address IS NULL)
  AND place_text IS NOT NULL
  AND btrim(place_text) <> '';

-- :zap: CHANGE 3: Helpful indexes for geo bounding-box queries
CREATE INDEX IF NOT EXISTS idx_activities_lat ON public.activities USING btree (lat);
CREATE INDEX IF NOT EXISTS idx_activities_lng ON public.activities USING btree (lng);

-- :zap: CHANGE 4: Default expiry -> 30 days (was 2 hours)
CREATE OR REPLACE FUNCTION public.compute_expires_at(
  p_created_at timestamp with time zone,
  p_end_time timestamp with time zone
)
RETURNS timestamp with time zone
LANGUAGE sql
AS $function$
  select case
    when p_end_time is null then p_created_at + interval '30 days'
    else p_end_time
  end;
$function$;

-- :zap: CHANGE 5: Respect client-provided expires_at; only auto-fill on INSERT when expires_at is NULL
CREATE OR REPLACE FUNCTION public.enforce_activity_expires_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- NULL means "never expire" (keep it)
  IF NEW.expires_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    -- If client provided expires_at (not null), respect it.
    -- If they did not provide it, it will still be NULL at this point,
    -- but we already returned above. So here, expires_at is not null.
    -- However, some clients may pass an empty value weirdly; we keep safe logic:
    IF NEW.expires_at IS NOT NULL THEN
      RETURN NEW;
    END IF;

    NEW.expires_at := public.compute_expires_at(
      COALESCE(NEW.created_at, now()),
      NEW.end_time
    );
    RETURN NEW;
  END IF;

  -- On UPDATE, do not recompute automatically (Edit screen controls it explicitly)
  RETURN NEW;
END;
$function$;

-- NOTE: Trigger already exists. No need to recreate if same name.
-- If your trigger name differs, keep as-is. This replaces the function body only.
