import s from "../design.module.css";

// /design/motion — Section 4 (filled in #43).
export default function MotionPage() {
  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>4 · Motion</h2>
      <p className="t-body" style={{ color: "var(--subtext)" }}>
        Press feedback, list stagger, dialog/sheet transitions, page
        transitions, and a reduced-motion toggle — arriving in #43.
      </p>
    </section>
  );
}
