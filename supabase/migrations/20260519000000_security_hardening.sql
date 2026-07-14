-- Security hardening: grants, trigger bugs, constraints, limit cap, indexes

-- ============================================================
-- 1. Revoke excessive anon permissions on tables
-- ============================================================
REVOKE ALL ON TABLE public.activities FROM anon;
REVOKE ALL ON TABLE public.activity_members FROM anon;
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.room_events FROM anon;

-- ============================================================
-- 2. Revoke anon access to internal trigger functions + RPCs
-- ============================================================
REVOKE ALL ON FUNCTION public.enforce_activity_expires_at() FROM anon;
REVOKE ALL ON FUNCTION public.sync_member_left_at() FROM anon;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.compute_expires_at(timestamptz, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.get_room_events_page(uuid, int, timestamptz, uuid, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.get_room_event_by_id(uuid) FROM anon;

-- ============================================================
-- 3. Fix enforce_activity_expires_at trigger (dead code bug)
--    Was: NULL -> return; NOT NULL -> return (never auto-computes)
--    Now: NULL on INSERT -> auto-compute 30d default; NOT NULL -> respect it
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_activity_expires_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.expires_at IS NULL THEN
      NEW.expires_at := public.compute_expires_at(
        COALESCE(NEW.created_at, now()),
        NEW.end_time
      );
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================================
-- 4. CHECK constraints on enum-like text columns
-- ============================================================
ALTER TABLE public.activities
  ADD CONSTRAINT chk_activities_status
  CHECK (status IN ('open', 'closed'));

ALTER TABLE public.activities
  ADD CONSTRAINT chk_activities_gender_pref
  CHECK (gender_pref IN ('any', 'men', 'women', 'non-binary'));

ALTER TABLE public.activity_members
  ADD CONSTRAINT chk_members_role
  CHECK (role IN ('creator', 'member'));

ALTER TABLE public.activity_members
  ADD CONSTRAINT chk_members_state
  CHECK (state IN ('joined', 'left'));

ALTER TABLE public.room_events
  ADD CONSTRAINT chk_room_events_type
  CHECK (type IN ('message', 'system'));

-- ============================================================
-- 5. Text length constraints
-- ============================================================
ALTER TABLE public.activities
  ADD CONSTRAINT chk_title_text_length
  CHECK (char_length(title_text) BETWEEN 1 AND 200);

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_display_name_length
  CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 100);

ALTER TABLE public.room_events
  ADD CONSTRAINT chk_content_length
  CHECK (char_length(content) BETWEEN 1 AND 5000);

-- ============================================================
-- 6. Cap p_limit in get_room_events_page to prevent DoS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_room_events_page(
  p_activity_id uuid,
  p_limit int default 50,
  p_cursor_created_at timestamptz default null,
  p_cursor_id uuid default null,
  p_left_at timestamptz default null
)
RETURNS TABLE (
  id uuid,
  activity_id uuid,
  user_id uuid,
  type text,
  content text,
  created_at timestamptz,
  display_name text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.id,
    e.activity_id,
    e.user_id,
    e.type,
    e.content,
    e.created_at,
    p.display_name
  FROM public.room_events e
  LEFT JOIN public.profiles p ON p.id = e.user_id
  WHERE e.activity_id = p_activity_id
    AND (p_left_at IS NULL OR e.created_at <= p_left_at)
    AND (
      p_cursor_created_at IS NULL
      OR e.created_at < p_cursor_created_at
      OR (e.created_at = p_cursor_created_at AND e.id < p_cursor_id)
    )
  ORDER BY e.created_at DESC, e.id DESC
  LIMIT LEAST(p_limit, 200);
$$;

-- ============================================================
-- 7. Enforce closed_by = auth.uid() when closing an activity
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_closed_by()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status = 'closed' AND (OLD.status IS DISTINCT FROM 'closed') THEN
    NEW.closed_by := auth.uid();
    NEW.closed_at := now();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_enforce_closed_by
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_closed_by();

-- ============================================================
-- 8. Enforce capacity on join
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_capacity()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_capacity integer;
  v_current_count integer;
BEGIN
  IF NEW.state <> 'joined' THEN
    RETURN NEW;
  END IF;

  SELECT a.capacity INTO v_capacity
  FROM public.activities a
  WHERE a.id = NEW.activity_id;

  IF v_capacity IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_current_count
  FROM public.activity_members m
  WHERE m.activity_id = NEW.activity_id
    AND m.state = 'joined'
    AND m.user_id <> NEW.user_id;

  IF v_current_count >= v_capacity THEN
    RAISE EXCEPTION 'Activity is full (capacity: %)', v_capacity;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_enforce_capacity
  BEFORE INSERT OR UPDATE ON public.activity_members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_capacity();

-- ============================================================
-- 9. Drop redundant indexes
-- ============================================================
DROP INDEX IF EXISTS idx_activity_members_activity_user;
DROP INDEX IF EXISTS activity_members_activity_idx;
DROP INDEX IF EXISTS room_events_activity_created_idx;
DROP INDEX IF EXISTS idx_room_events_activity_created;

-- ============================================================
-- 10. Revoke anon on new functions
-- ============================================================
REVOKE ALL ON FUNCTION public.enforce_closed_by() FROM anon;
REVOKE ALL ON FUNCTION public.enforce_capacity() FROM anon;
