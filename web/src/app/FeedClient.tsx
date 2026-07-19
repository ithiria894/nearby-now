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
  VibeIcon,
  IconPin,
  IconGlobe,
  IconChevronDown,
} from "@/components/icons";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { getFeedPublic, type FeedItem } from "@/lib/backend";
import { normalizeVibe, VIBE_TINT, VIBE_LABEL_EN } from "@/lib/vibes";
import { detectCategory, CATEGORIES, type CategoryKey } from "@/lib/categories";
import { AREAS } from "@/lib/areas";
import { track } from "@/lib/track";
import s from "./page.module.css";

// Discover v2 body (#69; approved mockup /design/mockups/feed). Location pill
// = single scope control (Anywhere / Near you / Online / district); featured
// carousel of banner cards; browse grid; past mini-strip.

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

// Stable platform-assigned banner: keyword detect first; deterministic
// pseudo-random (slug hash) fallback so a card never flickers between loads.
// LLM best-fit is the future upgrade (WEB_PLAN §3.3).
export function bannerCategory(title: string, slug: string): CategoryKey {
  const detected = detectCategory(title);
  if (detected) return detected;
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return CATEGORIES[h % (CATEGORIES.length - 1)].key; // excludes trailing "other"
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

function FeaturedCard({ r }: { r: FeedItem }) {
  const vibe = normalizeVibe(r.vibe);
  const spotsLeft = r.capacity != null ? r.capacity - r.joined_count : null;
  return (
    <Link href={`/r/${r.share_slug}`} className={s.fcard}>
      <Banner
        category={bannerCategory(r.title_text, r.share_slug)}
        height={92}
        radius="24px 24px 0 0"
      />
      <div className={s.fcardBody}>
        <div>
          <div className="t-h2">{r.title_text}</div>
          <div
            className="t-body"
            style={{ color: "var(--subtext)", marginTop: 6 }}
            suppressHydrationWarning
          >
            {[timeLabel(r.start_time), placeLabel(r)]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <div className={s.fcardTop} style={{ marginTop: 10 }}>
            {vibe !== "open" ? (
              <Chip
                accent={VIBE_TINT[vibe] ?? undefined}
                selected
                leading={<VibeIcon vibe={vibe} />}
              >
                {VIBE_LABEL_EN[vibe]}
              </Chip>
            ) : (
              <span />
            )}
            {spotsLeft != null && spotsLeft > 0 ? (
              <Badge fill="var(--yellow)">{spotsLeft} left</Badge>
            ) : null}
          </div>
        </div>
        <div className={s.fcardBottom}>
          <AvatarCluster count={r.joined_count} />
          <span className="t-caption" style={{ color: "var(--subtext)" }}>
            {r.joined_count}
            {r.capacity ? `/${r.capacity}` : ""}
            {r.host_display_name ? ` · by ${r.host_display_name}` : ""}
          </span>
        </div>
      </div>
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
  const [open, setOpen] = useState<FeedItem[] | null>(null);
  const [past, setPast] = useState<FeedItem[]>([]);
  const [geoDenied, setGeoDenied] = useState(false);

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
      setOpen(o);
      setPast(p);
    })();
    return () => {
      active = false;
    };
  }, [scope]);

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

  // featured = soonest-starting (nulls last), then most joined; top 3
  const featured = (open ?? [])
    .slice()
    .sort((a, b) => {
      const at = a.start_time ? new Date(a.start_time).getTime() : Infinity;
      const bt = b.start_time ? new Date(b.start_time).getTime() : Infinity;
      if (at !== bt) return at - bt;
      return b.joined_count - a.joined_count;
    })
    .slice(0, 3);
  const featuredSlugs = new Set(featured.map((r) => r.share_slug));
  const browse = (open ?? []).filter((r) => !featuredSlugs.has(r.share_slug));

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

      {open === null ? (
        <div
          className="t-body"
          style={{ color: "var(--subtext)", padding: "24px 0" }}
        >
          Loading…
        </div>
      ) : open.length === 0 ? (
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
          <div className={s.carousel}>
            {featured.map((r) => (
              <FeaturedCard key={r.share_slug} r={r} />
            ))}
          </div>

          {browse.length > 0 ? (
            <>
              <span className={`t-label ${s.sectionLabel}`}>More around</span>
              <div className={s.grid}>
                {browse.map((r) => (
                  <RoomCard
                    key={r.share_slug}
                    href={`/r/${r.share_slug}`}
                    title={r.title_text}
                    vibe={normalizeVibe(r.vibe)}
                    timeText={timeLabel(r.start_time) ?? undefined}
                    placeText={placeLabel(r)}
                    going={r.joined_count}
                    capacity={r.capacity ?? undefined}
                  />
                ))}
              </div>
            </>
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
