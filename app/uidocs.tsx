// =============================================================================
// /uidocs — NearbyNow Design System (NEO-BRUTALISM rebrand). Source of truth.
// Hidden route (URL only). Each element: canonical spec + live example + rules.
// Toggle light/dark up top. Edit values in src/ui/theme/uikit.ts.
// =============================================================================
import React, { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  LinearTransition,
  SlideInRight,
  ZoomIn,
} from "react-native-reanimated";
import {
  controls,
  hardShadow,
  layout,
  motion,
  radius,
  space,
  typeScale,
  uiColors,
  type UIColors,
  type UIScheme,
} from "../src/ui/theme/uikit";
import {
  BActivityRow,
  BAppBar,
  BBadge,
  BButton,
  BCard,
  BChip,
  BComposer,
  BIconButton,
  BInput,
  BList,
  BSkeleton,
  BSkeletonList,
  BAccordion,
  BStepper,
  BTabBar,
  BText,
  BToggle,
  Container,
  HardShadow,
  PaperTexture,
} from "../src/ui/components/brutal";

// Sample rows for the Tag Filter element. The first entry (key null) is the
// "All" chip; the rest mirror lib/ui/activityIcon categories.
const TAG_DEMO: {
  key: string | null;
  label: string;
  icon: string;
  tint: "coral" | "mint" | "sky" | "yellow" | "pink" | "grape";
  title: string;
}[] = [
  { key: null, label: "All", icon: "star-four-points", tint: "sky", title: "" },
  {
    key: "music",
    label: "Music",
    icon: "microphone-variant",
    tint: "coral",
    title: "Live music jam session",
  },
  {
    key: "food",
    label: "Food",
    icon: "silverware-fork-knife",
    tint: "yellow",
    title: "Hotpot dinner, need 3 more",
  },
  {
    key: "sports",
    label: "Sports",
    icon: "badminton",
    tint: "mint",
    title: "Badminton drop-in at the park",
  },
];

function Section({
  c,
  title,
  note,
  children,
}: {
  c: UIColors;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: space.md, marginTop: space.xxl }}>
      <BText v="h1" c={c} color={c.ink}>
        {title}
      </BText>
      {note ? (
        <BText v="caption" c={c} color={c.subtext}>
          {note}
        </BText>
      ) : null}
      <View style={{ height: 3, backgroundColor: c.border }} />
      {children}
    </View>
  );
}

function Rules({
  c,
  dos,
  donts,
}: {
  c: UIColors;
  dos: string[];
  donts: string[];
}) {
  const col = (items: string[], good: boolean) => (
    <View style={{ flex: 1, minWidth: 200, gap: 5 }}>
      {items.map((d) => (
        <View
          key={d}
          style={{ flexDirection: "row", gap: 6, alignItems: "flex-start" }}
        >
          <MaterialCommunityIcons
            name={good ? "check-bold" : "close-thick"}
            size={13}
            color={good ? c.success : c.danger}
            style={{ marginTop: 2 }}
          />
          <BText
            v="caption"
            c={c}
            color={good ? c.success : c.danger}
            style={{ flex: 1 }}
          >
            {d}
          </BText>
        </View>
      ))}
    </View>
  );
  return (
    <View style={{ flexDirection: "row", gap: space.lg, flexWrap: "wrap" }}>
      {col(dos, true)}
      {col(donts, false)}
    </View>
  );
}

function Swatch({
  c,
  name,
  value,
}: {
  c: UIColors;
  name: string;
  value: string;
}) {
  return (
    <View style={{ width: 92, gap: 4 }}>
      <View
        style={{
          height: 46,
          borderRadius: radius.sm,
          backgroundColor: value,
          borderWidth: 2,
          borderColor: c.border,
        }}
      />
      <BText v="label" c={c} color={c.text}>
        {name}
      </BText>
      <BText v="caption" c={c} color={c.subtext}>
        {value}
      </BText>
    </View>
  );
}

// Interactive navigation demo: switching pages slides the new page in ONCE —
// straight to content, no skeleton / re-render here (the skeleton has its own
// section below). A button lives inside each page body.
function NavDemo({ c }: { c: UIColors }) {
  const [page, setPage] = useState<"feed" | "room">("feed");
  return (
    <HardShadow c={c} radius={radius.md}>
      <View
        style={{
          borderWidth: controls.borderWidth,
          borderColor: c.border,
          backgroundColor: c.bg,
          overflow: "hidden",
          height: 420,
        }}
      >
        {/* header — borderless icon buttons */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.sm,
            paddingHorizontal: space.sm,
            paddingVertical: space.sm,
            borderBottomWidth: controls.borderWidth,
            borderBottomColor: c.border,
            backgroundColor: c.surface,
          }}
        >
          <BIconButton
            c={c}
            icon="chevron-left"
            size={26}
            onPress={page === "room" ? () => setPage("feed") : undefined}
          />
          <BText
            v="h2"
            c={c}
            color={c.ink}
            style={{ flex: 1 }}
            numberOfLines={1}
          >
            {page === "feed" ? "enoki" : "Karaoke tonight?"}
          </BText>
          <BIconButton
            c={c}
            icon={page === "feed" ? "magnify" : "dots-horizontal"}
          />
        </View>
        {/* body — animates on page switch */}
        <View style={{ flex: 1, overflow: "hidden" }}>
          <Animated.View
            key={page}
            entering={SlideInRight.duration(motion.duration.base)}
            style={{ flex: 1, padding: space.md, gap: space.sm }}
          >
            {page === "feed" ? (
              <>
                <BText v="caption" c={c} color={c.subtext}>
                  Central · within 2km
                </BText>
                <BList c={c}>
                  <BActivityRow
                    c={c}
                    icon="coffee"
                    iconBg={c.yellow}
                    title="Coffee & chat"
                    meta="Central · closes in 1h"
                    badges={<BBadge c={c} label="1/3" fill={c.surface} />}
                  />
                  <BActivityRow
                    c={c}
                    icon="dice-multiple"
                    iconBg={c.sky}
                    title="Board games"
                    meta="Sheung Wan · closes in 4h"
                    last
                    badges={<BBadge c={c} label="2/5" fill={c.surface} />}
                  />
                </BList>
                <BButton
                  c={c}
                  tone="primary"
                  label="Open a room"
                  full
                  onPress={() => setPage("room")}
                />
              </>
            ) : (
              <>
                <BText v="caption" c={c} color={c.subtext}>
                  3 people nearby
                </BText>
                <BList c={c}>
                  <BActivityRow
                    c={c}
                    icon="hand-wave"
                    iconBg={c.mint}
                    title="Ada"
                    meta="I'm here — grabbing a table"
                    badges={<BBadge c={c} label="Host" fill={c.pink} />}
                  />
                  <BActivityRow
                    c={c}
                    icon="account"
                    iconBg={c.sky}
                    title="Ben"
                    meta="On my way, 5 min"
                    last
                  />
                </BList>
                <BButton c={c} tone="secondary" label="Send a message" full />
              </>
            )}
          </Animated.View>
        </View>
        <BTabBar c={c} active={page === "feed" ? "feed" : "lobby"} />
      </View>
    </HardShadow>
  );
}

export default function UIDocs() {
  const [scheme, setScheme] = useState<UIScheme>("light");
  const [view, setView] = useState<"list" | "map">("list");
  const [tag, setTag] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [accOpen, setAccOpen] = useState<string | null>("when");
  const c = uiColors[scheme];

  // Animation demo state — "a new activity arrives"
  const spawnTitles = [
    "Board games",
    "Coffee run",
    "Hotpot dinner",
    "Sunset walk",
    "Badminton",
    "Live music",
  ];
  const [feed, setFeed] = useState([
    { id: 1, title: "Karaoke tonight?", meta: "Mongkok · closes in 3h" },
  ]);
  const nextId = useRef(2);
  const spawn = () => {
    const t = spawnTitles[nextId.current % spawnTitles.length];
    setFeed((prev) =>
      [
        { id: nextId.current++, title: t, meta: "Nearby · just now" },
        ...prev,
      ].slice(0, 5)
    );
  };

  const colorGroups = useMemo(
    () =>
      [
        {
          title: "Brand + accents",
          items: [
            ["brand", c.brand],
            ["yellow", c.yellow],
            ["coral", c.coral],
            ["mint", c.mint],
            ["sky", c.sky],
            ["pink", c.pink],
            ["grape", c.grape],
          ],
        },
        {
          title: "Paper / ink",
          items: [
            ["bg", c.bg],
            ["surface", c.surface],
            ["surfaceAlt", c.surfaceAlt],
            ["ink", c.ink],
            ["subtext", c.subtext],
          ],
        },
        {
          title: "Semantic",
          items: [
            ["success", c.success],
            ["warn", c.warn],
            ["danger", c.danger],
            ["info", c.info],
          ],
        },
      ] as { title: string; items: [string, string][] }[],
    [c]
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: "UIDocs — Design System" }} />
      <PaperTexture c={c} opacity={scheme === "light" ? 0.06 : 0.1} />
      <ScrollView
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={{
          padding: layout.screenPadding,
          paddingBottom: 96,
        }}
      >
        <Container style={{ gap: space.sm }}>
          {/* Scheme toggle */}
          <View
            style={{
              flexDirection: "row",
              gap: space.sm,
              alignSelf: "flex-end",
            }}
          >
            {(["light", "dark"] as UIScheme[]).map((s) => (
              <Pressable key={s} onPress={() => setScheme(s)}>
                <BChip
                  c={c}
                  label={s === "light" ? "Light" : "Dark"}
                  selected={scheme === s}
                />
              </Pressable>
            ))}
          </View>

          {/* Brand */}
          <View
            style={{
              alignItems: "center",
              gap: space.sm,
              paddingVertical: space.xl,
            }}
          >
            <HardShadow c={c} radius={radius.lg}>
              <View
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: radius.lg,
                  borderWidth: controls.borderWidth,
                  borderColor: c.border,
                  backgroundColor: c.yellow,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="compass-rose"
                  size={40}
                  color={c.ink}
                />
              </View>
            </HardShadow>
            <BText
              v="display"
              c={c}
              color={c.ink}
              style={{ marginTop: space.md, fontFamily: "ShortStack" }}
            >
              enoki
            </BText>
            <BText
              v="body"
              c={c}
              color={c.text}
              style={{ fontFamily: "CaveatBold", fontSize: 22 }}
            >
              get out there — right now
            </BText>
            <View
              style={{
                flexDirection: "row",
                gap: space.sm,
                marginTop: space.sm,
              }}
            >
              <BChip c={c} label="Soft brutalism v2" tone="brand" />
              <BChip c={c} label="edit → uikit.ts" />
            </View>
          </View>

          {/* Color */}
          <Section
            c={c}
            title="Color"
            note="Bold flat accents on warm paper; ink does the borders. Tokens in uikit.ts."
          >
            {colorGroups.map((g) => (
              <View key={g.title} style={{ gap: space.sm }}>
                <BText v="label" c={c} color={c.subtext}>
                  {g.title}
                </BText>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: space.md,
                  }}
                >
                  {g.items.map(([n, v]) => (
                    <Swatch key={n} c={c} name={n} value={v} />
                  ))}
                </View>
              </View>
            ))}
            <Rules
              c={c}
              dos={[
                "Brand = primary action & selection",
                "Accents label & energize (1-2 per screen)",
                "Ink for every border & body text",
              ]}
              donts={[
                "Don't blur or gradient fills",
                "Don't use >2 bright accents at once",
                "Don't invent off-token hexes",
              ]}
            />
          </Section>

          {/* Typography */}
          <Section
            c={c}
            title="Typography"
            note="Poppins (display/heading) · Inter (body) · Caveat (accent). Labels UPPERCASE."
          >
            <BCard c={c}>
              {(
                [
                  "display",
                  "h1",
                  "h2",
                  "title",
                  "body",
                  "bodyStrong",
                  "label",
                  "caption",
                ] as (keyof typeof typeScale)[]
              ).map((k) => (
                <View
                  key={k}
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: space.md,
                  }}
                >
                  <BText v={k} c={c} color={c.text} numberOfLines={1}>
                    {k}
                  </BText>
                  <BText v="caption" c={c} color={c.subtext}>
                    {typeScale[k].font} · {typeScale[k].size}/
                    {typeScale[k].lineHeight}
                  </BText>
                </View>
              ))}
            </BCard>
          </Section>

          {/* Foundations: spacing / radius / border / hard shadow */}
          <Section
            c={c}
            title="Foundations"
            note="4-based spacing · rounded corners · medium ink borders · small hard shadow."
          >
            <BCard c={c}>
              <BText v="label" c={c} color={c.subtext}>
                Spacing
              </BText>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  gap: space.md,
                  flexWrap: "wrap",
                }}
              >
                {Object.entries(space).map(([k, v]) => (
                  <View key={k} style={{ alignItems: "center", gap: 4 }}>
                    <View
                      style={{
                        width: v,
                        height: v,
                        backgroundColor: c.brand,
                        borderWidth: 1,
                        borderColor: c.border,
                      }}
                    />
                    <BText v="caption" c={c} color={c.subtext}>
                      {k} {v}
                    </BText>
                  </View>
                ))}
              </View>
              <BText
                v="label"
                c={c}
                color={c.subtext}
                style={{ marginTop: space.sm }}
              >
                Hard shadow
              </BText>
              <View
                style={{
                  flexDirection: "row",
                  gap: space.xl,
                  paddingBottom: hardShadow.lg.y + 4,
                }}
              >
                {(["sm", "md", "lg"] as const).map((k) => (
                  <View key={k} style={{ alignItems: "center", gap: 8 }}>
                    <HardShadow c={c} offset={hardShadow[k]} radius={radius.md}>
                      <View
                        style={{
                          width: 52,
                          height: 40,
                          borderRadius: radius.md,
                          borderWidth: controls.borderWidth,
                          borderColor: c.border,
                          backgroundColor: c.surface,
                        }}
                      />
                    </HardShadow>
                    <BText v="caption" c={c} color={c.subtext}>
                      {k} {hardShadow[k].x}px
                    </BText>
                  </View>
                ))}
              </View>
            </BCard>
          </Section>

          {/* Layout / responsiveness */}
          <Section
            c={c}
            title="Layout — fit any screen"
            note={`Content caps at ${layout.maxContentWidth}px and centers. Cards never over-stretch on tablet/web.`}
          >
            <BCard c={c}>
              <BText v="bodyStrong" c={c} color={c.ink}>
                maxContentWidth = {layout.maxContentWidth}
              </BText>
              <BText v="caption" c={c} color={c.subtext}>
                Every screen wraps its content in {"<Container>"} — full width
                on a phone, centered with paper margins on wide screens. This
                whole page uses it (note the paper edges on a wide window).
              </BText>
              <View
                style={{
                  height: 28,
                  borderRadius: radius.sm,
                  borderWidth: 2,
                  borderColor: c.border,
                  backgroundColor: c.mint,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BText v="label" c={c} color={c.onBright}>
                  content column
                </BText>
              </View>
            </BCard>
          </Section>

          {/* Buttons */}
          <Section
            c={c}
            title="Buttons"
            note="Two tiers — EMPHASIS (border + hard shadow) for decisions; PLAIN (icon / text, no border, no shadow) for nav & utility."
          >
            <BCard c={c}>
              <BText v="label" c={c} color={c.subtext}>
                Emphasis — border + hard shadow (the CTAs)
              </BText>
              <BButton c={c} tone="primary" label="Primary action" full />
              <View
                style={{
                  flexDirection: "row",
                  gap: space.md,
                  flexWrap: "wrap",
                }}
              >
                <BButton c={c} tone="secondary" label="Secondary" />
                <BButton c={c} tone="accent" label="Highlight" />
                <BButton
                  c={c}
                  tone="danger"
                  label="Delete"
                  icon="trash-can-outline"
                />
              </View>

              <View
                style={{
                  height: 2,
                  backgroundColor: c.hairline,
                  marginVertical: space.xs,
                }}
              />
              <BText v="label" c={c} color={c.subtext}>
                Highlighted — shadow matches the button’s own fill
              </BText>
              <View
                style={{
                  flexDirection: "row",
                  gap: space.md,
                  flexWrap: "wrap",
                }}
              >
                <BButton c={c} tone="primary" label="Join now" highlight />
                <BButton
                  c={c}
                  tone="accent"
                  label="Spawn"
                  icon="plus"
                  highlight
                />
              </View>

              <View
                style={{
                  height: 2,
                  backgroundColor: c.hairline,
                  marginVertical: space.xs,
                }}
              />
              <BText v="label" c={c} color={c.subtext}>
                Plain — no border, no shadow (nav & utility)
              </BText>
              <View
                style={{
                  flexDirection: "row",
                  gap: space.md,
                  alignItems: "center",
                }}
              >
                <BIconButton c={c} icon="chevron-left" />
                <BIconButton c={c} icon="dots-horizontal" />
                <BIconButton c={c} icon="close" />
                <BIconButton c={c} icon="magnify" />
                <Pressable>
                  <BText v="title" c={c} color={c.brand}>
                    Text action
                  </BText>
                </Pressable>
              </View>
            </BCard>
            <Rules
              c={c}
              dos={[
                "Border + shadow = primary / accent / danger CTAs",
                "Secondary = border only (no shadow)",
                "Highlight shadow matches the button’s fill",
                "Icon & nav buttons stay plain, no frame",
              ]}
              donts={[
                "Don't frame back / ⋯ / close / tab icons",
                "Don't give a secondary button a shadow",
                "Don't blur the shadow",
                "Don't stack two emphasis buttons",
              ]}
            />
          </Section>

          {/* Chips */}
          <Section
            c={c}
            title="Chips, Pills & Status"
            note="One pill spec for filters, segmented tabs & status. Bold fill = selected."
          >
            <BCard c={c}>
              <View
                style={{
                  flexDirection: "row",
                  gap: space.sm,
                  flexWrap: "wrap",
                }}
              >
                <BChip c={c} label="Selected" selected />
                <BChip c={c} label="Unselected" />
                <BChip c={c} label="Joined" tone="success" />
                <BChip c={c} label="Closing soon" tone="warn" />
                <BChip c={c} label="Closed" tone="danger" />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: space.sm,
                  marginTop: space.sm,
                }}
              >
                <BBadge c={c} label="Created" fill={c.sky} />
                <BBadge c={c} label="2/4" fill={c.surface} />
                <BBadge c={c} label="New" fill={c.pink} />
              </View>
            </BCard>
          </Section>

          {/* Tag Filter */}
          <Section
            c={c}
            title="Tag Filter"
            note="A scrolling chip bar to narrow a list by category. 'All' + one chip per category present. The matching colored badge repeats on each row so a tag reads the same in the filter and in the list."
          >
            <BCard c={c}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  gap: space.sm,
                  paddingRight: space.sm,
                }}
              >
                {TAG_DEMO.map((t) => (
                  <Pressable key={t.key ?? "all"} onPress={() => setTag(t.key)}>
                    <BChip c={c} label={t.label} selected={tag === t.key} />
                  </Pressable>
                ))}
              </ScrollView>
              <View style={{ gap: space.sm, marginTop: space.md }}>
                {TAG_DEMO.filter(
                  (t) => t.key !== null && (tag === null || tag === t.key)
                ).map((t, i, arr) => (
                  <BActivityRow
                    key={t.key}
                    c={c}
                    icon={t.icon}
                    iconBg={c[t.tint]}
                    title={t.title}
                    meta="Pomona · 2.6km away"
                    badges={<BBadge c={c} label={t.label} fill={c[t.tint]} />}
                    last={i === arr.length - 1}
                  />
                ))}
              </View>
            </BCard>
            <Rules
              c={c}
              dos={[
                "Lead with an 'All' chip (clears the filter)",
                "Show only categories actually present in the list",
                "Reuse the same color for the chip & the row badge",
              ]}
              donts={[
                "Don't show empty categories",
                "Don't stack multiple filter bars",
                "Don't add borders to the row badges",
              ]}
            />
          </Section>

          {/* Toggle */}
          <Section
            c={c}
            title="Toggle"
            note="A segmented switch for view/mode changes (e.g. List / Map). One pill; the active segment gets a soft neutral fill (not brand) so it reads as a quiet control, not a call to action. No per-segment borders."
          >
            <BCard c={c}>
              <BToggle<"list" | "map">
                c={c}
                value={view}
                onChange={setView}
                options={[
                  {
                    value: "list",
                    label: "List",
                    icon: "format-list-bulleted",
                  },
                  { value: "map", label: "Map", icon: "map" },
                ]}
              />
              <BText v="caption" c={c} color={c.subtext}>
                Selected: {view}
              </BText>
            </BCard>
            <Rules
              c={c}
              dos={[
                "2-3 mutually exclusive options",
                "Active segment = soft neutral fill",
                "Use for view/mode switches (List/Map)",
              ]}
              donts={[
                "Don't use for a single on/off",
                "Don't brand-fill the active segment (too loud)",
                "Don't border each segment",
              ]}
            />
          </Section>

          {/* Stepper */}
          <Section
            c={c}
            title="Stepper"
            note="For multi-step flows (create / edit an invite). Numbered circles joined by hairlines: active step is brand-filled, completed steps show a check, upcoming steps are muted. Optional steps read lighter. Steps are tappable so you can jump back. Keep it a map, not a gate — let people finish early when later steps are optional."
          >
            <BCard c={c}>
              <BStepper
                c={c}
                current={step}
                onStepPress={setStep}
                steps={[
                  { label: "Say it" },
                  { label: "Where", optional: true },
                  { label: "Details", optional: true },
                ]}
              />
              <View style={{ flexDirection: "row", gap: space.sm }}>
                <BButton
                  c={c}
                  tone="secondary"
                  label="‹ Back"
                  onPress={() => setStep((s) => Math.max(0, s - 1))}
                />
                <BButton
                  c={c}
                  tone="primary"
                  label="Next ›"
                  onPress={() => setStep((s) => Math.min(2, s + 1))}
                />
              </View>
            </BCard>
            <Rules
              c={c}
              dos={[
                "2–4 steps with short labels",
                "Brand-fill the active step; check the done ones",
                "Mark optional steps + allow finishing early",
              ]}
              donts={[
                "Don't use for a single form",
                "Don't block posting behind optional steps",
                "Don't hide where the user is in the flow",
              ]}
            />
          </Section>

          {/* Accordion */}
          <Section
            c={c}
            title="Accordion"
            note="For optional fields on a compact form (Quick Post / Create). Everything the user needs to post lives above; the rest collapses into tappable rows. A collapsed row shows a summary of its value — brand-colored when set, muted when empty — so the form reads at a glance without expanding. One page, no stepper, no sheets: post the moment a title exists, open a section only when you have something to add."
          >
            <BCard c={c}>
              <BAccordion
                c={c}
                label="Where"
                summary="Add a place"
                open={accOpen === "where"}
                onToggle={() =>
                  setAccOpen((v) => (v === "where" ? null : "where"))
                }
              >
                <BText c={c} v="body" color={c.subtext}>
                  Location picker lives here.
                </BText>
              </BAccordion>
              <BAccordion
                c={c}
                label="When"
                summary="Tonight · 8:00 PM"
                filled
                open={accOpen === "when"}
                onToggle={() =>
                  setAccOpen((v) => (v === "when" ? null : "when"))
                }
              >
                <View style={{ flexDirection: "row", gap: space.sm }}>
                  <BChip c={c} label="Tonight" selected />
                  <BChip c={c} label="Later" />
                  <BChip c={c} label="Weekend" />
                </View>
              </BAccordion>
              <BAccordion
                c={c}
                label="Who's it for"
                summary="Anyone"
                open={accOpen === "who"}
                onToggle={() => setAccOpen((v) => (v === "who" ? null : "who"))}
              >
                <BText c={c} v="body" color={c.subtext}>
                  Capacity + gender preference here.
                </BText>
              </BAccordion>
            </BCard>
            <Rules
              c={c}
              dos={[
                "Keep the required field (title) outside — above the accordions",
                "Show a value summary on the collapsed row (brand when set)",
                "Collapse by default; open in place on tap",
              ]}
              donts={[
                "Don't gate posting behind an accordion",
                "Don't nest accordions inside accordions",
                "Don't hide a required field in a collapsed section",
              ]}
            />
          </Section>

          {/* Inputs */}
          <Section
            c={c}
            title="Inputs"
            note={`Label above · thick ink border · height ${controls.inputHeight}.`}
          >
            <BCard c={c}>
              <BInput
                c={c}
                label="Email"
                placeholder="you@example.com"
                hint="We never share this."
              />
              <BInput
                c={c}
                label="Password"
                placeholder="Min 6 characters"
                error="Password is too short."
              />
            </BCard>
            <Rules
              c={c}
              dos={[
                "UPPERCASE label above the field",
                "Inline error in coral/danger",
                "Reveal toggle on passwords",
              ]}
              donts={[
                "Don't use the placeholder as the label",
                "Don't drop the border on focus",
                "Don't block focus on web",
              ]}
            />
          </Section>

          {/* Composer */}
          <Section
            c={c}
            title="Composer"
            note="The big create entry on the Feed. Its placeholder ROTATES through activity prompts — teaching new users what NearbyNow is for (its positioning)."
          >
            <BComposer
              c={c}
              heading="What do you feel like doing?"
              placeholders={[
                "Anyone up for board games?",
                "Grab a coffee nearby?",
                "Hotpot tonight?",
                "Karaoke, anyone?",
                "Badminton drop-in?",
                "Down for a walk?",
              ]}
            />
            <Rules
              c={c}
              dos={[
                "Keep it the biggest, top entry on the Feed",
                "Rotate the placeholder (~3s) to signal the app’s purpose",
                "Prompts = real activities people actually post",
              ]}
              donts={[
                "Don’t hide it behind a small icon button",
                "Don’t use a static placeholder",
                "Don’t rotate faster than people can read",
              ]}
            />
          </Section>

          {/* Activity list */}
          <Section
            c={c}
            title="Activity List"
            note="Don't stack bordered cards — too busy. ONE container carries the border + hard shadow; rows split by dividers."
          >
            <BList c={c}>
              <BActivityRow
                c={c}
                icon="microphone-variant"
                iconBg={c.coral}
                title="Karaoke tonight?"
                meta="Mongkok · closes in 3h · 1.2km"
                badges={
                  <>
                    <BBadge c={c} label="2/4" fill={c.surface} />
                    <BBadge c={c} label="Soon" fill={c.yellow} />
                  </>
                }
              />
              <BActivityRow
                c={c}
                icon="bowl-mix"
                iconBg={c.mint}
                title="Hotpot dinner"
                meta="Causeway Bay · closes in 5h · 0.8km"
                badges={<BBadge c={c} label="3/6" fill={c.surface} />}
              />
              <BActivityRow
                c={c}
                icon="badminton"
                iconBg={c.sky}
                title="Badminton drop-in"
                meta="Kowloon Park · closes in 2h · 2.1km"
                last
                badges={<BBadge c={c} label="Joined" fill={c.mint} />}
              />
            </BList>

            <BText
              v="label"
              c={c}
              color={c.subtext}
              style={{ marginTop: space.sm }}
            >
              Highlight A — colored shadow (the whole list is important)
            </BText>
            <BList c={c} shadowColor={c.mint}>
              <BActivityRow
                c={c}
                icon="music"
                iconBg={c.yellow}
                title="New: Live music nearby"
                meta="Just posted · 0.5km"
                last
                badges={<BBadge c={c} label="New" fill={c.pink} />}
              />
            </BList>

            <BText
              v="label"
              c={c}
              color={c.subtext}
              style={{ marginTop: space.sm }}
            >
              Highlight B — left accent bar (one row stands out)
            </BText>
            <BList c={c}>
              <BActivityRow
                c={c}
                icon="run"
                iconBg={c.mint}
                title="Morning run"
                meta="Harbourfront · closes in 2h"
              />
              <BActivityRow
                c={c}
                icon="star"
                iconBg={c.coral}
                title="Sunset drinks"
                meta="Highlighted row"
                accent={c.coral}
                last
                badges={<BBadge c={c} label="Filling up" fill={c.yellow} />}
              />
            </BList>
            <Rules
              c={c}
              dos={[
                "One border + shadow around the whole list",
                "Colored shadow = whole list is important",
                "Left accent bar = one row stands out",
              ]}
              donts={[
                "Don't give each row its own border + shadow",
                "Use colored shadow OR an accent bar — never both",
                "Don't exceed 2 badges per row",
              ]}
            />
          </Section>

          {/* Skeleton */}
          <Section
            c={c}
            title="Loading — Skeleton"
            note="While data loads, show a pulsing skeleton in the SAME shape as the content — no centered spinners."
          >
            <BSkeletonList c={c} rows={3} />
            <View
              style={{
                flexDirection: "row",
                gap: space.lg,
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              <View style={{ gap: 8 }}>
                <BSkeleton c={c} width={150} height={20} />
                <BSkeleton c={c} width={96} height={12} />
              </View>
              <BSkeleton c={c} width={120} height={controls.buttonHeight} />
            </View>
            <Rules
              c={c}
              dos={[
                "Skeleton mirrors the real layout",
                "Pulse opacity ~0.45→1",
                "Swap to content with a fade / pop",
              ]}
              donts={[
                "Don't use a centered spinner for lists",
                "Don't shift layout when content loads",
                "Don't loop the skeleton forever on error",
              ]}
            />
          </Section>

          {/* App Bar */}
          <Section
            c={c}
            title="App Bar"
            note="The top bar for every non-tab screen: paper surface + 2px bottom border (mirrors the tab bar). Carries the back button, title, an optional meta row (place · members · status), and right-side actions — so screens never fall back to the plain native header."
          >
            <View style={{ gap: space.lg }}>
              <View
                style={{
                  borderWidth: controls.borderWidth,
                  borderColor: c.border,
                  borderRadius: radius.md,
                  overflow: "hidden",
                }}
              >
                <BAppBar c={c} onBack={() => {}} title="Create an invite" />
              </View>
              <View
                style={{
                  borderWidth: controls.borderWidth,
                  borderColor: c.border,
                  borderRadius: radius.md,
                  overflow: "hidden",
                }}
              >
                <BAppBar
                  c={c}
                  onBack={() => {}}
                  title="Karaoke tonight?"
                  meta={
                    <>
                      <BText c={c} v="caption" color={c.subtext}>
                        Central
                      </BText>
                      <BBadge c={c} label="2 members" fill={c.surface} />
                    </>
                  }
                  right={
                    <BButton
                      c={c}
                      tone="secondary"
                      label="Leave"
                      onPress={() => {}}
                    />
                  }
                />
              </View>
              <Rules
                c={c}
                dos={[
                  "One title; put place · members · status in the meta row",
                  "Right-side actions sit in a row (never stacked)",
                  "Back = plain chevron, no border",
                ]}
                donts={[
                  "Don't use the plain native header",
                  "Don't stack action buttons vertically",
                  'Don\'t show empty fallbacks like "No place"',
                ]}
              />
            </View>
          </Section>

          {/* Navigation */}
          <Section
            c={c}
            title="Navigation"
            note="Tap “Open a room” to slide to the room page. Nav icons are borderless; active tab = color only."
          >
            <View style={{ gap: space.lg }}>
              <NavDemo c={c} />
              <Rules
                c={c}
                dos={[
                  "Active tab = color highlight only (no border)",
                  "Back / ⋯ / search = plain icons",
                  "Same tab bar height everywhere",
                ]}
                donts={[
                  "Don't border nav / utility icons",
                  "Don't hide the only path to a screen",
                  "Don't ship a dead ＋ / header button",
                ]}
              />
            </View>
          </Section>

          {/* Animation */}
          <Section
            c={c}
            title="Animation"
            note="Liveliness = motion. New activities/rooms POP in with a springy entrance; the list re-flows. Tap below."
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: space.md,
              }}
            >
              <BText v="bodyStrong" c={c} color={c.ink}>
                New activity arrives
              </BText>
              <BButton
                c={c}
                tone="accent"
                label="Spawn"
                icon="plus"
                onPress={spawn}
                highlight
              />
            </View>
            <BList c={c} shadowColor={c.mint}>
              {feed.map((it, i) => (
                <Animated.View
                  key={it.id}
                  entering={ZoomIn.springify()
                    .damping(motion.spring.damping)
                    .stiffness(motion.spring.stiffness)
                    .mass(motion.spring.mass)}
                  layout={LinearTransition.springify()
                    .damping(18)
                    .stiffness(160)}
                >
                  <BActivityRow
                    c={c}
                    icon="lightning-bolt"
                    iconBg={i === 0 ? c.mint : c.sky}
                    title={it.title}
                    meta={it.meta}
                    last={i === feed.length - 1}
                    accent={i === 0 ? c.mint : undefined}
                  />
                </Animated.View>
              ))}
            </BList>
            <BCard c={c}>
              <BText v="label" c={c} color={c.subtext}>
                Motion tokens (uikit.ts)
              </BText>
              <BText v="caption" c={c} color={c.text}>
                durations: fast {motion.duration.fast} · base{" "}
                {motion.duration.base} · slow {motion.duration.slow} ms
              </BText>
              <BText v="caption" c={c} color={c.text}>
                spring: damping {motion.spring.damping} · stiffness{" "}
                {motion.spring.stiffness} · mass {motion.spring.mass}
              </BText>
              <BText v="caption" c={c} color={c.text}>
                list stagger: {motion.stagger} ms · press shift:{" "}
                {motion.pressShift.x}px
              </BText>
            </BCard>
            <Rules
              c={c}
              dos={[
                "New item = spring pop-in (FadeInDown)",
                "List re-flows with layout spring",
                "Buttons press into their shadow",
                "Stagger lists on first load",
              ]}
              donts={[
                "Don't animate everything at once",
                "Don't exceed ~450ms for UI",
                "Don't block input while animating",
              ]}
            />
          </Section>

          {/* Principles */}
          <Section c={c} title="Principles">
            <BCard c={c}>
              <BText v="bodyStrong" c={c} color={c.ink}>
                1 · Loud, honest, tactile
              </BText>
              <BText v="caption" c={c} color={c.subtext}>
                Thick borders, hard shadows, bold flat color — controls look
                pressable and respond.
              </BText>
              <BText v="bodyStrong" c={c} color={c.ink}>
                2 · One way to do each thing
              </BText>
              <BText v="caption" c={c} color={c.subtext}>
                Consume these tokens/components — never restyle inline.
              </BText>
              <BText v="bodyStrong" c={c} color={c.ink}>
                3 · Alive by default
              </BText>
              <BText v="caption" c={c} color={c.subtext}>
                Arrivals pop, lists re-flow, presses feel physical.
              </BText>
              <BText v="bodyStrong" c={c} color={c.ink}>
                4 · Fits any screen
              </BText>
              <BText v="caption" c={c} color={c.subtext}>
                Capped, centered content column; never edge-to-edge on wide
                screens.
              </BText>
            </BCard>
          </Section>
        </Container>
      </ScrollView>
    </View>
  );
}
