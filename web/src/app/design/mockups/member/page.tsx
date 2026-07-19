"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { Avatar } from "@/components/Avatar";
import { VIBE_TINT, VIBE_LABEL_EN, VIBE_GLYPH } from "@/lib/vibes";
import s from "../../design.module.css";
import { MockFrame, FAKE_ROOM, FAKE_MEMBERS, FAKE_MESSAGES } from "../parts";
import c from "./member.module.css";

// #45 — member room: header + share bar, RSVP list, seeded chat, composer,
// leave/close, read-only variant. Static fake data.

type View = "member" | "host" | "readonly";
const VIEWS: View[] = ["member", "host", "readonly"];

function Room({ view }: { view: View }) {
  const r = FAKE_ROOM;
  return (
    <div style={{ minHeight: 560, display: "flex", flexDirection: "column" }}>
      <TopBar right={<Chip onClick={() => {}}>Leave</Chip>} />

      <div className={c.head}>
        <Chip
          accent={VIBE_TINT[r.vibe] ?? undefined}
          selected
          leading={VIBE_GLYPH[r.vibe]}
        >
          {VIBE_LABEL_EN[r.vibe]}
        </Chip>
        <h1 className="t-h2" style={{ marginTop: 8 }}>
          {r.title}
        </h1>
        <div
          className="t-caption"
          style={{ color: "var(--subtext)", marginTop: 2 }}
        >
          {r.timeText} · {r.placeName} · {r.going}/{r.capacity} going
        </div>
        <div className={c.shareBar}>
          <span className={c.shareLink}>
            enokiapp.com/r/hk8x2md4qp
            <span className="t-label" style={{ color: "var(--brand)" }}>
              Copy
            </span>
          </span>
          <Button tone="secondary" leading={<span aria-hidden>↗</span>}>
            Share
          </Button>
        </div>
      </div>

      <div className={c.rsvp}>
        {FAKE_MEMBERS.map((m, i) => (
          <div key={m.name} className={c.rsvpMember}>
            <Avatar size={40} seed={i} />
            <span className="t-caption">
              {m.host ? "👑 " : ""}
              {m.name}
            </span>
          </div>
        ))}
      </div>

      <div className={c.chat}>
        {FAKE_MESSAGES.map((msg) =>
          msg.kind === "system" ? (
            <div key={msg.id} className={c.system}>
              {msg.text} · {msg.at}
            </div>
          ) : (
            <div
              key={msg.id}
              className={`${c.bubbleRow} ${msg.kind === "me" ? c.me : ""}`}
            >
              <div
                className={`${c.bubble} ${msg.kind === "me" ? c.mine : c.them}`}
              >
                {msg.kind === "them" ? (
                  <div className={c.who}>{msg.who}</div>
                ) : null}
                {msg.text}
              </div>
            </div>
          )
        )}
      </div>

      {view === "readonly" ? (
        <div className={c.readonly}>You left this hangout · read-only</div>
      ) : (
        <>
          <div className={c.composer}>
            <input
              className={c.composerInput}
              placeholder="Message the group…"
            />
            <button className={c.send}>Send</button>
          </div>
          <div style={{ padding: "0 16px 16px" }}>
            {view === "host" ? (
              <Button tone="danger" full>
                Close this hangout
              </Button>
            ) : (
              <Button tone="secondary" full>
                Leave
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function MemberMockup() {
  const [view, setView] = useState<View>("member");
  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>Mockup · member room (#45)</h2>
      <div className={s.row} style={{ marginBottom: 12 }}>
        {VIEWS.map((v) => (
          <Chip key={v} selected={view === v} onClick={() => setView(v)}>
            {v}
          </Chip>
        ))}
      </div>
      <MockFrame label={`/r/hk8x2md4qp · member · ${view}`}>
        <Room view={view} />
      </MockFrame>
    </section>
  );
}
