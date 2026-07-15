# NearbyNow — Self-Host Backend Plan (搬離 Supabase 免費 tier)

> 2026-07-13。舊 Supabase 免費 project（`vvpkrbrirnfzdvyndmet`）停超過 90 日、過咗還原窗口、**已被刪，救唔返**（Management API 直接回 "paused for more than 90 days and cannot be restored"）。裡面淨係測試 data，冇損失。決定：搬去自己擁有嘅 stack，唔再靠會 rug-pull 嘅免費 tier。

## 決定：Self-host「Realtime-inclusive」Supabase 子集，放喺一台細 VPS，前面用 Caddy auto-HTTPS

點解唔用 Supabase Pro（$25/mo managed）：Pro 醫到 auto-pause，但**始終唔係你擁有**。付費 VPS ≠ 免費 tier rug-pull —— 你揸 root，你真正擁有嘅（schema + data + config + 成個 Docker stack）**host-independent、可攜**，一個鐘內搬去任何 box 或搬返 managed。呢個可攜性就係「擁有」。合你「own it / 去依賴」原則。Pro 保留做零運維逃生門（stack byte-identical，兩邊隨時互搬）。

## Repo 事實（synthesis agent 讀源碼驗到 —— 覆蓋咗 generic research）

- **指向新後端 = 改 2 個 env 值**：`lib/api/supabase.ts` 只讀 `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`。**零代碼改動**（仲有 `lib/backend/` abstraction）。
- **Realtime 係核心，唔可以 drop**：`lib/backend/supabase_backend.ts` 開 3 條 channel（`browse-activities`、`joined-realtime`、`nearby-now-room-<id>`），全部 `postgres_changes` on `activities` / `activity_members` / `room_events`。→ RAM floor 因為 Realtime（Elixir/BEAM）推到 **4GB**。
- **⚠️ 靜默失敗陷阱**：`postgres_changes` 要張 table 加入 `supabase_realtime` publication + `REPLICA IDENTITY FULL`。你 migrations **冇**呢兩樣（Supabase Cloud 係 dashboard toggle 設嘅，從未入 migration）。fresh self-host 個 publication 係**空**，realtime 會連到但**收唔到任何嘢**。必須跑一次（步驟 10）+ commit 做新 migration 修 drift。
- **唔使 SMTP**：`config.toml` `enable_confirmations = false`，email/password only，冇 OAuth、冇 password reset → GoTrue 唔使 mail server。
- **冇 Storage、冇 Edge Functions** → drop `storage` / `imgproxy` / `functions` container。
- **Postgres 17**（`.temp/postgres-version` = 17.6.1）→ self-host DB image pin v17。
- **Data**：fresh 空 DB（舊 project data 冇咗）。pre-launch 階段，OK。

## 你現有 server 現實（2026-07-13 SSH 實測）

| Server                         | Spec                                                                      | 用唔用得          |
| ------------------------------ | ------------------------------------------------------------------------- | ----------------- |
| racknerd-bot                   | 3.8GB RAM（淨 1.4G）, 3 core, **load 15.8**（跑緊成隊 crypto-sniper bot） | ❌ 冇位           |
| oracle-polymarket              | 945MB RAM, disk 淨 29MB                                                   | ❌ 太細 + disk 爆 |
| oracle-bot / aws-dublin / agpu | 連唔到（443 banner timeout / 22 timeout）                                 | ⏳ 未知           |

→ **冇一台現有 server 有位**放 4GB stack。需要另開一台細 VPS。

## 建議 spec

trimmed 容器（**db(pg17) + auth + rest + realtime + kong** + meta/studio bind localhost；drop storage/imgproxy/functions/analytics/vector）：

- **RAM 4GB 最低，8GB 舒服**（Realtime BEAM + Kong 係食 RAM 大戶；trimmed idle ~2–3GB）
- **CPU 2 vCPU 最低（4 舒服）**
- **Disk 40GB SSD 最低（80GB 有本地 backup retention）**
- 例：Hetzner CX22（2c/4G，~€4.5/mo）勉強；**CX32（4c/8G，~€7/mo）舒服**。RackNerd 另買一台平 VPS 亦可（你有 account）。Oracle 免費 ARM 24GB = $0 但要撞 capacity。

## Runbook（stand up + 指向 app）

1. Provision VPS（Ubuntu LTS）、SSH key-only、防火牆只開 **22 + 80 + 443**。
2. 裝 Docker + compose plugin。
3. `git clone --depth 1 https://github.com/supabase/supabase`；copy `docker/*` + `.env.example`→`.env`。
4. **生成全新 secrets**（唔好用 demo default）：`JWT_SECRET`(≥40)、`ANON_KEY`+`SERVICE_ROLE_KEY`（由 JWT_SECRET 簽）、`POSTGRES_PASSWORD`、`SECRET_KEY_BASE`(≥64)、`VAULT_ENC_KEY`(32)、`DASHBOARD_USER/PASS`。**全部入 gopass**。首次開機前設 `API_EXTERNAL_URL`/`SUPABASE_PUBLIC_URL`=`https://api.<domain>`、`SITE_URL`=app deep link。
5. Trim compose：移除 storage/imgproxy/functions/analytics/vector；keep db,auth,rest,realtime,kong,meta,studio；db image pin PG17。
6. Caddy：用官方 `docker-compose.caddy.yml`，Caddyfile `api.<domain> { reverse_proxy kong:8000 }`（auto Let's Encrypt + WebSocket 過 Realtime）。
7. DNS：`A api.<domain>` → VPS IP。
8. `docker compose up -d --wait`，verify health。
9. **套 schema**：`supabase db push --db-url postgresql://postgres:<PW>@<host>:5432/postgres?sslmode=disable`（跑 baseline + 3 migrations）。
10. **開 Realtime（修陷阱，跑一次 + commit 做新 migration）**：
    ```sql
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities, public.activity_members, public.room_events;
    ALTER TABLE public.activities       REPLICA IDENTITY FULL;
    ALTER TABLE public.activity_members REPLICA IDENTITY FULL;
    ALTER TABLE public.room_events      REPLICA IDENTITY FULL;
    ```
11. **指向 app（零代碼）**：`.env` / EAS secret 設 `EXPO_PUBLIC_SUPABASE_URL=https://api.<domain>` + 新 anon key → `eas update`（OTA）或 rebuild。
12. **Backup（不可省，而家全你負責）**：cron nightly `pg_dump` → off-box（B2 / Hetzner Storage Box），30 日 retention，**真跑一次 restore 測試**。
13. **E2E QA**（真人 tap 角度）：sign up → login → 開活動 → **Browse 即時見到**（證明步驟 10）→ join → 入 room post event（room_events realtime）→ 確認 RLS 遮到別人 data。Browse 唔即時更新 = 步驟 10 冇套到。

## 需要 Nicole 決定 / 提供（花錢，我做唔到）

1. **VPS**（一台，4–8GB）：Hetzner CX32（建議）／ RackNerd 另買 ／ Oracle 免費 ARM。要你開/買。
2. **Domain**（幾$/年）：要你擁有一個，畀 `api.<domain>` 用。有冇現成？
3. RAM tier：建議 8GB。
4. Data：確認 fresh 空 DB OK（pre-launch，冇真用戶）。

## 維護誠實話你知

Setup 一次幾個鐘（effort free）。長期 ~15–30 分鐘/月：check backup、`unattended-upgrades`、偶爾 `docker compose pull && up -d`（睇 release note，self-host 升級有時要 migration step）。Caddy 自動續 TLS。**唯一不可委託嘅係 backup + disaster recovery** —— 擁有嘅代價。

## 逃生門

Supabase Pro（$25/mo）做零運維 fallback，stack byte-identical，兩邊隨時互搬。
