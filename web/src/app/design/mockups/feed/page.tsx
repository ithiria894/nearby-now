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
  VibeIcon,
  IconPin,
  IconChevronDown,
  IconCrown,
  IconShuffle,
  IconImage,
  IconGlobe,
  CategoryIcon,
} from "@/components/icons";
import { VIBE_TINT, VIBE_LABEL_EN, type VibeKey } from "@/lib/vibes";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import s from "../../design.module.css";
import { MockFrame, DesktopFrame } from "../parts";
import f from "./feed.module.css";

// #68 — Discover v2 (WEB_PLAN §3.3 v2 + §4 session-presence).
// Two-tier feed: featured carousel of tall vibe-tinted cards + browse list.
// Location pill + area sheet; Online chip; session-aware TopBar + profile
// sheet. Static fake data — the design gate for the redesign.

type Session = "none" | "guest";
type Sheet = "none" | "area" | "profile";

const FEATURED: {
  title: string;
  vibe: VibeKey;
  cat: CategoryKey;
  time: string;
  place: string;
  going: number;
  cap: number;
  host: string;
}[] = [
  {
    title: "Hotpot Friday, who's in?",
    vibe: "hype",
    cat: "food",
    time: "Tonight 8pm",
    place: "1.2 km · Causeway Bay",
    going: 3,
    cap: 6,
    host: "mimi",
  },
  {
    title: "Valorant stack, mics on",
    vibe: "playful",
    cat: "games",
    time: "Tonight 10pm",
    place: "Online",
    going: 4,
    cap: 5,
    host: "kenji",
  },
  {
    title: "Sunday hike + picnic",
    vibe: "chill",
    cat: "outdoors",
    time: "Sun 9am",
    place: "Sai Kung",
    going: 2,
    cap: 8,
    host: "aya",
  },
];

const BROWSE = [
  {
    title: "Quiet coffee + reading",
    vibe: "chill",
    time: "Sat 10am",
    place: "3.8 km · Sheung Wan",
    going: 2,
    cap: 3,
  },
  {
    title: "Badminton doubles, casual",
    vibe: "open",
    time: "Sat 2pm",
    place: "5.1 km · Kowloon Park",
    going: 3,
    cap: 4,
  },
  {
    title: "Deep talk: quarter-life stuff",
    vibe: "deep",
    time: "Sun 3pm",
    place: "Online",
    going: 2,
    cap: 6,
  },
  {
    title: "Street photography walk",
    vibe: "chill",
    time: "Sun 9am",
    place: "2.2 km · Central",
    going: 2,
    cap: 6,
  },
] as const;

const PAST = [
  { title: "Board games night", when: "yesterday" },
  { title: "Morning hike + brunch", when: "last Sat" },
  { title: "Ramen crawl", when: "last week" },
] as const;

const AREAS = [
  "Causeway Bay",
  "Central",
  "Mong Kok",
  "Tsim Sha Tsui",
  "Kwun Tong",
];

function FeaturedCard(r: (typeof FEATURED)[number]) {
  return (
    <div className={f.fcard}>
      <Banner category={r.cat} height={92} radius="24px 24px 0 0" />
      <div className={f.fcardBody}>
        <div>
          <div className="t-h1">{r.title}</div>
          <div
            className="t-body"
            style={{ color: "var(--subtext)", marginTop: 6 }}
          >
            {r.time} · {r.place}
          </div>
          <div className={f.fcardTop} style={{ marginTop: 10 }}>
            {r.vibe !== "open" ? (
              <Chip
                accent={VIBE_TINT[r.vibe] ?? undefined}
                selected
                leading={<VibeIcon vibe={r.vibe} />}
              >
                {VIBE_LABEL_EN[r.vibe]}
              </Chip>
            ) : (
              <span />
            )}
            <Badge fill="var(--yellow)">{r.cap - r.going} left</Badge>
          </div>
        </div>
        <div className={f.fcardBottom}>
          <AvatarCluster count={r.going} />
          <span className="t-caption" style={{ color: "var(--subtext)" }}>
            {r.going}/{r.cap} · by {r.host}
          </span>
        </div>
      </div>
    </div>
  );
}

function Discover({
  wide,
  session,
  sheet,
  onSheet,
  loc,
  onLoc,
}: {
  wide?: boolean;
  session: Session;
  sheet: Sheet;
  onSheet: (v: Sheet) => void;
  loc: string;
  onLoc: (v: string) => void;
}) {
  const online = loc === "Online";
  const browse = online ? BROWSE.filter((b) => b.place === "Online") : BROWSE;
  const featured = online
    ? FEATURED.filter((b) => b.place === "Online")
    : FEATURED;

  return (
    <div className={f.frameRoot}>
      <TopBar
        right={
          session === "guest" ? (
            <button
              className={f.profilePill}
              onClick={() => onSheet("profile")}
            >
              <Avatar size={26} seed={0} />
              mimi
            </button>
          ) : undefined
        }
      />

      <div className={f.greet}>
        <div>
          <div className="t-h1">What&apos;s happening</div>
          <div className="t-caption" style={{ color: "var(--subtext)" }}>
            Spontaneous hangouts — tap in, no signup.
          </div>
        </div>
        <button className={f.locPill} onClick={() => onSheet("area")}>
          {online ? <IconGlobe size={15} /> : <IconPin size={15} />}
          {loc}
          <IconChevronDown size={14} />
        </button>
      </div>

      {/* featured carousel */}
      <div className={wide ? f.carouselWide : f.carousel}>
        {featured.map((r) => (
          <FeaturedCard key={r.title} {...r} />
        ))}
      </div>

      {/* browse */}
      <div className={f.section}>
        <span className={`t-label ${f.sectionLabel}`}>More around</span>
        {browse.length === 0 ? (
          <div className={f.empty}>
            <Avatar size={44} />
            <div className="t-title" style={{ marginTop: 6 }}>
              Quiet right now — be the first
            </div>
          </div>
        ) : (
          <div className={`${f.list} ${wide ? f.listWide : ""}`}>
            {browse.map((r) => (
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
      </div>

      {/* past strip */}
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

      {/* --- area sheet --- */}
      {sheet === "area" ? (
        <div className={f.sheetOverlay} onClick={() => onSheet("none")}>
          <div className={f.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={f.grabber} />
            <div className="t-h2" style={{ marginBottom: 6 }}>
              Where are you looking?
            </div>
            {["Near you", "Anywhere", "Online", ...AREAS].map((a) => (
              <button
                key={a}
                className={`${f.sheetRow} ${loc === a ? f.sheetRowActive : ""}`}
                onClick={() => {
                  onLoc(a);
                  onSheet("none");
                }}
              >
                {a === "Online" ? (
                  <IconGlobe size={16} />
                ) : (
                  <IconPin size={16} />
                )}
                {a}
                {a === "Near you" ? (
                  <span
                    className="t-caption"
                    style={{ color: "var(--faint)", marginLeft: "auto" }}
                  >
                    uses your location
                  </span>
                ) : a === "Online" ? (
                  <span
                    className="t-caption"
                    style={{ color: "var(--faint)", marginLeft: "auto" }}
                  >
                    no place needed
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* --- profile sheet --- */}
      {sheet === "profile" ? (
        <div className={f.sheetOverlay} onClick={() => onSheet("none")}>
          <div className={f.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={f.grabber} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                margin: "6px 0 12px",
              }}
            >
              <Avatar size={44} seed={0} />
              <div>
                <div
                  className="t-title"
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  mimi <IconCrown size={14} />
                </div>
                <div className="t-caption" style={{ color: "var(--subtext)" }}>
                  guest · anonymous to others
                </div>
              </div>
            </div>
            <Input label="Nickname" defaultValue="mimi" />
            <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
              <Button tone="secondary" full>
                My rooms
              </Button>
              <Button tone="secondary" full>
                Not you? Start fresh
              </Button>
            </div>
            <div
              className="t-caption"
              style={{ color: "var(--faint)", marginTop: 10 }}
            >
              Later: add an email to keep your rooms on other devices.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BannerPicker() {
  const [picked, setPicked] = useState<string>("food");
  const shown = CATEGORIES.slice(0, 6);
  return (
    <>
      <h3 className={`t-title ${s.subTitle}`}>
        Banner picker (goes on /new) — pick · surprise me · upload (phase 2)
      </h3>
      <div className={f.pickerRow}>
        {shown.map((c) => (
          <button
            key={c.key}
            className={`${f.pickerSwatch} ${picked === c.key ? f.pickerSwatchActive : ""}`}
            onClick={() => setPicked(c.key)}
          >
            <Banner category={c.key} height={52} radius="0" />
            <span className={f.pickerMeta}>{c.label}</span>
          </button>
        ))}
        <button
          className={`${f.pickerSwatch} ${picked === "random" ? f.pickerSwatchActive : ""}`}
          onClick={() => setPicked("random")}
        >
          <div
            style={{
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--surface-alt)",
              borderBottom: "var(--border-thick) solid var(--border)",
            }}
          >
            <IconShuffle size={24} />
          </div>
          <span className={f.pickerMeta}>Surprise me</span>
        </button>
        <div className={`${f.pickerSwatch} ${f.pickerDisabled}`}>
          <div
            style={{
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--surface-alt)",
              borderBottom: "var(--border-thick) solid var(--border)",
            }}
          >
            <IconImage size={24} />
          </div>
          <span className={f.pickerMeta}>Upload · soon</span>
        </div>
      </div>
      <p
        className="t-caption"
        style={{ color: "var(--subtext)", marginTop: 8 }}
      >
        Default when nothing is picked: auto-detect from the title, random if no
        match — LLM best-fit later. Uploads are phase 2 (moderation-gated).
      </p>
      <div
        style={{ marginTop: 10, display: "flex", gap: 6, alignItems: "center" }}
      >
        <span className="t-caption" style={{ color: "var(--faint)" }}>
          preview:
        </span>
        <CategoryIcon
          category={picked === "random" ? "other" : picked}
          size={16}
        />
        <span className="t-caption">{picked}</span>
      </div>
    </>
  );
}

export default function DiscoverMockup() {
  const [session, setSession] = useState<Session>("guest");
  const [sheet, setSheet] = useState<Sheet>("none");
  const [loc, setLoc] = useState("Anywhere");

  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>Mockup · Discover v2 (#68)</h2>
      <div className={s.row} style={{ marginBottom: 12 }}>
        <Chip selected={session === "none"} onClick={() => setSession("none")}>
          signed out
        </Chip>
        <Chip
          selected={session === "guest"}
          onClick={() => setSession("guest")}
        >
          guest session
        </Chip>
        <Chip
          selected={sheet === "area"}
          onClick={() => setSheet(sheet === "area" ? "none" : "area")}
        >
          area sheet
        </Chip>
        <Chip
          selected={sheet === "profile"}
          onClick={() => setSheet(sheet === "profile" ? "none" : "profile")}
        >
          profile sheet
        </Chip>
      </div>
      <p
        className="t-caption"
        style={{ color: "var(--subtext)", marginBottom: 12 }}
      >
        Signed out = no &ldquo;My rooms&rdquo;, no profile pill. Guest =
        mushroom pill → profile sheet (nickname, My rooms, start fresh).
      </p>
      <MockFrame label={`mobile · discover · ${session}`}>
        <Discover
          session={session}
          sheet={sheet}
          onSheet={setSheet}
          loc={loc}
          onLoc={setLoc}
        />
      </MockFrame>
      <DesktopFrame
        label={`desktop · discover · ${session} — featured 3-up + browse grid`}
      >
        <Discover
          wide
          session={session}
          sheet={sheet}
          onSheet={setSheet}
          loc={loc}
          onLoc={setLoc}
        />
      </DesktopFrame>

      <BannerPicker />
    </section>
  );
}
