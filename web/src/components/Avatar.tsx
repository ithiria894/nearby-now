// Avatar — the enoki mascot 🍄 as a simple inline SVG placeholder. Real mascot
// art comes later (WEB_PLAN parking lot); keep everything behind this one
// component so it's swappable. Cap color varies by `seed` so a cluster of
// members reads as distinct little mushrooms.

const CAPS = [
  "var(--coral)",
  "var(--yellow)",
  "var(--mint)",
  "var(--sky)",
  "var(--pink)",
  "var(--grape)",
];

export function Avatar({
  size = 32,
  seed = 0,
  cap,
}: {
  size?: number;
  seed?: number;
  cap?: string;
}) {
  const capColor =
    cap ?? CAPS[((seed % CAPS.length) + CAPS.length) % CAPS.length];
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden
      style={{ display: "block", flex: "none" }}
    >
      <rect
        x="12"
        y="15"
        width="8"
        height="11"
        rx="3.5"
        fill="var(--surface)"
        stroke="var(--ink)"
        strokeWidth="1.5"
      />
      <path
        d="M4 16 C4 8 11 4 16 4 C21 4 28 8 28 16 Z"
        fill={capColor}
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="1.6" fill="var(--surface)" />
      <circle cx="19" cy="9.5" r="1.2" fill="var(--surface)" />
    </svg>
  );
}

// A small overlapping cluster of mushroom avatars + optional "+N".
export function AvatarCluster({
  count,
  max = 4,
  size = 28,
}: {
  count: number;
  max?: number;
  size?: number;
}) {
  const shown = Math.min(count, max);
  const extra = count - shown;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {Array.from({ length: shown }).map((_, i) => (
        <span key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar size={size} seed={i} />
        </span>
      ))}
      {extra > 0 ? (
        <span
          className="t-label"
          style={{ marginLeft: 6, color: "var(--subtext)" }}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
