# Local Development Notes (Nearby Now)

# 本地開發筆記（Nearby Now）

This file is for my own reference.
呢個檔案係我自己用。
Not meant to be a public README.
唔係對外公開 README。

---

1. Start / Stop Supabase local
1. 啟動 / 停止 Supabase 本地

---

Start local Supabase:
啟動本地 Supabase：
npx supabase start

Stop local Supabase:
停止本地 Supabase：
npx supabase stop

Check status:
檢查狀態：
npx supabase status

---

2. Local database connection
3. 本地資料庫連線

---

Supabase local DB connection info:
Supabase 本地 DB 連線資料：

Host: 127.0.0.1
Port: 54322
User: postgres
Password: postgres
Database: postgres

Preferred way to connect: shell alias.
建議用 shell alias 連線。

I created a shell alias:
我已建立 alias：

psql-nearby

Alias definition (in ~/.bashrc):
Alias 定義（在 ~/.bashrc）：

alias psql-nearby="psql postgresql://postgres:postgres@127.0.0.1:54322/postgres"

Usage:
用法：
psql-nearby

This opens the local Supabase Postgres directly.
會直接開本地 Supabase Postgres。

---

## 2.1 PostgreSQL service file (pg_service.conf)

## 2.1 PostgreSQL 服務檔（pg_service.conf）

I also configured a PostgreSQL service entry for convenience.
我亦配置咗一個 PostgreSQL 服務，方便使用。

Config file location:
設定檔位置：
~/.postgresql/pg_service.conf

Content:
內容：

[nearby_local]
host=127.0.0.1
port=54322
user=postgres
password=postgres
dbname=postgres

Usage:
用法：

psql service=nearby_local

This is an alternative to the shell alias.
呢個係 alias 以外嘅另一種方法。
Useful if I later add multiple environments
日後如果有多個環境會方便
(e.g. nearby_staging, nearby_prod).
（例如 nearby_staging, nearby_prod）。

Notes:
注意：

- psql looks for pg_service.conf under ~/.postgresql/
- psql 會喺 ~/.postgresql/ 找 pg_service.conf
- File name must be exactly: pg_service.conf
- 檔名必須係 pg_service.conf
- Section name (nearby_local) is the service name
- section 名稱（nearby_local）係 service name

---

3. Verify tables
4. 驗證 tables

---

Inside psql:
喺 psql 入面：

\dt public.\*

Expected tables (current):
預期 tables（目前）：

- activities
- activity_members
- profiles
- room_events

---

4. When local DB feels weird
5. 本地 DB 怪怪地時

---

Try these in order:
按順序試：

npx supabase stop
npx supabase start

If schema is wrong or broken:
如果 schema 有問題：

npx supabase db reset

---

5. Supabase Studio
6. Supabase Studio

---

Local Studio URL:
本地 Studio URL：
http://127.0.0.1:54323

Use Studio for:
Studio 用途：

- Inspecting tables
- 檢查 tables
- Viewing RLS policies
- 查看 RLS policies
- Sanity checks
- 基本檢查

Do NOT use Studio to manually change schema.
唔好用 Studio 手動改 schema。

---

6. DB workflow
7. DB workflow

---

See: .docs/DB_WORKFLOW.md
詳見：.docs/DB_WORKFLOW.md
