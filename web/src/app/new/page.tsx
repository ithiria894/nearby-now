"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Stepper } from "@/components/Stepper";
import { Accordion } from "@/components/Accordion";
import { VibeIcon } from "@/components/icons";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { ensureGuestSession } from "@/lib/guest";
import { createActivity, addSelfMembership } from "@/lib/backend";
import { track } from "@/lib/track";
import { VIBES, VIBE_TINT, VIBE_LABEL_EN, type VibeKey } from "@/lib/vibes";
import s from "./new.module.css";

// /new (#55) — the ≤20s create flow. Default path = title + nickname. Details
// optional behind the accordion. On submit: guest session -> insert activity
// (slug via trigger) -> creator membership -> /r/[slug]?just_created=1 (opens
// the share sheet).

const TIMES: { key: string; label: string; hours: number | null }[] = [
  { key: "tonight", label: "Tonight", hours: 4 },
  { key: "tomorrow", label: "Tomorrow", hours: 24 },
  { key: "weekend", label: "This weekend", hours: 72 },
  { key: "none", label: "Anytime", hours: null },
];
const GENDERS = [
  { key: "any", label: "Anyone" },
  { key: "female", label: "Women" },
  { key: "male", label: "Men" },
];

export default function NewPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [vibe, setVibe] = useState<VibeKey>("open");
  const [time, setTime] = useState("none");
  const [place, setPlace] = useState("");
  const [cap, setCap] = useState(6);
  const [gender, setGender] = useState("any");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPost = title.trim().length > 0 && nickname.trim().length > 0;

  const post = async () => {
    if (!canPost || busy) return;
    setBusy(true);
    setError(null);
    try {
      const uid = await ensureGuestSession(nickname);
      const db = createSupabaseBrowser();
      const chosen = TIMES.find((t) => t.key === time);
      const startTime =
        chosen?.hours != null
          ? new Date(Date.now() + chosen.hours * 3600_000).toISOString()
          : null;
      const payload: Record<string, unknown> = {
        creator_id: uid,
        title_text: title.trim(),
        vibe,
        gender_pref: gender,
        capacity: cap,
        status: "open",
      };
      if (place.trim()) payload.place_name = place.trim();
      if (startTime) payload.start_time = startTime;

      const { id, share_slug } = await createActivity(db, payload);
      await addSelfMembership(db, id, uid, "creator");
      track("create_done", share_slug);
      router.push(`/r/${share_slug}?just_created=1`);
    } catch {
      setError("Couldn't post. Try again.");
      setBusy(false);
    }
  };

  return (
    <>
      <TopBar />
      <div className={s.page}>
        <div>
          <h1 className="t-h1">Start a hangout</h1>
          <div className="t-caption" style={{ color: "var(--subtext)" }}>
            Just a title gets you a room. Everything else is optional.
          </div>
        </div>

        <Input
          label="What do you feel like doing?"
          placeholder="今晚火鍋，仲差2個"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <div className={s.fieldLabel}>Vibe</div>
          <div className={s.row}>
            {VIBES.map((v) => (
              <Chip
                key={v}
                selected={vibe === v}
                accent={VIBE_TINT[v] ?? undefined}
                leading={<VibeIcon vibe={v} />}
                onClick={() => setVibe(v)}
              >
                {VIBE_LABEL_EN[v]}
              </Chip>
            ))}
          </div>
        </div>

        <Accordion title="More details">
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <div className={s.fieldLabel}>When</div>
              <div className={s.row}>
                {TIMES.map((t) => (
                  <Chip
                    key={t.key}
                    selected={time === t.key}
                    onClick={() => setTime(t.key)}
                  >
                    {t.label}
                  </Chip>
                ))}
              </div>
            </div>
            <Input
              label="Where (optional)"
              placeholder="Causeway Bay"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
            <div>
              <div className={s.fieldLabel}>Capacity</div>
              <Stepper value={cap} onChange={setCap} min={2} max={20} />
            </div>
            <div>
              <div className={s.fieldLabel}>Who can join</div>
              <div className={s.row}>
                {GENDERS.map((g) => (
                  <Chip
                    key={g.key}
                    selected={gender === g.key}
                    onClick={() => setGender(g.key)}
                  >
                    {g.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </Accordion>

        <Input
          label="Posting as"
          placeholder="your nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        {error ? (
          <div className="t-caption" style={{ color: "var(--danger)" }}>
            {error}
          </div>
        ) : null}

        <Button full onClick={post} loading={busy} disabled={!canPost}>
          Post to lobby
        </Button>
      </div>
    </>
  );
}
