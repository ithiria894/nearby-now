import Link from "next/link";
import s from "./design.module.css";

// /design overview (issue #64). Index of the gallery; each section is its own
// page under the shared shell.

const SECTIONS = [
  {
    href: "/design/tokens",
    title: "1 · Tokens",
    desc: "Color (both palettes), paper texture, radii, hard shadows, spacing, borders.",
  },
  {
    href: "/design/type",
    title: "2 · Typography",
    desc: "The full type scale in English + zh-Hant; wordmark; accent.",
  },
  {
    href: "/design/components",
    title: "3 · Components",
    desc: "Button, Card, Chip (+ vibes), Input, Badge — every tone and state.",
  },
  {
    href: "/design/motion",
    title: "4 · Motion",
    desc: "Press feedback, list stagger, dialog/sheet transitions, reduced-motion.",
  },
  {
    href: "/design/mockups",
    title: "5 · Page mockups",
    desc: "Fake-data renders of every v1 page + state (room, member, /new, landing, rooms).",
  },
];

export default function DesignOverview() {
  return (
    <>
      <h1 className="t-display">enoki · design</h1>
      <p className="t-body" style={{ color: "var(--subtext)", marginTop: 4 }}>
        Living design gallery (WEB_PLAN §3.8). Pick a section. Use the top bar
        to switch theme and preview width. <Link href="/">← home</Link>
      </p>

      <div style={{ marginTop: 24 }}>
        {SECTIONS.map((sec) => (
          <Link key={sec.href} href={sec.href} className={s.cardLink}>
            <div className="t-h2">{sec.title}</div>
            <div
              className="t-body"
              style={{ color: "var(--subtext)", marginTop: 4 }}
            >
              {sec.desc}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
