// app/(icon-preview)/all-icon.tsx
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/ui/theme/ThemeProvider";

import {
  Sparkle,
  Sparkle as Sparkle2,
  Compass,
  PaperPlaneTilt,
  Lightning,
  PartyPopper,
  MagicWand,
  Fire,
  ChatTeardropDots,
  BellRinging,
  UsersThree,
  Handshake,
  Heart,
  Star,
  SmileyWink,
  Coffee,
  ForkKnife,
  Martini,
  MusicNotes,
  MicrophoneStage,
  Ticket,
  Camera,
  MoonStars,
  SunHorizon,
  RocketLaunch,
  MapTrifold,
  Binoculars,
  Confetti,
  PlusCircle,
  SealCheck,
  GlobeHemisphereWest,
} from "phosphor-react-native";

// NOTE:
// - "App Icon" in real shipping app usually needs a raster image (PNG) in app.json / assets.
// - But this page helps you pick the *brand mark* (the symbol) first.

type Weight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";

type IconDef = {
  key: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Comp: any;
  vibe: "brand" | "action" | "social" | "night" | "food" | "discovery";
  note?: string;
};

export default function IconPreviewScreen() {
  const theme = useTheme();
  const bg = theme.colors.bg;
  const text = theme.colors.text;
  const subtext = theme.colors.subtext;
  const border = theme.colors.border;
  const surface = theme.colors.surface;

  const [weight, setWeight] = useState<Weight>("duotone");
  const [size, setSize] = useState(36);
  const [selectedKey, setSelectedKey] = useState<string>("sparkle");

  const icons: IconDef[] = useMemo(
    () => [
      // ===== BRAND MARK CANDIDATES (最代表你 app vibe) =====
      {
        key: "sparkle",
        label: "Sparkle",
        Comp: Sparkle,
        vibe: "brand",
        note: "spontaneous / cute / ‘let’s do sth now’",
      },
      {
        key: "magicwand",
        label: "MagicWand",
        Comp: MagicWand,
        vibe: "brand",
        note: "instantly create a plan",
      },
      {
        key: "compass",
        label: "Compass",
        Comp: Compass,
        vibe: "brand",
        note: "go somewhere / explore",
      },
      {
        key: "paperplane",
        label: "PaperPlaneTilt",
        Comp: PaperPlaneTilt,
        vibe: "brand",
        note: "shoot an invite / quick ping",
      },
      {
        key: "lightning",
        label: "Lightning",
        Comp: Lightning,
        vibe: "brand",
        note: "fast, spontaneous",
      },
      {
        key: "party",
        label: "PartyPopper",
        Comp: PartyPopper,
        vibe: "brand",
        note: "small fun hangouts",
      },
      {
        key: "rocket",
        label: "RocketLaunch",
        Comp: RocketLaunch,
        vibe: "brand",
        note: "let’s goooo",
      },
      {
        key: "moon",
        label: "MoonStars",
        Comp: MoonStars,
        vibe: "brand",
        note: "night vibe / after-work plans",
      },
      {
        key: "binoculars",
        label: "Binoculars",
        Comp: Binoculars,
        vibe: "brand",
        note: "find something interesting",
      },
      {
        key: "globe",
        label: "GlobeHemisphereWest",
        Comp: GlobeHemisphereWest,
        vibe: "brand",
        note: "nearby but open-world",
      },

      // ===== SOCIAL / CORE FEATURES =====
      {
        key: "chat",
        label: "ChatTeardropDots",
        Comp: ChatTeardropDots,
        vibe: "social",
        note: "IG-like chatroom feel",
      },
      {
        key: "users",
        label: "UsersThree",
        Comp: UsersThree,
        vibe: "social",
        note: "small group hangout",
      },
      {
        key: "handshake",
        label: "Handshake",
        Comp: Handshake,
        vibe: "social",
        note: "meet strangers safely",
      },
      {
        key: "heart",
        label: "Heart",
        Comp: Heart,
        vibe: "social",
        note: "follow host / vibe-match",
      },
      {
        key: "bell",
        label: "BellRinging",
        Comp: BellRinging,
        vibe: "social",
        note: "notifications",
      },
      {
        key: "verified",
        label: "SealCheck",
        Comp: SealCheck,
        vibe: "social",
        note: "trust / verified host (future)",
      },

      // ===== VIBE OBJECTS (你 app 常見活動) =====
      { key: "coffee", label: "Coffee", Comp: Coffee, vibe: "food" },
      { key: "fork", label: "ForkKnife", Comp: ForkKnife, vibe: "food" },
      { key: "martini", label: "Martini", Comp: Martini, vibe: "night" },
      { key: "music", label: "MusicNotes", Comp: MusicNotes, vibe: "night" },
      {
        key: "mic",
        label: "MicrophoneStage",
        Comp: MicrophoneStage,
        vibe: "night",
        note: "karaoke / performance night",
      },
      { key: "ticket", label: "Ticket", Comp: Ticket, vibe: "discovery" },
      { key: "camera", label: "Camera", Comp: Camera, vibe: "discovery" },

      // ===== EXTRA “CUTE ENERGY” =====
      { key: "star", label: "Star", Comp: Star, vibe: "action" },
      { key: "wink", label: "SmileyWink", Comp: SmileyWink, vibe: "action" },
      { key: "fire", label: "Fire", Comp: Fire, vibe: "action" },
      { key: "confetti", label: "Confetti", Comp: Confetti, vibe: "action" },

      // ===== OPTIONAL MAP SYMBOL (你如果真係要) =====
      { key: "map", label: "MapTrifold", Comp: MapTrifold, vibe: "discovery" },

      // ===== ACTION =====
      { key: "plus", label: "PlusCircle", Comp: PlusCircle, vibe: "action" },
      { key: "sun", label: "SunHorizon", Comp: SunHorizon, vibe: "action" },
    ],
    []
  );

  const selected = icons.find((x) => x.key === selectedKey) ?? icons[0];

  const weights: Weight[] = [
    "thin",
    "light",
    "regular",
    "bold",
    "fill",
    "duotone",
  ];

  const vibeColor = (v: IconDef["vibe"]) => {
    // keep it simple: map to theme text/subtext/surface; no hard-coded fancy colors
    if (v === "brand") return text;
    if (v === "social") return text;
    return text;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 14,
        }}
      >
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: text }}>
            Icon Preview — Brand Marks
          </Text>
          <Text style={{ fontSize: 13, color: subtext, lineHeight: 18 }}>
            揀一個最代表你 app 嘅「符號」：spontaneous / small hangouts / invite
            strangers. 你之後先再用呢個符號做真正 App Icon (PNG).
          </Text>
        </View>

        {/* Controls */}
        <View
          style={{
            borderWidth: 1,
            borderColor: border,
            backgroundColor: surface,
            borderRadius: 14,
            padding: 12,
            gap: 10,
          }}
        >
          <Text style={{ fontWeight: "900", color: text }}>Controls</Text>

          {/* Weight selector */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {weights.map((w) => {
              const on = w === weight;
              return (
                <Pressable
                  key={w}
                  onPress={() => setWeight(w)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: border,
                    backgroundColor: on ? bg : surface,
                    opacity: on ? 1 : 0.75,
                  }}
                >
                  <Text style={{ fontWeight: "800", color: text }}>{w}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Size selector */}
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {[28, 32, 36, 44, 52].map((s) => {
              const on = s === size;
              return (
                <Pressable
                  key={s}
                  onPress={() => setSize(s)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: border,
                    backgroundColor: on ? bg : surface,
                    opacity: on ? 1 : 0.75,
                  }}
                >
                  <Text style={{ fontWeight: "800", color: text }}>{s}px</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Big preview */}
        <View
          style={{
            borderWidth: 1,
            borderColor: border,
            backgroundColor: surface,
            borderRadius: 16,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: border,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: bg,
              }}
            >
              <selected.Comp size={46} weight={weight} color={text} />
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: text }}>
                {selected.label}
              </Text>
              <Text style={{ fontSize: 12, color: subtext }}>
                vibe: {selected.vibe}
              </Text>
              {selected.note ? (
                <Text style={{ fontSize: 12, color: subtext }}>
                  {selected.note}
                </Text>
              ) : null}
            </View>
          </View>

          <View
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: border,
              backgroundColor: bg,
            }}
          >
            <Text style={{ fontWeight: "900", color: text }}>pick</Text>
          </View>
        </View>

        {/* Grid */}
        <View
          style={{
            borderWidth: 1,
            borderColor: border,
            backgroundColor: surface,
            borderRadius: 16,
            padding: 12,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "900", color: text }}>
            Candidates (tap to preview)
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {icons.map((it) => {
              const active = it.key === selectedKey;
              return (
                <Pressable
                  key={it.key}
                  onPress={() => setSelectedKey(it.key)}
                  style={({ pressed }) => ({
                    width: "30%",
                    minWidth: 98,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: border,
                    backgroundColor: active ? bg : surface,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    gap: 8,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <View style={{ alignItems: "center", gap: 8 }}>
                    <it.Comp
                      size={size}
                      weight={weight}
                      color={vibeColor(it.vibe)}
                    />
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: text,
                        textAlign: "center",
                      }}
                    >
                      {it.label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 11,
                        color: subtext,
                        textAlign: "center",
                      }}
                    >
                      {it.vibe}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ paddingBottom: 24 }}>
          <Text style={{ fontSize: 12, color: subtext, lineHeight: 18 }}>
            小提示：如果你想個 App Icon 更「獨特」，
            最常見做法係：揀一個符號（例如 Sparkle / MagicWand / Compass），
            然後用同一個符號配你嘅色／形狀（例如圓角方塊、貼紙感、玻璃感），
            最終輸出成 PNG 做真正 app icon。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
