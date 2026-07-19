import type { SVGProps } from "react";
import type { VibeKey } from "@/lib/vibes";

// Inline-SVG icon set (zero dependency, token-colored via currentColor). The
// mobile app uses icon fonts and explicitly avoids emoji (lib/ui/vibe.ts); web
// mirrors that with these. Line style, 2px, round — reads well small.

type IconProps = { size?: number } & SVGProps<SVGSVGElement>;

function Svg({
  size = 20,
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      style={{ display: "block", flex: "none" }}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconMoon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Svg>
);

export const IconFlame = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 22a6 6 0 0 0 6-6c0-4-4-6-4-10 0 3-2 3-3 5-1-1-1-2-1-3-2 2-4 4-4 8a6 6 0 0 0 6 6z" />
  </Svg>
);

export const IconChat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 4H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h3v3l4-3h9a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z" />
    <path d="M8 10h.01M12 10h.01M16 10h.01" />
  </Svg>
);

export const IconSmiley = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 14a4 4 0 0 0 7 0" />
    <path d="M9 9.5h.01M15 9.5h.01" />
  </Svg>
);

export const IconCompass = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M16.2 7.8l-2.1 6.4-6.3 2.1 2.1-6.4z" />
  </Svg>
);

export const IconCrown = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 17h18M5 17l-1.5-9 5 4 3.5-6 3.5 6 5-4L19 17z" />
  </Svg>
);

export const IconArrowUpRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 17L17 7M8 7h9v9" />
  </Svg>
);

export const IconCopy = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Svg>
);

const VIBE_ICONS: Record<VibeKey, (p: IconProps) => React.ReactElement> = {
  chill: IconMoon,
  hype: IconFlame,
  deep: IconChat,
  playful: IconSmiley,
  open: IconCompass,
};

export function VibeIcon({
  vibe,
  size = 16,
}: {
  vibe: VibeKey;
  size?: number;
}) {
  const I = VIBE_ICONS[vibe];
  return <I size={size} />;
}
