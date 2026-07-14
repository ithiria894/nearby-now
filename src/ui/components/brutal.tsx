// =============================================================================
// Neo-brutalist canonical components — consume src/ui/theme/uikit.ts tokens.
// Rendered live in /uidocs; these are what screens will adopt on rollout.
// Each takes `c: UIColors` so it works with the UIDocs local scheme toggle.
// =============================================================================
import React, { useEffect } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type DimensionValue,
  type ViewStyle,
} from "react-native";
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
  hardShadow,
  layout,
  radius,
  space,
  typeScale,
  type TypeStyle,
  type UIColors,
} from "../theme/uikit";

/* ---------- text ---------- */
export function txt(style: TypeStyle, color: string) {
  return {
    fontFamily: style.font,
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

/* ---------- input ---------- */
export function BInput({
  c,
  label,
  placeholder,
  hint,
  error,
  value,
}: {
  c: UIColors;
  label: string;
  placeholder: string;
  hint?: string;
  error?: string;
  value?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={txt(typeScale.label, c.subtext)}>{label}</Text>
      <TextInput
        defaultValue={value}
        placeholder={placeholder}
        placeholderTextColor={c.faint}
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
  badges,
  last,
  accent,
  onPress,
}: {
  c: UIColors;
  icon: string; // MaterialCommunityIcons name (NO emoji)
  iconBg: string;
  title: string;
  meta: string;
  badges?: React.ReactNode;
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
          <Text style={txt(typeScale.caption, c.subtext)} numberOfLines={1}>
            {meta}
          </Text>
          {badges ? (
            <View style={{ flexDirection: "row", gap: space.sm, marginTop: 2 }}>
              {badges}
            </View>
          ) : null}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={c.ink} />
      </View>
    </Pressable>
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
}: {
  c: UIColors;
  icon: string;
  onPress?: () => void;
  size?: number;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={controls.hitSlop}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
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

/* ---------- navigation: top header / nav bar ---------- */
export function BHeader({
  c,
  title,
  action,
}: {
  c: UIColors;
  title: string;
  action?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderBottomWidth: controls.borderWidth,
        borderColor: c.border,
        backgroundColor: c.surface,
        borderTopLeftRadius: radius.md,
        borderTopRightRadius: radius.md,
      }}
    >
      <BIconButton c={c} icon="chevron-left" size={26} />
      <Text style={[txt(typeScale.h2, c.ink), { flex: 1 }]} numberOfLines={1}>
        {title}
      </Text>
      {action ? <BIconButton c={c} icon={action} /> : null}
    </View>
  );
}
