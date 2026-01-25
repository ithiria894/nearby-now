


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."compute_expires_at"("p_created_at" timestamp with time zone, "p_end_time" timestamp with time zone) RETURNS timestamp with time zone
    LANGUAGE "sql"
    AS $$
  select case
    when p_end_time is null then p_created_at + interval '2 hours'
    else p_end_time
  end;
$$;


ALTER FUNCTION "public"."compute_expires_at"("p_created_at" timestamp with time zone, "p_end_time" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_activity_expires_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."enforce_activity_expires_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_member_left_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."sync_member_left_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "title_text" "text" NOT NULL,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "place_text" "text",
    "lat" double precision,
    "lng" double precision,
    "gender_pref" "text" DEFAULT 'any'::"text" NOT NULL,
    "capacity" integer,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "closed_at" timestamp with time zone,
    "closed_by" "uuid"
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_members" (
    "activity_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "state" "text" DEFAULT 'joined'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "left_at" timestamp with time zone
);


ALTER TABLE "public"."activity_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."room_events" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_members"
    ADD CONSTRAINT "activity_members_pkey" PRIMARY KEY ("activity_id", "user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_events"
    ADD CONSTRAINT "room_events_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activities_closed_at" ON "public"."activities" USING "btree" ("closed_at");



CREATE INDEX "idx_activities_closed_by" ON "public"."activities" USING "btree" ("closed_by");



CREATE INDEX "idx_activities_creator" ON "public"."activities" USING "btree" ("creator_id");



CREATE INDEX "idx_activities_expires_at" ON "public"."activities" USING "btree" ("expires_at");



CREATE INDEX "idx_activities_start_time" ON "public"."activities" USING "btree" ("start_time");



CREATE INDEX "idx_activities_status" ON "public"."activities" USING "btree" ("status");



CREATE INDEX "idx_activity_members_activity_user" ON "public"."activity_members" USING "btree" ("activity_id", "user_id");



CREATE INDEX "idx_members_activity_state" ON "public"."activity_members" USING "btree" ("activity_id", "state");



CREATE INDEX "idx_room_events_activity_created" ON "public"."room_events" USING "btree" ("activity_id", "created_at");



CREATE OR REPLACE TRIGGER "trg_activities_updated_at" BEFORE UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_enforce_activity_expires_at" BEFORE INSERT OR UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_activity_expires_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sync_member_left_at" BEFORE INSERT OR UPDATE OF "state" ON "public"."activity_members" FOR EACH ROW EXECUTE FUNCTION "public"."sync_member_left_at"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_members"
    ADD CONSTRAINT "activity_members_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_members"
    ADD CONSTRAINT "activity_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_events"
    ADD CONSTRAINT "room_events_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_events"
    ADD CONSTRAINT "room_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities_delete_own" ON "public"."activities" FOR DELETE TO "authenticated" USING (("creator_id" = "auth"."uid"()));



CREATE POLICY "activities_insert_own" ON "public"."activities" FOR INSERT TO "authenticated" WITH CHECK (("creator_id" = "auth"."uid"()));



CREATE POLICY "activities_select_authenticated" ON "public"."activities" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "activities_update_own" ON "public"."activities" FOR UPDATE TO "authenticated" USING (("creator_id" = "auth"."uid"())) WITH CHECK (("creator_id" = "auth"."uid"()));



ALTER TABLE "public"."activity_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "members_insert_self_open_only" ON "public"."activity_members" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."activities" "a"
  WHERE (("a"."id" = "activity_members"."activity_id") AND ("a"."status" = 'open'::"text") AND (("a"."expires_at" IS NULL) OR ("a"."expires_at" > "now"())))))));



CREATE POLICY "members_select_authenticated" ON "public"."activity_members" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "members_update_self_open_only" ON "public"."activity_members" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND (("state" <> 'joined'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."activities" "a"
  WHERE (("a"."id" = "activity_members"."activity_id") AND ("a"."status" = 'open'::"text") AND (("a"."expires_at" IS NULL) OR ("a"."expires_at" > "now"()))))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_authenticated" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_upsert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."room_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "room_events_insert_open_only" ON "public"."room_events" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."activity_members" "m"
  WHERE (("m"."activity_id" = "room_events"."activity_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."state" = 'joined'::"text")))) AND (EXISTS ( SELECT 1
   FROM "public"."activities" "a"
  WHERE (("a"."id" = "room_events"."activity_id") AND ("a"."status" = 'open'::"text") AND (("a"."expires_at" IS NULL) OR ("a"."expires_at" > "now"())))))));



CREATE POLICY "room_events_select_members" ON "public"."room_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."activity_members" "m"
  WHERE (("m"."activity_id" = "room_events"."activity_id") AND ("m"."user_id" = "auth"."uid"()) AND (("m"."state" = 'joined'::"text") OR (("m"."state" = 'left'::"text") AND ("m"."left_at" IS NOT NULL) AND ("room_events"."created_at" <= "m"."left_at")))))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_expires_at"("p_created_at" timestamp with time zone, "p_end_time" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."compute_expires_at"("p_created_at" timestamp with time zone, "p_end_time" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_expires_at"("p_created_at" timestamp with time zone, "p_end_time" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_activity_expires_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_activity_expires_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_activity_expires_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_member_left_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_member_left_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_member_left_at"() TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."activity_members" TO "anon";
GRANT ALL ON TABLE "public"."activity_members" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_members" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."room_events" TO "anon";
GRANT ALL ON TABLE "public"."room_events" TO "authenticated";
GRANT ALL ON TABLE "public"."room_events" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







