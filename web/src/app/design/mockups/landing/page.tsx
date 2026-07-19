"use client";

import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { RoomCard } from "@/components/RoomCard";
import { Avatar } from "@/components/Avatar";
import { IconFlame } from "@/components/icons";
import s from "../../design.module.css";
import { MockFrame, DesktopFrame } from "../parts";

// #47 — landing (/), /rooms, and the OG link-preview card. Static.

function Landing() {
  return (
    <div style={{ minHeight: 560 }}>
      <TopBar right={<Chip onClick={() => {}}>EN</Chip>} />
      <div style={{ padding: "40px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Avatar size={64} />
        </div>
        <div
          className="t-wordmark"
          style={{ fontSize: 56, color: "var(--ink)", marginTop: 8 }}
        >
          enoki
        </div>
        <p className="t-body" style={{ color: "var(--subtext)", marginTop: 8 }}>
          Get people together — without being the host.
        </p>
        <div style={{ marginTop: 20, maxWidth: 260, marginInline: "auto" }}>
          <Button full>Start a hangout</Button>
        </div>

        <div
          style={{ marginTop: 36, textAlign: "left", display: "grid", gap: 14 }}
        >
          {[
            ["1", "Post what you feel like doing"],
            ["2", "Drop the link in your group chat"],
            ["3", "People tap in — no signup"],
          ].map(([n, t]) => (
            <div
              key={n}
              style={{ display: "flex", gap: 12, alignItems: "center" }}
            >
              <Chip tone="brand">{n}</Chip>
              <span className="t-title">{t}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          padding: 16,
          borderTop: "var(--border-base) solid var(--hairline)",
          textAlign: "center",
        }}
        className="t-caption"
      >
        <span style={{ color: "var(--subtext)" }}>Privacy · Terms · 中文</span>
      </div>
    </div>
  );
}

function Rooms() {
  return (
    <div style={{ minHeight: 560 }}>
      <TopBar right={<Chip onClick={() => {}}>My rooms</Chip>} />
      <div style={{ padding: 16 }}>
        <h1 className="t-h1" style={{ marginBottom: 12 }}>
          My rooms
        </h1>
        {/* responsive grid: 1 col on a phone, multi-col as width allows */}
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          <RoomCard
            href="#"
            title="Hotpot Friday, who's in?"
            vibe="hype"
            timeText="Tonight 8pm"
            placeText="Causeway Bay"
            going={3}
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
      </div>
    </div>
  );
}

function OgCard() {
  return (
    <div
      style={{
        aspectRatio: "1200 / 630",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "7%",
      }}
    >
      <div>
        <span
          className="t-label"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "var(--coral)",
            color: "var(--on-bright)",
            border: "var(--border-thick) solid var(--border)",
            borderRadius: 999,
            padding: "4px 12px",
          }}
        >
          <IconFlame size={14} /> Hype
        </span>
        <div
          className="t-display"
          style={{ fontSize: 34, marginTop: 12, lineHeight: 1.1 }}
        >
          Hotpot Friday, who&apos;s in?
        </div>
        <div
          className="t-body"
          style={{ color: "var(--subtext)", marginTop: 6 }}
        >
          Tonight 8pm · Causeway Bay · 3 / 6 going
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <span
          className="t-wordmark"
          style={{ fontSize: 30, color: "var(--ink)" }}
        >
          enoki
        </span>
        <span className="t-label" style={{ color: "var(--subtext)" }}>
          tap in — no signup
        </span>
      </div>
    </div>
  );
}

export default function LandingMockup() {
  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>
        Mockup · landing / rooms / OG (#47)
      </h2>

      <MockFrame label="/ — landing">
        <Landing />
      </MockFrame>

      <MockFrame label="/rooms — my rooms (mobile)">
        <Rooms />
      </MockFrame>

      <DesktopFrame label="/rooms — my rooms (desktop, grid fills the width)">
        <Rooms />
      </DesktopFrame>

      <div
        className="t-label"
        style={{ color: "var(--subtext)", marginBottom: 6 }}
      >
        OG link-preview card (1200×630) — how the link unfurls
      </div>
      <div
        style={{
          maxWidth: 480,
          border: "var(--border-thick) solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "var(--hard-shadow-md)",
        }}
      >
        <OgCard />
      </div>
    </section>
  );
}
