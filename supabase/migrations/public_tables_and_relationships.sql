CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    creator_id uuid NOT NULL,
    title_text text NOT NULL,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    expires_at timestamp with time zone,
    place_text text,
    lat double precision,
    lng double precision,
    gender_pref text DEFAULT 'any'::text NOT NULL,
    capacity integer,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.activity_members (
    activity_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    state text DEFAULT 'joined'::text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.room_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    user_id uuid,
    type text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.activity_members
    ADD CONSTRAINT activity_members_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.activity_members
    ADD CONSTRAINT activity_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.room_events
    ADD CONSTRAINT room_events_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.room_events
    ADD CONSTRAINT room_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

