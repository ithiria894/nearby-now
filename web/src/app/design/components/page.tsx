"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { VIBES, VIBE_TINT, VIBE_LABEL_EN, VIBE_GLYPH } from "@/lib/vibes";
import s from "../design.module.css";

// /design/components — Section 3.

export default function ComponentsPage() {
  const [vibe, setVibe] = useState<string>("open");
  const [chipOn, setChipOn] = useState(true);
  const [text, setText] = useState("");

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
    </section>
  );
}
