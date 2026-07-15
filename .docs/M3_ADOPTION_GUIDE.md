# M3 → nearby-now — Adoption Guide (the "How")

Companion to [`M3_EXPRESSIVE_RESEARCH.md`](./M3_EXPRESSIVE_RESEARCH.md). That report says _what_ to adopt and _why_; this file is the concrete _how_ — exact token edits (`src/ui/theme/uikit.ts`), component patterns (`src/ui/components/brutal.tsx`), and where each rule applies. Every rule is re-skinned to soft-brutalism, not Material.

Each rule: **RULE** (the one-liner to live by) → **TOKENS** → **COMPONENT/CODE** → **APPLIES TO**.

---

## A. Accessibility rules (hard floors — grounded in a real contrast audit)

Contrast audit of the current palette (WCAG 2.x, computed 2026-07-14):

| Pair                                    | Ratio               | Verdict                                        |
| --------------------------------------- | ------------------- | ---------------------------------------------- |
| text on bg / surface (light & dark)     | 12.9–16.0 : 1       | ✅                                             |
| subtext on surface (light / dark)       | 5.68 / 6.60 : 1     | ✅ body-text OK                                |
| **faint on surface (light / dark)**     | **3.01 / 3.41 : 1** | ❌ **fails body text** (OK for large/non-text) |
| onBright on every accent (yellow…grape) | 6.1–11.5 : 1        | ✅ (validates the single on-color)             |
| onBrand on brand (light / dark)         | 5.58 / 5.98 : 1     | ✅                                             |
| border on bg (non-text)                 | 14.9 / 4.36 : 1     | ✅ ≥3:1                                        |

### A1 — Contrast

- **RULE:** Body-size text must hit **4.5:1**; large (≥24px, or ≥18.7px bold) & non-text ≥ **3:1**. **`faint` is banned for body text** — use it only for hairlines, disabled glyphs, or large text.
- **CODE:** wherever a row/meta uses `c.faint` for readable text, switch to `c.subtext`. (`faint` stays for `hairline`-like decoration.)
- **APPLIES TO:** audit `BText color={c.faint}` usages; feed/list metadata should be `subtext`.

### A2 — Touch targets

- **RULE:** Every interactive element has a **≥48×48dp** hit area, **≥8dp** apart.
- **TOKENS:** add `controls.minTarget = 48`.
- **COMPONENT:** in `BIconButton`, ensure the pressable is `{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }` even when the icon is 20–24px. Keep `hitSlop` as a bonus, not the primary mechanism.
- **APPLIES TO:** `BIconButton` (back, search, 3-dots), tab items, chips, close buttons.

### A3 — Reduced motion

- **RULE:** When the OS "Reduce Motion" is on, **no bounce/large transforms** — fall back to fades/instant.
- **CODE:** Reanimated ships `useReducedMotion()`. Add one motion helper and use it for every entrance:
  ```ts
  // src/ui/theme/motion.ts
  import {
    useReducedMotion,
    FadeIn,
    SlideInDown,
  } from "react-native-reanimated";
  export function useEntrance() {
    const reduced = useReducedMotion();
    return reduced
      ? FadeIn.duration(motion.duration.fast)
      : SlideInDown.springify()
          .damping(spring.spatial.damping)
          .stiffness(spring.spatial.stiffness);
  }
  ```
- **APPLIES TO:** list-item entrances, composer spawn, nav transitions, the `/uidocs` animation demos.

### A4 — Screen-reader labels

- **RULE:** Every icon-only control has an `accessibilityLabel` describing the **action** ("Search", not "magnifying glass"); decorative icons are hidden.
- **COMPONENT:** add a required `label` prop to `BIconButton` → `accessibilityRole="button"`, `accessibilityLabel={label}`. For icons that sit next to text (row category icons), set `importantForAccessibility="no"` so they aren't double-announced.
- **APPLIES TO:** all `BIconButton`, `BComposer`'s star icon, tab icons (label = destination).

---

## B. Motion rules — split springs + real transitions

### B1 — Two named springs (spatial bounces, effects don't)

- **RULE:** Position/size/shape use the **spatial** spring (may overshoot). Opacity/color use the **effects** spring (never bounces).
- **TOKENS:** replace the single `spring` in `uikit.ts`:
  ```ts
  export const spring = {
    // position / size / shape — bouncy (damping ratio ≈ 0.75)
    spatial: { damping: 26, stiffness: 300, mass: 1 },
    // opacity / color — critically damped, no overshoot (ratio = 1.0)
    effects: { damping: 60, stiffness: 900, mass: 1 },
  } as const;
  ```
  (Your current `{damping:13, stiffness:150, mass:0.9}` ≈ ratio 0.56 — even bouncier; the new spatial value is a touch calmer and reusable. Tune to taste.)
- **APPLIES TO:** `withSpring(x, spring.spatial)` for transforms; `withSpring(opacity, spring.effects)` or `withTiming` for fades.

### B2 — Fade-through tab transition (also fixes the "skeleton re-render" bug)

- **RULE:** Switching between unrelated destinations (tabs) **cross-fades content in place** — never mount a skeleton that then re-renders.
- **CODE:** wrap each tab screen body in an `Animated.View` keyed by focus, entering with the effects spring/fade:
  ```tsx
  <Animated.View
    key={routeKey}
    entering={FadeIn.duration(motion.duration.base)}
    style={{ flex: 1 }}
  >
    {content}
  </Animated.View>
  ```
  Gate skeletons on _first data load only_ (not on every focus), so returning to a tab shows the cached list, not a skeleton flash.
- **APPLIES TO:** the tab navigator screens (Feed / Lobby / Created / Notifications).

### B3 — Container transform for the core drill-in

- **RULE:** A list row that opens a detail should feel like the row **grows into** the screen (continuity).
- **CODE:** use `react-native-reanimated`'s shared element / a layout transition on the activity row → room header (title + icon tile carry over). Lower priority than B1/B2.
- **APPLIES TO:** `BActivityRow` → `app/room/[id].tsx`.

---

## C. Color rules — pairing, containers, pressed layer

### C1 — On-color pairing (formalized)

- **RULE:** Never hand-pick text color on a fill. Text on any bright accent = `onBright`; on brand = `onBrand`. (Audit above proves `onBright` clears 4.5:1 on all six accents, so one on-color is enough — keep it.)
- **CODE:** add a helper so components stop guessing:
  ```ts
  export const onColor = (c: UIColors, fill: string) =>
    fill === c.brand ? c.onBrand : c.onBright;
  ```
- **APPLIES TO:** `BBadge`, `BButton` accent tone, category icon tiles.

### C2 — Soft container tints (the expressive-but-accessible upgrade)

- **RULE:** For low-emphasis backgrounds (banners, empty states, selected rows, highlighted cards) use a **pale tint** of the accent with `ink`/`onBright` text — not the full-strength fill.
- **TOKENS:** add soft variants (paper-mixed ~15–18% accent). Suggested light-theme hexes:
  ```ts
  // light — pale, paper-tinted containers (text = ink)
  yellowSoft: "#FBEFC7", coralSoft: "#FBDAD0", mintSoft: "#CDEFDF",
  skySoft: "#D6EEFB", pinkSoft: "#FBDDF0", grapeSoft: "#E7DBFB", brandSoft: "#DEDafB",
  ```
  (Dark theme: mix the accent ~22% over `surface` instead.)
- **APPLIES TO:** selected filter chip background, "you're in" banners, highlighted/pinned activity, empty-state cards.

### C3 — Pressed state layer for flat elements

- **RULE:** Shadowed controls sink via `pressShift` (keep it). **Flat** elements (rows, secondary buttons, chips, tab items) get a **pressed overlay** instead: ~10% `ink`.
- **TOKENS:**
  ```ts
  export const state = {
    hover: 0.08,
    focus: 0.1,
    pressed: 0.1,
    dragged: 0.16,
  } as const;
  ```
- **COMPONENT:** in flat `Pressable`s, `backgroundColor: pressed ? withAlpha(c.ink, state.pressed) : 'transparent'` (add a `withAlpha` util).
- **APPLIES TO:** `BActivityRow`, `BChip`, secondary `BButton`, tab items.

---

## D. Semantic token alias layer

- **RULE:** Components reference **meaning**, not hue. Add a `sys` map; migrate screens gradually.
- **TOKENS:**
  ```ts
  export const sys = (c: UIColors) => ({
    accentPrimary: c.brand,
    surfaceRaised: c.surfaceAlt,
    dangerFill: c.coral,
    playful: c.coral,
    calm: c.sky,
    go: c.mint,
    warmth: c.yellow,
    metaText: c.subtext, // never c.faint (A1)
  });
  ```
- **APPLIES TO:** new code reads `sys(c).metaText` etc.; re-skinning later touches only this map.

---

## E. Typography rules

- **RULE:** Every role = fixed size + line-height + tracking; tighten display, keep body loose.
- **TOKENS:** in `typeScale`, set `display.letterSpacing: -0.2` (was +0.2); add:
  ```ts
  displayLarge: { font: fonts.display, size: 40, lineHeight: 46, weight: "700", letterSpacing: -0.4 }, // big moments only
  labelSmall:   { font: fonts.bodyStrong, size: 10, lineHeight: 14, weight: "600", letterSpacing: 0.5, uppercase: true }, // micro-badges
  ```
- **APPLIES TO:** `displayLarge` for splash/empty hero; `labelSmall` for tiny count badges. **Fonts unchanged (Poppins/Inter/Caveat).**

---

## F. Layout rule — adaptive 2-column feed

- **RULE:** ≤839dp → single centered column (current). ≥840dp → **2-column feed**; widen the content cap so two columns fit.
- **CODE:**
  ```tsx
  const { width } = useWindowDimensions();
  const cols = width >= 840 ? 2 : 1;
  const maxW = cols === 2 ? 920 : layout.maxContentWidth; // 560
  <FlatList
    key={cols}
    numColumns={cols}
    columnWrapperStyle={cols > 1 ? { gap: space.md } : undefined}
    contentContainerStyle={{
      maxWidth: maxW,
      width: "100%",
      alignSelf: "center",
    }}
  />;
  ```
  (Changing `numColumns` needs the `key` prop to force a fresh list.)
- **APPLIES TO:** `app/(tabs)/browse.tsx` feed. Keep bottom tabs for now; nav-rail-on-wide is a later option.

---

## G. Content / writing rules

- **RULE set (adopt):**
  - Buttons are **action-first verbs** ("Create an account", "Save changes") — not "OK/Submit".
  - Errors/empty states say **what happened + how to fix**, supportively.
  - **Alt text = purpose, not appearance**; decorative icons hidden (see A4); ≤ ~150 chars; no "image of".
  - Leave **room for text expansion** (zh/ja already shipped); prefer relative time ("closes in 3h" — already done in the feed).
- **RULE (decide & document):** M3 uses sentence case everywhere. Keep **UPPERCASE for micro-labels/badges** (brand signal), but consider **sentence case for long button labels & screen titles**. Pick one convention per element type and note it in `/uidocs`.

---

## Suggested order (first sprint = all Low/Med effort)

1. **A (all four)** — a11y floors; `faint`→`subtext`, 48dp targets, reduced-motion helper, icon labels.
2. **B1 + B2** — split springs + fade-through tabs (kills the skeleton-rerender bug).
3. **C1 + C3** — on-color helper + pressed layer.
4. **C2** — soft container tints (unlocks nicer banners/selected states).
5. **F** — 2-column feed on wide.
6. **D / E / G** — as you touch the relevant code.

Every change lands in `uikit.ts` (tokens) + `brutal.tsx` (components) first, is shown in `/uidocs`, then flows to screens automatically. No screen rewrites required.
