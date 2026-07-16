// =============================================================================
// NearbyNow — Rebrand Design Tokens ("UIKit")  ·  SOFT NEO-BRUTALISM
// Single source of truth for the redesign. Rendered live in /uidocs.
// Standalone from the current theme (tokens.ts) so it can be tuned in isolation.
//
// Direction: SOFT NEOBRUTALISM — bold flat color on warm *paper* (subtle grain),
// medium ink borders, SMALL hard offset shadows, ROUNDED corners, confident
// (not heavy) type. Friendly + encouraging. Content is capped to a max width
// and centered so cards never over-stretch on wide / tablet / web screens.
// =============================================================================

export type UIScheme = "light" | "dark";

export type UIColors = {
  bg: string; // paper background
  surface: string; // card paper
  surfaceAlt: string;
  overlay: string;
  ink: string; // strongest text / icons (the "black" of the system)
  border: string; // structural borders — muted in dark so they don't glare
  text: string;
  subtext: string;
  faint: string;
  hairline: string; // faint divider (not a structural border)
  brand: string;
  onBrand: string;
  // bold flat "sticker" accents
  yellow: string;
  coral: string;
  mint: string;
  sky: string;
  pink: string;
  grape: string;
  onBright: string; // text/icon on any bright accent fill
  success: string;
  warn: string;
  danger: string;
  info: string;
  shadow: string; // HARD shadow color
};

export const lightColors: UIColors = {
  bg: "#F3EBD8",
  surface: "#FFFCF3",
  surfaceAlt: "#EBE1C9",
  overlay: "rgba(28,24,15,0.45)",
  ink: "#1C180F",
  border: "#1C180F", // light: black borders
  text: "#241F14",
  subtext: "#6E6450",
  faint: "#9C927A",
  hairline: "#DBD0B4",
  brand: "#5B4DF0",
  onBrand: "#FFFFFF",
  yellow: "#FFC93C",
  coral: "#FF6B4A",
  mint: "#2FCE8E",
  sky: "#54C1FF",
  pink: "#FF7AC6",
  grape: "#B57BFF",
  onBright: "#1C180F",
  success: "#12A66C",
  warn: "#F5A300",
  danger: "#FF5247",
  info: "#3B82F6",
  shadow: "#1C180F",
};

export const darkColors: UIColors = {
  bg: "#1B1710",
  surface: "#26211A",
  surfaceAlt: "#312B21",
  overlay: "rgba(0,0,0,0.6)",
  ink: "#F3EBD8", // dark: cream text/icons
  border: "#8A7C5E", // dark: muted warm border (not glaring cream)
  text: "#EFE7D4",
  subtext: "#B0A68C",
  faint: "#7C7360",
  hairline: "#3A3428",
  brand: "#8E80FF",
  onBrand: "#141019",
  yellow: "#FFD65C",
  coral: "#FF8A6E",
  mint: "#4FDCA0",
  sky: "#79CFFF",
  pink: "#FF9AD3",
  grape: "#C79BFF",
  onBright: "#141019",
  success: "#2FCF8E",
  warn: "#FFC44D",
  danger: "#FF6A61",
  info: "#6FA8FF",
  shadow: "#000000",
};

export const uiColors: Record<UIScheme, UIColors> = {
  light: lightColors,
  dark: darkColors,
};

// --- Typography (bold, confident) -------------------------------------------
// Fonts loaded in app/_layout.tsx. Display/headings = Poppins; body = Inter;
// accent/personality = Caveat (sparingly). Labels are UPPERCASE + tracked.
export const fonts = {
  display: "PoppinsBold",
  heading: "PoppinsSemi",
  body: "Inter",
  bodyStrong: "InterSemi",
  accent: "CaveatBold",
} as const;

export type TypeStyle = {
  font: string;
  size: number;
  lineHeight: number;
  weight: "400" | "600" | "700" | "800";
  letterSpacing?: number;
  uppercase?: boolean;
};

export const typeScale: Record<string, TypeStyle> = {
  display: {
    font: fonts.display,
    size: 30,
    lineHeight: 36,
    weight: "700",
    letterSpacing: 0.2,
  },
  h1: { font: fonts.display, size: 24, lineHeight: 30, weight: "700" },
  h2: { font: fonts.heading, size: 19, lineHeight: 25, weight: "700" },
  title: { font: fonts.heading, size: 16, lineHeight: 22, weight: "600" },
  body: { font: fonts.body, size: 15, lineHeight: 22, weight: "400" },
  bodyStrong: {
    font: fonts.bodyStrong,
    size: 15,
    lineHeight: 22,
    weight: "600",
  },
  label: {
    font: fonts.bodyStrong,
    size: 12,
    lineHeight: 16,
    weight: "600",
    letterSpacing: 0.5,
    uppercase: true,
  },
  caption: { font: fonts.body, size: 12, lineHeight: 16, weight: "400" },
};

// --- Space / radius / borders / hard shadow ---------------------------------
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
// Soft-brutalism: ROUNDED corners (friendlier than hard square).
export const radius = { sm: 12, md: 16, lg: 20, xl: 26, pill: 999 } as const;
// Thinner borders than classic neobrutalism — a little less bold.
export const borders = { hair: 1, base: 1.5, thick: 2 } as const;

// Small hard (no-blur) offset shadow — the brutalist signature, softened.
export const hardShadow = {
  sm: { x: 2, y: 2 },
  md: { x: 3, y: 3 },
  lg: { x: 5, y: 5 },
} as const;

// --- Layout: cap content width, center on wide screens ----------------------
export const layout = {
  maxContentWidth: 560, // cards/content never exceed this; centered beyond it
  screenPadding: space.lg,
} as const;

// --- Motion (liveliness) ----------------------------------------------------
// The app should feel alive: new activities/rooms POP in with a springy
// entrance; controls press INTO their shadow. Reanimated consumes these.
export const motion = {
  duration: { fast: 150, base: 260, slow: 420 },
  // Legacy single spring — still used for list/entrance pops. Bouncy, "lively"
  // (damping ratio ≈ 0.56).
  spring: { damping: 13, stiffness: 150, mass: 0.9 },
  // M3-split springs (see .docs/M3_ADOPTION_GUIDE.md §B1): spatial = position /
  // size / shape (crisp, may slightly overshoot); effects = opacity / color
  // (critically damped, never bounces).
  springSpatial: { damping: 26, stiffness: 300, mass: 1 },
  springEffects: { damping: 60, stiffness: 900, mass: 1 },
  // M3 easing (cubic-bezier control points). Emphasized-decelerate for
  // entrances / expansions, emphasized-accelerate for exits, standard for
  // symmetric resize / move. Crisp, no overshoot.
  easing: {
    emphasizedDecelerate: [0.05, 0.7, 0.1, 1],
    emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
    standard: [0.2, 0, 0, 1],
  },
  // stagger between list items on first appear
  stagger: 45,
  // how far a control shifts when pressed (matches its hard-shadow offset)
  pressShift: hardShadow.md,
} as const;

// --- Canonical control specs ------------------------------------------------
export const controls = {
  buttonHeight: 50,
  buttonRadius: radius.md,
  buttonPaddingX: space.lg,
  inputHeight: 50,
  inputRadius: radius.md,
  inputPaddingX: space.md,
  pillPaddingY: 7,
  pillPaddingX: space.md,
  pillRadius: radius.pill,
  cardRadius: radius.lg,
  cardPadding: space.lg,
  borderWidth: borders.thick,
  hitSlop: 8,
  tabBarHeight: 64,
} as const;
