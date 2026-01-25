-- ============================================================
-- AUTO-GENERATED: public RLS + policies
-- Generated at: 2026-01-25T12:25:40Z
-- ============================================================

-- ---- RLS flags (ENABLE/FORCE) ----
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.activity_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.room_events ENABLE ROW LEVEL SECURITY;


-- ---- Policies ----
-- Policy: activities_insert_own on public.activities

CREATE POLICY activities_insert_own ON public.activities AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((creator_id = auth.uid()));

-- Policy: activities_delete_own on public.activities

CREATE POLICY activities_delete_own ON public.activities AS PERMISSIVE FOR DELETE TO authenticated USING ((creator_id = auth.uid()));

-- Policy: activities_select_authenticated on public.activities

CREATE POLICY activities_select_authenticated ON public.activities AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- Policy: activities_update_own on public.activities

CREATE POLICY activities_update_own ON public.activities AS PERMISSIVE FOR UPDATE TO authenticated USING ((creator_id = auth.uid())) WITH CHECK ((creator_id = auth.uid()));

-- Policy: members_insert_self_open_only on public.activity_members

CREATE POLICY members_insert_self_open_only ON public.activity_members AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1

   FROM activities a

  WHERE ((a.id = activity_members.activity_id) AND (a.status = 'open'::text) AND ((a.expires_at IS NULL) OR (a.expires_at > now())))))));

-- Policy: members_select_authenticated on public.activity_members

CREATE POLICY members_select_authenticated ON public.activity_members AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- Policy: members_update_self_open_only on public.activity_members

CREATE POLICY members_update_self_open_only ON public.activity_members AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK (((user_id = auth.uid()) AND ((state <> 'joined'::text) OR (EXISTS ( SELECT 1

   FROM activities a

  WHERE ((a.id = activity_members.activity_id) AND (a.status = 'open'::text) AND ((a.expires_at IS NULL) OR (a.expires_at > now()))))))));

-- Policy: profiles_upsert_own on public.profiles

CREATE POLICY profiles_upsert_own ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()));

-- Policy: profiles_select_authenticated on public.profiles

CREATE POLICY profiles_select_authenticated ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- Policy: profiles_update_own on public.profiles

CREATE POLICY profiles_update_own ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));

-- Policy: room_events_insert_open_only on public.room_events

CREATE POLICY room_events_insert_open_only ON public.room_events AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1

   FROM activity_members m

  WHERE ((m.activity_id = room_events.activity_id) AND (m.user_id = auth.uid()) AND (m.state = 'joined'::text)))) AND (EXISTS ( SELECT 1

   FROM activities a

  WHERE ((a.id = room_events.activity_id) AND (a.status = 'open'::text) AND ((a.expires_at IS NULL) OR (a.expires_at > now())))))));

-- Policy: room_events_select_members on public.room_events

CREATE POLICY room_events_select_members ON public.room_events AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1

   FROM activity_members m

  WHERE ((m.activity_id = room_events.activity_id) AND (m.user_id = auth.uid()) AND ((m.state = 'joined'::text) OR ((m.state = 'left'::text) AND (m.left_at IS NOT NULL) AND (room_events.created_at <= m.left_at)))))));

