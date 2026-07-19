"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import s from "./ShareSheet.module.css";

// ShareSheet — the organizer's copy-link surface (WEB_PLAN §3.7). Bottom sheet
// (native <dialog>) with a big copy-link row + native share when available.
// Auto-opens after create (?just_created=1). Copy is one tap — the whole point.
export function ShareSheet({
  open,
  url,
  onClose,
  note,
}: {
  open: boolean;
  url: string;
  onClose: () => void;
  note?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const close = () => {
    setCopied(false);
    onClose();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — the URL row is selectable as a fallback
    }
  };

  const nativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <dialog
      ref={ref}
      className={s.sheet}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className={s.body}>
        <div className={s.grabber} aria-hidden />
        <h2 className="t-h2">Share your room</h2>
        {note ? (
          <p className="t-body" style={{ color: "var(--subtext)" }}>
            {note}
          </p>
        ) : null}

        <button className={s.linkRow} onClick={copy}>
          <span className={s.url}>{url}</span>
          <span className={`t-label ${s.copy}`}>
            {copied ? "Copied!" : "Copy"}
          </span>
        </button>

        <div className={s.actions}>
          {nativeShare ? (
            <Button
              full
              onClick={() =>
                navigator.share?.({ url, title: "Join my enoki hangout" })
              }
            >
              Share…
            </Button>
          ) : null}
          <Button tone="secondary" full onClick={close}>
            Done
          </Button>
        </div>
      </div>
    </dialog>
  );
}
