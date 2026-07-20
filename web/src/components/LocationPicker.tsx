"use client";

import { useState } from "react";
import { IconPin, IconGlobe, IconChevronDown } from "./icons";
import { AREAS } from "@/lib/areas";
import s from "./LocationPicker.module.css";

// Location scope picker — shared by the real feed and the design mockup so
// they can't drift. Owns open state + the two presentations (desktop dropdown,
// mobile bottom sheet) + their entrance motion (M3 emphasized-decelerate:
// dropdown scales from its top-right origin, sheet slides up, rows stagger,
// chevron rotates). The parent owns what a pick MEANS (geolocation, areas) —
// this just reports the chosen label.

const OPTIONS = [
  "Near you",
  "Anywhere",
  "Online",
  ...AREAS.map((a) => a.label),
];

function Options({
  value,
  onChoose,
}: {
  value: string;
  onChoose: (label: string) => void;
}) {
  return (
    <>
      {OPTIONS.map((a, i) => (
        <button
          key={a}
          className={`${s.row} ${value === a ? s.rowActive : ""}`}
          style={{ animationDelay: `${i * 30}ms` }}
          onClick={() => onChoose(a)}
        >
          {a === "Online" ? <IconGlobe size={16} /> : <IconPin size={16} />}
          {a}
          {a === "Near you" ? (
            <span className={s.hint}>uses your location</span>
          ) : a === "Online" ? (
            <span className={s.hint}>no place needed</span>
          ) : null}
        </button>
      ))}
    </>
  );
}

export function LocationPicker({
  value,
  onPick,
}: {
  value: string;
  onPick: (label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const online = value === "Online";
  const choose = (label: string) => {
    setOpen(false);
    onPick(label);
  };

  return (
    <div className={s.wrap}>
      <button
        className={s.pill}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {online ? <IconGlobe size={15} /> : <IconPin size={15} />}
        {value}
        <span className={`${s.chev} ${open ? s.chevOpen : ""}`}>
          <IconChevronDown size={14} />
        </span>
      </button>

      {/* desktop: dropdown (mobile hides it via media query) */}
      {open ? (
        <>
          <div
            className={s.clickAway}
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className={s.dropdown} role="menu">
            <Options value={value} onChoose={choose} />
          </div>
        </>
      ) : null}

      {/* mobile: bottom sheet (desktop hides it via media query) */}
      {open ? (
        <div className={s.overlay} onClick={() => setOpen(false)}>
          <div className={s.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={s.grabber} />
            <div className="t-h2" style={{ marginBottom: 6 }}>
              Where are you looking?
            </div>
            <Options value={value} onChoose={choose} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
