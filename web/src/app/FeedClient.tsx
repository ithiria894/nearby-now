"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Input } from "@/components/Input";
import { RoomCard } from "@/components/RoomCard";
import { Banner } from "@/components/Banner";
import { Avatar, AvatarCluster } from "@/components/Avatar";
import { Toast } from "@/components/Toast";
import {
  IconPin,
  IconGlobe,
  IconChevronDown,
  IconSearch,
  CategoryIcon,
} from "@/components/icons";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { getFeedPublic, fetchMyRooms, type FeedItem } from "@/lib/backend";
import { normalizeVibe, VIBE_TINT, VIBE_LABEL_EN, VIBES } from "@/lib/vibes";
import type { VibeKey } from "@/lib/vibes";
import { CATEGORIES, resolveBanner, type CategoryKey } from "@/lib/categories";
import { AREAS } from "@/lib/areas";
import { track } from "@/lib/track";
import s from "./page.module.css";

// Discover v3 (approved mockup /design/mockups/feed3). One vertical scroll —
// no carousel. Top cluster = "Starting soon · has room" (honest high-join-
// success picks). Always-visible category + vibe chips, Has-room toggle,
// search behind a labeled pill. Facet filtering is client-side over the open
// set (small by nature); Joined tags via my-rooms ∩ feed slugs.

type Scope =
  | { kind: "anywhere" }
  | { kind: "near"; lat: number; lng: number }
  | { kind: "online" }
  | { kind: "area"; key: string };

function scopeLabel(sc: Scope): string {
  if (sc.kind === "anywhere") return "Anywhere";
  if (sc.kind === "near") return "Near you";
  if (sc.kind === "online") return "Online";
  return AREAS.find((a) => a.key === sc.key)?.label ?? "Anywhere";
}

function timeLabel(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function placeLabel(r: FeedItem): string {
  if (r.place_name == null && r.distance_km == null) return "Online";
  return [r.distance_km != null ? `${r.distance_km} km` : null, r.place_name]
    .filter(Boolean)
    .join(" · ");
}

// FeedItem + facets computed once at load (Date.now in the effect, not render)
type Enriched = FeedItem & {
  cat: CategoryKey;
  minsUntil: number | null;
  hasSpots: boolean;
};

function soonBadge(mins: number): string {
  if (mins <= 0) return "now";
  if (mins < 60) return `in ${Math.round(mins)} min`;
  return `in ${Math.round(mins / 60)} h`;
}

function SoonCard({ r, joined }: { r: Enriched; joined: boolean }) {
  const spotsLeft = r.capacity != null ? r.capacity - r.joined_count : null;
  return (
    <Link href={`/r/${r.share_slug}`} className={s.fcard}>
      <div className={s.fcardBody}>
        <div>
          <div className={s.fcardTop}>
            <div className="t-h2">{r.title_text}</div>
            {joined ? <Badge fill="var(--mint)">Joined</Badge> : null}
          </div>
          <div
            className="t-body"
            style={{ color: "var(--subtext)", marginTop: 4 }}
            suppressHydrationWarning
          >
            {[timeLabel(r.start_time), placeLabel(r)]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <div className={s.fcardBottom}>
          <AvatarCluster count={r.joined_count} />
          <span
            className="t-caption"
            style={{
              color: "var(--subtext)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {r.minsUntil != null ? (
              <Badge fill="var(--yellow)">{soonBadge(r.minsUntil)}</Badge>
            ) : null}
            {spotsLeft != null && spotsLeft > 0 ? `${spotsLeft} left · ` : ""}
            {r.joined_count}
            {r.capacity ? `/${r.capacity}` : ""}
            {r.host_display_name ? ` · by ${r.host_display_name}` : ""}
          </span>
        </div>
      </div>
      <Banner
        category={r.cat}
        vibe={r.vibe}
        height={84}
        edge="bottom"
        radius="0 0 24px 24px"
      />
    </Link>
  );
}

function AreaOptions({
  scope,
  onPick,
}: {
  scope: Scope;
  onPick: (label: string) => void;
}) {
  const current = scopeLabel(scope);
  return (
    <>
      {["Near you", "Anywhere", "Online", ...AREAS.map((a) => a.label)].map(
        (a) => (
          <button
            key={a}
            className={`${s.sheetRow} ${current === a ? s.sheetRowActive : ""}`}
            onClick={() => onPick(a)}
          >
            {a === "Online" ? <IconGlobe size={16} /> : <IconPin size={16} />}
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
        )
      )}
    </>
  );
}

export function FeedClient() {
  const [scope, setScope] = useState<Scope>({ kind: "anywhere" });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [open, setOpen] = useState<Enriched[] | null>(null);
  const [past, setPast] = useState<FeedItem[]>([]);
  const [mySlugs, setMySlugs] = useState<Set<string>>(new Set());
  const [geoDenied, setGeoDenied] = useState(false);

  // facet filters (client-side over the open set)
  const [cat, setCat] = useState<"all" | CategoryKey>("all");
  const [vibe, setVibe] = useState<"any" | VibeKey>("any");
  const [hasRoom, setHasRoom] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const db = createSupabaseBrowser();
      const filter =
        scope.kind === "online"
          ? "online"
          : scope.kind === "anywhere"
            ? "all"
            : "nearby";
      const coords =
        scope.kind === "near"
          ? { lat: scope.lat, lng: scope.lng }
          : scope.kind === "area"
            ? (() => {
                const a = AREAS.find((x) => x.key === scope.key);
                return a ? { lat: a.lat, lng: a.lng } : undefined;
              })()
            : undefined;
      const radius =
        scope.kind === "area"
          ? (AREAS.find((x) => x.key === scope.key)?.radiusKm ?? 15)
          : 15;
      const [o, p] = await Promise.all([
        getFeedPublic(db, "open", filter, coords, radius).catch(() => []),
        getFeedPublic(db, "past", "all", undefined, 15, 8).catch(() => []),
      ]);
      if (!active) return;
      const now = Date.now();
      setOpen(
        o.map((r) => ({
          ...r,
          cat: resolveBanner(r.banner, r.title_text, r.share_slug),
          minsUntil: r.start_time
            ? (new Date(r.start_time).getTime() - now) / 60000
            : null,
          hasSpots: r.capacity == null || r.joined_count < r.capacity,
        }))
      );
      setPast(p);
    })();
    return () => {
      active = false;
    };
  }, [scope]);

  // Joined tags — only when a session already exists (viewing the feed must
  // never create one)
  useEffect(() => {
    let active = true;
    (async () => {
      const db = createSupabaseBrowser();
      const { data } = await db.auth.getSession();
      const uid = data.session?.user?.id;
      if (!uid) return;
      const rooms = await fetchMyRooms(db, uid).catch(() => []);
      if (!active) return;
      setMySlugs(new Set(rooms.map((r) => r.share_slug)));
    })();
    return () => {
      active = false;
    };
  }, []);

  const pick = (label: string) => {
    setPickerOpen(false);
    track("feed_filter", undefined, label);
    if (label === "Anywhere") return setScope({ kind: "anywhere" });
    if (label === "Online") return setScope({ kind: "online" });
    if (label === "Near you") {
      if (!("geolocation" in navigator)) return setGeoDenied(true);
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setScope({
            kind: "near",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => setGeoDenied(true),
        { timeout: 8000 }
      );
      return;
    }
    const area = AREAS.find((a) => a.label === label);
    if (area) setScope({ kind: "area", key: area.key });
  };

  // ---- facets ----
  const all = open ?? [];
  const liveCats = CATEGORIES.filter((c) => all.some((i) => i.cat === c.key));
  const filtered = all.filter((i) => {
    if (cat !== "all" && i.cat !== cat) return false;
    if (vibe !== "any" && normalizeVibe(i.vibe) !== vibe) return false;
    if (hasRoom && !i.hasSpots) return false;
    if (q) {
      const hay = `${i.title_text} ${i.place_name ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  // Starting soon = starts within 4h (or just started), has room; top 3
  const soon = filtered
    .filter(
      (i) =>
        i.minsUntil != null &&
        i.minsUntil <= 240 &&
        i.minsUntil > -60 &&
        i.hasSpots
    )
    .sort((a, b) => (a.minsUntil ?? 0) - (b.minsUntil ?? 0))
    .slice(0, 3);
  const soonSlugs = new Set(soon.map((r) => r.share_slug));
  const browse = filtered
    .filter((r) => !soonSlugs.has(r.share_slug))
    .sort((a, b) => (a.minsUntil ?? Infinity) - (b.minsUntil ?? Infinity));

  const anyFilter = cat !== "all" || vibe !== "any" || hasRoom || q.length > 0;
  const clearAll = () => {
    setCat("all");
    setVibe("any");
    setHasRoom(false);
    setQ("");
    setSearchOpen(false);
  };

  return (
    <>
      <div className={s.greet}>
        <div>
          <h1 className="t-h1">What&apos;s happening</h1>
          <div className="t-caption" style={{ color: "var(--subtext)" }}>
            Spontaneous hangouts — tap in, no signup.
          </div>
        </div>
        <div className={s.pillWrap}>
          <button
            className={s.locPill}
            onClick={() => setPickerOpen((v) => !v)}
            aria-expanded={pickerOpen}
          >
            {scope.kind === "online" ? (
              <IconGlobe size={15} />
            ) : (
              <IconPin size={15} />
            )}
            {scopeLabel(scope)}
            <IconChevronDown size={14} />
          </button>
          {pickerOpen ? (
            <div className={s.dropdown}>
              <AreaOptions scope={scope} onPick={pick} />
            </div>
          ) : null}
        </div>
      </div>

      {/* ---- filter bar ---- */}
      <div className={s.filters}>
        <div className={s.filterRow}>
          <Chip
            selected={searchOpen}
            leading={<IconSearch size={14} />}
            onClick={() => {
              if (searchOpen) setQ("");
              else track("feed_filter", undefined, "search");
              setSearchOpen((v) => !v);
            }}
          >
            Search
          </Chip>
          <Chip selected={cat === "all"} onClick={() => setCat("all")}>
            All
          </Chip>
          {liveCats.map((c) => (
            <Chip
              key={c.key}
              selected={cat === c.key}
              accent={c.tint}
              leading={<CategoryIcon category={c.key} size={14} />}
              onClick={() => {
                const next = cat === c.key ? "all" : c.key;
                if (next !== "all")
                  track("feed_filter", undefined, `cat:${c.key}`);
                setCat(next);
              }}
            >
              {c.label}
            </Chip>
          ))}
        </div>
        <div className={s.filterRow}>
          {VIBES.filter((v) => v !== "open").map((v) => (
            <Chip
              key={v}
              selected={vibe === v}
              accent={VIBE_TINT[v] ?? undefined}
              onClick={() => {
                const next = vibe === v ? "any" : v;
                if (next !== "any")
                  track("feed_filter", undefined, `vibe:${v}`);
                setVibe(next);
              }}
            >
              {VIBE_LABEL_EN[v]}
            </Chip>
          ))}
          <span className={s.vibeDivider} aria-hidden />
          <Chip
            selected={hasRoom}
            accent="var(--mint)"
            onClick={() => {
              if (!hasRoom) track("feed_filter", undefined, "has_room");
              setHasRoom((v) => !v);
            }}
          >
            Has room
          </Chip>
        </div>
        {searchOpen ? (
          <div className={s.searchWrap}>
            <Input
              placeholder="Search title or place…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </div>
        ) : null}
      </div>

      {open === null ? (
        <div
          className="t-body"
          style={{ color: "var(--subtext)", padding: "24px 0" }}
        >
          Loading…
        </div>
      ) : all.length === 0 ? (
        <div className={s.empty}>
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
            Nothing {scope.kind === "online" ? "online" : "around"} at the
            moment — be the first.
          </div>
          <Link href="/new" style={{ marginTop: 14, display: "inline-block" }}>
            <Button>Start one</Button>
          </Link>
        </div>
      ) : (
        <>
          {soon.length > 0 ? (
            <>
              <span className={`t-label ${s.sectionLabel}`}>
                Starting soon · has room
              </span>
              <div className={s.soonList}>
                {soon.map((r) => (
                  <SoonCard
                    key={r.share_slug}
                    r={r}
                    joined={mySlugs.has(r.share_slug)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {browse.length > 0 ? (
            <>
              <span className={`t-label ${s.sectionLabel}`}>
                {soon.length > 0 ? "More around" : "Around"}
              </span>
              <div className={s.grid}>
                {browse.map((r) => (
                  <RoomCard
                    key={r.share_slug}
                    href={`/r/${r.share_slug}`}
                    title={r.title_text}
                    vibe={normalizeVibe(r.vibe)}
                    banner={r.banner}
                    timeText={timeLabel(r.start_time) ?? undefined}
                    placeText={placeLabel(r)}
                    going={r.joined_count}
                    capacity={r.capacity ?? undefined}
                    joined={mySlugs.has(r.share_slug)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {filtered.length === 0 ? (
            <div className={s.noMatch}>
              <div className="t-title">Nothing matches</div>
              <div
                className="t-body"
                style={{ color: "var(--subtext)", margin: "4px 0 12px" }}
              >
                Try fewer filters — or start this one yourself.
              </div>
              <div
                style={{ display: "flex", gap: 8, justifyContent: "center" }}
              >
                <Button tone="secondary" onClick={clearAll}>
                  Clear filters
                </Button>
                <Link href="/new">
                  <Button>Start one</Button>
                </Link>
              </div>
            </div>
          ) : anyFilter ? (
            <button className={`t-caption ${s.clearBtn}`} onClick={clearAll}>
              Clear filters
            </button>
          ) : null}
        </>
      )}

      {past.length > 0 ? (
        <>
          <span className={`t-label ${s.sectionLabel}`}>Recently happened</span>
          <div className={s.pastStrip}>
            {past.map((r) => (
              <Link
                key={r.share_slug}
                href={`/r/${r.share_slug}`}
                className={s.pastCard}
              >
                <div className="t-title">{r.title_text}</div>
                <div className="t-caption" style={{ color: "var(--subtext)" }}>
                  {r.joined_count} went
                  {r.place_name ? ` · ${r.place_name}` : ""}
                </div>
              </Link>
            ))}
          </div>
          <div className="t-caption" style={{ color: "var(--subtext)" }}>
            You missed these — start the next one.
          </div>
        </>
      ) : null}

      <Link href="/new" className={s.fab} aria-label="Start a hangout">
        +
      </Link>

      {/* mobile: bottom-sheet presentation of the same options */}
      {pickerOpen ? (
        <div className={s.sheetOverlay} onClick={() => setPickerOpen(false)}>
          <div className={s.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={s.grabber} />
            <div className="t-h2" style={{ marginBottom: 6 }}>
              Where are you looking?
            </div>
            <AreaOptions scope={scope} onPick={pick} />
          </div>
        </div>
      ) : null}

      <Toast open={geoDenied} tone="danger" onClose={() => setGeoDenied(false)}>
        Location unavailable — showing all hangouts
      </Toast>
    </>
  );
}
