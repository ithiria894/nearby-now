-- ============================================================
-- AUTO-GENERATED: public triggers + functions
-- Generated at: 2026-02-01T06:26:32Z
-- ============================================================

-- ---- Functions (public) ----
-- Function: public.compute_expires_at(p_created_at timestamp with time zone, p_end_time timestamp with time zone)

CREATE OR REPLACE FUNCTION public.compute_expires_at(p_created_at timestamp with time zone, p_end_time timestamp with time zone)

 RETURNS timestamp with time zone

 LANGUAGE sql

AS $function$

  select case

    when p_end_time is null then p_created_at + interval '30 days'

    else p_end_time

  end;

$function$



-- Function: public.enforce_activity_expires_at()

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

$function$



-- Function: public.get_room_event_by_id(p_event_id uuid)

CREATE OR REPLACE FUNCTION public.get_room_event_by_id(p_event_id uuid)

 RETURNS TABLE(id uuid, activity_id uuid, user_id uuid, type text, content text, created_at timestamp with time zone, display_name text)

 LANGUAGE sql

 STABLE

AS $function$

  select

    e.id,

    e.activity_id,

    e.user_id,

    e.type,

    e.content,

    e.created_at,

    p.display_name

  from public.room_events e

  left join public.profiles p on p.id = e.user_id

  where e.id = p_event_id

  limit 1;

$function$



-- Function: public.get_room_events_page(p_activity_id uuid, p_limit integer, p_cursor_created_at timestamp with time zone, p_cursor_id uuid, p_left_at timestamp with time zone)

CREATE OR REPLACE FUNCTION public.get_room_events_page(p_activity_id uuid, p_limit integer DEFAULT 50, p_cursor_created_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_cursor_id uuid DEFAULT NULL::uuid, p_left_at timestamp with time zone DEFAULT NULL::timestamp with time zone)

 RETURNS TABLE(id uuid, activity_id uuid, user_id uuid, type text, content text, created_at timestamp with time zone, display_name text)

 LANGUAGE sql

 STABLE

AS $function$

  select

    e.id,

    e.activity_id,

    e.user_id,

    e.type,

    e.content,

    e.created_at,

    p.display_name

  from public.room_events e

  left join public.profiles p on p.id = e.user_id

  where e.activity_id = p_activity_id

    and (p_left_at is null or e.created_at <= p_left_at)

    and (

      p_cursor_created_at is null

      or e.created_at < p_cursor_created_at

      or (e.created_at = p_cursor_created_at and e.id < p_cursor_id)

    )

  order by e.created_at desc, e.id desc

  limit p_limit;

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

