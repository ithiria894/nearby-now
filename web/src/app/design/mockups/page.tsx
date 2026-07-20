import Link from "next/link";
import s from "../design.module.css";

// /design/mockups — Section 5 index (#44–#47). Fake-data renders of every v1
// page + state; the design gate.

const MOCKUPS = [
  {
    href: "/design/mockups/feed3",
    title: "/ feed · Discover v3 — filters + starting soon",
    desc: "One scroll (no carousel), honest 'Starting soon · has room' cluster, always-visible category/vibe chips, Has-room toggle, search behind an icon. Live filters — tap around.",
  },
  {
    href: "/design/mockups/feed",
    title: "/ feed (#65)",
    desc: "Front page: open + recently-happened hangouts, All/Nearby/Online, floating +.",
  },
  {
    href: "/design/mockups/room",
    title: "Room · visitor view (#44)",
    desc: "The front door. 6 states: open, full, expired, closed, 404, join-race.",
  },
  {
    href: "/design/mockups/member",
    title: "Member room (#45)",
    desc: "RSVP list, seeded chat, share bar, host/member/read-only variants.",
  },
  {
    href: "/design/mockups/new",
    title: "/new create flow (#46)",
    desc: "Title + nickname default path; expandable details; post-create share sheet.",
  },
  {
    href: "/design/mockups/landing",
    title: "Landing · /rooms · OG (#47)",
    desc: "Home CTA, my-rooms list, and the link-unfurl card.",
  },
];

export default function MockupsIndex() {
  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>5 · Page mockups</h2>
      <p className="t-body" style={{ color: "var(--subtext)" }}>
        Fake-data renders of every v1 page and state — the design gate. Approve
        each before its page gets built with real data.
      </p>
      <div style={{ marginTop: 20 }}>
        {MOCKUPS.map((m) => (
          <Link key={m.href} href={m.href} className={s.cardLink}>
            <div className="t-h2">{m.title}</div>
            <div
              className="t-body"
              style={{ color: "var(--subtext)", marginTop: 4 }}
            >
              {m.desc}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
