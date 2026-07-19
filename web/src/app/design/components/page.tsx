"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { TopBar } from "@/components/TopBar";
import { Stepper } from "@/components/Stepper";
import { Accordion } from "@/components/Accordion";
import { RoomCard } from "@/components/RoomCard";
import { Avatar, AvatarCluster } from "@/components/Avatar";
import { Toast } from "@/components/Toast";
import { Dialog } from "@/components/Dialog";
import { ShareSheet } from "@/components/ShareSheet";
import { VIBES, VIBE_TINT, VIBE_LABEL_EN, VIBE_GLYPH } from "@/lib/vibes";
import s from "../design.module.css";

// /design/components — Section 3.

export default function ComponentsPage() {
  const [vibe, setVibe] = useState<string>("open");
  const [chipOn, setChipOn] = useState(true);
  const [text, setText] = useState("");
  const [cap, setCap] = useState(4);
  const [toastOpen, setToastOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>3 · Components</h2>

      <h3 className={`t-title ${s.subTitle}`}>Button — tones</h3>
      <div className={s.row}>
        <Button tone="primary">Primary</Button>
        <Button tone="secondary">Secondary</Button>
        <Button tone="accent">Accent</Button>
        <Button tone="danger">Danger</Button>
      </div>

      <h3 className={`t-title ${s.subTitle}`}>
        Button — states (press me: moves into its shadow)
      </h3>
      <div className={s.row}>
        <Button disabled>Disabled</Button>
        <Button loading>Posting</Button>
        <Button leading={<span aria-hidden>🍄</span>}>With glyph</Button>
      </div>
      <div style={{ marginTop: 12, maxWidth: 320 }}>
        <Button tone="primary" full>
          Full width — Join
        </Button>
      </div>

      <h3 className={`t-title ${s.subTitle}`}>Card</h3>
      <Card style={{ maxWidth: 320 }}>
        <div className="t-h2">Hotpot Friday</div>
        <div className="t-body" style={{ color: "var(--subtext)" }}>
          8pm · Causeway Bay · 3 / 6 going
        </div>
        <div className={s.row}>
          <Badge fill="var(--sky)">Chill</Badge>
          <Badge fill="var(--yellow)">2 spots</Badge>
        </div>
      </Card>

      <h3 className={`t-title ${s.subTitle}`}>
        Chip — neutral (tap to toggle)
      </h3>
      <div className={s.row}>
        <Chip selected={chipOn} onClick={() => setChipOn((v) => !v)}>
          Selected
        </Chip>
        <Chip onClick={() => {}}>Pressable</Chip>
        <Chip>Static</Chip>
      </div>

      <h3 className={`t-title ${s.subTitle}`}>
        Chip — vibes (single-select, each in its own tint)
      </h3>
      <div className={s.row}>
        {VIBES.map((v) => (
          <Chip
            key={v}
            selected={vibe === v}
            accent={VIBE_TINT[v] ?? undefined}
            leading={VIBE_GLYPH[v]}
            onClick={() => setVibe(v)}
          >
            {VIBE_LABEL_EN[v]}
          </Chip>
        ))}
      </div>

      <h3 className={`t-title ${s.subTitle}`}>Chip — solid tones</h3>
      <div className={s.row}>
        <Chip tone="brand">Brand</Chip>
        <Chip tone="success">Success</Chip>
        <Chip tone="danger">Danger</Chip>
        <Chip tone="warn">Warn</Chip>
      </div>

      <h3 className={`t-title ${s.subTitle}`}>Badge</h3>
      <div className={s.row}>
        <Badge fill="var(--mint)">New</Badge>
        <Badge fill="var(--coral)">Full</Badge>
        <Badge fill="var(--grape)">Deep</Badge>
        <Badge fill="var(--yellow)" bleed>
          Bleed
        </Badge>
      </div>

      <h3 className={`t-title ${s.subTitle}`}>Input</h3>
      <div style={{ display: "grid", gap: 16, maxWidth: 340 }}>
        <Input
          label="Nickname"
          placeholder="e.g. mimi"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Input
          label="Title"
          placeholder="今晚火鍋，仲差2個"
          hint="Say what you feel like doing"
        />
        <Input
          label="Email"
          placeholder="you@example.com"
          defaultValue="not-an-email"
          error="Enter a valid email"
        />
        <Input label="Disabled" placeholder="can't type" disabled />
      </div>

      {/* ---------------- kit B ---------------- */}
      <h3 className={`t-title ${s.subTitle}`}>TopBar</h3>
      <div
        style={{
          border: "var(--border-base) solid var(--hairline)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <TopBar
          right={
            <>
              <Chip onClick={() => {}}>My rooms</Chip>
              <Chip onClick={() => {}}>EN</Chip>
            </>
          }
        />
      </div>

      <h3 className={`t-title ${s.subTitle}`}>Avatar (mascot 🍄) + cluster</h3>
      <div className={s.row} style={{ alignItems: "center" }}>
        <Avatar size={40} seed={0} />
        <Avatar size={40} seed={1} />
        <Avatar size={40} seed={2} />
        <AvatarCluster count={5} />
      </div>

      <h3 className={`t-title ${s.subTitle}`}>Stepper (capacity)</h3>
      <Stepper
        value={cap}
        onChange={setCap}
        min={2}
        max={12}
        label="Capacity"
      />

      <h3 className={`t-title ${s.subTitle}`}>Accordion (More details)</h3>
      <Accordion title="More details">
        <div className="t-body" style={{ color: "var(--subtext)" }}>
          Time, place, capacity, gender — all optional, kept out of the way so
          the default create path stays two fields.
        </div>
      </Accordion>

      <h3 className={`t-title ${s.subTitle}`}>RoomCard</h3>
      <div style={{ display: "grid", gap: 16 }}>
        <RoomCard
          href="#"
          title="Hotpot Friday"
          vibe="hype"
          timeText="Fri 8pm"
          placeText="Causeway Bay"
          going={4}
          capacity={6}
          host
        />
        <RoomCard
          href="#"
          title="Quiet coffee + reading"
          vibe="chill"
          timeText="Sat 10am"
          placeText="Sheung Wan"
          going={2}
          capacity={3}
        />
        <RoomCard
          href="#"
          title="Board games night"
          vibe="playful"
          timeText="last week"
          going={6}
          capacity={6}
          closed
        />
      </div>

      <h3 className={`t-title ${s.subTitle}`}>Overlays</h3>
      <div className={s.row}>
        <Button tone="secondary" onClick={() => setToastOpen(true)}>
          Show toast
        </Button>
        <Button tone="secondary" onClick={() => setDialogOpen(true)}>
          Open dialog
        </Button>
        <Button onClick={() => setShareOpen(true)}>Share sheet</Button>
      </div>

      <Toast open={toastOpen} onClose={() => setToastOpen(false)}>
        Link copied 🍄
      </Toast>
      <Dialog
        open={dialogOpen}
        title="Leave this hangout?"
        danger
        confirmLabel="Leave"
        onConfirm={() => setDialogOpen(false)}
        onClose={() => setDialogOpen(false)}
      >
        You can re-join while it&apos;s open.
      </Dialog>
      <ShareSheet
        open={shareOpen}
        url="https://enokiapp.com/r/hk8x2md4qp"
        note="This link is your room — keep it."
        onClose={() => setShareOpen(false)}
      />
    </section>
  );
}
