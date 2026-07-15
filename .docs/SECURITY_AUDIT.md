# NearbyNow Backend 安全審計 — 2026-07-15

> 方法：5 個 adversarial finder agent（authz/RLS、schema-drift、integration、realtime、integrity-race）靜態攻你個 backend，**每個 finding 再由另一個 agent 由唔同角度反攻證真定證假**。結果：**12 confirmed / 1 refuted / 0 uncertain**（18 agent、~1.37M token、7 分鐘）。威脅模型：攻擊者有一個普通已登入帳戶，可以直接 call Supabase REST/Realtime API，唔止經 app UI（UI 嘅 check 保護唔到 DB —— 只有 RLS + DB constraint + SECURITY DEFINER function 先做到）。

## 一個 root cause 撐起最恐怖嗰幾個：RLS 寫成 `USING (true)`

`20260519000000_security_hardening.sql` 個名叫「security hardening」，但佢**淨係 REVOKE 咗 `anon` role，從來冇 scope `authenticated` role**。所以：

- RLS 係「enabled」✓、有個「security_hardening」migration ✓、tsc 綠 ✓、test 過 ✓、app work ✓ —— **表面全部 scream「done + secure」**。
- 但 `activities` / `activity_members` / `profiles` 三張表嘅 SELECT policy 都係 `USING (true)` = **「任何登入用戶讀曬所有嘢」**。RLS enabled 但 `USING(true)` = 一把冇上鎖嘅鎖。
- 呢個正正係「叫 AI 整 best practice」嘅招牌死法：AI 嘅懶 default 就係 `USING(true)`，再包一個叫 hardening 嘅 migration 扮做好咗。**齋讀 code 睇唔穿（語法上係一條正常 RLS policy），只有「攻擊者問：我讀唔讀到我唔應該讀嘅嘢」先捉到。**

---

## HIGH — 上真用戶前必修（呢個係陌生人見面 app，係人身安全）

### H1. 全開嘅出席者名單 + profile + 地點 = 起底/跟蹤 feed `[authz-rls]`

- **證據**：`activity_members` 只有 `members_select_authenticated ... USING (true)`（baseline.sql:305）；配 `activities_select_authenticated USING(true)`（baseline.sql:288，露 lat/lng、place、start_time）+ `profiles_select_authenticated USING(true)`（baseline.sql:318，露每個用戶 display_name）。（room_events **有**正確 gate 到 member，baseline.sql:341 —— 證明名單嗰個 `USING(true)` 係漏，唔係設計。）
- **攻擊**：普通 token → `GET /rest/v1/activity_members?activity_id=eq.<任何id>` 攞全部 user_id → `GET /profiles?id=in(...)` 攞名 → `GET /activities?...&select=lat,lng,start_time` 攞精確座標+時間 = **邊個實名人、幾點、喺邊個 GPS 點聚會**嘅去底地圖。
- **你點驗**：用普通帳戶登入，揀一個你**冇 join** 嘅 meetup，用你自己 session token 去 REST 拉佢個 members list。如果拉到其他人 user_id（再查到名同地點）→ 漏。

### H2. Realtime 即時洩露行蹤（H1 嘅 live 版） `[realtime]`

- **證據**：`realtime_publication.sql:10-17` 將 `activity_members` + `activities` 加入 publication + REPLICA IDENTITY FULL；佢哋 SELECT RLS 係 `USING(true)`，Supabase Realtime 按 SELECT policy 授權每行 → **INSERT/UPDATE/DELETE 事件推去每一個已登入 subscriber**。（room_events 有 gate，所以 chat 唔漏，正好反證 member/activity 事件漏。）
- **攻擊**：攻擊者開一條 realtime channel，listen `activity_members` filter `user_id=eq.<受害者>`，**永遠唔 join**，就即時收到受害者每次 join/leave 邊個 activity → 再讀 activities 攞地點 = **一個特定真人幾時去邊度聚會嘅實時跟蹤 channel**。
- **你點驗**：兩個唔相干帳戶 A、B。A 喺 realtime 測試頁 subscribe member 變動、乜都唔 join；B join/leave 任何 A 唔喺度嘅 activity。A 即刻收到 B 嘅 join/leave → 漏（而 chat 唔會漏，證明 app 保護咗 chat 但漏咗行蹤+地點）。

### H3. 「只限女性 / 只限男性」邀請根本 create 唔到 `[schema-drift + integration]`

- **證據**：DB `chk_activities_gender_pref CHECK (gender_pref IN ('any','men','women','non-binary'))`（security_hardening.sql:52）；但 app 只出 `any|female|male`（InviteForm.tsx:16/638），原封寫入（create.tsx:35 → supabase_backend.ts:85），冇 remap。`female`/`male` 唔喺允許集 → **insert 被 DB reject**。**同已修嘅 room_events bug 一模一樣嘅 class（schema vs TS type drift）。**
- **後果**：揀「只限女性」post → `violates check constraint chk_activities_gender_pref` → 落唔到單。**只有「任何人」work**；一個 safety-critical 嘅女性限定過濾器係爛嘅。
- **你點驗**：Create → Show more → 「只限女性」→ Post = 出 error 冇 activity；改返「任何人」= 正常出。

### H4. 就算 create 到，gender 限制都攔唔到任何人 `[integrity-race]`

- **證據**：member INSERT policy（baseline.sql:299）只 check `user_id=auth.uid()` + activity open，**完全冇 reference gender_pref**；而且 `profiles` 表**根本冇 gender column**（baseline.sql:146），即係**原理上都冇得 enforce**。gender_pref 淨係俾嚟顯示。
- **攻擊**：`gender_pref='women'` 嘅 activity，任何帳戶 `POST /activity_members {state:'joined'}` 都入到房。**「女性安全空間」= 裝飾。**
- **你點驗**：A 開一個「只限女性」，B（app 從來冇問過性別）去 Join；入到 = 假限制。

---

## MEDIUM

### M1. Capacity race — 同時 join 爆容量 `[integrity-race]`（原 high，verify 下修 medium）

- `enforce_capacity()`（security_hardening.sql:170）係 non-locking `COUNT(*)`，冇 `FOR UPDATE`/advisory lock/unique 約束。READ COMMITTED 下兩個同時 insert 各自見到 capacity-1，兩個都過 → 超額。上限受 PK(activity_id,user_id) + `user_id=auth.uid()` 約束，通常爆 1-2 個。
- **你點驗**：整一個 max=2 嘅 activity，填到 1 個，兩個 friend 同一秒撳 Join；member list 多過 max = 穿。

### M2. Member 可以偽造官方「system」訊息 `[authz-rls]`

- `room_events_insert_open_only`（baseline.sql:333）只 check self + joined + open，**冇限制 `type`**；`type='system'` 被 renderer 當官方灰色系統通知（room/[id].tsx:636），content 嘅 `{"k":"room.system.invite_closed"}` map 做「活動已關閉」（room.ts:193）。
- **攻擊**：join 後 `POST /room_events {type:'system', content:'{"k":"room.system.invite_closed"}'}` → 全房見到假「活動已關閉」→ 呃人唔嚟。
- **你點驗**：兩帳戶入同一房，B 用 REST 出一條 type=system 的「已關閉」訊息；A 見到冇人真係關閉過嘅官方關閉通知 = 可偽造。

### M3. Room 吞 load error → joined member 被靜靜當非 member `[integration]`

- `loadAll` 只 `console.error(meErr)`（room/[id].tsx:170），membership 留 default 'none' → chat 清空 + 顯示 Join。網絡差時一個 member state 請求失敗就中；而且 realtime re-subscribe gate 喺 `myMembershipState==='joined'`（:285），一鎖 'none' 就冇 realtime 冇 retry，要手動退房重入先返到。
- **你點驗**：join 一個房睇到訊息，整到極差網絡再開同一個房；你短暫變「未 join」（Join、冇訊息）但你冇離開過 → 應該出「載入失敗、重試」而唔係靜靜掉你去非 member view。

---

## LOW（defense-in-depth）

### L1. Member 可自封 `role='creator'` `[authz-rls / integrity-race]`

- member INSERT/UPDATE policy 冇限制 `role`，`chk_members_role` 又允許 'creator'（security_hardening.sql:56）。**今日只係 cosmetic**（真 owner 權限 key 喺 `activities.creator_id`，room/[id].tsx:327；room_events insert gate 喺 state 唔係 role），但將來任何信 `member.role` 嘅 feature 就會當佢係 host。

### L2. 直接 API 可造 `capacity<=0` 嘅 ghost activity `[integration]`

- `activities.capacity` 冇 DB CHECK（baseline.sql:122 純 nullable int）。UI 擋 <1，但 direct REST `{capacity:0}` 過到 RLS，row 出現喺 Browse 但**冇人（連 creator）join 得到**（enforce_capacity: 0>=0 → full）。可洗版 Browse。

---

## REFUTED（1）— 證明呢套唔係橡皮圖章

**closeInvite「關閉失敗」UI 分岔** — 被反攻推翻。理由：`insertRoomEvent` 係 `return {error}` **唔 throw**（supabase_backend.ts:222）；closeInvite 個 return value await 咗但**冇 check**（room/[id].tsx:468），所以 error 被吞、`loadAll` 照跑、UI 顯示 closed；就算真係網絡 throw，realtime `onActivityChange → scheduleReload`（:288）都會 self-heal。原 finding 混淆咗「returns {error}」同「throws」。→ 一個 confident-sounding 但**錯**嘅 finding，被 orthogonal 反攻殺咗。

---

## 修復建議（優先序）

1. **一條 RLS scoping migration**（一次過搞掂 H1、H2、大半個 M2 嘅 read 面）：
   - `activity_members` SELECT → 只限「同你 share 緊一個你已 join 嘅 activity 嘅 member」或該 activity 嘅 creator。
   - `profiles` SELECT → 只限「同你 share 緊 activity 嘅人」（唔好全表可讀）。
   - `activities` SELECT → open 嘅可 browse 合理，但考慮 lat/lng 精度（join 前只俾粗略位置？）+ closed/expired 唔好全露。
   - realtime 會自動跟 SELECT policy 收緊（H2 一齊好）。
2. **`chk_activities_gender_pref` 對齊 TS type**（H3）：constraint 改成 `('any','female','male')`（或 app remap，二揀一，一邊做 source of truth）。
3. **gender / capacity 服務端 enforce**（H4、M1）：join 前用 SECURITY DEFINER RPC 做「原子檢查+插入」（鎖 activity row、驗 capacity、驗 gender if 有 gender 資料），唔好靠 client。H4 要先決定收唔收 gender 資料。
4. **M2**：RLS 加 `type IN ('chat','quick')`（禁 client 寫 system），或 system 事件改由 SECURITY DEFINER RPC 出。
5. **M3**：`loadAll` 嘅 error 唔好吞 → 出 retry；realtime re-subscribe 唔好只靠 membership state。
6. **schema-as-code guard**：`tests/sql/migration_constraints.test.sql` 擴展去 assert 每個 CHECK/enum vs TS union（防第 4 次 drift）。
7. L1/L2：RLS 加 role/state/capacity 的 WITH CHECK 約束（低優先）。

> **每個修好之後用真 Supabase creds 做 live 攻擊驗證**（我有 creds）——「攻擊打唔穿」先叫真係修好，唔係「migration apply 咗」。
