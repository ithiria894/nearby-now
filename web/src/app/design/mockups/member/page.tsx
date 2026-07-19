"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { Avatar } from "@/components/Avatar";
import { IconArrowUpRight, IconCrown } from "@/components/icons";
import { VIBE_TINT, VIBE_LABEL_EN } from "@/lib/vibes";
import s from "../../design.module.css";
import {
  MockFrame,
  DesktopFrame,
  FAKE_ROOM,
  FAKE_MEMBERS,
  FAKE_MESSAGES,
} from "../parts";
import c from "./member.module.css";

// #45 — member room. Phone view (single column) + desktop view (two-pane:
// info/RSVP/share left, chat right). Static fake data.

type View = "member" | "host" | "readonly";
const VIEWS: View[] = ["member", "host", "readonly"];
const r = FAKE_ROOM;

function VibeTitle() {
  return (
    <div className={c.head}>
      <Chip accent={VIBE_TINT[r.vibe] ?? undefined} selected>
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
        <Button tone="secondary" leading={<IconArrowUpRight size={16} />}>
          Share
        </Button>
      </div>
    </div>
  );
}

function Chat() {
  return (
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
  );
}

function Composer({ view }: { view: View }) {
  if (view === "readonly") {
    return <div className={c.readonly}>You left this hangout · read-only</div>;
  }
  return (
    <>
      <div className={c.composer}>
        <input className={c.composerInput} placeholder="Message the group…" />
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
  );
}

function PhoneRoom({ view }: { view: View }) {
  return (
    <div style={{ minHeight: 560, display: "flex", flexDirection: "column" }}>
      <TopBar right={<Chip onClick={() => {}}>Leave</Chip>} />
      <VibeTitle />
      <div className={c.rsvp}>
        {FAKE_MEMBERS.map((m, i) => (
          <div key={m.name} className={c.rsvpMember}>
            <Avatar size={40} seed={i} />
            <span
              className="t-caption"
              style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
            >
              {m.host ? <IconCrown size={12} /> : null}
              {m.name}
            </span>
          </div>
        ))}
      </div>
      <Chat />
      <Composer view={view} />
    </div>
  );
}

function DesktopRoom({ view }: { view: View }) {
  return (
    <div>
      <TopBar right={<Chip onClick={() => {}}>My rooms</Chip>} />
      <div className={c.desktop}>
        <div className={c.desktopLeft}>
          <VibeTitle />
          <div className={c.rsvpCol}>
            {FAKE_MEMBERS.map((m, i) => (
              <div key={m.name} className={c.rsvpColMember}>
                <Avatar size={36} seed={i} />
                <span
                  className="t-body-strong"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {m.host ? <IconCrown size={14} /> : null}
                  {m.name}
                </span>
              </div>
            ))}
          </div>
          <div style={{ padding: 16, marginTop: "auto" }}>
            {view === "host" ? (
              <Button tone="danger" full>
                Close this hangout
              </Button>
            ) : view === "member" ? (
              <Button tone="secondary" full>
                Leave
              </Button>
            ) : null}
          </div>
        </div>
        <div className={c.desktopRight}>
          <Chat />
          {view === "readonly" ? (
            <div className={c.readonly}>You left this hangout · read-only</div>
          ) : (
            <div className={c.composer}>
              <input
                className={c.composerInput}
                placeholder="Message the group…"
              />
              <button className={c.send}>Send</button>
            </div>
          )}
        </div>
      </div>
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
      <MockFrame label={`mobile · ${view}`}>
        <PhoneRoom view={view} />
      </MockFrame>
      <DesktopFrame label={`desktop · ${view} — two-pane`}>
        <DesktopRoom view={view} />
      </DesktopFrame>
    </section>
  );
}
