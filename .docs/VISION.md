# enoki — 世界觀 / Product Vision 🍄

> **一句講晒**：enoki 幫你**即興揪人一齊玩**，唔使做「主辦人」，唔使起 profile，改個名就出 post。
> 一條金菇淡淡無味，一紮金菇一齊煮先至鮮甜好味。

_單一真相源。所有 product 決定對住呢份文件。（來源：Nicole × CY 2026-07 Telegram + Discord 討論。）_

---

## 0. 點解會有 enoki（origin）

睇到好多人喺 Threads 出「有冇人一齊食火鍋 / 玩狼人殺 / board game」，但**冇工具協調** —— 樓主要逐個逐個 inbox 有興趣嘅人。加上 Nicole 自己去過 meetup 活動，**去到搵唔到人**（冇 pre-event chatroom、搵唔到 host、host 又唔覆），活動已經開始咗。呢種「搵附近人即興做啲活動」嘅 app，暫時真係未有一個做啱。

> 靈感原型：**enoki = 多人版 Heymandi** —— 一開 app 講一句就即刻有人覆，無 profile、零門檻，只係由「1 對 1 匿名 chat」搬去「一齊做活動」嘅 group context。

---

## 1. 我哋幫邊個（Target user）

**唔限地域、唔限族裔 —— 每個城市都有呢種人。** 核心係一種**心態**：

> 想搵人一齊做／搞啲活動，但**唔想做「host」嗰個好認真、好有責任、要孭場嘅角色**。

佢哋覺得「太毒 🥲」「小悶」，想即興搵伴玩低門檻嘢：火鍋、唱 K、酒局、board game／狼人殺、festival、揾飯友、行街食飯。

---

## 2. 佢哋要完成嘅工作（Job-to-be-done）

> 「幫我而家搵到幾個人，一齊去做 X —— 唔使我孭起成場、唔使我管一大堆嘢。」

---

## 3. 現有方案點解爛（= 我哋嘅入口）

而家佢哋喺 Threads／IG 出「臨時開團 / 有冇人一齊 X」→ 有興趣留言「報名／+1」→ 樓主**手動** DM ＋ IG 限動放 Google form 數人頭 ＋ 拉 WhatsApp group。

| 痛點                          | 佢哋原話（真證據，見 `market-evidence/`）                |
| ----------------------------- | -------------------------------------------------------- |
| 冇 RSVP／容量                 | 「填報名表統計人數」「額滿了」「座位留給盡快確認時間者」 |
| coordination 散晒             | comment → DM → IG form → WhatsApp，四五個工具            |
| discovery 靠彩數              | 「會比其他 post 淹沒咗」                                 |
| 冇身份／信任連續性            | 「網友相認現場」「見過但唔記得你個名」                   |
| **host 角色太重**             | 「第一次在脆上找飯友，覺得挺大膽的」                     |
| 加入現成興趣群組又難又 cringe | 「一入 group 就即刻搵人去做活動…成件事好 cringe」        |
| 需求係真                      | 單一 post 去到 152❤️ / 79💬 / 幾千 views                 |

**最關鍵**：痛點唔止「冇好 RSVP 工具」，係 **「做 host / 主辦」個角色太重**。現有 event app（Meetup / Partiful / Luma）host 同參加者係兩種人，host 通常有 sell 嘢 / business 目的。**enoki 出 post 嗰個唔係 host，佢只係想搵人一齊做佢本身都想做嘅嘢。**

---

## 4. 核心設計原則

1. **拆走 host 負擔**（架構層 differentiator）
   開個活動 = 「我想去 X，邊個一齊?」。發起人只係「**先開口嗰個參加者**」，唔係要孭場嘅主辦。⚠️ UI 上「host」唔好變成一個令人卻步嘅認真身份／badge。

2. **匿名優先、輕身份**
   身份淨係 **nickname ＋（可選）性別**，隨時改得。**唔 upload 頭像、唔寫興趣 bio、唔使註冊一大輪** —— 唔好搞到似交友 app。少 friction 係第一優先。

3. **強制 group、冇 1 對 1 inbox**（HARD 約束）
   全 app **冇任何一對一私訊**，所有對話都喺 group／room 入面。刻意咁做係為咗**唔會變成一對一交友／dating DM 工具**。

4. **「傾偈 and/or 見面」，location 唔係硬閘**
   一間房可以「淨係傾偈」又得、「約出嚟」又得。**唔會逼你有地點先開到房** —— 逼 location 會壓死早期成長。「附近」係一個 discovery 訊號，唔係一個 requirement。（CY 提過個 design 有少少太 geo-heavy，好多 event 最後會 online；Nicole 澄清核心從來唔係 location-gated。）

5. **即興 discovery（附近 + follow）**
   「附近有人開咗活動」「你 follow 嗰個開咗新房」直接 push 畀你 —— 直接打即興社交嘅頭號死症：**空 feed（冷啟動）**。

6. **內建 RSVP ＋ 容量 ＋ coordination**
   報名／人數／容量 app 幫你搞掂；開團後喺 Rooms 傾，取代 WhatsApp group。活動完，發起人可**保留個 group**（下次再玩 / 變朋友）**或者解散**。

7. **vibe tags**
   每個活動可帶 0–3 個 vibe tag（例如 文青 vs 狂野），前頁可 filter。一開始**唔用全自由 text**（太自由就好難搵），用受限 select 保持可搜尋。

---

## 5. Go-to-market（點樣 reach 人）

- **Web-first、shareable-link 做主漏斗**：整個 share link，樓主可以掉條 link 落佢現有嘅 WhatsApp／IG／Threads post，**一 click 就直接入到房**（唔使 signup、唔使 profile、淨係 nickname+性別）。玩完一次體驗好，先 download 隻 app。→ web／url 版要行先。
- **先攻中文市場**（Threads 出 post 流量大但唔 target、會被淹沒）。
- **Distribution 係所有平台最難嘅嘢** —— 揾人上嚟先係真挑戰，broadcast push 係武器。
- 出 Reddit 俾人鏟 UI 收 feedback 先改好。
- **近期即將派 beta 畀真人試。**

---

## 6. Business model（未定，方向）

- **暫時未有 monetization** —— app 起初純粹自己想用。
- **明確唔行 Meetup 嘅「organizer 課金」model**（正正係現有 app 對大部分人賺唔到錢嘅原因）。
- **餐廳／場地合作**做 revenue + content hook：活動綁真實優惠（例如韓燒平日 happy hour 要最少 2 人）。
- **Moderation 係生死線**：無 moderation 嘅空間會變墳場。要防 sex-party 揪人、亂 share contact、OnlyFans 自我宣傳 → 起碼 keyword ban。
- Family-friendly vs 18+ 定位未決，睇邊啲人用多啲先定（18+ 太多會殺死多元）。

---

## 7. 信任 & 安全

> **對其他用戶匿名，對系統唔匿名。**

- handle 隨你改，但底層帳號**綁死 verified phone / device** → 改名 ≠ 開新帳號 → ban 到就走唔甩。
- 高風險動作（開活動 / 約人出嚟）先**驗電話**（一次過、對其他人隱形）。scam 靠量，每個馬甲要一個新號 = 成本爆。
- 新／未驗 handle 有 rate limit；**舉報 → 即時 ban（ban 落 account 唔係 handle）**。
- 顯示「✓ 已驗證」badge，畀信任訊號但唔洩露身份；用戶可揀淨係見 verified host。
- 檢舉係所有 app 通用嘅安全底 —— 就算成個 profile 擺晒出嚟都要有人 report 先知係 scam，所以「改得名」唔蝕安全。
- ⚠️ 考慮過 live-location「邊個到咗」（Uber/Maps 式）解決「去到搵唔到人」，但有**洩露住址**風險，暫時 shelve。

---

## 8. 品牌 / Naming 🍄

- **命名哲學**：唔好直接描述功能；短（4–8 字）、估唔到、抽象。近年會紅嘅 app 個名多數同功能無關。
- **由來**：nearby-now（descriptive 工作名）→ 試過一輪名多數俾人用晒 → 食物名 → **enoki（金菇）** → pun「**Fungi = fun guy**」，EnokiApp.com 平 + available。
- **試過／否決嘅名**：Fika（太似 Flock）、Bento、Otter（讀音含糊）、See you tomorrow.io。
- **吉祥物**：**每個 user 登入默認 = 一條金菇**。試過有面／有手手 vs 無面密集一紮（避 trypophobia）、3 個唔同表情（怕醜／興奮／享受）；刻意避開「似 butthole / 4 條 dickhead / AI slop」嘅 read。
- **Slogan 候選**：「你想唔想要一堆 fungi 呀」、「係屋企困太耐，菇都生埋出嚟，要出下去喇」。
- **離開房 gag**：mushroom 被 flush 走嘅動畫 + punchline「See you tomorrow」。**所有音效否決咗**，flush 視覺保留討論中。
- **顏色**：主色 = 淡啡黃（真金菇色）；accent 傾向**淡綠**做差異化（magenta 似 Meetup、紅／橙／黃太飽和市場多，都否決）。
- **Text wordmark 做 logo**（「enoki」字型本身）—— 好處係可以 screenshot 俾人睇、可 search。試緊 Reem Kufi Fun / Madimi One / Pangolin 等 Google Fonts。
- Mascot AI 圖有「AI 味」要 de-AI；後備方案：搵真人畫家（CY 妹妹，art student）重畫。

---

## 9. 資訊架構（現況 + 方向）

- 現時 tab：**browse**（發現）/ **rooms**（你有份嘅活動，host+joined 合併）/ **notifications**。
- 方向（TG 討論）：兩頁前台 —— **Schedule**（我 join 咗嘅活動）+ **Explore**（發現，名偷自參考 app）；**create** 改做底部一個**大 floating「+」**掣；**notifications 唔急做獨立 tab**，可能先塞喺 feed 頂做 status section；**feed 都 show 已完結 event 整 FOMO**。
- 開房大入口用**輪播 placeholder**（示範用法 + 減少重複 title）；idle 時可有**平 LLM AI 幫寫 title**（幫 introvert 開房）。
- 字體用 **Noto Sans**（cover 所有語言，為將來多語言）。

---

## 10. 已 build、對得住 vision 嘅嘢

| 已 build                          | 對應                       |
| --------------------------------- | -------------------------- |
| 「附近有人開咗活動」push          | §5 冷啟動 / §4.5 discovery |
| 匿名 + 性別（唔 verify、可改）    | §4.2 輕身份                |
| Rooms（合併 host/joined）         | §6 coordination            |
| config-reuse（開新空房同 config） | §2 低門檻再開團            |
| push infra（附近 + room message） | §5                         |
| vibe column                       | §4.7                       |
| reset-password                    | §9                         |

_視覺方向：neobrutalism（CY 起初）↔ 文青治癒 soft（Nicole）→ 迭代折衷，避「vibe-code / tech / AI 味」。技術：Supabase（考慮自 host VPS）、免費非-Google 地圖、web 版已存在。證據：`market-evidence/`。_
