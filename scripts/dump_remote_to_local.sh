#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="${PROJECT_REF:-vvpkrbrirnfzdvyndmet}"
OUT_FILE="${OUT_FILE:-/tmp/nearby_remote_data.sql}"
LOCAL_DB_URL="${LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

echo "==> Supabase login (if needed)"
npx supabase login >/dev/null 2>&1 || true

echo "==> Linking project ref: ${PROJECT_REF}"
npx supabase link --project-ref "${PROJECT_REF}" >/dev/null

echo "==> Dumping remote data to ${OUT_FILE}"
npx supabase db dump --data-only -f "${OUT_FILE}"

echo "==> Importing into local DB: ${LOCAL_DB_URL}"
psql "${LOCAL_DB_URL}" -f "${OUT_FILE}"

echo "==> Done. Sanity check:"
psql "${LOCAL_DB_URL}" -c "select count(*) from public.activities;"
