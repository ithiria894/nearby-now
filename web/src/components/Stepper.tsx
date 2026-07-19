"use client";

import s from "./Stepper.module.css";

// Stepper — capacity picker (BStepper). Controlled. − value +.
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className={s.wrap} role="group" aria-label={label ?? "Stepper"}>
      <button
        className={s.btn}
        onClick={dec}
        disabled={value <= min}
        aria-label="Decrease"
      >
        −
      </button>
      <span className={s.value} aria-live="polite">
        {value}
      </span>
      <button
        className={s.btn}
        onClick={inc}
        disabled={value >= max}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
