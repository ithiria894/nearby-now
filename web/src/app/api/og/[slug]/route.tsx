import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/env";

// OG link-preview card (#51 / WEB_PLAN §3.6). Front-door file. Renders the room
// as a 1200×630 card in the paper/ink brutal style. Uses the built-in font for
// robustness (loading Poppins TTF is a later enhancement).
export const dynamic = "force-dynamic";

const VIBES: Record<string, { label: string; color: string }> = {
  chill: { label: "Chill", color: "#54C1FF" },
  hype: { label: "Hype", color: "#FF6B4A" },
  deep: { label: "Deep", color: "#B57BFF" },
  playful: { label: "Playful", color: "#FF7AC6" },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  let title = "Join my enoki hangout";
  let sub = "tap in — no signup";
  let vibe: { label: string; color: string } | null = null;

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data } = await db
      .rpc("get_room_public", { p_slug: slug })
      .maybeSingle();
    const room = data as {
      title_text: string;
      vibe: string | null;
      place_name: string | null;
      joined_count: number;
      capacity: number | null;
      status: string;
    } | null;
    if (room && room.status === "open") {
      title = room.title_text;
      const parts = [
        room.place_name,
        `${room.joined_count}${room.capacity ? `/${room.capacity}` : ""} going`,
      ].filter(Boolean);
      sub = parts.join(" · ");
      if (room.vibe && VIBES[room.vibe]) vibe = VIBES[room.vibe];
    }
  } catch {
    // fall back to the generic card
  }

  // Brand type in the unfurl (#77): Poppins Bold, fetched + cached. If the
  // fetch fails (offline build/CI), fonts stays undefined → default sans.
  const poppins = await fetch(
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Bold.ttf",
    { cache: "force-cache" }
  )
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .catch(() => null);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#F3EBD8",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 84,
        border: "12px solid #1C180F",
        fontFamily: poppins ? "Poppins" : undefined,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        {vibe ? (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: vibe.color,
              color: "#1C180F",
              border: "4px solid #1C180F",
              borderRadius: 999,
              padding: "8px 22px",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            {vibe.label}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            color: "#1C180F",
            marginTop: 28,
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#6E6450",
            marginTop: 18,
          }}
        >
          {sub}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 52,
            fontWeight: 800,
            color: "#1C180F",
          }}
        >
          enoki
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#6E6450" }}>
          enokiapp.com
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: poppins
        ? [{ name: "Poppins", data: poppins, weight: 700, style: "normal" }]
        : undefined,
    }
  );
}
