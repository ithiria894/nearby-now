import s from "../design.module.css";

// /design/mockups — Section 5 index (filled by #44–#47). Fake-data renders of
// every v1 page + state; the design gate.
export default function MockupsPage() {
  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>5 · Page mockups</h2>
      <p className="t-body" style={{ color: "var(--subtext)" }}>
        Fake-data renders of every v1 page and state — room visitor (6 states),
        member room + chat, /new, share sheet, landing, /rooms, OG card.
        Arriving in #44–#47.
      </p>
    </section>
  );
}
