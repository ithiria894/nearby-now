import s from "../design.module.css";

// /design/type — Section 2. Static server component.

const TYPES: { cls: string; label: string; en: string; zh: string }[] = [
  {
    cls: "t-display",
    label: "display 30/36",
    en: "Get people together",
    zh: "揪人一齊玩",
  },
  {
    cls: "t-h1",
    label: "h1 24/30",
    en: "Hotpot Friday, 2 spots left",
    zh: "今晚火鍋，仲差兩個",
  },
  {
    cls: "t-h2",
    label: "h2 19/25",
    en: "Board games at mine, 7pm",
    zh: "夜晚玩 board game",
  },
  {
    cls: "t-title",
    label: "title 16/22",
    en: "Who's around right now?",
    zh: "而家附近有邊個",
  },
  {
    cls: "t-body",
    label: "body 15/22",
    en: "No host, no profile — just say what you feel like doing nearby, and see who's in.",
    zh: "唔使做主辦人，唔使起 profile，講一句你想做啲乜，睇下邊個一齊。",
  },
  {
    cls: "t-body-strong",
    label: "body-strong 15/22",
    en: "3 / 6 going",
    zh: "3 / 6 人已加入",
  },
  {
    cls: "t-label",
    label: "label 12/16 · caps",
    en: "Chill vibe",
    zh: "放鬆 VIBE",
  },
  {
    cls: "t-caption",
    label: "caption 12/16",
    en: "started by mimi · 2 min ago",
    zh: "由 mimi 開 · 2 分鐘前",
  },
];

export default function TypePage() {
  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>2 · Typography</h2>

      <div className={s.typeRow}>
        <div className={s.typeMeta}>wordmark · Madimi One</div>
        <div
          className="t-wordmark"
          style={{ fontSize: 48, color: "var(--ink)" }}
        >
          enoki
        </div>
      </div>

      {TYPES.map((t) => (
        <div key={t.cls} className={s.typeRow}>
          <div className={s.typeMeta}>{t.label}</div>
          <div className={t.cls}>{t.en}</div>
          <div className={t.cls} lang="zh-Hant">
            {t.zh}
          </div>
        </div>
      ))}

      <div className={s.typeRow}>
        <div className={s.typeMeta}>accent · Caveat (use sparingly)</div>
        <div className="t-accent" style={{ color: "var(--brand)" }}>
          see you tomorrow 🍄
        </div>
      </div>
    </section>
  );
}
