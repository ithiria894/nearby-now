-- ============================================================
-- AUTO-GENERATED: public triggers + functions
-- Generated at: 2026-01-26T07:47:24Z
-- ============================================================

-- ---- Functions (public) ----
-- Function: public.compute_expires_at(p_created_at timestamp with time zone, p_end_time timestamp with time zone)

CREATE OR REPLACE FUNCTION public.compute_expires_at(p_created_at timestamp with time zone, p_end_time timestamp with time zone)

 RETURNS timestamp with time zone

 LANGUAGE sql

AS $function$

  select case

    when p_end_time is null then p_created_at + interval '2 hours'

    else p_end_time

  end;

$function$



-- Function: public.enforce_activity_expires_at()

CREATE OR REPLACE FUNCTION public.enforce_activity_expires_at()

 RETURNS trigger

 LANGUAGE plpgsql

AS $function$

BEGIN

  -- :zap: CHANGE 1: Allow NULL expires_at to mean "never expire"

  IF NEW.expires_at IS NULL THEN

    RETURN NEW;

  END IF;



  IF (TG_OP = 'INSERT') THEN

    -- :zap: CHANGE 2: Only compute when expires_at is not NULL (guard above)

    NEW.expires_at := public.compute_expires_at(

      COALESCE(NEW.created_at, now()),

      NEW.end_time

    );

  ELSE

    -- :zap: CHANGE 3: Recompute only when end_time changed (and expires_at is not NULL)

    IF NEW.end_time IS DISTINCT FROM OLD.end_time THEN

      NEW.expires_at := public.compute_expires_at(OLD.created_at, NEW.end_time);

    END IF;

  END IF;



  RETURN NEW;

END;

$function$



-- Function: public.set_updated_at()

CREATE OR REPLACE FUNCTION public.set_updated_at()

 RETURNS trigger

 LANGUAGE plpgsql

AS $function$

begin

  new.updated_at = now();

  return new;

end;

$function$



-- Function: public.sync_member_left_at()

CREATE OR REPLACE FUNCTION public.sync_member_left_at()

 RETURNS trigger

 LANGUAGE plpgsql

AS $function$

begin

  -- When switching to left, set left_at if not already set

  if new.state = 'left' then

    if new.left_at is null then

      new.left_at := now();

    end if;

  end if;



  -- When switching to joined, clear left_at (so joined sees all)

  if new.state = 'joined' then

    new.left_at := null;

  end if;



  return new;

end;

$function$




-- ---- Triggers (public tables) ----
-- Trigger: trg_activities_updated_at on public.activities

CREATE TRIGGER trg_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: trg_enforce_activity_expires_at on public.activities

CREATE TRIGGER trg_enforce_activity_expires_at BEFORE INSERT OR UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION enforce_activity_expires_at();

-- Trigger: trg_sync_member_left_at on public.activity_members

CREATE TRIGGER trg_sync_member_left_at BEFORE INSERT OR UPDATE OF state ON activity_members FOR EACH ROW EXECUTE FUNCTION sync_member_left_at();

-- Trigger: trg_profiles_updated_at on public.profiles

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

