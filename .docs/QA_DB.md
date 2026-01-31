# DB QA Template (Nearby Now)

# DB QA 模板（Nearby Now）

Use this checklist after every migration. Copy the template section and fill it.
每次 migration 後用呢份 checklist。複製模板並填寫。

---

## Template (copy per migration)

## 模板（每個 migration 用一次）

Migration file:
Migration 檔案：

Affected tables/functions/policies:
受影響 tables/functions/policies：

Key risks:
主要風險：

Verification steps:
驗證步驟：

1. Migration applied
1. Migration 已套用

```sql
select * from supabase_migrations.schema_migrations
order by version desc
limit 5;
```

2. Tables/columns exist
3. Tables/columns 存在

```sql
-- Replace table/column names
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('<table_1>','<table_2>')
order by table_name, column_name;
```

3. Indexes exist
4. Indexes 存在

```sql
-- Replace table names
select indexname, indexdef
from pg_indexes
where tablename in ('<table_1>','<table_2>')
order by tablename, indexname;
```

4. Functions/Triggers exist (if any)
5. Functions/Triggers 存在（如有）

```sql
-- Replace function name pattern
\df public.<function_name>
```

5. Core query sanity
6. 核心查詢 sanity

```sql
-- Replace with the key query for this migration
select now();
```

6. App behavior check
7. App 行為檢查

- List any related UI flows to verify
- 列出相關 UI flow 驗證
- Example: "Create invite", "Join room", "Chat pagination"
- 例子：「Create invite」「Join room」「Chat pagination」

---

## Current helper scripts

## 目前 helper scripts

- scripts/qa_db.sql (auto-picks an activity_id and runs get_room_events_page)
- scripts/qa_db.sql（自動揀 activity_id，跑 get_room_events_page）

Quick usage:
快速用法：

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f scripts/qa_db.sql
```
