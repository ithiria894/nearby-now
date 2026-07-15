# Material 3 (Expressive) → nearby-now — Research & Applicability Report

**Date:** 2026-07-14
**Scope:** Google's Material 3 (M3) design system, focused on the **May 2025 "Material 3 Expressive"** update, mapped onto nearby-now's **soft-brutalist** design system (`src/ui/theme/uikit.ts` + `src/ui/components/brutal.tsx`, documented at `/uidocs`).
**Method:** 5 parallel web-research passes (motion, color/elevation, typography/shape/icons, tokens/layout, accessibility/content). Sources listed at the end. Note: `m3.material.io` is a client-rendered SPA; exact token numbers were corroborated from Google's canonical AndroidX Compose token sources + Google Fonts docs + reputable secondary write-ups.

---

## 0. TL;DR

**Thesis:** M3 is an excellent _implementation rulebook_. Treat it in two layers:

- **The GUIDE (adopt/adapt):** token architecture, color **role-pairing**, type-scale _discipline_, spacing grid, **state layers**, motion tokens, accessibility floors, content/writing rules. These are aesthetic-neutral and make any design system more robust.
- **The SKIN (reject — it would erase soft-brutalism):** Roboto/Roboto Flex fonts, dynamic color / Material You, tonal-elevation surface tint, blurred shadows, the ~35-shape blob library, and their component library. Adopting these dilutes the brand and couples us to Google's system.

**We're already closer than most:** nearby-now already has a token file, a spring + list stagger, a max-content-width philosophy, and text-labelled category badges (passes "don't rely on color alone"). The work is mostly _formalizing_ and _filling a few gaps_, not rebuilding.

### Scoreboard

| Dimension          | M3 approach                                 | nearby-now now                       | Verdict                                           |
| ------------------ | ------------------------------------------- | ------------------------------------ | ------------------------------------------------- |
| Token architecture | 3-tier `ref → sys → comp`                   | Flattened (hex named by hue)         | **Adapt** — add thin semantic layer               |
| Color roles        | Paired `role` + `on-role` + `container`     | `onBright`/`onBrand` only            | **Adopt** pairing · **Adapt** container tints     |
| State feedback     | Opacity state layers (8/10/10/16%)          | `pressShift` (move into shadow)      | **Adapt** — add pressed layer for flat elements   |
| Elevation          | dp levels + tonal tint + surface-containers | Hard offset shadow (no blur)         | **Reject** tint · **keep hard shadow (identity)** |
| Typography         | 15 roles + 15 emphasized, Roboto Flex       | 8 roles, Poppins/Inter/Caveat        | **Reject fonts** · **Adopt** scale discipline     |
| Shape              | 7-step radius + 35 shapes + morphing        | radius 12/16/20/26/pill              | **Adapt** (morph-on-press) · **Reject** blob lib  |
| Iconography        | Material Symbols (4 axes), 20/24/40/48dp    | MaterialCommunityIcons (static)      | **Adapt** sizing/state · **Reject** lib swap      |
| Motion             | Spring engine + transition patterns         | Spring + stagger already present     | **Adopt** — we're ~80% there                      |
| Layout / adaptive  | Window size classes, canonical layouts      | max-width 560, always bottom tabs    | **Adapt** — multi-col feed on wide                |
| Accessibility      | Contrast/touch/focus/motion floors          | Partial                              | **Adopt all (non-negotiable)**                    |
| Content / writing  | Sentence case, action-first, alt text       | UPPERCASE labels (brand), Title Case | **Adopt** most · **keep** UPPERCASE micro-labels  |

Reading key: **Adopt** = take as-is; **Adapt** = take the idea, re-skin to soft-brutalism; **Reject** = deliberately don't, to protect identity.

---

## 1. Design Token Architecture — **Adapt**

**M3:** three tiers, each pointing "up" one level of abstraction:

- `md.ref.*` — raw primitives (hex, sizes). Context-free. e.g. `md.ref.palette.primary40 = #6750A4`.
- `md.sys.*` — semantic roles (the "decisions"); where light/dark/contrast logic lives. e.g. `md.sys.color.primary → md.ref.palette.primary40`.
- `md.comp.*` — one property of one component. e.g. `md.comp.filled-button.container.color → md.sys.color.primary`.

Payoff: retheme by editing only the `sys` layer; components never hold literals; global vs. surgical control.

**nearby-now now:** `uikit.ts` collapses ref+sys into one object — some names are semantic (`bg`, `surface`, `ink`, `brand`), but the accents are _reference-style_ (named by hue: `coral`, `yellow`). Components read `c.coral` directly (a literal-ish reference), so re-mapping "the danger fill" means find-replacing `coral`.

**Action:** add a thin **semantic alias layer** over the palette without changing the visuals:

```
// meaning → hue (components should read these)
accentPrimary: brand, accentPlay: coral, accentCalm: sky, accentGo: mint,
surfaceRaised: surfaceAlt, dangerFill: coral, ...
```

Low effort, big future flexibility (re-skin categories, dark-mode tweaks, A/B a palette) without touching screens.

---

## 2. Color System & Role Pairing — **Adopt pairing / Adapt containers / Reject dynamic**

**M3:**

- Every fill role has a paired `on-` role guaranteed to contrast (e.g. `primary`/`on-primary`, `secondary-container`/`on-secondary-container`). Using role tokens = accessible pairings "for free."
- Accent groups: primary / secondary / tertiary, plus error; each with `-container` (softer standing fill) + `on-container`.
- **State layers:** interaction = a fixed-opacity overlay of the _content_ color on the container:

  | State      | Opacity                     |
  | ---------- | --------------------------- |
  | Hover      | 8%                          |
  | Focus      | 10%                         |
  | Pressed    | 10%                         |
  | Dragged    | 16%                         |
  | (Disabled) | content 38% / container 12% |

- Built on **tonal palettes** (0–100 tone in HCT space); roles = palette + tone (accents 40 light / 80 dark; containers 90/30; `on-` 100/20; `on-container` 10/90). **Dynamic color / Material You** regenerates the palette from the user's wallpaper.
- **Expressive color change:** higher chroma / more vibrant variation within the same role system (no new roles).

**nearby-now now:** single-tone accents (`coral`, `yellow`, …) + two on-colors (`onBright` for accents, `onBrand` for the indigo). No `-container` softer variants. Feedback is physical (`pressShift`), not opacity overlays.

**Verdict & actions:**

- **Adopt the pairing discipline.** Give each accent an explicit `on-` color (most map to `onBright = ink`, but verify contrast — see §10). Document the pairs so no one puts low-contrast text on a fill.
- **Adapt — add soft "container" tints** for banners/empty-states/selected rows (e.g. a pale coral behind a highlighted card) with a matching `on-` (usually `ink`). This is the single biggest expressive-yet-accessible upgrade.
- **Adapt — add a pressed state layer** for _flat_ elements that don't have a shadow to sink into (secondary buttons, list rows, chips): an ~8–10% `ink` overlay on press. Keep `pressShift` for shadowed controls — that's the brutalist signature.
- **Reject** tonal-palette generation, HCT, and dynamic color: they'd override the fixed brand palette that _is_ soft-brutalism. Keep hand-tuned swatches.

---

## 3. Elevation & Surfaces — **Reject tonal tint (keep hard shadow)**

**M3:** 6 elevation levels → **0 / 1 / 3 / 6 / 8 / 12 dp**. The M2→M3 shift: depth is conveyed by **BOTH** a `primary`-derived **tonal surface tint** (opacity grows with elevation) **and** shadow; current M3 prefers discrete **surface-container tones** (`surface-container-low/…/highest`) over the tint overlay for nesting.

**nearby-now now:** depth = **hard, no-blur offset shadow** (`hardShadow.sm/md/lg = 2/3/5 px`) — the defining brutalist cue. Two surface tones (`surface`, `surfaceAlt`).

**Verdict:**

- **Reject** tonal-elevation surface tint and blurred Material shadows outright — they're the opposite of the aesthetic.
- **Adopt the _idea_ of a small, discrete elevation scale** (you already have `sm/md/lg`) and of **nesting surfaces** — `surfaceAlt` already plays the "raised container" role; if you ever need a third nesting level, add one `surfaceContainerHigh`-style tone rather than more shadow.

---

## 4. Typography — **Reject fonts (explicit) / Adopt scale discipline**

> **User directive:** we do **not** want Google's typefaces. Keep Poppins (display/heading) + Inter (body) + Caveat (accent). This section takes M3's _structure_, not Roboto.

**M3 type scale (15 roles):**

| Role               | Size/Line (sp)        | Weight          | Tracking         |
| ------------------ | --------------------- | --------------- | ---------------- |
| Display L / M / S  | 57/64 · 45/52 · 36/44 | 400             | −0.2 / 0 / 0     |
| Headline L / M / S | 32/40 · 28/36 · 24/32 | 400             | 0                |
| Title L / M / S    | 22/28 · 16/24 · 14/20 | 400 / 500 / 500 | 0 / 0.2 / 0.1    |
| Body L / M / S     | 16/24 · 14/20 · 12/16 | 400             | 0.5 / 0.25 / 0.4 |
| Label L / M / S    | 14/20 · 12/16 · 11/16 | 500             | 0.1 / 0.5 / 0.5  |

Principles worth stealing: **display uses negative tracking** (tighten big text); **body uses loose tracking** (aid reading); **title/label use a heavier weight** than body to hold presence at small sizes. Expressive adds a parallel **"emphasized"** set (heavier weights for key moments) via variable fonts.

**nearby-now now (8 roles):** display 30/700, h1 24/700, h2 19/700, title 16/600, body 15/400, bodyStrong 15/600, label 12/600 (UPPERCASE, +0.5), caption 12/400.

**Mapping & gaps:**

| M3 role      | nearby-now                    | Gap / note                                                  |
| ------------ | ----------------------------- | ----------------------------------------------------------- |
| Display L    | _(none — display is only 30)_ | Optional: a true "big moment" size (~40–48) for splash/hero |
| Headline L/M | display / h1                  | ok                                                          |
| Title L/M/S  | h2 / title / —                | consider a smaller title (`title-small`) for dense rows     |
| Body L/M     | body / caption                | ok                                                          |
| Label L/M/S  | label / —                     | consider `label-small` (10–11) for micro-badges             |

**Actions:**

- **Adopt scale discipline:** every role = fixed size + line-height + tracking (you already do this — keep it tight). Consider **negative tracking on `display`** (currently +0.2 → try −0.2 for a crisper wordmark-adjacent look).
- **Adapt "emphasized":** you get emphasis from Poppins**Bold** display already; if you want an Expressive-style focal treatment, bump weight/size on the _one_ key element per screen (the CTA, the active room) — don't over-emphasize.
- **Keep UPPERCASE labels** as a brand signal (this diverges from M3 sentence case — see §11; it's a deliberate keep).

---

## 5. Shape — **Adapt (morph-on-press) / Reject blob library**

**M3:** 7-step radius scale — **0 / 4 / 8 / 12 / 16 / 28 dp + full**. Expressive adds a **~35-shape library** (scallop, clover, flower, arch…) and **shape morphing** (a button/FAB changes shape on press/select — shape becomes a _state signal_).

**nearby-now now:** `radius = 12 / 16 / 20 / 26 / pill` — already almost exactly M3's medium→extra-large band. Corners are the friendly counterweight to the hard borders/shadows.

**Verdict:**

- **Alignment:** your radius scale ≈ M3's; no change needed.
- **Adapt the _interaction_ idea:** M3's shape-morph-on-press → you already press controls _into_ their shadow; a subtle **corner-radius morph on press** (e.g. pill → slightly-less-round) could add the same "alive" feedback in a brutalist key. Optional.
- **Reject** the 35-shape blob library — organic Material blobs are off-brand for soft-brutalism's rectilinear-with-rounded-corners language.

---

## 6. Iconography & Imagery — **Adapt sizing/state / Reject lib swap**

**M3:** Material Symbols = variable font, **4 axes** — Weight (100–700), Fill (0→1, "fill = active/selected"), Grade (−50…200; use negative on dark bg to cut glare), Optical size (20–48, should match render size); **3 styles** (Outlined/Rounded/Sharp). Standard sizes **20 / 24 / 40 / 48 dp**; a 24dp icon lives in a **48dp touch target**.

**nearby-now now:** MaterialCommunityIcons (static font), no-emoji-in-UI rule (icons instead), active tab shown by a brand pill.

**Actions:**

- **Adopt the sizing system:** standardize **24dp** for row/inline icons, **20dp** for dense meta, larger (40/48) beside headers; ensure every icon-only control sits in a **≥48dp** target (§10).
- **Adapt "fill = active":** the tab bar's active state could use a filled icon variant in addition to the brand pill (reinforces state non-chromatically → helps a11y).
- **Reject** switching to Material Symbols — MaterialCommunityIcons is fine and broad; keep it.

---

## 7. Motion & Animation — **Adopt (we're ~80% there)**

**M3 Expressive:** layers a **spring engine** on top of (still-present) easing+duration tokens. Two spring families:

- **Spatial** (position/size/shape) — _allowed to overshoot/bounce._ Expressive damping **0.6–0.8**, Standard **0.9**.
- **Effects** (color/opacity) — **damping 1.0, never bounces** (bouncing alpha looks wrong). Identical across schemes.

**Easing (cubic-bezier):** Emphasized-Decelerate `(0.05,0.7,0.1,1)` for _entrances_; Emphasized-Accelerate `(0.3,0,0.8,0.15)` for _exits_; Standard `(0.2,0,0,1)`. **Durations:** short 50–200 / medium 250–400 / long 450–600 / extra-long 700–1000 ms.

**Transition patterns:** Container-transform (card→detail), Shared-axis (X peers / Y levels / Z depth), **Fade-through** (unrelated views, e.g. bottom-nav switches), Fade (in-place transient UI). Principles: motion for hierarchy (**stagger** primary before supporting), feedback, and continuity.

**nearby-now now:** `motion = { duration: {fast 150, base 260, slow 420}, spring: {damping 13, stiffness 150, mass 0.9}, stagger 45, pressShift }`.

> Note: that spring's _damping ratio_ ≈ `13 / (2·√(150·0.9))` ≈ **0.56** — i.e. you're already tuned **bouncy/Expressive**. But it's one spring used for everything.

**Actions:**

- **Adapt — split into two named springs** (mirroring M3):
  - `spring.spatial` (bouncy, for enter/move/scale): keep ~ratio 0.7–0.8, e.g. Reanimated `{ stiffness: 300, damping: 26, mass: 1 }`.
  - `spring.effects` (no bounce, for opacity/color/cross-fades): critically damped, e.g. `{ stiffness: 900, damping: 60, mass: 1 }` — or just `withTiming(…, emphasized easing)`.
- **Adopt transition patterns** — and this **fixes the nav complaint you already raised** ("skeleton appears and the card re-renders / jarring"): use a **fade-through** (or shared-axis) page transition between tabs instead of mounting a skeleton, so content cross-fades in place.
- **Adopt** container-transform for **row → room detail** (the activity row visibly grows into the detail screen) — strong continuity for the core flow.
- **Map durations** to M3 tiers if you like (your 150/260/420 ≈ short-3 / medium-2 / long-1).
- **Add reduced-motion gating** (a11y — see §10): when the OS "Reduce Motion" is on, drop bounce → fades.

---

## 8. Layout & Adaptive — **Adapt (multi-column feed on wide)**

**M3:** 4/8dp grid. **Window size classes:** Compact `<600` / Medium `600–839` / Expanded `840–1199` / Large `1200–1599` / XL `≥1600` dp. **Canonical layouts:** list-detail, supporting-pane, **feed** (grows column count with width). **Navigation adapts:** bottom bar → nav rail → nav drawer as width grows. A constrained **body region** keeps content readable on huge screens.

**nearby-now now:** `layout.maxContentWidth = 560`, centered on wide screens (good — matches M3's "body region" idea); bottom tab bar at all widths; feed is a single centered column even on desktop web.

**Actions:**

- **Adapt — multi-column feed at ≥840dp:** instead of only centering a 560px column, let the feed become **2 columns** on wide/tablet/web (M3's canonical feed). Highest-visible-payoff layout change.
- **Keep** the max-width philosophy — it already embodies M3's body-region guidance and your "cards never over-stretch" rule.
- **Optional (low priority):** on wide web, a **nav rail** (left) instead of the bottom bar. Only worth it if web becomes a real target.
- Your spacing scale (`4/8/12/16/20/24/32`) is 4dp-based; fine. (12 & 20 aren't pure-8dp but are intentional.)

---

## 9. Accessibility — **Adopt all (non-negotiable floors)**

| Requirement               | M3 / WCAG                                    | nearby-now to-do                                                                                      |
| ------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Text contrast             | 4.5:1 body, 3:1 large (≥18.66px bold / 24px) | **Verify** every `on-*` on its fill (esp. `subtext` on `surface`, badge text on accents)              |
| Non-text/UI contrast      | 3:1 (borders, icons, focus)                  | Verify accent fills & borders vs. paper                                                               |
| Touch targets             | **48×48dp** min, **8dp** apart               | **Audit** borderless `BIconButton`, chips, tab items (hitSlop 8 helps but small icons may fall short) |
| Don't rely on color alone | Pair color with icon/text/shape              | ✅ already pass (badges carry text labels)                                                            |
| Focus indicators          | Visible, 3:1                                 | Add a focus ring for web/keyboard                                                                     |
| Reduced motion            | Honor OS setting; fades not big transforms   | **Add** gating around springs (currently none)                                                        |
| Dynamic type              | Support up to **200%**, use `sp`             | Check `allowFontScaling`; ensure rows reflow                                                          |
| Screen readers            | Label icon-only controls; hide decorative    | Add `accessibilityLabel` to icon buttons; mark decorative icons                                       |

These are floors, not style — adopt them regardless of aesthetic. Top a11y wins: **reduced-motion gating**, **touch-target audit**, **contrast verification**.

---

## 10. Content Design / UX Writing — **Adopt most / keep UPPERCASE micro-labels**

**M3:** Voice (consistent) vs Tone (contextual); present tense; short sentences. **Sentence case everywhere** (even buttons: "Sign in", not "Sign In" or "SIGN IN"). Buttons **action-first** ("Save changes"). Errors/empty states: say what happened + how to fix, supportively. **Alt text:** describe _purpose not appearance_ ("Search", not "magnifying glass"); decorative → empty; ~≤150 chars; no "image of". i18n: leave room for **text expansion**, design RTL + tall scripts (you already ship en/zh/ja). Truncate with ellipsis; abbreviate dates when tight.

**nearby-now now:** UPPERCASE labels/badges (brutalist brand), Title Case buttons ("Sign In"), i18n present, category badges carry labels.

**Verdict:**

- **Adopt:** action-first button verbs; helpful error/empty copy; **alt-text discipline** (purpose over appearance; label icon-only controls); i18n text-expansion room.
- **Divergence to keep:** M3 wants sentence case _everywhere_; your **UPPERCASE micro-labels/badges are a deliberate brand signal** — keep them. But consider **sentence case for longer button labels and screen titles** ("Sign in", "Create an account") where UPPERCASE would feel shouty. Your call; document whichever you pick so it's consistent.
- You already fixed one M3-aligned thing: the feed row now shows **relative time** ("closes in 3h") instead of a raw datetime — matches M3's "write dates the way people speak / abbreviate when tight."

---

## 11. Prioritized Action List

| #   | Action                                                                   | Dimension    | Verdict     | Impact  | Effort  |
| --- | ------------------------------------------------------------------------ | ------------ | ----------- | ------- | ------- |
| 1   | Reduced-motion gating + touch-target audit + contrast verify             | A11y         | Adopt       | High    | Low–Med |
| 2   | Fade-through / shared-axis tab transition (kills the skeleton re-render) | Motion       | Adopt       | High    | Med     |
| 3   | Split spring into `spatial` (bouncy) + `effects` (no-bounce)             | Motion       | Adapt       | Med     | Low     |
| 4   | Per-accent `on-` colors + soft `container` tints                         | Color        | Adopt/Adapt | Med     | Low     |
| 5   | Pressed state layer for flat elements (rows/secondary btns/chips)        | Color        | Adapt       | Med     | Low     |
| 6   | 2-column feed at ≥840dp (wide/web/tablet)                                | Layout       | Adapt       | Med     | Med     |
| 7   | Container-transform: row → room detail                                   | Motion       | Adopt       | Med     | Med     |
| 8   | Semantic token alias layer over the palette                              | Tokens       | Adapt       | Med     | Low     |
| 9   | Icon sizing system (20/24/40/48) + "fill = active" tabs                  | Icons        | Adapt       | Low–Med | Low     |
| 10  | Alt-text / accessibilityLabel pass on icon-only controls                 | Content/A11y | Adopt       | Med     | Low     |
| 11  | Type: add display-large + label-small; negative display tracking         | Type         | Adapt       | Low     | Low     |
| 12  | Decide sentence-case vs UPPERCASE per element; document                  | Content      | Adapt       | Low     | Low     |

**Suggested first sprint:** #1–#5 (all Low/Med effort, and #2 directly resolves a bug you already flagged).

---

## 12. Explicit "Do NOT Copy" (protect identity + avoid coupling)

- **Roboto / Roboto Flex / Roboto Serif** — keep Poppins/Inter/Caveat (user directive).
- **Dynamic color / Material You / HCT tonal generation** — would override the fixed brand palette.
- **Tonal-elevation surface tint + blurred Material shadows** — the antithesis of the hard offset shadow.
- **The ~35-shape organic blob library + cut-corner family** — off-brand.
- **The Material component library / Compose code** — we own our components (this is the shadcn-style "own your code" model, already in place).

Rule: take M3's **rules and structure**, never its **skin**. Soft-brutalism stays the visual identity; M3 makes the plumbing under it more rigorous.

---

## Sources (selected)

**Motion:** m3.material.io/styles/motion · /blog/m3-expressive-motion-theming · AndroidX Compose `ExpressiveMotionTokens.kt` / `StandardMotionTokens.kt` · material-components-android `Motion.md` · MDN/W3C `prefers-reduced-motion`, WCAG 2.3.3.
**Color/Elevation:** m3.material.io/styles/color/roles · /styles/color/system · /styles/elevation/tokens · /blog/tone-based-surface-color-m3 · material-components-android `Color.md` · Android Developers Material3 · Flutter `DynamicSchemeVariant`.
**Type/Shape/Icons:** m3.material.io/styles/typography/type-scale-tokens · /styles/shape/shape-morph · AndroidX `TypeScaleTokens.kt` · Google Fonts Material Symbols guide · /blog/roboto-flex.
**Tokens/Layout:** m3.material.io/foundations/design-tokens · /foundations/layout/window-size-classes · /foundations/layout/canonical-layouts · Android Developers "Canonical layouts" · 9to5Google (Expressive nav changes).
**A11y/Content:** m3.material.io/foundations/designing/color-contrast · /foundations/content-design/style-guide · /foundations/content-design/alt-text · W3C WAI Understanding SC 1.4.3 / 1.4.11 / 2.3.3 · Android Accessibility (touch targets) · NN/g "Write Alt Text".

_Full per-topic digests with all numeric tables were produced during research and can be regenerated on request._
