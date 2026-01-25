#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# dump_supabase_schema.sh
#
# Outputs (all under supabase/SchemaSnapshot):
#   1) public_tables_and_relationships.sql
#   2) public_constraints_and_indexes.sql
#   3) public_policies.sql
#   4) public_triggers_and_functions.sql
#   5) public_types_domains_enums.sql
#   6) project_client_init.txt
#   7) project_meta.json  (manual-fill for Auth settings)
#
# How to run:
#   chmod +x scripts/dump_supabase_schema.sh
#   ./scripts/dump_supabase_schema.sh
# ============================================================

# :zap: CHANGE 1: Hardcode DB URL (local-only convenience)
SUPABASE_DB_URL="postgresql://postgres:Somnium_8947@db.vvpkrbrirnfzdvyndmet.supabase.co:5432/postgres"

OUT_DIR="supabase/SchemaSnapshot"
OUT_TABLES="${OUT_DIR}/public_tables_and_relationships.sql"
OUT_CONSTRAINTS_INDEXES="${OUT_DIR}/public_constraints_and_indexes.sql"
OUT_POLICIES="${OUT_DIR}/public_policies.sql"
OUT_TRIGGERS_FUNCTIONS="${OUT_DIR}/public_triggers_and_functions.sql"
OUT_TYPES_DOMAINS_ENUMS="${OUT_DIR}/public_types_domains_enums.sql"
OUT_CLIENT_INIT="${OUT_DIR}/project_client_init.txt"
OUT_PROJECT_META="${OUT_DIR}/project_meta.json"

mkdir -p "$OUT_DIR"

# :zap: CHANGE 2: Helper to run psql in docker (no local psql required)
psql_docker() {
  local sql="$1"
  sudo docker run --rm --network host postgres:17 \
    psql "$SUPABASE_DB_URL" \
      -v ON_ERROR_STOP=1 \
      -qAt \
      -c "$sql"
}

# :zap: CHANGE 3: Timestamp helper
now_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

echo "[dump] Starting..."
echo "[dump] DB: $SUPABASE_DB_URL"
echo "[dump] Out dir: $OUT_DIR"

# ============================================================
# Part A: Tables + Foreign Keys (from pg_dump)
# ============================================================
echo "[dump] Writing: $OUT_TABLES"
sudo docker run --rm --network host postgres:17 \
  pg_dump --schema-only --no-owner --no-privileges -n public \
  "$SUPABASE_DB_URL" \
| tee \
  >(awk '
      # ---- CREATE TABLE blocks ----
      /^CREATE TABLE / { in_table=1 }
      in_table { print }
      in_table && /^\);$/ { in_table=0; print "" }

      # ---- FOREIGN KEY relationships (ALTER TABLE ... FOREIGN KEY ... REFERENCES ...) ----
      /^ALTER TABLE ONLY / { stmt=$0; in_alter=1; next }
      in_alter { stmt = stmt ORS $0 }
      in_alter && /;$/ {
        if (stmt ~ /FOREIGN KEY/ && stmt ~ /REFERENCES/)
          print stmt ORS "";
        in_alter=0; stmt=""
      }
    ' > "$OUT_TABLES") \
> /dev/null

# ============================================================
# Part B: RLS Enable/Force + Policies (from catalogs)
# ============================================================
echo "[dump] Writing: $OUT_POLICIES"
{
  echo "-- ============================================================"
  echo "-- AUTO-GENERATED: public RLS + policies"
  echo "-- Generated at: $(now_utc)"
  echo "-- ============================================================"
  echo ""

  echo "-- ---- RLS flags (ENABLE/FORCE) ----"
  psql_docker "
    select
      case when c.relrowsecurity then
        'ALTER TABLE public.' || quote_ident(c.relname) || ' ENABLE ROW LEVEL SECURITY;'
      else
        null
      end as enable_sql,
      case when c.relforcerowsecurity then
        'ALTER TABLE public.' || quote_ident(c.relname) || ' FORCE ROW LEVEL SECURITY;'
      else
        null
      end as force_sql
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
    order by c.relname;
  " | awk -F'|' '
      {
        if ($1 != "" && $1 != "null") { print $1 "\n" }
        if ($2 != "" && $2 != "null") { print $2 "\n" }
      }
  '

  echo ""
  echo "-- ---- Policies ----"

  psql_docker "
    with p as (
      select
        n.nspname as schemaname,
        c.relname as tablename,
        pol.polname as policyname,
        pol.polpermissive,
        pol.polcmd,
        pol.polroles,
        pg_get_expr(pol.polqual, pol.polrelid) as qual,
        pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
      from pg_policy pol
      join pg_class c on c.oid = pol.polrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
    ),
    roles as (
      select
        p.*,
        case
          when array_length(p.polroles, 1) is null then array['public']::text[]
          else (
            select array_agg(quote_ident(r.rolname) order by r.rolname)
            from pg_roles r
            where r.oid = any(p.polroles)
          )
        end as role_names
      from p
    )
    select
      '-- Policy: ' || quote_ident(policyname) || ' on public.' || quote_ident(tablename) || E'\n' ||
      'CREATE POLICY ' || quote_ident(policyname) ||
      ' ON public.' || quote_ident(tablename) ||
      case when polpermissive then ' AS PERMISSIVE' else ' AS RESTRICTIVE' end ||
      case polcmd
        when 'r' then ' FOR SELECT'
        when 'a' then ' FOR INSERT'
        when 'w' then ' FOR UPDATE'
        when 'd' then ' FOR DELETE'
        else ' FOR ALL'
      end ||
      ' TO ' || array_to_string(role_names, ', ') ||
      case
        when polcmd in ('r','w','d') and qual is not null
          then ' USING (' || qual || ')'
        else ''
      end ||
      case
        when polcmd in ('a','w') and with_check is not null
          then ' WITH CHECK (' || with_check || ')'
        else ''
      end ||
      ';'
    from roles
    order by tablename, polcmd, policyname;
  " | awk '{ print $0 "\n" }'
} > "$OUT_POLICIES"

# ============================================================
# Part C: Constraints (PK/UNIQUE/CHECK) + Non-constraint Indexes
# ============================================================
echo "[dump] Writing: $OUT_CONSTRAINTS_INDEXES"
{
  echo "-- ============================================================"
  echo "-- AUTO-GENERATED: public constraints + indexes"
  echo "-- Generated at: $(now_utc)"
  echo "-- ============================================================"
  echo ""

  echo "-- ---- Constraints (PK / UNIQUE / CHECK) ----"
  psql_docker "
    select
      '-- Constraint: ' || quote_ident(con.conname) || ' on public.' || quote_ident(rel.relname) || E'\n' ||
      'ALTER TABLE ONLY public.' || quote_ident(rel.relname) ||
      ' ADD CONSTRAINT ' || quote_ident(con.conname) || ' ' ||
      pg_get_constraintdef(con.oid, true) || ';'
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public'
      and rel.relkind = 'r'
      and con.contype in ('p','u','c')
    order by rel.relname, con.conname;
  " | awk '{ print $0 "\n" }'

  echo ""
  echo "-- ---- Indexes (excluding constraint-backed indexes) ----"
  psql_docker "
    with constraint_indexes as (
      select conindid as index_oid
      from pg_constraint
      where conindid is not null
    )
    select
      '-- Index: public.' || quote_ident(cls.relname) || E'\n' ||
      pg_get_indexdef(idx.indexrelid) || ';'
    from pg_index idx
    join pg_class cls on cls.oid = idx.indexrelid
    join pg_class tbl on tbl.oid = idx.indrelid
    join pg_namespace n on n.oid = cls.relnamespace
    where n.nspname = 'public'
      and tbl.relkind = 'r'
      and idx.indexrelid not in (select index_oid from constraint_indexes)
    order by tbl.relname, cls.relname;
  " | awk '{ print $0 "\n" }'
} > "$OUT_CONSTRAINTS_INDEXES"

# ============================================================
# Part D: Functions + Triggers (public)
# ============================================================
echo "[dump] Writing: $OUT_TRIGGERS_FUNCTIONS"
{
  echo "-- ============================================================"
  echo "-- AUTO-GENERATED: public triggers + functions"
  echo "-- Generated at: $(now_utc)"
  echo "-- ============================================================"
  echo ""

  echo "-- ---- Functions (public) ----"
  psql_docker "
    select
      '-- Function: public.' || quote_ident(p.proname) || '(' ||
      pg_get_function_identity_arguments(p.oid) || ')' || E'\n' ||
      pg_get_functiondef(p.oid)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
    order by p.proname;
  " | awk '{ print $0 "\n" }'

  echo ""
  echo "-- ---- Triggers (public tables) ----"
  psql_docker "
    select
      '-- Trigger: ' || quote_ident(t.tgname) || ' on public.' || quote_ident(c.relname) || E'\n' ||
      pg_get_triggerdef(t.oid, true) || ';'
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and not t.tgisinternal
    order by c.relname, t.tgname;
  " | awk '{ print $0 "\n" }'
} > "$OUT_TRIGGERS_FUNCTIONS"

# ============================================================
# Part E: Types / Domains / Enums (public)
# ============================================================
# This helps future tightening (e.g., room_events.type), and captures custom types.
echo "[dump] Writing: $OUT_TYPES_DOMAINS_ENUMS"
{
  echo "-- ============================================================"
  echo "-- AUTO-GENERATED: public types/domains/enums"
  echo "-- Generated at: $(now_utc)"
  echo "-- ============================================================"
  echo ""

  echo "-- ---- Enums (public) ----"
  psql_docker "
    select
      '-- Enum: public.' || quote_ident(t.typname) || E'\n' ||
      'CREATE TYPE public.' || quote_ident(t.typname) || ' AS ENUM (' ||
      string_agg(quote_literal(e.enumlabel), ', ' order by e.enumsortorder) ||
      ');'
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'public'
    group by t.typname
    order by t.typname;
  " | awk '{ print $0 "\n" }'

  echo ""
  echo "-- ---- Domains (public) ----"
  psql_docker "
    select
      '-- Domain: public.' || quote_ident(t.typname) || E'\n' ||
      'CREATE DOMAIN public.' || quote_ident(t.typname) || ' AS ' ||
      pg_catalog.format_type(t.typbasetype, t.typtypmod) ||
      case when t.typnotnull then ' NOT NULL' else '' end ||
      case when t.typdefault is not null then ' DEFAULT ' || t.typdefault else '' end ||
      ';'
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typtype = 'd'
    order by t.typname;
  " | awk '{ print $0 "\n" }'

  echo ""
  echo "-- ---- Domain constraints (public) ----"
  psql_docker "
    select
      '-- Domain constraint: ' || quote_ident(con.conname) || ' on public.' || quote_ident(t.typname) || E'\n' ||
      'ALTER DOMAIN public.' || quote_ident(t.typname) ||
      ' ADD CONSTRAINT ' || quote_ident(con.conname) || ' ' ||
      pg_get_constraintdef(con.oid, true) || ';'
    from pg_constraint con
    join pg_type t on t.oid = con.contypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and con.contype = 'c'
    order by t.typname, con.conname;
  " | awk '{ print $0 "\n" }'
} > "$OUT_TYPES_DOMAINS_ENUMS"

# ============================================================
# Part F: Repo-side context for AI (client init + auth setting placeholder)
# ============================================================

# :zap: CHANGE 4: Dump Supabase client init from repo files (may include anon key)
echo "[dump] Writing: $OUT_CLIENT_INIT"
{
  echo "# ============================================================"
  echo "# AUTO-GENERATED: Supabase client init (repo-side)"
  echo "# Generated at: $(now_utc)"
  echo "# NOTE: This may contain keys. Local use only."
  echo "# ============================================================"
  echo ""

  # Try common paths. Adjust if your repo differs.
  for f in \
    "lib/supabase.ts" \
    "src/lib/supabase.ts" \
    "app/lib/supabase.ts" \
    "supabaseClient.ts" \
    ".env" \
    ".env.local"
  do
    if [[ -f "$f" ]]; then
      echo "## FILE: $f"
      echo "------------------------------------------------------------"
      # Print file content (AI needs exact init). If you prefer, replace with grep patterns only.
      sed -n '1,200p' "$f"
      echo ""
    fi
  done

  echo "## GREP: createClient/supabaseUrl/supabaseAnonKey"
  echo "------------------------------------------------------------"
  # Lightweight grep in case your init is elsewhere
  grep -RIn --exclude-dir=node_modules --exclude-dir=.git \
    -E "createClient\\(|supabaseUrl|supabaseAnonKey|SUPABASE_URL|SUPABASE_ANON_KEY|anon key" \
    . 2>/dev/null \
    | head -n 200 || true
} > "$OUT_CLIENT_INIT"

# :zap: CHANGE 5: Create project meta file for Auth settings (cannot be dumped via Postgres)
# Supabase Auth settings (email confirm on/off) live in GoTrue/project config, not in public schema.
echo "[dump] Writing: $OUT_PROJECT_META"
{
  cat <<'JSON'
{
  "generated_at_utc": "__REPLACE_WITH_TIMESTAMP__",
  "notes": [
    "Auth settings (e.g. email confirmation on/off) are Supabase project-level settings (GoTrue), not stored in Postgres public schema.",
    "Fill these fields manually from Supabase Dashboard > Authentication > Providers / Settings."
  ],
  "auth_settings": {
    "email_confirm_required": null,
    "email_confirm_hint": "Set true if signUp requires email confirmation before session becomes active. Set false if user is immediately signed-in after signUp."
  },
  "client_init": {
    "repo_dump_file": "supabase/SchemaSnapshot/project_client_init.txt",
    "uses_service_role_key": null,
    "service_role_hint": "Client apps should NOT use service role. If you see 'service_role' key in repo, it should only be on server."
  }
}
JSON
} | sed "s/__REPLACE_WITH_TIMESTAMP__/$(now_utc)/" > "$OUT_PROJECT_META"

echo "[dump] Done."
echo "  - $OUT_TABLES"
echo "  - $OUT_CONSTRAINTS_INDEXES"
echo "  - $OUT_POLICIES"
echo "  - $OUT_TRIGGERS_FUNCTIONS"
echo "  - $OUT_TYPES_DOMAINS_ENUMS"
echo "  - $OUT_CLIENT_INIT"
echo "  - $OUT_PROJECT_META"
