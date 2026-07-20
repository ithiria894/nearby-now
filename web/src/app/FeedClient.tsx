"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { RoomCard } from "@/components/RoomCard";
import { Banner } from "@/components/Banner";
import { Avatar, AvatarCluster } from "@/components/Avatar";
import { Toast } from "@/components/Toast";
import {
  IconPin,
  IconGlobe,
  IconChevronDown,
  IconSearch,
  IconX,
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

// Discover v3 (approved mockup /design/mockups/feed3, iterated live). One
// vertical scroll — no carousel. Top cluster = "Starting soon · has room".
// Search is a TOOL (next to the location pill), not a facet chip. Category +
// vibe chips MULTI-select: OR within a facet, AND across facets. Chip taps
// replay a staggered M3 entrance on the lists; typing does not (too jumpy).

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

// toggle helper for multi-select facet sets
function toggled<T>(prev: Set<T>, key: T): Set<T> {
  const next = new Set(prev);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
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

  // facet filters — multi-select sets; empty set = "all"/"any"
  const [cats, setCats] = useState<Set<CategoryKey>>(new Set());
  const [vibesSel, setVibesSel] = useState<Set<VibeKey>>(new Set());
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

  // ---- facets: OR within a set, AND across facets ----
  const all = open ?? [];
  const liveCats = CATEGORIES.filter((c) => all.some((i) => i.cat === c.key));
  const filtered = all.filter((i) => {
    if (cats.size > 0 && !cats.has(i.cat)) return false;
    if (vibesSel.size > 0 && !vibesSel.has(normalizeVibe(i.vibe))) return false;
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

  const anyFilter =
    cats.size > 0 || vibesSel.size > 0 || hasRoom || q.length > 0;
  const clearAll = () => {
    setCats(new Set());
    setVibesSel(new Set());
    setHasRoom(false);
    setQ("");
    setSearchOpen(false);
  };

  // chip taps remount the results → staggered entrance replays. Typing (q)
  // deliberately excluded — re-animating every keystroke is jumpy.
  const filterKey = [
    scopeLabel(scope),
    [...cats].sort().join(","),
    [...vibesSel].sort().join(","),
    hasRoom ? "room" : "",
  ].join("|");
  let delayIdx = 0;
  const entrance = () => ({
    animationDelay: `${Math.min(delayIdx++, 10) * 35}ms`,
  });

  return (
    <>
      <div className={`${s.greet} ${searchOpen ? s.greetSearching : ""}`}>
        <div className={s.titleBlock}>
          <h1 className="t-h1">What&apos;s happening</h1>
          <div className="t-caption" style={{ color: "var(--subtext)" }}>
            Spontaneous hangouts — tap in, no signup.
          </div>
        </div>
        <div className={s.tools}>
          {searchOpen ? (
            /* the pill, morphed: in-flow field left of the (still tappable)
               location pill; X or Escape collapses */
            <div className={s.searchField}>
              <span className={s.searchLead} aria-hidden>
                <IconSearch size={16} />
              </span>
              <input
                className={s.searchInput}
                placeholder="Search title or place…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setQ("");
                    setSearchOpen(false);
                  }
                }}
                autoFocus
              />
              <button
                className={s.searchX}
                aria-label="Close search"
                onClick={() => {
                  setQ("");
                  setSearchOpen(false);
                }}
              >
                <IconX size={16} />
              </button>
            </div>
          ) : (
            <button
              className={s.searchPill}
              aria-label="Search hangouts"
              aria-expanded={searchOpen}
              onClick={() => {
                track("feed_filter", undefined, "search");
                setSearchOpen(true);
              }}
            >
              <IconSearch size={17} />
            </button>
          )}
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
      </div>

      {/* ---- facet chips: categories, then vibes + has-room ---- */}
      <div className={s.filters}>
        <div className={s.filterRow}>
          <Chip selected={cats.size === 0} onClick={() => setCats(new Set())}>
            All
          </Chip>
          {liveCats.map((c) => (
            <Chip
              key={c.key}
              selected={cats.has(c.key)}
              accent={c.tint}
              leading={<CategoryIcon category={c.key} size={14} />}
              onClick={() => {
                if (!cats.has(c.key))
                  track("feed_filter", undefined, `cat:${c.key}`);
                setCats((prev) => toggled(prev, c.key));
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
              selected={vibesSel.has(v)}
              accent={VIBE_TINT[v] ?? undefined}
              onClick={() => {
                if (!vibesSel.has(v))
                  track("feed_filter", undefined, `vibe:${v}`);
                setVibesSel((prev) => toggled(prev, v));
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
        <div key={filterKey}>
          {soon.length > 0 ? (
            <>
              <span className={`t-label ${s.sectionLabel}`}>
                Starting soon · has room
              </span>
              <div className={s.soonList}>
                {soon.map((r) => (
                  <div
                    key={r.share_slug}
                    className={s.cardIn}
                    style={entrance()}
                  >
                    <SoonCard r={r} joined={mySlugs.has(r.share_slug)} />
                  </div>
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
                  <div
                    key={r.share_slug}
                    className={s.cardIn}
                    style={entrance()}
                  >
                    <RoomCard
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
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {filtered.length === 0 ? (
            <div className={`${s.noMatch} ${s.cardIn}`}>
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
        </div>
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
