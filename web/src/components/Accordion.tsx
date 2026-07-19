"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import s from "./Accordion.module.css";

// Accordion — the collapsed "More details" on /new (BAccordion). Height animates
// via the grid-template-rows 0fr→1fr trick (smooth, no JS measuring).
export function Accordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={s.wrap}>
      <button
        className={s.header}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="t-title">{title}</span>
        <span
          className={`${s.chevron} ${open ? s.chevronOpen : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      <div id={id} className={`${s.content} ${open ? s.open : ""}`}>
        <div className={s.inner}>{children}</div>
      </div>
    </div>
  );
}
