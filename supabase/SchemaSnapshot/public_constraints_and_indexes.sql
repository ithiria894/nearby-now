-- ============================================================
-- AUTO-GENERATED: public constraints + indexes
-- Generated at: 2026-01-27T01:20:42Z
-- ============================================================

-- ---- Constraints (PK / UNIQUE / CHECK) ----
-- Constraint: activities_pkey on public.activities

ALTER TABLE ONLY public.activities ADD CONSTRAINT activities_pkey PRIMARY KEY (id);

-- Constraint: activity_members_pkey on public.activity_members

ALTER TABLE ONLY public.activity_members ADD CONSTRAINT activity_members_pkey PRIMARY KEY (activity_id, user_id);

-- Constraint: profiles_pkey on public.profiles

ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

-- Constraint: room_events_pkey on public.room_events

ALTER TABLE ONLY public.room_events ADD CONSTRAINT room_events_pkey PRIMARY KEY (id);


-- ---- Indexes (excluding constraint-backed indexes) ----
-- Index: public.idx_activities_closed_at

CREATE INDEX idx_activities_closed_at ON public.activities USING btree (closed_at);

-- Index: public.idx_activities_closed_by

CREATE INDEX idx_activities_closed_by ON public.activities USING btree (closed_by);

-- Index: public.idx_activities_creator

CREATE INDEX idx_activities_creator ON public.activities USING btree (creator_id);

-- Index: public.idx_activities_expires_at

CREATE INDEX idx_activities_expires_at ON public.activities USING btree (expires_at);

-- Index: public.idx_activities_lat

CREATE INDEX idx_activities_lat ON public.activities USING btree (lat);

-- Index: public.idx_activities_lng

CREATE INDEX idx_activities_lng ON public.activities USING btree (lng);

-- Index: public.idx_activities_start_time

CREATE INDEX idx_activities_start_time ON public.activities USING btree (start_time);

-- Index: public.idx_activities_status

CREATE INDEX idx_activities_status ON public.activities USING btree (status);

-- Index: public.idx_activity_members_activity_user

CREATE INDEX idx_activity_members_activity_user ON public.activity_members USING btree (activity_id, user_id);

-- Index: public.idx_members_activity_state

CREATE INDEX idx_members_activity_state ON public.activity_members USING btree (activity_id, state);

-- Index: public.idx_room_events_activity_created

CREATE INDEX idx_room_events_activity_created ON public.room_events USING btree (activity_id, created_at);

