"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { RoomCard } from "@/components/RoomCard";
import { Avatar } from "@/components/Avatar";
import s from "../../design.module.css";
import { MockFrame, DesktopFrame } from "../parts";
import f from "./feed.module.css";

// #65 — the front page as a FEED (WEB_PLAN §3.3 revised). Open hangouts +
// "recently happened" (FOMO), All/Nearby/Online filters, floating + on mobile.
// Static fake data.

type Filter = "all" | "nearby" | "online";

const OPEN = [
  {
    title: "Hotpot Friday, who's in?",
    vibe: "hype",
    time: "Tonight 8pm",
    place: "1.2 km · Causeway Bay",
    going: 3,
    cap: 6,
  },
  {
    title: "Quiet coffee + reading",
    vibe: "chill",
    time: "Sat 10am",
    place: "3.8 km · Sheung Wan",
    going: 2,
    cap: 3,
  },
  {
    title: "Valorant stack, mics on",
    vibe: "playful",
    time: "Tonight 10pm",
    place: "Online",
    going: 4,
    cap: 5,
  },
  {
    title: "Deep talk: quarter-life stuff",
    vibe: "deep",
    time: "Sun 3pm",
    place: "Online",
    going: 2,
    cap: 6,
  },
] as const;

const PAST = [
  {
    title: "Board games night",
    vibe: "playful",
    time: "yesterday",
    place: "Mong Kok",
    going: 6,
    cap: 6,
  },
  {
    title: "Morning hike + brunch",
    vibe: "chill",
    time: "last Sat",
    place: "Sai Kung",
    going: 5,
    cap: 8,
  },
] as const;

function Feed({ wide, empty }: { wide?: boolean; empty?: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const open = empty
    ? []
    : OPEN.filter((r) =>
        filter === "all"
          ? true
          : filter === "online"
            ? r.place === "Online"
            : r.place !== "Online"
      );

  return (
    <div
      style={{
        minHeight: 620,
        position: "relative",
        paddingBottom: wide ? 0 : 72,
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

      <div className={f.hero}>
        <div className={f.heroText}>
          <div className={`t-wordmark ${f.wordmark}`}>enoki</div>
          <div className={`t-caption ${f.tagline}`}>
            Spontaneous hangouts — tap in, no signup.
          </div>
        </div>
        {wide ? <Button>Start a hangout</Button> : null}
      </div>

      <div className={f.filters}>
        {(["all", "nearby", "online"] as Filter[]).map((k) => (
          <Chip key={k} selected={filter === k} onClick={() => setFilter(k)}>
            {k === "all" ? "All" : k === "nearby" ? "Nearby" : "Online"}
          </Chip>
        ))}
      </div>

      <div className={f.section}>
        <div className={`t-label ${f.sectionLabel}`}>Happening</div>
        {open.length === 0 ? (
          <div className={f.empty}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Avatar size={48} />
            </div>
            <div className="t-h2" style={{ marginTop: 8 }}>
              Quiet right now
            </div>
            <div
              className="t-body"
              style={{ color: "var(--subtext)", marginTop: 4 }}
            >
              Nothing {filter === "online" ? "online" : "nearby"} at the moment
              — be the first.
            </div>
            <div style={{ marginTop: 14, display: "inline-block" }}>
              <Button>Start one</Button>
            </div>
          </div>
        ) : (
          <div className={`${f.list} ${wide ? f.gridWide : ""}`}>
            {open.map((r) => (
              <RoomCard
                key={r.title}
                href="#"
                title={r.title}
                vibe={r.vibe}
                timeText={r.time}
                placeText={r.place}
                going={r.going}
                capacity={r.cap}
              />
            ))}
          </div>
        )}

        <div className={`t-label ${f.sectionLabel}`}>Recently happened</div>
        <div className={`${f.list} ${wide ? f.gridWide : ""}`}>
          {PAST.map((r) => (
            <RoomCard
              key={r.title}
              href="#"
              title={r.title}
              vibe={r.vibe}
              timeText={r.time}
              placeText={r.place}
              going={r.going}
              capacity={r.cap}
              closed
            />
          ))}
        </div>
        <div
          className="t-caption"
          style={{ color: "var(--subtext)", marginTop: 8 }}
        >
          You missed these — start the next one.
        </div>
      </div>

      <div className={f.steps}>
        {[
          "Post what you feel like doing",
          "Drop the link in your group chat",
          "People tap in — no signup",
        ].map((t, i) => (
          <div key={i} className={f.step}>
            <Chip tone="brand">{String(i + 1)}</Chip>
            <span className="t-title">{t}</span>
          </div>
        ))}
      </div>

      {!wide ? (
        <button className={f.fab} aria-label="Start a hangout">
          +
        </button>
      ) : null}
    </div>
  );
}

export default function FeedMockup() {
  const [empty, setEmpty] = useState(false);
  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>Mockup · / feed (#65)</h2>
      <div className={s.row} style={{ marginBottom: 12 }}>
        <Chip selected={!empty} onClick={() => setEmpty(false)}>
          with rooms
        </Chip>
        <Chip selected={empty} onClick={() => setEmpty(true)}>
          empty state
        </Chip>
      </div>
      <MockFrame label="mobile · feed (floating +)">
        <Feed empty={empty} />
      </MockFrame>
      <DesktopFrame label="desktop · feed (grid + header CTA)">
        <Feed wide empty={empty} />
      </DesktopFrame>
    </section>
  );
}
