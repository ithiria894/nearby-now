// Supabase Edge Function: send-push
// Triggered by a database webhook on INSERT into public.room_events. For a new
// chat/quick message it notifies every OTHER joined member of that room via the
// Expo Push API. Runs with the service_role key (bypasses RLS) so it can read
// recipients' push tokens — which are NOT client-readable (see push_tokens RLS).
//
// Deploy:  supabase functions deploy send-push
// Wire:    a database webhook (room_events INSERT) -> this function's URL.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

type RoomEvent = {
  id: string;
  activity_id: string;
  user_id: string;
  type: string;
  content: string | null;
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    // Supabase webhook shape: { type, table, record, old_record, schema }.
    const record: RoomEvent = payload.record ?? payload;

    if (!record?.activity_id || !record?.user_id) {
      return json({ skipped: "missing fields" });
    }
    // Only real messages notify — system events (joins, edits) do not.
    if (record.type !== "chat" && record.type !== "quick") {
      return json({ skipped: `type=${record.type}` });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const activityId = record.activity_id;
    const authorId = record.user_id;

    // Activity title + author display name (for the notification text).
    const [{ data: activity }, { data: author }] = await Promise.all([
      supabase
        .from("activities")
        .select("title_text")
        .eq("id", activityId)
        .single(),
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", authorId)
        .single(),
    ]);
    const title = activity?.title_text?.trim() || "NearbyNow";
    const authorName = author?.display_name?.trim() || "Someone";

    // Recipients = joined members of this room, excluding the author.
    const { data: members } = await supabase
      .from("activity_members")
      .select("user_id")
      .eq("activity_id", activityId)
      .eq("state", "joined")
      .neq("user_id", authorId);
    const recipientIds = (members ?? []).map((m) => m.user_id as string);
    if (recipientIds.length === 0)
      return json({ sent: 0, reason: "no recipients" });

    // Their Expo push tokens (service_role bypasses push_tokens RLS).
    const { data: tokenRows } = await supabase
      .from("push_tokens")
      .select("token")
      .in("user_id", recipientIds);
    const tokens = (tokenRows ?? [])
      .map((t) => t.token as string)
      .filter(
        (t) => typeof t === "string" && t.startsWith("ExponentPushToken")
      );
    if (tokens.length === 0) return json({ sent: 0, reason: "no tokens" });

    const body =
      record.type === "quick"
        ? `${authorName} sent a quick update`
        : `${authorName} sent a message`;

    const messages = tokens.map((to) => ({
      to,
      sound: "default",
      title,
      body,
      data: { activityId },
    }));

    // Expo accepts up to 100 messages per request.
    const results: unknown[] = [];
    for (let i = 0; i < messages.length; i += 100) {
      const resp = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(messages.slice(i, i + 100)),
      });
      results.push(await resp.json());
    }

    return json({ sent: tokens.length, results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
