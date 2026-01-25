#To run this script: ./scripts/dump_supabase_schema.sh from root
#!/usr/bin/env bash
set -e

sudo docker run --rm --network host postgres:17 \
pg_dump --schema-only --no-owner --no-privileges -n public \
"postgresql://postgres:Somnium_8947@db.vvpkrbrirnfzdvyndmet.supabase.co:5432/postgres" \
| awk '
  # ---- CREATE TABLE blocks ----
  /^CREATE TABLE / { in_table=1 }
  in_table { print }
  in_table && /^\);$/ { in_table=0 }

  # ---- FOREIGN KEY relationships ----
  /^ALTER TABLE ONLY / { stmt=$0; in_alter=1; next }
  in_alter { stmt = stmt ORS $0 }
  in_alter && /;$/ {
    if (stmt ~ /FOREIGN KEY/ && stmt ~ /REFERENCES/)
      print stmt ORS "";
    in_alter=0; stmt=""
  }
' \
| tee supabase/migrations/public_tables_and_relationships.sql > /dev/null
