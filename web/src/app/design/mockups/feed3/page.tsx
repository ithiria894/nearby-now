"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { RoomCard } from "@/components/RoomCard";
import { Banner } from "@/components/Banner";
import { Avatar, AvatarCluster } from "@/components/Avatar";
import {
  IconPin,
  IconChevronDown,
  IconGlobe,
  IconSearch,
  CategoryIcon,
} from "@/components/icons";
import { VIBE_TINT, VIBE_LABEL_EN, VIBES, type VibeKey } from "@/lib/vibes";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import s from "../../design.module.css";
import { MockFrame, DesktopFrame } from "../parts";
import f from "../feed/feed.module.css";
import g from "./feed3.module.css";

// Discover v3 — design gate for the feed rework (supersedes v2's carousel):
// 1. ONE vertical scroll — no featured carousel. Carousels hide items 2..n
//    behind a swipe; a discover feed wants the eye running down a list.
// 2. Top cluster reframed as "Starting soon" — honest label (soonest + has
//    room = high join-success), not fake personalization we can't back.
// 3. Always-visible filter bar: category chips + vibe chips + Has-room
//    toggle + search (behind an icon). Filters are client-side over the live
//    open set (small!) — facets, not a search engine.
// Every card keeps category (banner label chip) + vibe (pill) visible.

type Item = {
  title: string;
  cat: CategoryKey;
  vibe: VibeKey;
  mins: number; // minutes until start — drives "Starting soon"
  time: string;
  place: string;
  online?: boolean;
  going: number;
  cap: number;
  host: string;
  joined?: boolean; // viewer already in — real impl: fetchMyRooms ∩ feed slugs
};

const ITEMS: Item[] = [
  {
    title: "Hotpot tonight, who's in?",
    cat: "food",
    vibe: "hype",
    mins: 90,
    time: "Tonight 8pm",
    place: "1.2 km · Causeway Bay",
    going: 3,
    cap: 6,
    host: "mimi",
    joined: true, // demo: viewer already tapped in
  },
  {
    title: "Valorant stack, mics on",
    cat: "games",
    vibe: "playful",
    mins: 150,
    time: "Tonight 10pm",
    place: "Online",
    online: true,
    going: 4,
    cap: 5,
    host: "kenji",
  },
  {
    title: "Late-night ramen run",
    cat: "food",
    vibe: "chill",
    mins: 210,
    time: "Tonight 11pm",
    place: "0.8 km · Mong Kok",
    going: 2,
    cap: 4,
    host: "leo",
  },
  {
    title: "Board games at the cafe",
    cat: "games",
    vibe: "chill",
    mins: 60,
    time: "Tonight 7:30pm",
    place: "2.0 km · Tsim Sha Tsui",
    going: 5,
    cap: 5, // FULL — demos the Has-room toggle
    host: "aya",
  },
  {
    title: "Sunday hike + picnic",
    cat: "outdoors",
    vibe: "chill",
    mins: 2400,
    time: "Sun 9am",
    place: "Sai Kung",
    going: 2,
    cap: 8,
    host: "aya",
  },
  {
    title: "Badminton doubles, casual",
    cat: "sports",
    vibe: "open",
    mins: 1100,
    time: "Sat 2pm",
    place: "5.1 km · Kowloon Park",
    going: 3,
    cap: 4,
    host: "sam",
    joined: true, // demo: joined tag on a browse card
  },
  {
    title: "Deep talk: quarter-life stuff",
    cat: "drinks",
    vibe: "deep",
    mins: 1500,
    time: "Sun 3pm",
    place: "Online",
    online: true,
    going: 2,
    cap: 6,
    host: "noa",
  },
  {
    title: "Street photography walk",
    cat: "photo",
    vibe: "chill",
    mins: 2350,
    time: "Sun 9am",
    place: "2.2 km · Central",
    going: 2,
    cap: 6,
    host: "kit",
  },
  {
    title: "Guitar jam, all levels",
    cat: "music",
    vibe: "playful",
    mins: 1300,
    time: "Sat 5pm",
    place: "3.1 km · Sheung Wan",
    going: 1,
    cap: 5,
    host: "rui",
  },
  {
    title: "Study sprint: finals week",
    cat: "study",
    vibe: "open",
    mins: 45,
    time: "Tonight 7pm",
    place: "Online",
    online: true,
    going: 3,
    cap: 10,
    host: "wing",
  },
];

const PAST = [
  { title: "Board games night", when: "yesterday" },
  { title: "Morning hike + brunch", when: "last Sat" },
  { title: "Ramen crawl", when: "last week" },
] as const;

// categories that actually appear in the open set — chips for empty
// categories just produce "no match" noise
const LIVE_CATS = CATEGORIES.filter((c) => ITEMS.some((i) => i.cat === c.key));

function soonLabel(mins: number): string | null {
  if (mins > 240) return null;
  if (mins < 60) return `in ${mins} min`;
  const h = Math.round(mins / 60);
  return `in ${h} h`;
}

function SoonCard({ r }: { r: Item }) {
  const left = r.cap - r.going;
  const soon = soonLabel(r.mins);
  return (
    <div className={`${f.fcard} ${g.scard}`}>
      <div className={f.fcardBody}>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "space-between",
            }}
          >
            <div className="t-h2">{r.title}</div>
            {r.joined ? <Badge fill="var(--mint)">Joined</Badge> : null}
          </div>
          <div
            className="t-body"
            style={{ color: "var(--subtext)", marginTop: 4 }}
          >
            {r.time} · {r.place}
          </div>
        </div>
        <div className={f.fcardBottom}>
          <AvatarCluster count={r.going} />
          <span
            className="t-caption"
            style={{
              color: "var(--subtext)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {soon ? <Badge fill="var(--yellow)">{soon}</Badge> : null}
            {left > 0 ? `${left} left` : "full"} · by {r.host}
          </span>
        </div>
      </div>
      <Banner
        category={r.cat}
        height={84}
        edge="bottom"
        radius="0 0 24px 24px"
        corner={
          r.vibe !== "open" ? (
            <Chip accent={VIBE_TINT[r.vibe] ?? undefined} selected>
              {VIBE_LABEL_EN[r.vibe]}
            </Chip>
          ) : undefined
        }
      />
    </div>
  );
}

function Discover({ wide }: { wide?: boolean }) {
  const [loc, setLoc] = useState("Anywhere");
  const [cat, setCat] = useState<"all" | CategoryKey>("all");
  const [vibe, setVibe] = useState<"any" | VibeKey>("any");
  const [hasRoom, setHasRoom] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  const online = loc === "Online";
  const filtered = ITEMS.filter((i) => {
    if (online && !i.online) return false;
    if (cat !== "all" && i.cat !== cat) return false;
    if (vibe !== "any" && i.vibe !== vibe) return false;
    if (hasRoom && i.going >= i.cap) return false;
    if (q) {
      const hay = `${i.title} ${i.place}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  // Starting soon = next 4h AND has room (honest high-join-success picks)
  const soon = filtered
    .filter((i) => i.mins <= 240 && i.going < i.cap)
    .sort((a, b) => a.mins - b.mins)
    .slice(0, 3);
  const soonTitles = new Set(soon.map((i) => i.title));
  const more = filtered
    .filter((i) => !soonTitles.has(i.title))
    .sort((a, b) => a.mins - b.mins);

  const anyFilter = cat !== "all" || vibe !== "any" || hasRoom || q.length > 0;
  const clearAll = () => {
    setCat("all");
    setVibe("any");
    setHasRoom(false);
    setQ("");
    setSearchOpen(false);
  };

  return (
    <div className={f.frameRoot}>
      <TopBar
        right={
          <button className={f.profilePill}>
            <Avatar size={26} seed={0} />
            mimi
          </button>
        }
      />

      <div className={f.greet}>
        <div>
          <div className="t-h1">What&apos;s happening</div>
          <div className="t-caption" style={{ color: "var(--subtext)" }}>
            Spontaneous hangouts — tap in, no signup.
          </div>
        </div>
        <div className={f.pillWrap}>
          <button
            className={f.locPill}
            onClick={() => setLoc(online ? "Anywhere" : "Online")}
          >
            {online ? <IconGlobe size={15} /> : <IconPin size={15} />}
            {loc}
            <IconChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* ---- filter bar: always visible ---- */}
      <div className={g.filters}>
        <div className={g.filterRow}>
          <button
            className={`${g.searchBtn} ${searchOpen ? g.searchBtnActive : ""}`}
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => {
              if (searchOpen) setQ("");
              setSearchOpen((v) => !v);
            }}
          >
            <IconSearch size={18} />
          </button>
          <Chip selected={cat === "all"} onClick={() => setCat("all")}>
            All
          </Chip>
          {LIVE_CATS.map((c) => (
            <Chip
              key={c.key}
              selected={cat === c.key}
              accent={c.tint}
              leading={<CategoryIcon category={c.key} size={14} />}
              onClick={() => setCat(cat === c.key ? "all" : c.key)}
            >
              {c.label}
            </Chip>
          ))}
        </div>
        <div className={g.filterRow}>
          {VIBES.filter((v) => v !== "open").map((v) => (
            <Chip
              key={v}
              selected={vibe === v}
              accent={VIBE_TINT[v] ?? undefined}
              onClick={() => setVibe(vibe === v ? "any" : v)}
            >
              {VIBE_LABEL_EN[v]}
            </Chip>
          ))}
          <span className={g.vibeDivider} aria-hidden />
          <Chip
            selected={hasRoom}
            accent="var(--mint)"
            onClick={() => setHasRoom((v) => !v)}
          >
            Has room
          </Chip>
        </div>
        {searchOpen ? (
          <div className={g.searchWrap}>
            <Input
              placeholder="Search title or place…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </div>
        ) : null}
      </div>

      {/* ---- starting soon: honest top cluster, vertical, no carousel ---- */}
      {soon.length > 0 ? (
        <>
          <div className={f.section}>
            <span className={`t-label ${f.sectionLabel}`}>
              Starting soon · has room
            </span>
          </div>
          <div className={`${g.soonList} ${wide ? g.soonListWide : ""}`}>
            {soon.map((r) => (
              <SoonCard key={r.title} r={r} />
            ))}
          </div>
        </>
      ) : null}

      {/* ---- everything else ---- */}
      {more.length > 0 ? (
        <div className={f.section}>
          <span className={`t-label ${f.sectionLabel}`}>
            {soon.length > 0 ? "More around" : "Around"}
          </span>
          <div className={`${f.list} ${wide ? f.listWide : ""}`}>
            {more.map((r) => (
              <RoomCard
                key={r.title}
                href="#"
                title={r.title}
                vibe={r.vibe}
                banner={`cat:${r.cat}`}
                timeText={r.time}
                placeText={r.place}
                going={r.going}
                capacity={r.cap}
                joined={r.joined}
              />
            ))}
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className={g.noMatch}>
          <div className="t-title">Nothing matches</div>
          <div
            className="t-body"
            style={{ color: "var(--subtext)", margin: "4px 0 12px" }}
          >
            Try fewer filters — or start this one yourself.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <Button tone="secondary" onClick={clearAll}>
              Clear filters
            </Button>
            <Button>Start one</Button>
          </div>
        </div>
      ) : anyFilter ? (
        <div className={f.section}>
          <button
            className="t-caption"
            style={{
              color: "var(--brand)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
            }}
            onClick={clearAll}
          >
            Clear filters
          </button>
        </div>
      ) : null}

      {/* ---- past strip (unchanged from v2) ---- */}
      <div className={f.section}>
        <span className={`t-label ${f.sectionLabel}`}>Recently happened</span>
      </div>
      <div className={f.pastStrip}>
        {PAST.map((r) => (
          <div key={r.title} className={f.pastCard}>
            <div className="t-title">{r.title}</div>
            <div className="t-caption" style={{ color: "var(--subtext)" }}>
              {r.when}
            </div>
          </div>
        ))}
      </div>

      <div className={f.newHere}>
        New here? <span style={{ color: "var(--brand)" }}>How enoki works</span>{" "}
        · Privacy · Terms
      </div>

      {!wide ? (
        <button className={f.fab} aria-label="Start a hangout">
          +
        </button>
      ) : null}
    </div>
  );
}

export default function DiscoverV3Mockup() {
  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>
        Mockup · Discover v3 — filters + starting soon
      </h2>
      <p
        className="t-caption"
        style={{ color: "var(--subtext)", marginBottom: 12 }}
      >
        Supersedes v2&apos;s carousel: one vertical scroll; top cluster is an
        honest &ldquo;Starting soon · has room&rdquo; (soonest + joinable = high
        success), not fake personalization. Category + vibe chips always
        visible; search tucked behind the icon; filters here are LIVE over the
        fake data — tap around. Every card keeps its category label + vibe pill
        on the banner.
      </p>
      <MockFrame label="mobile · discover v3 — try the filters">
        <Discover />
      </MockFrame>
      <DesktopFrame label="desktop · discover v3 — soon 3-up, browse grid">
        <Discover wide />
      </DesktopFrame>
    </section>
  );
}
