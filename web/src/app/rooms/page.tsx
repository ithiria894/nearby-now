"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { ProfileSlot } from "@/components/ProfileSlot";
import { Button } from "@/components/Button";
import { RoomCard } from "@/components/RoomCard";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { currentUserId } from "@/lib/guest";
import { fetchMyRooms, type MyRoom } from "@/lib/backend";
import { normalizeVibe } from "@/lib/vibes";
import s from "./rooms.module.css";

// /rooms (#57). Session-gated re-entry: created + joined rooms, newest first,
// responsive grid, crown on hosted, closed dimmed.

type DisplayRoom = MyRoom & { closed: boolean };

export default function RoomsPage() {
  const [rooms, setRooms] = useState<DisplayRoom[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const uid = await currentUserId();
      if (!active) return;
      setSignedIn(!!uid);
      if (!uid) {
        setRooms([]);
        return;
      }
      const list = await fetchMyRooms(createSupabaseBrowser(), uid);
      if (!active) return;
      const now = Date.now();
      setRooms(
        list.map((r) => ({
          ...r,
          closed:
            r.status !== "open" ||
            (r.expires_at != null && new Date(r.expires_at).getTime() <= now),
        }))
      );
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <TopBar right={<ProfileSlot />} />
      <main className={s.main}>
        <h1 className="t-h1" style={{ marginBottom: 16 }}>
          My rooms
        </h1>

        {rooms === null ? (
          <div className="t-body" style={{ color: "var(--subtext)" }}>
            Loading…
          </div>
        ) : rooms.length === 0 ? (
          <div className={s.empty}>
            <div className="t-body" style={{ color: "var(--subtext)" }}>
              {signedIn
                ? "No rooms yet."
                : "Rooms you create or join show up here."}
            </div>
            <Link
              href="/new"
              style={{ marginTop: 12, display: "inline-block" }}
            >
              <Button>Start one</Button>
            </Link>
          </div>
        ) : (
          <div className={s.grid}>
            {rooms.map((r) => (
              <RoomCard
                key={r.id}
                href={`/r/${r.share_slug}`}
                title={r.title_text}
                vibe={normalizeVibe(r.vibe)}
                banner={r.banner}
                placeText={r.place_name ?? undefined}
                capacity={r.capacity ?? undefined}
                host={r.role === "creator"}
                closed={r.closed}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
