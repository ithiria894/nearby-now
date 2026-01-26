# Local Development Notes (Nearby Now)

This file is for my own reference.
Not meant to be a public README.

---

1. Start / Stop Supabase local

---

Start local Supabase:
npx supabase start

Stop local Supabase:
npx supabase stop

Check status:
npx supabase status

---

2. Local database connection

---

Supabase local DB connection info:

Host: 127.0.0.1
Port: 54322
User: postgres
Password: postgres
Database: postgres

Preferred way to connect: shell alias.

I created a shell alias:

psql-nearby

Alias definition (in ~/.bashrc):

alias psql-nearby="psql postgresql://postgres:postgres@127.0.0.1:54322/postgres"

Usage:
psql-nearby

This opens the local Supabase Postgres directly.

---

## 2.1 PostgreSQL service file (pg_service.conf)

I also configured a PostgreSQL service entry for convenience.

Config file location:
~/.postgresql/pg_service.conf

Content:

[nearby_local]
host=127.0.0.1
port=54322
user=postgres
password=postgres
dbname=postgres

Usage:

psql service=nearby_local

This is an alternative to the shell alias.
Useful if I later add multiple environments
(e.g. nearby_staging, nearby_prod).

Notes:

- psql looks for pg_service.conf under ~/.postgresql/
- File name must be exactly: pg_service.conf
- Section name (nearby_local) is the service name

---

3. Verify tables

---

Inside psql:

\dt public.\*

Expected tables (current):

- activities
- activity_members
- profiles
- room_events

---

4. When local DB feels weird

---

Try these in order:

npx supabase stop
npx supabase start

If schema is wrong or broken:

npx supabase db reset

---

5. Supabase Studio

---

Local Studio URL:
http://127.0.0.1:54323

Use Studio for:

- Inspecting tables
- Viewing RLS policies
- Sanity checks

Do NOT use Studio to manually change schema.
