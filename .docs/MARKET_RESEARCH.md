# enoki — 市場研究 / Market Research 🍄

_2026-07-16。18-agent 並行研究(demand 驗證 ×3、競品拆解 ×13、complaints + dead solutions ×2)綜合。_

## ⚠️ 方法 & 信心度(先講清楚,唔 sugar-coat)

- **17/18 個 agent 有真數據;1 個(Reddit/forums demand)failed** —— curl Reddit JSON / Bluesky / mirror 全部俾 Cloudflare 403,WebSearch 揾唔到 raw post,佢返咗 placeholder,**唔當證據**。
- **Demand 證據係 aggregate / 新聞 / app-store 級,唔係 raw 逐個 post + engagement**(同一個 Cloudflare 封鎖原因)。→ **demand 信心 = MEDIUM,唔係 HIGH**。要 raw post-level 數據要 authenticated API 或人手 login browse。
- **一個誠實負面發現**:Threads/IG 有啲「想交朋友」post 係 **spam campaign**(同一張 selfie + WhatsApp link 5 日 repost 30+ 次,Engadget 踢爆),唔算 organic —— 已剔走。
- 競品拆解係 [CHECKED](WebFetch 真 app-store / 官網頁),個別欄位 app 頁 403 有標 [UNVERIFIED]。

---

## 1. 一句總結(the story)

> **架構白位係真嘅**:13 個競品,**10 個逼你做 host 或者填 profile**,而且**全部係 scheduled 唔係即興 nearby**。冇一個夾齊「**無 host + 匿名 + 即興 nearby**」呢三樣 —— 正正係 enoki 嘅 thesis。
> **但唯一試過幾乎一模一樣 spec 嘅 Flock(Vancouver 出品)冇死於 model 錯,係死於 cold-start(空 feed / liquidity)。** → enoki 個 model 被 Flock 驗證咗,**真正嘅仗係 cold-start**。

---

## 2. 競品全景(13 個,對 enoki 三條軸)

| 競品                                   | 要 host?                                  | 要 profile?                                    | 即興+nearby?                                       | 逼 host/profile | 最大限制 / gap                                                                  |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------- | -------------------------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| **Meetup**                             | ✅ 要,仲要**課金**(~$30/mo organizer sub) | 唔強制                                         | ❌ scheduled(建議提早 6 週宣傳)                    | True            | 冇人課金做 organizer 就乜都冇;organizer burnout                                 |
| **Bumble BFF**                         | group「Plans」要                          | ✅ **重**(selfie 驗證 + 4 相 + bio)            | ❌ swipe-match-then-schedule                       | True            | 掛住「spontaneous friendship」但係 scheduling app;要 swipe 完先見面             |
| **Partiful**                           | ✅ **重**(整 event page、管 guest list)   | 客人淨係電話號 RSVP                            | ❌ 全部 scheduled                                  | True            | 係現有社交圈嘅 planning/RSVP 工具,唔係陌生人 discovery                          |
| **Nextdoor**                           | ✅ Event 要填完整 form                    | ✅ **真名 + 住址驗證**先入到                   | ❌ scheduled                                       | True            | 逼永久真身份;根本唔算「識人」app,discourse 全講 moderation/marketplace          |
| **Luma**                               | ✅ 每個 event 要 host 管                  | 客人 name+email;host 重                        | ❌ scheduled、按城市/類別                          | True            | 冇「而家做 X 邊個一齊」嘅零 setup 即興位                                        |
| **Timeleft**                           | ❌ 冇 host(公司包辦)                      | ✅ **重**(真相 + 真名 + 可能 ID)               | ❌ 固定每週(如逢三 7pm 晚餐)                       | True            | 週會 appointment,唔係即興;要提前 book                                           |
| **222**                                | ❌ 冇 peer host(公司做唯一 organizer)     | ✅ **重**(~30 題 MBTI 式問卷)                  | ❌ 公司排期、城市級                                | True            | 移走 peer host 但變咗**收費、侵入、公司 gatekeep**                              |
| **Fever**                              | ✅ **重**(FeverZone event 管理)           | 未驗(頁 403)                                   | ❌ ticketed、scheduled                             | True            | 整個即興零-organizer 層佢個 ticketing 架構掂唔到                                |
| **Yubo**                               | 功能上要(整 profile 俾人 swipe / go live) | ✅ 強制(DOB、名、性別、電話)                   | livestream 即時但**冇活動 object**                 | True            | 永遠出唔到 app 去真實世界「而家做 X」                                           |
| **Peanut**(Find Mom Friends)           | group meetup 有軟 host                    | ✅ **重**(相、bio、interest packs、小朋友年齡) | nearby ✅ 但唔即興                                 | True            | swipe→match→DM,match 到 IRL 轉換失敗                                            |
| **HeyMandi**                           | ❌(根本冇 group 功能)                     | 部分(post 一句 + hashtag,無相無名)             | 有「Nearby Perspectives」但係 1:1                  | False           | 1:1 chat/dating-adjacent,**驗證咗「chat-before-photo 輕身份」但解緊另一個問題** |
| **Mozi**(Ev Williams)                  | ❌ 冇 host **但都冇「開活動」**           | ❌ 冇 public profile                           | ❌ 只係你**已認識**嘅 contact 撞位                 | False           | 永遠唔會 surface 新人,冇人可以 broadcast「我而家做 X」                          |
| **Flock: Hangout & Meetup**(Vancouver) | ❌ **無正式 host**                        | 未 hands-on 裝(標 [UNVERIFIED])                | ✅ **spontaneous + nearby**(唯一同 enoki 幾乎一致) | **False**       | **幾乎試齊 enoki spec,唔係 model 錯,係 liquidity / cold-start 卡死 + 疑似棄坑** |

**睇表就明**:除咗 Flock,冇一個做到「無 host + 匿名 + 即興 nearby」。Mozi(無 host 無 profile)但只限熟人、冇 broadcast;HeyMandi(輕身份)但係 1:1 dating-adjacent。→ **enoki 嘅三軸組合係空白。**

---

## 3. Flock —— 最重要嘅一個(near-twin,同你一樣 Vancouver)

Flock: Hangout & Meetup **試過幾乎一模一樣嘅 spec**(無正式 host、group 唔係 1:1、spontaneous + nearby)。研究結論:**唔係因為 model 錯,係 nobody solved cold-start(空 feed / liquidity),然後疑似棄坑。**

> **對 enoki 嘅意思**:你個 model 有一個 real-world precedent 驗證咗(唔係得你自己覺得得)。**你要贏嘅唯一嘢就係 cold-start** —— 呢個正正係你已 build 嘅「附近有人開咗活動 broadcast push」想解嘅嘢。呢個 push feature 唔係 nice-to-have,係**生死線 feature**。建議之後 deep-dive Flock(裝返、睇佢點死、有咩殘留 user)。

---

## 4. Incumbent complaints —— 驗證咗 enoki 每條原則

| 用戶喊咩(競品)                                                                             | enoki 對應原則(= 已對症)                                                       |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **organizer burnout / unpaid labor**(Meetup 最大 theme)                                    | §4.1 拆走 host 負擔                                                            |
| **feels/works exactly like dating, swiping on looks, ghosting**(Bumble BFF 最大 complaint) | §4.2 輕身份 + §4.3 冇 1 對 1 inbox                                             |
| **aggressive paywall / organizer 課金**(Meetup、Timeleft 亂扣費)                           | §6 唔行 organizer 課金                                                         |
| **cliquey,新人似外人**(Meetup)                                                             | 匿名 + 即興房,冇既有小圈子                                                     |
| **flaky / no-show**(Meetup、Bumble BFF)                                                    | ⚠️ **未解** —— 即興 low-commitment 可能仲易 no-show,要諗(RSVP 信號 / 出席機制) |
| **dead / empty 喺細城市**(Bumble BFF)                                                      | ⚠️ = cold-start,同 §3 同一個核心風險                                           |

---

## 5. Dead solutions —— 兩個真正嘅殺手

研究 16 個死/掙扎案例,收斂成**兩個 pattern**:

**A. Cold-start / 冇 habit loop(最多)**

- **Highlight**(2012–15):被動「附近人同你有 X 共通」,冇每日開 app 理由 → 冇 habit loop。**enoki 個「我而家做 X 邊個一齊」+ push 就係 habit loop**,但要靠 push 真係 work。
- **Down to Lunch**(2014–18):「who's in」broadcast model 升到 App Store #2,一個**假**human-trafficking 抹黑 campaign 幾週內殺死佢。→ 公開「who's in」model **對單一 viral 安全 narrative 極脆弱**,要有 safety 論述 + moderation ready。
- Houseparty(靠 COVID tailwind,退潮 crater)、tbh / Squad(novelty spike 冇 retention)。

**B. 匿名濫用 / 安全(第二殺手,直接驗證你嘅 trust model)**

- **Yik Yak、Secret**:full 匿名 + hyperlocal + 弱 moderation → 變 harassment / 威脅 vector,殺 growth + 法律/PR 風險。
- **Wizz**(生存中警號):弱 age/identity 驗證嘅「識陌生人」surface = **最快被 app store 落架**。
- → **正正驗證咗 VISION §7「匿名對人、唔匿名對系統」+ phone-tied + moderation**。呢個唔係 optional,係死線。

**其他教訓**:Zenly(40M users 都俾 Snap 收咗即殺 → engagement ≠ 生存,要**早諗 monetization**);IRL($200M raup、95% bot,董事會查 → 唔好容忍假帳號);Squad(起喺第三方 SDK,被收購即無得留低)。

---

## 6. Demand 驗證(MEDIUM 信心,跨 3 個文化圈)

- **中國(最成熟)**:「找搭子」文化 —— #饭搭子 59.5B + #游戏搭子 46.2B Douyin views;DT 數據 50%+ 有搭子、50%+ 想有、得 4.2% 抗拒;小紅書 2023-09 出咗「找搭子/发现群聊」feature(因為陌生人要有主題先傾到偈)。
- **韓國(有專門詞)**:번개(閃電 = 即日/翌日即興聚)—— 소모임 500 萬下載、每週 ~14,000 個 event。
- **英語圈(有需求冇 dominant 詞)**:No More Lonely Friends(2021 一個 TikTok 揪到 ~100-200 人零 organizer 現身,擴到 6 城);digital nomad(Chiang Mai/Bali)靠 activity-specific WhatsApp group;Flaky app 定位「plans die in negotiation」。
- **淨結論**:「即興、無 organizer、而家、附近」呢種行為**係全球性**,唔止華人。但呢批係 aggregate 證據,**信心 MEDIUM**,要 raw post-level 要 authenticated API。

---

## 7. 市場規模(冇單一 TAM,但 pool 大 + 鄰近生意喺 scaling)

- **Target pool**:美國國際生 1.18M(24/25 新高)、全球國際生 ~7.3M、digital nomads ~40M(2025)、全球移民 304M、美國海外公民 5M+。→ 「新到埠 / 孤獨 / 年輕城市人」pool 好大,但冇人 size 過「即興匿名無 organizer 見陌生人」呢個 category 本身。
- **鄰近生意 scaling**:Partiful 500K MAU(+400% YoY)、Timeleft 3M users、Luma ~2M/mo、Fever 200M/mo、222 由 3→13+ 城、Meetup 60M(可能 stale)。Mozi 得 ~20K(冷)。

---

## 8. Positioning + 三大風險 + 建議

**Positioning**:enoki = 唯一「**無 host + 匿名 + 即興 nearby**」嘅 group-活動 app。同 Meetup/Luma/Partiful(host+scheduled)、Bumble BFF/Peanut/Yubo(profile+swipe)、Timeleft/222(公司排期+重 profile)清楚分開。最貼近嘅 Flock 已卡死喺 cold-start。

**風險排序:**

1. 🔴 **Cold-start / liquidity** —— 殺死 Flock + Highlight 嘅嘢。**你已 build 嘅 broadcast push 係主武器**,要 nail 佢(地域密度、seeding 策略)。這是 #1 仗。
2. 🔴 **匿名濫用 / 安全落架** —— Yik Yak/Secret/Wizz 嘅死法。你嘅 phone-tied + moderation + verify badge 要**launch 前 ready**(呼應 SECURITY_AUDIT 嘅 pre-launch 決定)。
3. 🟡 **No-show / flakiness** —— 即興 low-commitment 天然易 no-show(Meetup/BFF 都中),未有對策,要諗 RSVP 信號 / 出席機制 / reputation。

**建議下一步:**

- Flock **deep-dive**(裝返、拆佢點死、有冇殘留 user 可撈)—— 佢係你最直接嘅 case study(task #10)。
- 補 **raw post-level demand**(authenticated Reddit/RED API 或人手)升信心到 HIGH。
- 將 cold-start 當**產品第一優先**,唔係 feature backlog 一項。

_來源:見各 agent 內 URL(woshipm / 36kr / somoim / myimperfectlife / play.google / 各 app 官網 + app store)。原始 per-agent 結果:workflow `wf_2ea59634-8db` journal。_
