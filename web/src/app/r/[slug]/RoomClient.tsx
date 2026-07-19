"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { Avatar, AvatarCluster } from "@/components/Avatar";
import { VibeIcon, IconArrowUpRight, IconCrown } from "@/components/icons";
import { Dialog } from "@/components/Dialog";
import { Toast } from "@/components/Toast";
import { ShareSheet } from "@/components/ShareSheet";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { ensureGuestSession, currentUserId } from "@/lib/guest";
import { track } from "@/lib/track";
import {
  fetchMembers,
  getActivityCreatorId,
  getMembershipState,
  getRoomEventsPage,
  insertRoomEvent,
  joinRoom,
  leaveRoom,
  closeRoom,
} from "@/lib/backend";
import {
  roomVibe,
  type RoomPublic,
  type RoomState,
  type RoomMember,
  type RoomEvent,
} from "@/lib/types";
import { VIBE_TINT, VIBE_LABEL_EN } from "@/lib/vibes";
import s from "./room.module.css";

type Membership = { state: string; role: string; left_at: string | null };

export function RoomClient({
  room,
  initialState,
  justCreated,
}: {
  room: RoomPublic | null;
  initialState: RoomState;
  justCreated?: boolean;
}) {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [asMember, setAsMember] = useState(false);

  useEffect(() => {
    track("link_open", slugFromPath());
    if (!room) return;
    let active = true;
    (async () => {
      const uid = await currentUserId();
      if (!uid || !active) return;
      const m = await getMembershipState(createSupabaseBrowser(), room.id, uid);
      if (!active || !m) return;
      setMembership(m);
      if (m.state === "joined" || m.state === "left") setAsMember(true);
    })();
    return () => {
      active = false;
    };
  }, [room]);

  if (!room) return <DeadEnd state="notfound" />;

  if (asMember && membership) {
    return (
      <MemberRoom
        room={room}
        membership={membership}
        justCreated={justCreated}
        onLeave={() => {
          setAsMember(false);
          setMembership(null);
        }}
      />
    );
  }

  return (
    <Visitor
      room={room}
      state={initialState}
      onJoined={(m) => {
        setMembership(m);
        setAsMember(true);
      }}
    />
  );
}

/* ---------------- visitor ---------------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <div className={s.page}>{children}</div>
    </>
  );
}

function Explain() {
  return (
    <div className={s.explain}>
      <div className="t-title">What&apos;s enoki?</div>
      <div className="t-body" style={{ color: "var(--subtext)", marginTop: 4 }}>
        Spontaneous hangouts nearby — no host, no profile, just a nickname.
      </div>
      <ol className={`t-body ${s.steps}`}>
        <li>Tap in with a nickname</li>
        <li>Chat with the group</li>
        <li>Show up</li>
      </ol>
    </div>
  );
}

function DeadEnd({ state }: { state: Exclude<RoomState, "open"> }) {
  const copy: Record<string, { title: string; body: string }> = {
    full: { title: "This one's full", body: "Every spot's taken." },
    expired: {
      title: "This hangout already happened",
      body: "It's over — but you can start a fresh one.",
    },
    closed: {
      title: "This hangout is closed",
      body: "The host wrapped it up.",
    },
    notfound: {
      title: "Nothing here",
      body: "This link's expired or never existed.",
    },
  };
  const c = copy[state] ?? copy.notfound;
  return (
    <Shell>
      <div className={`${s.card} ${s.deadend}`}>
        <div className={s.mascot}>
          <Avatar size={48} />
        </div>
        <div className="t-h2" style={{ marginTop: 8 }}>
          {c.title}
        </div>
        <div
          className="t-body"
          style={{ color: "var(--subtext)", marginTop: 4 }}
        >
          {c.body}
        </div>
        <div style={{ marginTop: 16 }}>
          <Link href="/new">
            <Button full>Start your own</Button>
          </Link>
        </div>
      </div>
    </Shell>
  );
}

function Visitor({
  room,
  state,
  onJoined,
}: {
  room: RoomPublic;
  state: RoomState;
  onJoined: (m: Membership) => void;
}) {
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state !== "open") return <DeadEnd state={state} />;

  const vibe = roomVibe(room);
  const spotsLeft =
    room.capacity != null ? room.capacity - room.joined_count : null;

  const join = async () => {
    if (!nickname.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await ensureGuestSession(nickname);
      const res = await joinRoom(createSupabaseBrowser(), room.id);
      if (res === "ok") {
        const uid = await currentUserId();
        const m = uid
          ? await getMembershipState(createSupabaseBrowser(), room.id, uid)
          : null;
        track("join_done", slugFromPath());
        onJoined(m ?? { state: "joined", role: "member", left_at: null });
        return;
      }
      setError(
        res === "full"
          ? "Someone just took the last spot."
          : "This hangout isn't open anymore."
      );
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const card = (
    <div className={s.card}>
      {vibe !== "open" ? (
        <Chip
          accent={VIBE_TINT[vibe] ?? undefined}
          selected
          leading={<VibeIcon vibe={vibe} />}
        >
          {VIBE_LABEL_EN[vibe]}
        </Chip>
      ) : null}
      <h1 className="t-h1" style={{ marginTop: 10 }}>
        {room.title_text}
      </h1>
      <div className={`t-body ${s.meta}`}>
        <TimeAndPlace room={room} />
      </div>
      <div className={s.countRow}>
        <AvatarCluster count={room.joined_count} />
        {spotsLeft != null && spotsLeft > 0 ? (
          <Badge fill="var(--yellow)">{spotsLeft} spots left</Badge>
        ) : null}
      </div>
      <div
        className="t-caption"
        style={{ color: "var(--subtext)", marginTop: 8 }}
      >
        {room.joined_count}
        {room.capacity ? ` / ${room.capacity}` : ""} going
        {room.host_display_name
          ? ` · started by ${room.host_display_name}`
          : ""}
      </div>

      <div className={s.divider} />

      <Input
        label="Your nickname"
        placeholder="e.g. mimi"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      {error ? <div className={`t-caption ${s.error}`}>{error}</div> : null}
      <div style={{ marginTop: 14 }}>
        <Button full onClick={join} loading={busy} disabled={!nickname.trim()}>
          Join this hangout
        </Button>
      </div>
    </div>
  );

  return (
    <Shell>
      <div className={s.visitorGrid}>
        {card}
        <Explain />
      </div>
    </Shell>
  );
}

function TimeAndPlace({ room }: { room: RoomPublic }) {
  // Format in the viewer's timezone. suppressHydrationWarning: the server (UTC)
  // and client may format differently; the client value wins after hydration.
  const when = room.start_time
    ? new Date(room.start_time).toLocaleString(undefined, {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;
  const parts = [when, room.place_name].filter(Boolean);
  return (
    <span suppressHydrationWarning>
      {parts.join(" · ") || "anytime · nearby"}
    </span>
  );
}

/* ---------------- member room ---------------- */

function MemberRoom({
  room,
  membership,
  justCreated,
  onLeave,
}: {
  room: RoomPublic;
  membership: Membership;
  justCreated?: boolean;
  onLeave: () => void;
}) {
  const [shareOpen, setShareOpen] = useState(!!justCreated);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [text, setText] = useState("");
  const [uid, setUid] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [copied, setCopied] = useState(false);
  const readonly = membership.state === "left";
  const isHost = creatorId != null && creatorId === uid;
  const chatEnd = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const db = createSupabaseBrowser();
    const id = await currentUserId();
    setUid(id);
    const [m, e, cid] = await Promise.all([
      fetchMembers(db, room.id),
      getRoomEventsPage(db, room.id, 50, membership.left_at),
      getActivityCreatorId(db, room.id),
    ]);
    setMembers(m);
    setEvents(e);
    setCreatorId(cid);
  }, [room.id, membership.left_at]);

  useEffect(() => {
    let active = true;
    // initial fetch inline (async → not a synchronous setState in the effect)
    (async () => {
      const db = createSupabaseBrowser();
      const id = await currentUserId();
      if (!active) return;
      setUid(id);
      const [m, e, cid] = await Promise.all([
        fetchMembers(db, room.id),
        getRoomEventsPage(db, room.id, 50, membership.left_at),
        getActivityCreatorId(db, room.id),
      ]);
      if (!active) return;
      setMembers(m);
      setEvents(e);
      setCreatorId(cid);
    })();

    if (readonly) {
      return () => {
        active = false;
      };
    }

    const db = createSupabaseBrowser();
    const channel = db
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_events",
          filter: `activity_id=eq.${room.id}`,
        },
        () => load()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity_members",
          filter: `activity_id=eq.${room.id}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      active = false;
      db.removeChannel(channel);
    };
  }, [room.id, readonly, membership.left_at, load]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: "end" });
  }, [events.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || !uid) return;
    setText("");
    try {
      await insertRoomEvent(createSupabaseBrowser(), room.id, uid, body);
    } catch {
      setText(body);
    }
  };

  const vibe = roomVibe(room);

  return (
    <>
      <TopBar
        right={
          <Chip onClick={readonly ? undefined : () => setConfirmLeave(true)}>
            {readonly ? "Left" : "Leave"}
          </Chip>
        }
      />
      <div className={s.page}>
        <div className={s.head}>
          {vibe !== "open" ? (
            <Chip
              accent={VIBE_TINT[vibe] ?? undefined}
              selected
              leading={<VibeIcon vibe={vibe} />}
            >
              {VIBE_LABEL_EN[vibe]}
            </Chip>
          ) : null}
          <h1 className="t-h2" style={{ marginTop: 8 }}>
            {room.title_text}
          </h1>
          <div
            className="t-caption"
            style={{ color: "var(--subtext)", marginTop: 2 }}
          >
            <TimeAndPlace room={room} /> · {members.length}
            {room.capacity ? `/${room.capacity}` : ""} going
          </div>
          <div className={s.shareBar}>
            <button
              className={s.shareLink}
              onClick={async () => {
                const url = `${location.origin}/r/${slugFromPath()}`;
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                } catch {}
              }}
            >
              <span>
                {typeof location !== "undefined" ? location.host : ""}/r/…
              </span>
              <span className="t-label" style={{ color: "var(--brand)" }}>
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
            <Button
              tone="secondary"
              leading={<IconArrowUpRight size={16} />}
              onClick={() =>
                navigator.share?.({
                  url: `${location.origin}/r/${slugFromPath()}`,
                  title: room.title_text,
                })
              }
            >
              Share
            </Button>
          </div>
        </div>

        <div className={s.rsvp}>
          {members.map((m, i) => (
            <div key={m.user_id} className={s.rsvpMember}>
              <Avatar size={40} seed={i} />
              <span
                className="t-caption"
                style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
              >
                {m.user_id === creatorId ? <IconCrown size={12} /> : null}
                {m.display_name ?? "guest"}
              </span>
            </div>
          ))}
        </div>

        <div className={s.chat}>
          {events.map((e) =>
            e.type !== "message" ? (
              <div key={e.id} className={s.system}>
                {e.content}
              </div>
            ) : (
              <div
                key={e.id}
                className={`${s.bubbleRow} ${e.user_id === uid ? s.me : ""}`}
              >
                <div
                  className={`${s.bubble} ${e.user_id === uid ? s.mine : s.them}`}
                >
                  {e.user_id !== uid ? (
                    <div className={s.who}>{e.display_name ?? "guest"}</div>
                  ) : null}
                  {e.content}
                </div>
              </div>
            )
          )}
          <div ref={chatEnd} />
        </div>

        {readonly ? (
          <div className={s.readonly}>You left this hangout · read-only</div>
        ) : (
          <>
            <div className={s.composer}>
              <input
                className={s.composerInput}
                placeholder="Message the group…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />
              <Button onClick={send} disabled={!text.trim()}>
                Send
              </Button>
            </div>
            <div style={{ marginTop: 12 }}>
              {isHost ? (
                <Button
                  tone="danger"
                  full
                  onClick={() => setConfirmClose(true)}
                >
                  Close this hangout
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>

      <Dialog
        open={confirmLeave}
        title="Leave this hangout?"
        confirmLabel="Leave"
        danger
        onConfirm={async () => {
          setConfirmLeave(false);
          if (uid) await leaveRoom(createSupabaseBrowser(), room.id, uid);
          onLeave();
        }}
        onClose={() => setConfirmLeave(false)}
      >
        You can re-join while it&apos;s open.
      </Dialog>
      <Dialog
        open={confirmClose}
        title="Close this hangout?"
        confirmLabel="Close"
        danger
        onConfirm={async () => {
          setConfirmClose(false);
          await closeRoom(createSupabaseBrowser(), room.id);
        }}
        onClose={() => setConfirmClose(false)}
      >
        No one will be able to join or chat after this.
      </Dialog>
      <ShareSheet
        open={shareOpen}
        url={
          typeof location !== "undefined"
            ? `${location.origin}/r/${slugFromPath()}`
            : ""
        }
        note="This link is your room — keep it. Drop it in your group chat."
        onClose={() => setShareOpen(false)}
      />
      <Toast open={copied} onClose={() => setCopied(false)}>
        Link copied
      </Toast>
    </>
  );
}

function slugFromPath(): string {
  if (typeof location === "undefined") return "";
  const m = location.pathname.match(/\/r\/([^/]+)/);
  return m ? m[1] : "";
}
