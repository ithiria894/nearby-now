import type { SVGProps } from "react";
import type { VibeKey } from "@/lib/vibes";
import type { CategoryKey } from "@/lib/categories";

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

/* --- category icons (banner system; mirrors lib/ui/activityIcon.ts) --- */

export const IconMusic = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 18V5l10-2v13" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </Svg>
);

export const IconFood = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 3v6a2 2 0 0 0 4 0V3M6 3v18" />
    <path d="M19 3c-2 0-3.5 2.2-3.5 5.5S17 13 19 13v8M19 3v18" />
  </Svg>
);

export const IconDice = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="9" cy="15" r="1.2" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconTree = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l4.5 6h-2.5l4 5.5H6L10 9H7.5z" />
    <path d="M12 14.5V21" />
  </Svg>
);

export const IconCoffee = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" />
    <path d="M16 9h2a2.5 2.5 0 0 1 0 5h-2" />
  </Svg>
);

export const IconBall = (p: IconProps) => (
  // soccer ball: center pentagon + spokes (NOT meridians — that reads as a globe)
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8.8l3 2.2-1.1 3.6h-3.8L9 11z" />
    <path d="M12 8.8V3.2M15 11l5.3-1.5M13.9 14.6l3.5 4.7M10.1 14.6l-3.5 4.7M9 11L3.7 9.5" />
  </Svg>
);

export const IconShuffle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16 4h4v4M4 20L20 4M14 16l3 3M20 16v4h-4M4 4l5 5" />
  </Svg>
);

export const IconImage = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M4 18l5-5 3 3 4-4 4 4" />
  </Svg>
);

export const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

export const IconFlag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 21V4M5 4h11l-1.5 3.5L16 11H5" />
  </Svg>
);

export const IconSun = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M19.4 4.6l-2.1 2.1M6.7 17.3l-2.1 2.1" />
  </Svg>
);

export const IconGlobe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18" />
  </Svg>
);

export const IconCopy = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Svg>
);

const CATEGORY_ICONS: Partial<
  Record<CategoryKey, (p: IconProps) => React.ReactElement>
> = {
  music: IconMusic,
  drinks: IconCoffee,
  games: IconDice,
  food: IconFood,
  sports: IconBall,
  fitness: IconBall,
  outdoors: IconTree,
  movies: IconImage,
  study: IconChat,
  shopping: IconImage,
  photo: IconImage,
};

export function CategoryIcon({
  category,
  size = 16,
}: {
  category: CategoryKey | string;
  size?: number;
}) {
  const I = CATEGORY_ICONS[category as CategoryKey] ?? IconCompass;
  return <I size={size} />;
}

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
