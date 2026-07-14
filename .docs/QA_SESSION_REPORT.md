# NearbyNow — QA + Fix Session Report (2026-07-14, 自主完成)

## 定案 build（派 fd 用呢個）

- 安裝頁（QR）：https://expo.dev/accounts/ithiria137/projects/nearby-now/builds/2d3540b1-8cd2-4d81-91ae-fa85f7509833
- 直接 APK：https://expo.dev/artifacts/eas/MgjSs5a-MGEap4xgJE8pF7KN6ylYoZxwiiyudIqreNk.apk
- fd 要**重裝呢個新 APK**先有 app-code fix（room bug 係後端 fix，佢即刻已受惠唔使重裝）。

## ✅ 實機 E2E 驗證通過（Pixel 8 Pro，定案 build）

1. Fresh launch → **直接 Login，冇「Refresh failed」flash**（index routing fix）
2. **註冊 → 直接入 app**（冇二次登入；register label Email/Password 正常）
3. Browse 顯示活動 + expiry **「closes in 29 days」**（唔再「718 小時…前完」）
4. 地圖 **OSM 免費 render**（MapLibre，零 Google/零卡）
5. Join lobby → **room chat + quick「I'm here」全 work，冇 Failed**

## 已修 bug（6 commit，全部 tsc + jest 綠 + git diff 審查）

**後端（已 live）**：`chk_room_events_type` message/system→chat/quick/system（fd 爆嗰個）。

**Batch 1 — auth（5）**：register 二次登入、offline 誤登出、login ensureProfile 困死、register label i18n、index dead code + login debug log。

**Batch 2 — 高影響（21）**：splash 無限 hang timeout、i18n English fallback、create 冇 transaction（orphan+重複）guard、compose 標題 collapse+cap200、place-chip 要真座標、past-time guard、browse 非-auth error 唔再登出、移除死 filter UI、browse empty CTA route、地圖 fit-to-markers、password trim、duplicate-email、expiry 顯示「N 日後」。

**Batch 3 — room/realtime（11）**：compose dup-guard+reset、joined/created/room false-logout、**realtime re-add（isJoinableActivity 尊重 joinedSet — 最高影響 realtime defect）**、Send 空 disable、doLeave 原子化重排。

**Batch 4 — routing（1）**：index 按 session 路由。

→ 共約 **41 個 fix**。

## QA checklist

`.docs/QA_CHECKLIST.md` —— 7-agent 分析，**169 個 findings**，逐個 screen/function + edge case。

## 剩低 findings（未修，等你決定 —— 唔盲改免搞爛）

- **Report / Copy 未實作**（room 長按選單）—— meet-strangers app 嘅 **safety gap**，係 feature 唔係 bug，要你決定點做 moderation。
- **Search 未實作**（browse 搜尋框打字唔 filter）—— feature。
- GPS timeout / Nominatim 429 無 retry copy、pagination-vs-client-filter 令 count under-report / 分頁停、realtime channel churn、Hermes ICU 月份格式、gender 只得 any/male/female（無 non-binary，DB 又無 constraint）等 —— 多數 edge-case / polish / 複雜 race，風險高，逐個要 care。全部喺 QA_CHECKLIST.md。

## 建議下一步（你醒返揀）

1. 我繼續掃 batch 5（揀 checklist 入面你想優先嘅 clear findings）。
2. 或者針對 Report/moderation（safety）做設計 + 實作。
3. 或者呢個 build 夠好，派返 fd 試新版先收 feedback。
