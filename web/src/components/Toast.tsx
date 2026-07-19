"use client";

import { useEffect } from "react";
import s from "./Toast.module.css";

// Toast — transient confirmation/error (copy confirmations, errors). Controlled:
// render when `open`; auto-dismisses after `duration` ms.
export function Toast({
  open,
  children,
  tone = "default",
  duration = 2400,
  onClose,
}: {
  open: boolean;
  children: React.ReactNode;
  tone?: "default" | "danger";
  duration?: number;
  onClose?: () => void;
}) {
  useEffect(() => {
    if (!open || !onClose) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;
  return (
    <div className={s.host} role="status" aria-live="polite">
      <div className={`${s.toast} ${tone === "danger" ? s.danger : ""}`}>
        {children}
      </div>
    </div>
  );
}
