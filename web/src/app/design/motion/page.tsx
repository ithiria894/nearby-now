"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Dialog } from "@/components/Dialog";
import { ShareSheet } from "@/components/ShareSheet";
import s from "../design.module.css";
import m from "./motion.module.css";

// /design/motion — Section 4 (issue #43). Motion is M3-crisp (see
// .docs/M3_ADOPTION_GUIDE.md): position/size use emphasized easing; effects
// never bounce. Everything respects prefers-reduced-motion.

const EASES = [
  ["--dur-fast", "150ms", "press, small state changes"],
  ["--dur-base", "260ms", "entrances, sheets, accordions"],
  ["--dur-slow", "420ms", "container transform"],
  [
    "--ease-emphasized-decelerate",
    "cubic-bezier(.05,.7,.1,1)",
    "entrances / expand",
  ],
  ["--ease-emphasized-accelerate", "cubic-bezier(.3,0,.8,.15)", "exits"],
  ["--ease-standard", "cubic-bezier(.2,0,0,1)", "symmetric move / resize"],
];

export default function MotionPage() {
  const [runId, setRunId] = useState(0);
  const [ctOpen, setCtOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>4 · Motion</h2>

      <p className="t-body" style={{ color: "var(--subtext)" }}>
        M3-crisp motion (see M3_ADOPTION_GUIDE): position/size use emphasized
        easing; opacity/color never bounce. All of it respects the OS
        &ldquo;reduce motion&rdquo; setting.
      </p>
      <p style={{ marginTop: 8 }}>
        <span className={m.status}>
          OS reduce-motion: {reduced ? "ON — animations minimized" : "off"}
        </span>
      </p>

      <h3 className={`t-title ${s.subTitle}`}>Easing &amp; duration tokens</h3>
      <table className={m.easeTable}>
        <tbody>
          {EASES.map(([name, val, use]) => (
            <tr key={name}>
              <td className={m.easeName}>{name}</td>
              <td style={{ color: "var(--subtext)" }}>{val}</td>
              <td style={{ color: "var(--subtext)" }}>{use}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className={`t-title ${s.subTitle}`}>
        Press feedback (into the shadow)
      </h3>
      <div className={s.row}>
        <Button>Press &amp; hold me</Button>
        <Card style={{ width: 160, cursor: "pointer" }}>
          <div className="t-title">Press this card</div>
        </Card>
      </div>

      <h3 className={`t-title ${s.subTitle}`}>List entrance — 45ms stagger</h3>
      <Button tone="secondary" onClick={() => setRunId((v) => v + 1)}>
        Replay
      </Button>
      <div className={m.staggerList} key={runId}>
        {[
          "Hotpot Friday",
          "Board games",
          "Morning run",
          "Deep-talk coffee",
        ].map((t, i) => (
          <div
            key={t}
            className={m.staggerItem}
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <span className="t-title">{t}</span>
          </div>
        ))}
      </div>

      <h3 className={`t-title ${s.subTitle}`}>
        Container transform (row → panel)
      </h3>
      <p
        className="t-caption"
        style={{ color: "var(--subtext)", marginBottom: 8 }}
      >
        The web equivalent of the mobile drill-in: a row grows into the screen.
        On real routes this will use the View Transitions API (WEB_PLAN §7.4 /
        M3 guide B3). Tap to toggle.
      </p>
      <div
        className={`${m.ct} ${ctOpen ? m.ctOpen : ""}`}
        onClick={() => setCtOpen((v) => !v)}
      >
        <div className="t-h2">Hotpot Friday</div>
        {ctOpen ? (
          <div
            className="t-body"
            style={{ color: "var(--subtext)", marginTop: 8 }}
          >
            8pm · Causeway Bay · 3 / 6 going. Tap to collapse.
          </div>
        ) : null}
      </div>

      <h3 className={`t-title ${s.subTitle}`}>Overlay transitions</h3>
      <div className={s.row}>
        <Button tone="secondary" onClick={() => setDialogOpen(true)}>
          Dialog (scale-fade in)
        </Button>
        <Button onClick={() => setShareOpen(true)}>
          Share sheet (slide up)
        </Button>
      </div>

      <h3 className={`t-title ${s.subTitle}`}>Page transitions</h3>
      <p className="t-body" style={{ color: "var(--subtext)" }}>
        Navigating between real funnel pages (/r/[slug] ↔ /new) will use the
        View Transitions API for a cross-fade / shared-element feel — built and
        tuned once those routes exist (acceptance on the M1–M3 page issues). Try
        the nav above to feel client-side navigation today.
      </p>

      <Dialog
        open={dialogOpen}
        title="Leave this hangout?"
        danger
        confirmLabel="Leave"
        onConfirm={() => setDialogOpen(false)}
        onClose={() => setDialogOpen(false)}
      >
        You can re-join while it&apos;s open.
      </Dialog>
      <ShareSheet
        open={shareOpen}
        url="https://enokiapp.com/r/hk8x2md4qp"
        note="This link is your room — keep it."
        onClose={() => setShareOpen(false)}
      />
    </section>
  );
}
