import React, { useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, View, Platform } from "react-native";
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  Rect,
  RoundedRect,
  Skia,
  vec,
  BlurMask,
  DashPathEffect,
} from "@shopify/react-native-skia";
import { useT } from "../lib/i18n/useT";
import {
  formatCapacity,
  formatExpiryLabel,
  formatGenderPref,
} from "../lib/i18n/i18n_format";
import { useTheme } from "../src/ui/theme/ThemeProvider";
import { lightTheme } from "../src/ui/theme/tokens";

/* =======================
 * Types
 * ======================= */
export type ActivityCardActivity = {
  id: string;
  creator_id: string;
  title_text: string;
  place_name: string | null;
  place_address: string | null;
  place_text?: string | null;
  lat?: number | null;
  lng?: number | null;
  expires_at: string | null;
  gender_pref: string;
  capacity: number | null;
  status: string;
  created_at?: string | null;
};

export type MembershipState = "none" | "joined" | "left";

type Props = {
  activity: ActivityCardActivity;
  currentUserId: string | null;
  membershipState: MembershipState;
  isJoining: boolean;
  onPressCard: () => void;
  onPressEdit?: () => void;
};

/* =======================
 * Font Tokens (Cute)
 * ======================= */
const cuteFontFamily = Platform.select({
  ios: "SF Pro Rounded",
  android: undefined, // keep Roboto/system for reliability
});
const FONT = {
  title: {
    fontFamily: cuteFontFamily,
    fontSize: 16, // ⬆️ 更明顯
    fontWeight: "800" as const,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  placeName: {
    fontFamily: cuteFontFamily,
    fontSize: 13.5 as any, // RN 接受 number，但 TS 有時唔鍾意小數；唔想就改 14
    fontWeight: "700" as const,
    lineHeight: 17,
    letterSpacing: 0.15,
  },
  address: {
    fontFamily: cuteFontFamily,
    fontSize: 11.5 as any, // 唔想小數就用 12
    fontWeight: "500" as const,
    lineHeight: 14,
    letterSpacing: 0.25,
  },
  chip: {
    fontFamily: cuteFontFamily,
    fontSize: 12,
    fontWeight: "700" as const,
    lineHeight: 14,
    letterSpacing: 0.3, // ⬆️ sticker label 感更明顯
  },
  chipBold: {
    fontFamily: cuteFontFamily,
    fontSize: 12,
    fontWeight: "800" as const,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
};

/* =======================
 * Variants (3 templates)
 * ======================= */
type Variant = 0 | 1 | 2;

const CARD_VARIANTS: Array<{
  paperTop: string;
  paperBottom: string;
  stitch: string;
  speck: string;
  accent: string; // tape / sticker accent
  icon: string;
}> = [
  {
    paperTop: "#FBF6EC",
    paperBottom: "#F3E6D2",
    stitch: "rgba(182,130,70,0.32)",
    speck: "rgba(120,80,40,0.12)",
    accent: "rgba(240,208,150,0.55)",
    icon: "🎯",
  },
  {
    paperTop: "#F8F2EA",
    paperBottom: "#EADFD3",
    stitch: "rgba(110,110,110,0.24)",
    speck: "rgba(80,80,80,0.12)",
    accent: "rgba(200,220,240,0.55)",
    icon: "🎬",
  },
  {
    paperTop: "#FAF3E7",
    paperBottom: "#F0D7C3",
    stitch: "rgba(165,90,60,0.26)",
    speck: "rgba(120,70,50,0.12)",
    accent: "rgba(210,235,210,0.55)",
    icon: "🍜",
  },
];

/* =======================
 * Helpers
 * ======================= */

// :zap: CHANGE 1: Stable variant pick per activity id
function pickVariant(activityId: string): Variant {
  let h = 0;
  for (let i = 0; i < activityId.length; i += 1) {
    h = (h * 31 + activityId.charCodeAt(i)) >>> 0;
  }
  return (h % 3) as Variant;
}

// :zap: CHANGE 2: Tiny PRNG for deterministic "texture" points
function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// :zap: CHANGE 3: Torn-ish rounded rect path (subtle, not too noisy)
function makeTornRectPath(
  w: number,
  h: number,
  r: number,
  seed: number,
  jitter: number
) {
  const rand = mulberry32(seed);
  const p = Skia.Path.Make();

  const left = 0;
  const top = 0;
  const right = w;
  const bottom = h;

  const steps = Math.max(10, Math.floor((w + h) / 28)); // controls edge detail
  const j = Math.max(0.6, jitter);

  // Start near top-left corner
  p.moveTo(left + r, top);

  // Top edge
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const x = left + r + (w - 2 * r) * t;
    const y = top + (rand() - 0.5) * j;
    p.lineTo(x, y);
  }

  // Top-right corner arc approximation
  p.quadTo(right, top, right, top + r);

  // Right edge
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const y = top + r + (h - 2 * r) * t;
    const x = right + (rand() - 0.5) * j;
    p.lineTo(x, y);
  }

  p.quadTo(right, bottom, right - r, bottom);

  // Bottom edge
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const x = right - r - (w - 2 * r) * t;
    const y = bottom + (rand() - 0.5) * j;
    p.lineTo(x, y);
  }

  p.quadTo(left, bottom, left, bottom - r);

  // Left edge
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const y = bottom - r - (h - 2 * r) * t;
    const x = left + (rand() - 0.5) * j;
    p.lineTo(x, y);
  }

  p.quadTo(left, top, left + r, top);

  p.close();
  return p;
}

// :zap: CHANGE 4: Time + urgency
function timeLeft(t: (key: string) => string, expiresAt: string | null) {
  const nowMs = Date.now();
  if (!expiresAt) {
    return {
      label: formatExpiryLabel(null, nowMs, t),
      urgency: "normal" as const,
    };
  }

  const ts = new Date(expiresAt).getTime();
  if (!Number.isFinite(ts)) {
    return {
      label: t("common.unknown"),
      urgency: "normal" as const,
    };
  }

  const ms = ts - nowMs;
  if (ms <= 0) {
    return {
      label: formatExpiryLabel(expiresAt, nowMs, t),
      urgency: "expired" as const,
    };
  }

  const mins = Math.floor(ms / 60000);
  let urgency: "critical" | "soon" | "normal" = "normal";
  if (mins < 15) urgency = "critical";
  else if (mins < 60) urgency = "soon";

  return {
    label: formatExpiryLabel(expiresAt, nowMs, t),
    urgency,
  };
}

// :zap: CHANGE 6: Sticker-like chip
function Chip({
  label,
  bg,
  border,
  color,
  bold,
}: {
  label: string;
  bg: string;
  border: string;
  color: string;
  bold?: boolean;
}) {
  return (
    <View
      style={{
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        backgroundColor: bg,
        borderColor: border,
      }}
    >
      <Text
        style={{
          ...(bold ? FONT.chipBold : FONT.chip),
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// :zap: CHANGE 7: Cross-platform menu item
function MenuItem({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const theme = useTheme();
  const TOKENS = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 16,
        paddingVertical: 14,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "800",
          color: destructive ? TOKENS.dangerText : TOKENS.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* =======================
 * Skia Background Frame
 * ======================= */
function ScrapbookBackground({
  width,
  height,
  variant,
  seed,
}: {
  width: number;
  height: number;
  variant: Variant;
  seed: number;
}) {
  const v = CARD_VARIANTS[variant];

  const paperPath = useMemo(() => {
    const r = 18;
    const jitter = 2.6; // subtle torn feel
    return makeTornRectPath(width, height, r, seed, jitter);
  }, [width, height, seed]);

  const innerPath = useMemo(() => {
    const inset = 10;
    const r = 14;
    const jitter = 0.6;
    return makeTornRectPath(
      width - inset * 2,
      height - inset * 2,
      r,
      seed + 77,
      jitter
    );
  }, [width, height, seed]);

  // Speckles / doodles (deterministic)
  const speckles = useMemo(() => {
    const rand = mulberry32(seed + 999);
    const dots: Array<{ x: number; y: number; r: number; a: number }> = [];
    const n = Math.floor((width * height) / 4200); // density
    for (let i = 0; i < n; i += 1) {
      dots.push({
        x: rand() * width,
        y: rand() * height,
        r: 0.6 + rand() * 1.6,
        a: 0.06 + rand() * 0.12,
      });
    }
    return dots;
  }, [width, height, seed]);

  // Little star-ish accents near top-right (subtle)
  const stars = useMemo(() => {
    const rand = mulberry32(seed + 2024);
    const pts: Array<{ x: number; y: number; r: number }> = [];
    for (let i = 0; i < 5; i += 1) {
      pts.push({
        x: width * (0.72 + rand() * 0.22),
        y: height * (0.12 + rand() * 0.18),
        r: 1.2 + rand() * 1.6,
      });
    }
    return pts;
  }, [width, height, seed]);

  // Tape position (top-left-ish)
  const tape = useMemo(() => {
    const rand = mulberry32(seed + 404);
    const w = 66 + rand() * 10;
    const h = 18 + rand() * 4;
    const x = 12 + rand() * 8;
    const y = 8 + rand() * 6;
    const rotate = (-12 + rand() * 18) * (Math.PI / 180);
    return { w, h, x, y, rotate };
  }, [seed]);

  return (
    <Canvas style={{ width, height }}>
      {/* :zap: CHANGE 8: Soft shadow behind the paper */}
      <Group transform={[{ translateX: 0 }, { translateY: 3 }]}>
        <Path path={paperPath} color="rgba(0,0,0,0.14)">
          <BlurMask blur={10} style="normal" />
        </Path>
      </Group>

      {/* :zap: CHANGE 9: Paper fill with gentle gradient */}
      <Path path={paperPath}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={[v.paperTop, v.paperBottom]}
        />
      </Path>

      {/* :zap: CHANGE 10: Inner stitched/dashed border */}
      <Group transform={[{ translateX: 10 }, { translateY: 10 }]}>
        <Path
          path={innerPath}
          color={v.stitch}
          style="stroke"
          strokeWidth={1.6}
        >
          <DashPathEffect intervals={[6, 6]} phase={0} />
        </Path>
      </Group>

      {/* :zap: CHANGE 11: Tape (semi-transparent rotated rounded rect) */}
      <Group
        transform={[
          { translateX: tape.x + tape.w / 2 },
          { translateY: tape.y + tape.h / 2 },
          { rotate: tape.rotate },
          { translateX: -(tape.x + tape.w / 2) },
          { translateY: -(tape.y + tape.h / 2) },
        ]}
      >
        <RoundedRect
          x={tape.x}
          y={tape.y}
          width={tape.w}
          height={tape.h}
          r={6}
          color={v.accent}
        />
        <RoundedRect
          x={tape.x}
          y={tape.y}
          width={tape.w}
          height={tape.h}
          r={6}
          color="rgba(255,255,255,0.10)"
        />
      </Group>

      {/* :zap: CHANGE 12: Speckles texture */}
      {speckles.map((d, idx) => (
        <Circle
          key={`sp-${idx}`}
          cx={d.x}
          cy={d.y}
          r={d.r}
          color={`rgba(0,0,0,${d.a})`}
        />
      ))}

      {/* :zap: CHANGE 13: Small star-like highlights */}
      {stars.map((s, idx) => (
        <Circle
          key={`st-${idx}`}
          cx={s.x}
          cy={s.y}
          r={s.r}
          color="rgba(255,255,255,0.55)"
        />
      ))}

      {/* :zap: CHANGE 14: Corner vignette for depth */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        color="rgba(0,0,0,0.03)"
      />
    </Canvas>
  );
}

/* =======================
 * Component
 * ======================= */
export default function ActivityCard({
  activity: a,
  currentUserId,
  membershipState,
  isJoining,
  onPressCard,
  onPressEdit,
}: Props) {
  const theme = useTheme();
  const TOKENS = theme.colors;
  const { t } = useT();
  const isCreator = !!currentUserId && a.creator_id === currentUserId;
  const cardTokens = theme.isDark ? lightTheme.colors : TOKENS;
  const cardTitleColor = cardTokens.title;
  const cardTextColor = cardTokens.text;
  const cardSubtextColor = cardTokens.subtext;

  const placeName =
    (a.place_name ?? a.place_text ?? "").trim() || t("activityCard.place_none");
  const placeAddress = (a.place_address ?? "").trim();

  const time = timeLeft(t, a.expires_at);
  const [menuOpen, setMenuOpen] = useState(false);

  const variant = useMemo(() => pickVariant(a.id), [a.id]);
  const v = CARD_VARIANTS[variant];

  const timeChipStyle = useMemo(() => {
    if (time.urgency === "critical" || time.urgency === "expired") {
      return {
        bg: cardTokens.expiredBg,
        border: cardTokens.expiredBorder,
        color: cardTokens.expiredText,
        bold: true,
      };
    }
    if (time.urgency === "soon") {
      return {
        bg: cardTokens.soonBg,
        border: cardTokens.soonBorder,
        color: cardTokens.soonText,
        bold: true,
      };
    }
    return {
      bg: cardTokens.chipBg,
      border: cardTokens.chipBorder,
      color: cardTokens.text,
      bold: false,
    };
  }, [cardTokens, time.label, time.urgency]);

  // :zap: CHANGE 15: Card layout constants (tune once, applies everywhere)
  const CARD_HEIGHT = 132;

  // :zap: CHANGE 16: Measure width so Skia background matches the card frame
  const [cardWidth, setCardWidth] = useState<number>(0);

  function notImplemented(action: "share" | "report" | "delete") {
    const titleKey = `activityCard.notImplementedTitle_${action}` as const;
    Alert.alert(t(titleKey), t("activityCard.notImplementedBody"));
  }

  function runAction(action: "edit" | "share" | "report" | "delete") {
    setMenuOpen(false);

    if (action === "edit") {
      if (!isCreator) return;
      if (!onPressEdit) return;
      onPressEdit();
      return;
    }

    if (action === "share") return notImplemented("share");
    if (action === "report") return notImplemented("report");
    if (action === "delete") return notImplemented("delete");
  }

  return (
    <>
      <Pressable
        onPress={onPressCard}
        disabled={isJoining}
        style={({ pressed }) => ({
          opacity: isJoining ? 0.6 : pressed ? 0.94 : 1,
          ...(pressed ? { transform: [{ scale: 0.99 }] } : {}),
        })}
      >
        {/* :zap: CHANGE 17: Fixed-height frame so list spacing is predictable */}
        <View
          onLayout={(e) => {
            const w = Math.max(0, Math.floor(e.nativeEvent.layout.width));
            if (w && w !== cardWidth) setCardWidth(w);
          }}
          style={{
            width: "100%",
            height: CARD_HEIGHT,
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          {/* :zap: CHANGE 18: Skia scrapbook background (no assets) */}
          {cardWidth > 0 ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <ScrapbookBackground
                width={cardWidth}
                height={CARD_HEIGHT}
                variant={variant}
                seed={a.id.length * 1337 + a.id.charCodeAt(0)}
              />
            </View>
          ) : null}

          {/* :zap: CHANGE 19: Content overlay, vertically centered (your request) */}
          <View
            style={{
              flex: 1,
              paddingHorizontal: 16,
              paddingVertical: 12,
              justifyContent: "center", // ✅ vertical center
            }}
          >
            {/* :zap: CHANGE 20: Always show ⋯ (top-right) */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setMenuOpen(true);
              }}
              hitSlop={16}
              style={({ pressed }) => ({
                position: "absolute",
                top: 6,
                right: 6,
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                backgroundColor: pressed
                  ? "rgba(255,255,255,0.70)"
                  : "rgba(255,255,255,0.55)",
              })}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  color: cardSubtextColor,
                }}
              >
                ⋯
              </Text>
            </Pressable>

            {/* :zap: CHANGE 21: Icon stays on the left (your request) */}
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "rgba(255,255,255,0.86)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 16 }}>{v.icon}</Text>
              </View>

              {/* Main */}
              <View style={{ flex: 1, gap: 5 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    ...FONT.title,
                    color: cardTitleColor,
                    paddingRight: 44,
                  }}
                >
                  {a.title_text}
                </Text>

                <View style={{ gap: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      ...FONT.placeName,
                      color: cardTextColor,
                    }}
                  >
                    {placeName}
                  </Text>

                  {placeAddress ? (
                    <Text
                      numberOfLines={1}
                      style={{
                        ...FONT.address,
                        color: cardSubtextColor,
                      }}
                    >
                      {placeAddress}
                    </Text>
                  ) : null}
                </View>

                {/* Chips */}
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                >
                  {isCreator ? (
                    <Chip
                      label={t("activityCard.chip_created")}
                      bg={cardTokens.createdBg}
                      border={cardTokens.createdBorder}
                      color={cardTokens.createdText}
                      bold
                    />
                  ) : null}

                  <Chip
                    label={t("activityCard.chip_time", { label: time.label })}
                    bg={timeChipStyle.bg}
                    border={timeChipStyle.border}
                    color={timeChipStyle.color}
                    bold={timeChipStyle.bold}
                  />

                  <Chip
                    label={t("activityCard.chip_pref", {
                      value: formatGenderPref(a.gender_pref, t),
                    })}
                    bg={cardTokens.chipBg}
                    border={cardTokens.chipBorder}
                    color={cardTokens.text}
                  />

                  <Chip
                    label={t("activityCard.chip_cap", {
                      value: formatCapacity(a.capacity, t),
                    })}
                    bg={cardTokens.chipBg}
                    border={cardTokens.chipBorder}
                    color={cardTokens.text}
                  />

                  {membershipState === "joined" ? (
                    <Chip
                      label={t("activityCard.chip_joined")}
                      bg={cardTokens.joinedBg}
                      border={cardTokens.joinedBorder}
                      color={cardTokens.joinedText}
                      bold
                    />
                  ) : membershipState === "left" ? (
                    <Chip
                      label={t("activityCard.chip_left")}
                      bg={cardTokens.chipBg}
                      border={cardTokens.chipBorder}
                      color={cardTokens.subtext}
                    />
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Menu */}
      <Modal
        transparent
        visible={menuOpen}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{
            flex: 1,
            backgroundColor: TOKENS.overlay,
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: TOKENS.surface,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderWidth: 1,
              borderColor: TOKENS.border,
              paddingTop: 10,
              paddingBottom: 12,
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 42,
                height: 4,
                borderRadius: 999,
                backgroundColor: TOKENS.subtext,
                marginBottom: 10,
              }}
            />

            {isCreator ? (
              <>
                <MenuItem
                  label={t("activityCard.menu.edit")}
                  onPress={() => runAction("edit")}
                />
                <MenuItem
                  label={t("activityCard.menu.delete")}
                  destructive
                  onPress={() => runAction("delete")}
                />
              </>
            ) : null}

            <MenuItem
              label={t("activityCard.menu.share")}
              onPress={() => runAction("share")}
            />
            <MenuItem
              label={t("activityCard.menu.report")}
              onPress={() => runAction("report")}
            />

            <View style={{ height: 8 }} />
            <MenuItem
              label={t("activityCard.menu.cancel")}
              onPress={() => setMenuOpen(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
