import Link from "next/link";
import { Chip } from "./Chip";
import { Badge } from "./Badge";
import { AvatarCluster } from "./Avatar";
import { VibeIcon, IconCrown } from "./icons";
import { VIBE_TINT, VIBE_LABEL_EN, type VibeKey } from "@/lib/vibes";
import s from "./RoomCard.module.css";

// RoomCard — compact list card for /rooms (BActivityRow). Whole card is the
// link; presses into its shadow. Closed/expired rooms render dimmed.
export function RoomCard({
  href,
  title,
  vibe,
  timeText,
  placeText,
  going,
  capacity,
  host,
  closed,
}: {
  href: string;
  title: string;
  vibe?: VibeKey;
  timeText?: string;
  placeText?: string;
  going?: number;
  capacity?: number;
  host?: boolean;
  closed?: boolean;
}) {
  const spotsLeft =
    capacity != null && going != null
      ? Math.max(0, capacity - going)
      : undefined;
  const meta = [timeText, placeText].filter(Boolean).join(" · ");
  return (
    <Link
      href={href}
      className={`${s.card} ${closed ? s.closed : ""}`}
      aria-label={title}
    >
      <div className={s.top}>
        {vibe && vibe !== "open" ? (
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
        {host ? (
          <span className={s.crown} aria-label="You host this">
            <IconCrown size={18} />
          </span>
        ) : null}
      </div>

      <div className="t-h2" style={{ marginTop: 4 }}>
        {title}
      </div>
      {meta ? (
        <div className="t-body" style={{ color: "var(--subtext)" }}>
          {meta}
        </div>
      ) : null}

      <div className={s.bottom}>
        {going != null ? <AvatarCluster count={going} /> : <span />}
        <div className={s.spots}>
          {going != null ? (
            <span className="t-body-strong">
              {going}
              {capacity ? ` / ${capacity}` : ""} going
            </span>
          ) : null}
          {closed ? (
            <Badge fill="var(--surface-alt)" color="var(--subtext)">
              Closed
            </Badge>
          ) : spotsLeft === 0 ? (
            <Badge fill="var(--coral)">Full</Badge>
          ) : spotsLeft !== undefined && spotsLeft <= 2 ? (
            <Badge fill="var(--yellow)">{spotsLeft} left</Badge>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
