"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import s from "./Dialog.module.css";

// Dialog — confirm modal (leave/close). Uses the native <dialog> for focus
// trapping + Esc + backdrop. Controlled via `open`.
export function Dialog({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // click on backdrop (the dialog element itself) closes
        if (e.target === ref.current) onClose();
      }}
    >
      <div className={s.body}>
        <h2 className="t-h2">{title}</h2>
        {children ? (
          <p className="t-body" style={{ color: "var(--subtext)" }}>
            {children}
          </p>
        ) : null}
        <div className={s.actions}>
          <Button tone="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button tone={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
