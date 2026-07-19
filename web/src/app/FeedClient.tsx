"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { RoomCard } from "@/components/RoomCard";
import { Avatar } from "@/components/Avatar";
import { Toast } from "@/components/Toast";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { getFeedPublic, type FeedItem } from "@/lib/backend";
import { normalizeVibe } from "@/lib/vibes";
import { track } from "@/lib/track";
import s from "./page.module.css";

// Feed body (#67, WEB_PLAN §3.3 revised). Client component: filters,
// geolocation for Nearby, open + recently-happened sections.

type Filter = "all" | "nearby" | "online";

function cardPlace(r: FeedItem): string | undefined {
  const isOnline = r.place_name == null && r.distance_km == null;
  if (isOnline) return "Online";
  const parts = [
    r.distance_km != null ? `${r.distance_km} km` : null,
    r.place_name,
  ].filter(Boolean);
  return parts.join(" · ") || undefined;
}

function cardTime(r: FeedItem): string | undefined {
  if (!r.start_time) return undefined;
  return new Date(r.start_time).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FeedClient() {
  const [filter, setFilter] = useState<Filter>("all");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [open, setOpen] = useState<FeedItem[] | null>(null);
  const [past, setPast] = useState<FeedItem[]>([]);
  const [geoDenied, setGeoDenied] = useState(false);

  // fetch whenever filter/coords change (past list only needs the first load)
  useEffect(() => {
    let active = true;
    (async () => {
      const db = createSupabaseBrowser();
      const wantCoords = filter === "nearby" && coords ? coords : undefined;
      const [o, p] = await Promise.all([
        getFeedPublic(db, "open", filter, wantCoords).catch(() => []),
        getFeedPublic(db, "past", "all", undefined, 15, 6).catch(() => []),
      ]);
      if (!active) return;
      setOpen(o);
      setPast(p);
    })();
    return () => {
      active = false;
    };
  }, [filter, coords]);

  const pickFilter = (k: Filter) => {
    track("feed_filter", undefined, k);
    if (k === "nearby" && !coords) {
      if (!("geolocation" in navigator)) {
        setGeoDenied(true);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setFilter("nearby");
        },
        () => {
          setGeoDenied(true);
          setFilter("all");
        },
        { timeout: 8000 }
      );
      return;
    }
    setFilter(k);
  };

  return (
    <>
      <div className={s.filters}>
        {(["all", "nearby", "online"] as Filter[]).map((k) => (
          <Chip key={k} selected={filter === k} onClick={() => pickFilter(k)}>
            {k === "all" ? "All" : k === "nearby" ? "Nearby" : "Online"}
          </Chip>
        ))}
      </div>

      <div className={s.section}>
        <div className={`t-label ${s.sectionLabel}`}>Happening</div>
        {open === null ? (
          <div className="t-body" style={{ color: "var(--subtext)" }}>
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
              Nothing {filter === "online" ? "online" : "around"} at the moment
              — be the first.
            </div>
            <Link
              href="/new"
              style={{ marginTop: 14, display: "inline-block" }}
            >
              <Button>Start one</Button>
            </Link>
          </div>
        ) : (
          <div className={s.grid}>
            {open.map((r) => (
              <RoomCard
                key={r.share_slug}
                href={`/r/${r.share_slug}`}
                title={r.title_text}
                vibe={normalizeVibe(r.vibe)}
                timeText={cardTime(r)}
                placeText={cardPlace(r)}
                going={r.joined_count}
                capacity={r.capacity ?? undefined}
              />
            ))}
          </div>
        )}

        {past.length > 0 ? (
          <>
            <div className={`t-label ${s.sectionLabel}`}>Recently happened</div>
            <div className={s.grid}>
              {past.map((r) => (
                <RoomCard
                  key={r.share_slug}
                  href={`/r/${r.share_slug}`}
                  title={r.title_text}
                  vibe={normalizeVibe(r.vibe)}
                  placeText={r.place_name ?? "Online"}
                  going={r.joined_count}
                  capacity={r.capacity ?? undefined}
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
          </>
        ) : null}
      </div>

      <Link href="/new" className={s.fab} aria-label="Start a hangout">
        +
      </Link>

      <Toast open={geoDenied} tone="danger" onClose={() => setGeoDenied(false)}>
        Location unavailable — showing all hangouts
      </Toast>
    </>
  );
}
