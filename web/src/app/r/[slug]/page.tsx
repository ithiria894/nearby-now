import type { Metadata } from "next";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getRoomPublic } from "@/lib/backend";
import { roomState } from "@/lib/types";
import { RoomClient } from "./RoomClient";

// /r/[slug] — THE page (WEB_PLAN §3.1). Front-door file: the only place Next
// server APIs (server component, generateMetadata) are used for this surface.
// force-dynamic: a live room must never render from cache. Timestamps are
// formatted client-side (avoids SSR timezone hydration mismatch).
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const db = await createSupabaseServer();
  let title = "enoki";
  let description = "Spontaneous hangouts nearby — tap in, no signup.";
  try {
    const room = await getRoomPublic(db, slug);
    if (room) {
      title = room.title_text;
      const parts = [room.place_name, `${room.joined_count} going`].filter(
        Boolean
      );
      description = parts.join(" · ");
    }
  } catch {
    // fall back to defaults
  }
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      images: [{ url: `/api/og/${slug}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function RoomPage({ params }: Params) {
  const { slug } = await params;
  const db = await createSupabaseServer();
  const room = await getRoomPublic(db, slug).catch(() => null);
  const state = roomState(room);

  return <RoomClient room={room} initialState={state} />;
}
