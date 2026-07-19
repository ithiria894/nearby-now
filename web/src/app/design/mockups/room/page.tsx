"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { AvatarCluster } from "@/components/Avatar";
import { VIBE_TINT, VIBE_LABEL_EN, VIBE_GLYPH } from "@/lib/vibes";
import s from "../../design.module.css";
import { MockFrame, FAKE_ROOM } from "../parts";

// #44 — /r/[slug] visitor view, all 6 states. Static fake data.

type State = "open" | "full" | "expired" | "closed" | "notfound" | "race";
const STATES: State[] = [
  "open",
  "full",
  "expired",
  "closed",
  "notfound",
  "race",
];

const pad = { padding: 16 } as const;

function HowItWorks() {
  return (
    <div style={{ marginTop: 20 }}>
      <div className="t-title">What&apos;s enoki?</div>
      <div className="t-body" style={{ color: "var(--subtext)", marginTop: 4 }}>
        Spontaneous hangouts nearby — no host, no profile, just a nickname.
      </div>
      <ol style={{ margin: "10px 0 0 18px" }} className="t-body">
        <li>Tap in with a nickname</li>
        <li>Chat with the group</li>
        <li>Show up 🍄</li>
      </ol>
    </div>
  );
}

function DeadEnd({ title, body }: { title: string; body: string }) {
  return (
    <div style={pad}>
      <div
        style={{
          background: "var(--surface)",
          border: "var(--border-thick) solid var(--border)",
          borderRadius: 20,
          boxShadow: "var(--hard-shadow-md)",
          padding: 20,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40 }}>🍄</div>
        <div className="t-h2" style={{ marginTop: 8 }}>
          {title}
        </div>
        <div
          className="t-body"
          style={{ color: "var(--subtext)", marginTop: 4 }}
        >
          {body}
        </div>
        <div style={{ marginTop: 16 }}>
          <Button full>Start your own</Button>
        </div>
      </div>
    </div>
  );
}

function OpenView({ race }: { race?: boolean }) {
  const r = FAKE_ROOM;
  return (
    <div style={pad}>
      <div
        style={{
          background: "var(--surface)",
          border: "var(--border-thick) solid var(--border)",
          borderRadius: 20,
          boxShadow: "var(--hard-shadow-md)",
          padding: 20,
        }}
      >
        <Chip
          accent={VIBE_TINT[r.vibe] ?? undefined}
          selected
          leading={VIBE_GLYPH[r.vibe]}
        >
          {VIBE_LABEL_EN[r.vibe]}
        </Chip>
        <h1 className="t-h1" style={{ marginTop: 10 }}>
          {r.title}
        </h1>
        <div
          className="t-body"
          style={{ color: "var(--subtext)", marginTop: 4 }}
        >
          {r.timeText} · {r.placeName}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 14,
          }}
        >
          <AvatarCluster count={r.going} />
          <Badge fill="var(--yellow)">{r.capacity - r.going} spots left</Badge>
        </div>
        <div
          className="t-caption"
          style={{ color: "var(--subtext)", marginTop: 8 }}
        >
          {r.going} / {r.capacity} going · started by {r.host}
        </div>

        <div
          style={{ height: 1, background: "var(--hairline)", margin: "16px 0" }}
        />

        <Input label="Your nickname" placeholder="e.g. mimi" />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Chip onClick={() => {}}>♀</Chip>
          <Chip onClick={() => {}}>♂</Chip>
          <Chip selected onClick={() => {}}>
            Skip
          </Chip>
        </div>
        {race ? (
          <div
            className="t-caption"
            style={{ color: "var(--danger)", marginTop: 10 }}
          >
            Someone just took the last spot. This one filled up.
          </div>
        ) : null}
        <div style={{ marginTop: 14 }}>
          {race ? (
            <Button full>Start your own</Button>
          ) : (
            <Button full>Join this hangout</Button>
          )}
        </div>
      </div>
      <HowItWorks />
    </div>
  );
}

function Screen({ state }: { state: State }) {
  return (
    <div style={{ minHeight: 560 }}>
      <TopBar right={<Chip onClick={() => {}}>EN</Chip>} />
      {state === "open" && <OpenView />}
      {state === "race" && <OpenView race />}
      {state === "full" && (
        <DeadEnd
          title="This one's full"
          body="Every spot's taken. Start your own hangout nearby."
        />
      )}
      {state === "expired" && (
        <DeadEnd
          title="This hangout already happened"
          body="It's over — but you can start a fresh one."
        />
      )}
      {state === "closed" && (
        <DeadEnd
          title="This hangout is closed"
          body="The host wrapped it up. Start your own."
        />
      )}
      {state === "notfound" && (
        <DeadEnd
          title="Nothing here"
          body="This link's expired or never existed. Start your own."
        />
      )}
    </div>
  );
}

export default function RoomMockup() {
  const [state, setState] = useState<State>("open");
  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>
        Mockup · room visitor view (#44)
      </h2>
      <div className={s.row} style={{ marginBottom: 12 }}>
        {STATES.map((st) => (
          <Chip key={st} selected={state === st} onClick={() => setState(st)}>
            {st}
          </Chip>
        ))}
      </div>
      <MockFrame label={`/r/hk8x2md4qp · ${state}`}>
        <Screen state={state} />
      </MockFrame>
    </section>
  );
}
