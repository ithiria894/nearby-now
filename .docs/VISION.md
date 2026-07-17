# enoki — 世界觀 / Product Vision 🍄

> **一句講晒**：enoki 幫你**即興揪附近嘅人一齊玩**，唔使做「主辦人」，唔使起 profile，改個名就出 post。
> 一條金菇淡淡無味，一紮金菇一齊煮先至鮮甜好味。

_單一真相源。所有 product 決定對住呢份文件。_

---

## 1. 我哋幫邊個（Target user）

**唔限地域、唔限族裔 —— 每個城市都有呢種人。** 核心係一種**心態**：

> 想搵人一齊做／搞啲活動，但**唔想做「host」嗰個好認真、好有責任、要孭場嘅角色**。

佢哋覺得「太毒 🥲」「小悶」「無聊嘅秋天」，想即興搵伴玩低門檻嘢：火鍋、唱 K、酒局、board game／狼人殺、festival、揾飯友、行街食飯。
（第一批證據係溫哥華華人 diaspora，但呢個需求係 universal。）

---

## 2. 佢哋要完成嘅工作（Job-to-be-done）

> 「幫我而家搵到幾個附近嘅人，一齊去做 X —— 唔使我孭起成場、唔使我管一大堆嘢。」

---

## 3. 現有方案點解爛（= 我哋嘅入口）

而家佢哋喺 Threads／IG 出「臨時開團 / 有冇人一齊 X」→ 有興趣留言「報名／+1」→ 樓主**手動** DM ＋ IG 限動放 Google form 數人頭 ＋ 拉 WhatsApp group。

| 痛點               | 佢哋原話（真證據，見 `market-evidence/`）                |
| ------------------ | -------------------------------------------------------- |
| 冇 RSVP／容量      | 「填報名表統計人數」「額滿了」「座位留給盡快確認時間者」 |
| coordination 散晒  | comment → DM → IG form → WhatsApp，四五個工具            |
| discovery 靠彩數   | 「會比其他 post 淹沒咗」                                 |
| 冇身份／信任連續性 | 「網友相認現場」「見過但唔記得你個名」                   |
| **host 角色太重**  | 「第一次在脆上找飯友，覺得挺大膽的」                     |
| 需求係真           | 單一 post 去到 152❤️ / 79💬 / 幾千 views                 |

**最關鍵**：痛點唔止「冇好 RSVP 工具」，係 **「做 host / 主辦」個角色太重**。Meetup / Partiful / Luma / 出 Threads post，全部逼你變成一個認真、負責、要管嘢嘅 organizer —— 大部分人唔想孭。

---

## 4. enoki 點解決（核心設計原則）

1. **拆走 host 負擔**（架構層 differentiator）
   開個活動 = 「我想去 X，邊個一齊?」。發起人只係「**先開口嗰個參加者**」，唔係要孭場嘅主辦。呢個先係我哋同所有競品最根本嘅分別 —— **唔係做更好嘅 RSVP，係根本唔需要 host。**
   ⚠️ 小心：UI 上「host」唔好變成一個令人卻步嘅認真身份／badge。

2. **匿名優先、輕身份**
   盡量唔做 profile。一個**隨時改得**嘅 handle ＋ 你隻金菇 ＋（可選）性別，就出到 post。唔使 upload 頭像、唔使寫興趣、唔使註冊一大輪 —— 唔好搞到似交友 app。

3. **零 friction 落地**
   一開 app 就玩到。少 friction 係第一優先。

4. **即興 discovery（附近 + follow）**
   「附近有人開咗活動」「你 follow 嗰個開咗新房」直接 push 畀你 —— 解決「post 被 feed 淹沒」。

5. **內建 RSVP ＋ 容量 ＋ coordination**
   報名／人數／容量 app 幫你搞掂；開團之後喺 Rooms 傾，取代 WhatsApp group。

---

## 5. 信任 & 安全（匿名點樣唔等於冇王管）

> **對其他用戶匿名，對系統唔匿名。**

- handle 隨你改，但底層帳號**綁死 verified phone / device** → 改個名 ≠ 開新帳號 → ban 到就走唔甩。
- 高風險動作（開活動 / 約人出嚟）先驗電話（一次過，對其他人隱形）。scam 靠量，驗電話令每個馬甲要一個新號 = 成本爆。
- 新／未驗 handle 有 rate limit；**舉報 → 即時 ban（ban 落 account 唔係 handle）**。
- 顯示「✓ 已驗證」「新用戶」badge，畀信任訊號但唔洩露身份；用戶可揀淨係見 verified host。
- 檢舉係所有 app 通用嘅安全底 —— 就算成個 profile 擺晒出嚟都要有人 report 先知係 scam，所以「改得名」唔蝕安全。

---

## 6. 品牌 / metaphor

- 吉祥物：金菇仔 🍄。**每個 user = 一條金菇。**
- 核心比喻：一條金菇淡淡無味，一紮一齊煮先至鮮甜 —— 一個人悶，一齊出嚟玩先好玩。
- 語氣：即興、輕鬆、好玩、唔認真、無包袱。

---

## 7. 資訊架構（現況 + 方向）

- 現時 tab：**browse**（發現）/ **rooms**（你有份嘅活動，host+joined 合併）/ **notifications**（活動+社交提示 feed：活動幾時開始、有人入房、有人 follow 你、附近開新房、你 follow 嗰個開房）。
- settings 而家收喺 notifications header 個 cog（隨手擺位，非聖旨）。
- 方向：考慮開個 **「You / 我」tab** 放 profile（輕）+ settings + notifications，令 IA 清 D。

---

## 8. 已經 build 咗、對得住 vision 嘅嘢

| 已 build                               | 對應 vision            |
| -------------------------------------- | ---------------------- |
| 「附近有人開咗活動」push               | §4.4 即興 discovery    |
| 匿名 + 性別（唔 verify、可改）         | §4.2 輕身份            |
| Rooms tab（合併 host/joined）          | §4.5 coordination home |
| config-reuse（開新空房同 config）      | §2 低門檻再開團        |
| push 通知 infra（附近 + room message） | §4.4                   |

_證據：見 `market-evidence/`。來源：Nicole × CY 2026-07-16 討論。_
