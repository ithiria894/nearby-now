"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { Input } from "./Input";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { upsertProfile } from "@/lib/backend";
import s from "./ProfileSlot.module.css";

// Session presence (WEB_PLAN §4 v2, #70). No session → renders NOTHING (no
// "My rooms", no account UI — identity first appears when the user acts).
// Guest session → mushroom profile pill → profile sheet: edit nickname,
// My rooms, "Not you? Start fresh".
export function ProfileSlot() {
  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const db = createSupabaseBrowser();
      const {
        data: { session },
      } = await db.auth.getSession();
      const id = session?.user?.id ?? null;
      if (!active) return;
      setUid(id);
      if (!id) return;
      const { data } = await db
        .from("profiles")
        .select("display_name")
        .eq("id", id)
        .maybeSingle();
      if (!active) return;
      const n = (data as { display_name: string | null } | null)?.display_name;
      setName(n ?? "guest");
      setDraft(n ?? "");
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  if (!uid) return null;

  const save = async () => {
    const n = draft.trim();
    if (!n || saving) return;
    setSaving(true);
    try {
      await upsertProfile(createSupabaseBrowser(), uid, n);
      setName(n);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const startFresh = async () => {
    if (
      !window.confirm(
        "Start fresh? You'll lose access to this guest identity and its rooms on this device."
      )
    )
      return;
    await createSupabaseBrowser().auth.signOut();
    location.href = "/";
  };

  return (
    <>
      <button className={s.pill} onClick={() => setOpen(true)}>
        <Avatar size={26} seed={0} />
        <span className={s.name}>{name}</span>
      </button>

      <dialog
        ref={ref}
        className={s.sheet}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
      >
        <div className={s.body}>
          <div className={s.grabber} aria-hidden />
          <div className={s.head}>
            <Avatar size={44} seed={0} />
            <div>
              <div className="t-title">{name}</div>
              <div className="t-caption" style={{ color: "var(--subtext)" }}>
                guest · anonymous to others
              </div>
            </div>
          </div>
          <Input
            label="Nickname"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="your nickname"
          />
          <div className={s.actions}>
            <Button
              full
              onClick={save}
              loading={saving}
              disabled={!draft.trim()}
            >
              Save
            </Button>
            <Link href="/rooms" onClick={() => setOpen(false)}>
              <Button tone="secondary" full>
                My rooms
              </Button>
            </Link>
            <Button tone="secondary" full onClick={startFresh}>
              Not you? Start fresh
            </Button>
          </div>
          <div className="t-caption" style={{ color: "var(--faint)" }}>
            Later: add an email to keep your rooms on other devices.
          </div>
        </div>
      </dialog>
    </>
  );
}
