"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { ensureAnonSession } from "@/lib/guest";
import { reportActivity, reportMessage } from "@/lib/backend";
import { track } from "@/lib/track";
import s from "./ReportDialog.module.css";

// Report a hangout or a message (#71). Reason presets + optional detail →
// resolves the reported user server-side via an RPC. Ensures a session first
// (anonymous is fine — reporting needs no nickname). No moderation console;
// rows are read via SQL.
type Target =
  | { kind: "activity"; id: string }
  | { kind: "message"; id: string };

const REASONS = ["Spam", "Harassment", "Unsafe / scam", "Other"];

export function ReportDialog({
  target,
  onClose,
}: {
  target: Target | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (target && !el.open) {
      el.showModal();
      setReason(REASONS[0]);
      setDetail("");
      setDone(false);
    }
    if (!target && el.open) el.close();
  }, [target]);

  const submit = async () => {
    if (!target || busy) return;
    setBusy(true);
    try {
      const uid = await ensureAnonSession();
      if (!uid) throw new Error("no session");
      const db = createSupabaseBrowser();
      const text = [reason, detail.trim()].filter(Boolean).join(" — ");
      if (target.kind === "activity") await reportActivity(db, target.id, text);
      else await reportMessage(db, target.id, text);
      track("report", undefined, target.kind);
      setDone(true);
    } catch {
      // best-effort; close on failure too so the user isn't stuck
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className={s.body}>
        {done ? (
          <>
            <h2 className="t-h2">Thanks — reported</h2>
            <p className="t-body" style={{ color: "var(--subtext)" }}>
              We&apos;ll review it. Reports are anonymous to the person
              reported.
            </p>
            <Button full onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <>
            <h2 className="t-h2">
              Report {target?.kind === "message" ? "message" : "hangout"}
            </h2>
            <div className={s.reasons}>
              {REASONS.map((r) => (
                <Chip
                  key={r}
                  selected={reason === r}
                  onClick={() => setReason(r)}
                >
                  {r}
                </Chip>
              ))}
            </div>
            <textarea
              className={s.detail}
              placeholder="Add detail (optional)"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={1000}
              rows={3}
            />
            <div className={s.actions}>
              <Button tone="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button tone="danger" onClick={submit} loading={busy}>
                Report
              </Button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
