# DB QA Template (Nearby Now)

Use this checklist after every migration. Copy the template section and fill it.

---

## Template (copy per migration)

Migration file:

Affected tables/functions/policies:

Key risks:

Verification steps:

1. Migration applied

```sql
select * from supabase_migrations.schema_migrations
order by version desc
limit 5;
```

2. Tables/columns exist

```sql
-- Replace table/column names
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('<table_1>','<table_2>')
order by table_name, column_name;
```

3. Indexes exist

```sql
-- Replace table names
select indexname, indexdef
from pg_indexes
where tablename in ('<table_1>','<table_2>')
order by tablename, indexname;
```

4. Functions/Triggers exist (if any)

```sql
-- Replace function name pattern
\df public.<function_name>
```

5. Core query sanity

```sql
-- Replace with the key query for this migration
select now();
```

6. App behavior check

- List any related UI flows to verify
- Example: "Create invite", "Join room", "Chat pagination"

---

## Current helper scripts

- scripts/qa_db.sql (auto-picks an activity_id and runs get_room_events_page)

Quick usage:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f scripts/qa_db.sql
```
