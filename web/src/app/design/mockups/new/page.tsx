"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Stepper } from "@/components/Stepper";
import { Accordion } from "@/components/Accordion";
import { ShareSheet } from "@/components/ShareSheet";
import { VIBES, VIBE_TINT, VIBE_LABEL_EN } from "@/lib/vibes";
import s from "../../design.module.css";
import { MockFrame } from "../parts";

// #46 — /new create flow (≤20s: title + nickname is the whole default path) +
// the auto-opened share sheet after posting. Static.

const TIMES = ["Tonight", "Tomorrow", "This weekend", "Pick…"];

export default function NewMockup() {
  const [vibe, setVibe] = useState<string>("open");
  const [cap, setCap] = useState(6);
  const [time, setTime] = useState("Tonight");
  const [share, setShare] = useState(false);

  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>Mockup · /new (#46)</h2>
      <div className={s.row} style={{ marginBottom: 12 }}>
        <Button tone="secondary" onClick={() => setShare(true)}>
          Preview post-create share sheet
        </Button>
      </div>

      <MockFrame label="/new">
        <div style={{ minHeight: 560 }}>
          <TopBar />
          <div style={{ padding: 16, display: "grid", gap: 16 }}>
            <div>
              <h1 className="t-h1">Start a hangout</h1>
              <div className="t-caption" style={{ color: "var(--subtext)" }}>
                Just a title gets you a room. Everything else is optional.
              </div>
            </div>

            <Input
              label="What do you feel like doing?"
              placeholder="今晚火鍋，仲差2個"
            />

            <div>
              <div
                className="t-label"
                style={{ color: "var(--subtext)", marginBottom: 8 }}
              >
                Vibe
              </div>
              <div className={s.row}>
                {VIBES.map((v) => (
                  <Chip
                    key={v}
                    selected={vibe === v}
                    accent={VIBE_TINT[v] ?? undefined}
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
                  <div
                    className="t-label"
                    style={{ color: "var(--subtext)", marginBottom: 8 }}
                  >
                    When
                  </div>
                  <div className={s.row}>
                    {TIMES.map((t) => (
                      <Chip
                        key={t}
                        selected={time === t}
                        onClick={() => setTime(t)}
                      >
                        {t}
                      </Chip>
                    ))}
                  </div>
                </div>
                <Input label="Where (optional)" placeholder="Causeway Bay" />
                <div>
                  <div
                    className="t-label"
                    style={{ color: "var(--subtext)", marginBottom: 8 }}
                  >
                    Capacity
                  </div>
                  <Stepper value={cap} onChange={setCap} min={2} max={20} />
                </div>
                <div>
                  <div
                    className="t-label"
                    style={{ color: "var(--subtext)", marginBottom: 8 }}
                  >
                    Who can join
                  </div>
                  <div className={s.row}>
                    <Chip selected onClick={() => {}}>
                      Anyone
                    </Chip>
                    <Chip onClick={() => {}}>Women</Chip>
                    <Chip onClick={() => {}}>Men</Chip>
                  </div>
                </div>
              </div>
            </Accordion>

            <Input label="Posting as" placeholder="your nickname" />
            <Button full>Post to lobby</Button>
          </div>
        </div>
      </MockFrame>

      <ShareSheet
        open={share}
        url="https://enokiapp.com/r/hk8x2md4qp"
        note="This link is your room — keep it. Drop it in your Threads/WhatsApp post."
        onClose={() => setShare(false)}
      />
    </section>
  );
}
