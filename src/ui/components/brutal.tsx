// =============================================================================
// Neo-brutalist canonical components — consume src/ui/theme/uikit.ts tokens.
// Rendered live in /uidocs; these are what screens will adopt on rollout.
// Each takes `c: UIColors` so it works with the UIDocs local scheme toggle.
// =============================================================================
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  type DimensionValue,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Defs,
  Filter,
  FeColorMatrix,
  FeTurbulence,
  Rect,
} from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  borders,
  controls,
  fonts,
  hardShadow,
  layout,
  radius,
  space,
  typeScale,
  type TypeStyle,
  type UIColors,
} from "../theme/uikit";
import i18n from "../../../lib/i18n/i18n";

/* ---------- text ---------- */
// Per-language Noto CJK fallback order, so Chinese/Japanese glyphs render in the
// regionally-correct Noto face (SC vs TC vs JP forms differ).
function notoCjkStack(): string {
  switch (i18n.language) {
    case "ja":
      return '"Noto Sans JP", "Noto Sans SC", "Noto Sans TC"';
    case "zh-CN":
      return '"Noto Sans SC", "Noto Sans TC", "Noto Sans JP"';
    case "zh-HK":
      return '"Noto Sans TC", "Noto Sans SC", "Noto Sans JP"';
    default:
      return '"Noto Sans SC", "Noto Sans TC", "Noto Sans JP"';
  }
}

export function txt(style: TypeStyle, color: string) {
  // New direction: Noto for all UI text, loaded from Google Fonts on web (see
  // app/_layout.tsx). Latin uses Noto Sans, CJK falls through to the matching
  // Noto CJK face. The handwritten wordmark keeps its accent font. Native is
  // untouched — we deliberately don't bundle Noto (esp. the heavy CJK) there.
  let fontFamily: string = style.font;
  if (Platform.OS === "web") {
    const base = style.font === fonts.accent ? style.font : "Noto Sans";
    fontFamily = `${base}, ${notoCjkStack()}, sans-serif`;
  }
  return {
    fontFamily,
    fontSize: style.size,
    lineHeight: style.lineHeight,
    fontWeight: style.weight as any,
    letterSpacing: style.letterSpacing,
    textTransform: style.uppercase ? ("uppercase" as const) : undefined,
    color,
  };
}
export function BText({
  v = "body",
  c,
  color,
  style,
  numberOfLines,
  children,
}: {
  v?: keyof typeof typeScale;
  c: UIColors;
  color?: string;
  style?: any;
  numberOfLines?: number;
  children: React.ReactNode;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[txt(typeScale[v], color ?? c.text), style]}
    >
      {children}
    </Text>
  );
}

/* ---------- paper texture (subtle grain) ---------- */
export function PaperTexture({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Filter id="paperGrain">
            <FeTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves={2}
              stitchTiles="stitch"
              result="n"
            />
            <FeColorMatrix in="n" type="saturate" values="0" />
          </Filter>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          filter="url(#paperGrain)"
          opacity={opacity}
        />
      </Svg>
    </View>
  );
}

/* ---------- hard offset shadow (the neobrutalist signature) ---------- */
export function HardShadow({
  c,
  offset = hardShadow.md,
  radius: r = radius.lg,
  color,
  style,
  children,
}: {
  c: UIColors;
  offset?: { x: number; y: number };
  radius?: number;
  color?: string;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  return (
    <View style={[{ position: "relative" }, style]}>
      <View
        style={{
          position: "absolute",
          top: offset.y,
          left: offset.x,
          right: -offset.x,
          bottom: -offset.y,
          backgroundColor: color ?? c.shadow,
          borderRadius: r,
        }}
      />
      {children}
    </View>
  );
}

/* ---------- responsive max-width container (fit any screen) ---------- */
export function Container({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          width: "100%",
          maxWidth: layout.maxContentWidth,
          alignSelf: "center",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ---------- screen container (paper bg + grain + safe area + web-safe dismiss) ---------- */
export function BScreen({
  c,
  children,
  scroll,
  center,
  texture = true,
  appBar,
}: {
  c: UIColors;
  children: React.ReactNode;
  scroll?: boolean;
  center?: boolean;
  texture?: boolean;
  // Optional <BAppBar/> rendered edge-to-edge above the content. It provides
  // the top safe-area inset, so the body skips its own top edge.
  appBar?: React.ReactNode;
}) {
  // Cap the content column and center it so cards never stretch full-width on
  // a wide / tablet / desktop-web window (paper margins fill the sides).
  const column = (
    <View
      style={{
        width: "100%",
        maxWidth: layout.maxContentWidth,
        alignSelf: "center",
        gap: space.md,
      }}
    >
      {children}
    </View>
  );
  const body = scroll ? (
    <ScrollView
      style={{ backgroundColor: "transparent" }}
      contentContainerStyle={{
        padding: layout.screenPadding,
        flexGrow: 1,
        justifyContent: center ? "center" : undefined,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {column}
    </ScrollView>
  ) : (
    <View
      style={{
        flex: 1,
        padding: layout.screenPadding,
        justifyContent: center ? "center" : undefined,
      }}
    >
      {column}
    </View>
  );

  const framed = (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {texture ? <PaperTexture opacity={0.06} /> : null}
      {appBar}
      <SafeAreaView
        style={{ flex: 1 }}
        edges={appBar ? ["bottom", "left", "right"] : undefined}
      >
        {body}
      </SafeAreaView>
    </View>
  );

  // Native: tap outside to dismiss the keyboard. Web: NOT (it steals input focus).
  if (Platform.OS === "web") return framed;
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {framed}
    </TouchableWithoutFeedback>
  );
}

/* ---------- card ---------- */
export function BCard({
  c,
  children,
  fill,
  style,
  offset,
  shadowColor,
}: {
  c: UIColors;
  children: React.ReactNode;
  fill?: string;
  style?: ViewStyle;
  offset?: { x: number; y: number };
  shadowColor?: string; // colored shadow to HIGHLIGHT (border stays ink)
}) {
  return (
    <HardShadow
      c={c}
      color={shadowColor}
      radius={controls.cardRadius}
      offset={offset}
    >
      <View
        style={[
          {
            backgroundColor: fill ?? c.surface,
            borderWidth: controls.borderWidth,
            borderColor: c.border,
            borderRadius: controls.cardRadius,
            padding: controls.cardPadding,
            gap: space.md,
            overflow: "hidden",
          },
          style,
        ]}
      >
        {children}
      </View>
    </HardShadow>
  );
}

/* ---------- button (presses INTO its shadow) ---------- */
export type BTone = "primary" | "secondary" | "accent" | "danger";
export function BButton({
  c,
  tone = "primary",
  label,
  icon,
  onPress,
  full,
  shadowColor,
  highlight,
}: {
  c: UIColors;
  tone?: BTone;
  label: string;
  icon?: string;
  onPress?: () => void;
  full?: boolean;
  shadowColor?: string; // explicit colored shadow
  highlight?: boolean; // shadow matches the button's OWN fill (yellow button → yellow shadow)
}) {
  const map: Record<BTone, { bg: string; fg: string }> = {
    primary: { bg: c.brand, fg: c.onBrand },
    secondary: { bg: c.surface, fg: c.ink },
    accent: { bg: c.yellow, fg: c.onBright },
    danger: { bg: c.danger, fg: c.onBright },
  };
  const off = hardShadow.md;
  const face = map[tone];
  const hasShadow = tone !== "secondary"; // secondary = border only, NO shadow
  const shadow = shadowColor ?? (highlight ? face.bg : c.shadow); // highlight → match fill
  return (
    <Pressable
      onPress={onPress}
      style={{ alignSelf: full ? "stretch" : "flex-start" }}
    >
      {({ pressed }) => (
        <View style={{ position: "relative" }}>
          {hasShadow && !pressed && (
            <View
              style={{
                position: "absolute",
                top: off.y,
                left: off.x,
                right: -off.x,
                bottom: -off.y,
                backgroundColor: shadow,
                borderRadius: controls.buttonRadius,
              }}
            />
          )}
          <View
            style={{
              transform:
                hasShadow && pressed
                  ? [{ translateX: off.x }, { translateY: off.y }]
                  : [],
              opacity: !hasShadow && pressed ? 0.6 : 1,
              height: controls.buttonHeight,
              paddingHorizontal: controls.buttonPaddingX,
              borderRadius: controls.buttonRadius,
              borderWidth: controls.borderWidth,
              borderColor: c.border,
              backgroundColor: face.bg,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: space.sm,
            }}
          >
            {icon ? (
              <MaterialCommunityIcons
                name={icon as any}
                size={18}
                color={face.fg}
              />
            ) : null}
            <Text style={txt(typeScale.title, face.fg)}>{label}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

/* ---------- chip / pill ---------- */
export type ChipTone = "neutral" | "brand" | "success" | "danger" | "warn";
export function BChip({
  c,
  label,
  selected,
  tone = "neutral",
}: {
  c: UIColors;
  label: string;
  selected?: boolean;
  tone?: ChipTone;
}) {
  const t: Record<ChipTone, { bg: string; fg: string }> = {
    neutral: {
      bg: selected ? c.brand : c.surface,
      fg: selected ? c.onBrand : c.text,
    },
    brand: { bg: c.brand, fg: c.onBrand },
    success: { bg: c.mint, fg: c.onBright },
    danger: { bg: c.coral, fg: c.onBright },
    warn: { bg: c.yellow, fg: c.onBright },
  };
  return (
    <View
      style={{
        paddingVertical: controls.pillPaddingY,
        paddingHorizontal: controls.pillPaddingX,
        borderRadius: controls.pillRadius,
        borderWidth: 2,
        borderColor: c.border,
        backgroundColor: t[tone].bg,
      }}
    >
      <Text style={txt(typeScale.label, t[tone].fg)}>{label}</Text>
    </View>
  );
}

/* ---------- toggle (segmented switch) ---------- */
// A single pill container with 2+ segments; the active one is brand-filled.
// Use for view switches like List / Map. NO per-segment borders.
export function BToggle<T extends string>({
  c,
  value,
  onChange,
  options,
}: {
  c: UIColors;
  value: T;
  onChange: (v: T) => void;
  options: { value: NoInfer<T>; label: string; icon?: string }[];
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignSelf: "flex-start",
        borderWidth: controls.borderWidth,
        borderColor: c.border,
        borderRadius: radius.pill,
        backgroundColor: c.surface,
        padding: 3,
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingVertical: 7,
              paddingHorizontal: space.md,
              borderRadius: radius.pill,
              // subtle "raised" fill for the active segment — no color pop
              backgroundColor: on ? c.surfaceAlt : "transparent",
            }}
          >
            {o.icon ? (
              <MaterialCommunityIcons
                name={o.icon as any}
                size={16}
                color={on ? c.ink : c.subtext}
              />
            ) : null}
            <Text style={txt(typeScale.label, on ? c.ink : c.subtext)}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- input ---------- */
export function BInput({
  c,
  label,
  placeholder,
  hint,
  error,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  c: UIColors;
  label: string;
  placeholder: string;
  hint?: string;
  error?: string;
  value?: string;
  onChangeText?: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={txt(typeScale.label, c.subtext)}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.faint}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          height: controls.inputHeight,
          borderRadius: controls.inputRadius,
          borderWidth: controls.borderWidth,
          borderColor: error ? c.danger : c.ink,
          backgroundColor: c.surface,
          paddingHorizontal: controls.inputPaddingX,
          color: c.text,
          fontFamily: typeScale.body.font,
          fontSize: typeScale.body.size,
        }}
      />
      {error ? (
        <Text style={txt(typeScale.caption, c.danger)}>{error}</Text>
      ) : hint ? (
        <Text style={txt(typeScale.caption, c.subtext)}>{hint}</Text>
      ) : null}
    </View>
  );
}

/* ---------- badge ---------- */
export function BBadge({
  c,
  label,
  fill,
}: {
  c: UIColors;
  label: string;
  fill: string;
}) {
  return (
    <View
      style={{
        paddingVertical: 3,
        paddingHorizontal: space.sm,
        borderRadius: radius.sm,
        borderWidth: 2,
        borderColor: c.border,
        backgroundColor: fill,
      }}
    >
      <Text style={txt(typeScale.label, c.onBright)}>{label}</Text>
    </View>
  );
}

/* ---------- activity LIST (not individual cards — one container, divider rows) ---------- */
// Individual bordered+shadowed cards stack into visual noise. Instead, one
// list container carries the single border + hard shadow, and rows are
// separated by ink dividers. Pass `shadowColor` to highlight the whole list.
export function BList({
  c,
  children,
  shadowColor,
  style,
}: {
  c: UIColors;
  children: React.ReactNode;
  shadowColor?: string;
  style?: ViewStyle;
}) {
  return (
    <HardShadow c={c} color={shadowColor} radius={controls.cardRadius}>
      <View
        style={[
          {
            borderWidth: controls.borderWidth,
            borderColor: c.border,
            backgroundColor: c.surface,
            borderRadius: controls.cardRadius,
            overflow: "hidden",
          },
          style,
        ]}
      >
        {children}
      </View>
    </HardShadow>
  );
}

export function BActivityRow({
  c,
  icon,
  iconBg,
  title,
  meta,
  preview,
  previewMuted,
  badges,
  trailing,
  unread,
  last,
  accent,
  onPress,
}: {
  c: UIColors;
  icon: string; // MaterialCommunityIcons name (NO emoji)
  iconBg: string;
  title: string;
  meta: React.ReactNode; // string, or inline nodes (e.g. an icon + count)
  preview?: string; // conversation preview line, e.g. "Alex: see you there"
  previewMuted?: boolean; // dim the preview (system events / "no messages")
  badges?: React.ReactNode;
  trailing?: string; // small top-right text (e.g. distance, last-message time)
  unread?: number; // unread count bubble at the right edge (hidden when 0)
  last?: boolean;
  accent?: string; // optional left accent bar to flag an important row
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? c.surfaceAlt : "transparent",
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.md,
          paddingVertical: space.md,
          paddingHorizontal: space.md,
          borderBottomWidth: last ? 0 : borders.base,
          borderBottomColor: c.border,
          borderLeftWidth: accent ? 5 : 0,
          borderLeftColor: accent,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.sm,
            borderWidth: borders.base,
            borderColor: c.border,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={22}
            color={c.onBright}
          />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={txt(typeScale.title, c.ink)} numberOfLines={1}>
            {title}
          </Text>
          {preview ? (
            <Text
              style={
                previewMuted
                  ? txt(typeScale.caption, c.faint)
                  : [txt(typeScale.caption, c.text), { fontWeight: "600" }]
              }
              numberOfLines={1}
            >
              {preview}
            </Text>
          ) : null}
          <Text style={txt(typeScale.caption, c.subtext)} numberOfLines={1}>
            {meta}
          </Text>
          {badges ? (
            <View
              style={{
                flexDirection: "row",
                gap: space.sm,
                marginTop: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {badges}
            </View>
          ) : null}
        </View>
        {trailing || (unread && unread > 0) ? (
          // Time on top, unread badge beneath — one right-aligned column so the
          // time lines up across rows whether or not there's a badge.
          <View
            style={{
              alignSelf: "stretch",
              alignItems: "flex-end",
              justifyContent: "flex-start",
              gap: 6,
            }}
          >
            {trailing ? (
              <Text style={txt(typeScale.caption, c.subtext)} numberOfLines={1}>
                {trailing}
              </Text>
            ) : null}
            {unread && unread > 0 ? (
              <View
                style={{
                  minWidth: 22,
                  height: 22,
                  borderRadius: 11,
                  paddingHorizontal: 6,
                  backgroundColor: c.brand,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: c.onBrand, fontSize: 11, fontWeight: "800" }}
                >
                  {unread > 99 ? "99+" : String(unread)}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <MaterialCommunityIcons name="chevron-right" size={24} color={c.ink} />
      </View>
    </Pressable>
  );
}

/* ---------- composer (the big "create" entry with a ROTATING placeholder) ---------- */
// The primary create entry on the Feed. Its placeholder cycles through activity
// prompts to hint what NearbyNow is for (its positioning) — so a new user learns
// the app at a glance. Prominent: a large card with a bigger hard shadow.
export function BComposer({
  c,
  heading,
  placeholders,
  onPress,
}: {
  c: UIColors;
  heading: string;
  placeholders: string[];
  onPress?: () => void;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (placeholders.length < 2) return;
    const id = setInterval(
      () => setI((x) => (x + 1) % placeholders.length),
      3200
    );
    return () => clearInterval(id);
  }, [placeholders.length]);
  const ph = placeholders[i] ?? "";
  const Quick = ({ icon, text }: { icon: string; text: string }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <MaterialCommunityIcons name={icon as any} size={16} color={c.subtext} />
      <Text style={txt(typeScale.label, c.subtext)}>{text}</Text>
    </View>
  );
  return (
    <BCard c={c} offset={hardShadow.lg}>
      <Text style={txt(typeScale.title, c.ink)}>{heading}</Text>
      <Pressable
        onPress={onPress}
        style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.sm,
            borderWidth: borders.base,
            borderColor: c.border,
            backgroundColor: c.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons
            name="compass-rose"
            size={22}
            color={c.brand}
          />
        </View>
        <View
          style={{
            flex: 1,
            height: 44,
            borderRadius: radius.pill,
            borderWidth: borders.base,
            borderColor: c.border,
            backgroundColor: c.surface,
            justifyContent: "center",
            paddingHorizontal: space.md,
          }}
        >
          <Text numberOfLines={1} style={txt(typeScale.body, c.faint)}>
            {ph}
          </Text>
        </View>
      </Pressable>
      <View style={{ flexDirection: "row", gap: space.lg }}>
        <Quick icon="message-outline" text="Quick post" />
        <Quick icon="account-group" text="Join" />
      </View>
    </BCard>
  );
}

/* ---------- skeleton (loading placeholders) ---------- */
export function BSkeleton({
  c,
  width,
  height = 14,
  style,
}: {
  c: UIColors;
  width: DimensionValue;
  height?: number;
  style?: ViewStyle;
}) {
  const o = useSharedValue(0.45);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 750 }), -1, true);
  }, [o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius.sm,
          backgroundColor: c.surfaceAlt,
          borderWidth: borders.base,
          borderColor: c.border,
        },
        anim,
        style,
      ]}
    />
  );
}

export function BSkeletonRow({ c, last }: { c: UIColors; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: space.md,
        alignItems: "center",
        padding: space.md,
        borderBottomWidth: last ? 0 : borders.base,
        borderBottomColor: c.border,
      }}
    >
      <BSkeleton c={c} width={44} height={44} />
      <View style={{ flex: 1, gap: 8 }}>
        <BSkeleton c={c} width={"70%"} height={12} />
        <BSkeleton c={c} width={"45%"} height={10} />
      </View>
    </View>
  );
}

export function BSkeletonList({ c, rows = 3 }: { c: UIColors; rows?: number }) {
  return (
    <BList c={c}>
      {Array.from({ length: rows }).map((_, i) => (
        <BSkeletonRow key={i} c={c} last={i === rows - 1} />
      ))}
    </BList>
  );
}

/* ---------- navigation: bottom tab bar ---------- */
const TABS = [
  { key: "feed", label: "Feed", icon: "heart" },
  { key: "lobby", label: "Lobby", icon: "account-group" },
  { key: "created", label: "Created", icon: "pencil-box" },
  { key: "alerts", label: "Alerts", icon: "bell" },
] as const;

export function BTabBar({
  c,
  active = "feed",
}: {
  c: UIColors;
  active?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        height: controls.tabBarHeight,
        borderTopWidth: controls.borderWidth,
        borderColor: c.border,
        backgroundColor: c.surface,
        overflow: "hidden",
        borderBottomLeftRadius: radius.md,
        borderBottomRightRadius: radius.md,
      }}
    >
      {TABS.map((tb) => {
        const on = tb.key === active;
        // Tab items: NO border, NO shadow — just a color highlight on the
        // focused one (a filled brand block behind the icon + brand label).
        return (
          <View
            key={tb.key}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <View
              style={{
                width: 52,
                height: 30,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: on ? c.brand : "transparent",
              }}
            >
              <MaterialCommunityIcons
                name={tb.icon as any}
                size={22}
                color={on ? c.onBrand : c.subtext}
              />
            </View>
            <Text style={txt(typeScale.caption, on ? c.brand : c.subtext)}>
              {tb.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* ---------- borderless icon button (nav / utility) ---------- */
// Icon-only actions (back, ⋯, ✕, gear) get NO border + NO shadow — a frame on
// every one is visual noise. Just the icon + a tap target + pressed feedback.
export function BIconButton({
  c,
  icon,
  onPress,
  size = 24,
  color,
  accessibilityLabel,
}: {
  c: UIColors;
  icon: string;
  onPress?: () => void;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={controls.hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={size}
        color={color ?? c.ink}
      />
    </Pressable>
  );
}

/* ---------- navigation: top app bar ---------- */
// Soft-brutalist top bar: paper surface + 2px bottom ink border (mirrors the
// bottom tab bar), safe-area inset, content capped to maxContentWidth. Carries
// page info so screens don't need the plain native header:
//   [back] [icon tile?] [ title / subtitle / meta ]  ...  [right actions]
export function BAppBar({
  c,
  title,
  subtitle,
  onBack,
  backLabel,
  icon,
  iconBg,
  meta,
  right,
}: {
  c: UIColors;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  icon?: string;
  iconBg?: string;
  meta?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderBottomWidth: controls.borderWidth,
        borderColor: c.border,
      }}
    >
      <SafeAreaView edges={["top"]}>
        <View
          style={{
            width: "100%",
            maxWidth: layout.maxContentWidth,
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "center",
            gap: space.sm,
            paddingHorizontal: space.md,
            paddingVertical: space.sm,
          }}
        >
          {onBack ? (
            <BIconButton
              c={c}
              icon="chevron-left"
              size={26}
              onPress={onBack}
              accessibilityLabel={backLabel ?? "Go back"}
            />
          ) : null}
          {icon ? (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.sm,
                backgroundColor: iconBg ?? c.surfaceAlt,
                borderWidth: controls.borderWidth,
                borderColor: c.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name={icon as any}
                size={20}
                color={c.ink}
              />
            </View>
          ) : null}
          <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
            <Text style={txt(typeScale.h2, c.ink)} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={txt(typeScale.caption, c.subtext)} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            {meta ? (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: space.xs,
                  marginTop: 2,
                }}
              >
                {meta}
              </View>
            ) : null}
          </View>
          {right ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.xs,
              }}
            >
              {right}
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}
