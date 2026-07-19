import Link from "next/link";
import { Chip } from "./Chip";
import { Badge } from "./Badge";
import { Banner } from "./Banner";
import { AvatarCluster } from "./Avatar";
import { IconCrown } from "./icons";
import { VIBE_TINT, VIBE_LABEL_EN, type VibeKey } from "@/lib/vibes";
import { bannerCategory } from "@/lib/categories";
import s from "./RoomCard.module.css";

// RoomCard — compact list card. Every event carries a category banner; the
// vibe pill (label only, no icon) sits bottom-right ON the banner; host crown
// top-right on the banner. Whole card is the link; presses into its shadow.
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
  const slug = href.split("/").pop() ?? title;
  return (
    <Link
      href={href}
      className={`${s.card} ${closed ? s.closed : ""}`}
      aria-label={title}
    >
      {/* banner sits at the BOTTOM (decided 2026-07-19): title-first scanning */}
      <div className={s.body}>
        <div className={s.titleRow}>
          <div className="t-h2">{title}</div>
          {host ? (
            <span className={s.crown} aria-label="You host this">
              <IconCrown size={16} />
            </span>
          ) : null}
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
      </div>
      <Banner
        category={bannerCategory(title, slug)}
        height={64}
        edge="bottom"
        radius="0 0 18px 18px"
        corner={
          vibe && vibe !== "open" ? (
            <Chip accent={VIBE_TINT[vibe] ?? undefined} selected>
              {VIBE_LABEL_EN[vibe]}
            </Chip>
          ) : undefined
        }
      />
    </Link>
  );
}
