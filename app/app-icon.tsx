// app/all-icon.tsx
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../src/ui/theme/ThemeProvider";

type Lib = "ion" | "mci";

type IconItem = {
  lib: Lib;
  name: string;
  label: string;
  vibe: "brand" | "social" | "night" | "food" | "discovery" | "action";
  note?: string;
};

export default function AllIconScreen() {
  const theme = useTheme();
  const bg = theme.colors.bg;
  const surface = theme.colors.surface;
  const border = theme.colors.border;
  const text = theme.colors.text;
  const subtext = theme.colors.subtext;

  const [size, setSize] = useState(36);
  const [selected, setSelected] = useState<IconItem | null>(null);

  const icons: IconItem[] = useMemo(
    () => [
      // ===== Brand marks (代表你 app：即興、小活動、快邀請) =====
      {
        lib: "mci",
        name: "sparkles",
        label: "sparkles",
        vibe: "brand",
        note: "spontaneous / cute",
      },
      {
        lib: "mci",
        name: "magic-staff",
        label: "magic-staff",
        vibe: "brand",
        note: "instantly create plan",
      },
      {
        lib: "mci",
        name: "compass-rose",
        label: "compass-rose",
        vibe: "brand",
        note: "go somewhere",
      },
      {
        lib: "mci",
        name: "send-circle",
        label: "send-circle",
        vibe: "brand",
        note: "shoot an invite",
      },
      {
        lib: "mci",
        name: "lightning-bolt-circle",
        label: "lightning-bolt-circle",
        vibe: "brand",
        note: "fast now vibe",
      },
      {
        lib: "mci",
        name: "party-popper",
        label: "party-popper",
        vibe: "brand",
        note: "small fun hangout",
      },
      {
        lib: "mci",
        name: "rocket-launch",
        label: "rocket-launch",
        vibe: "brand",
        note: "let’s go",
      },
      {
        lib: "mci",
        name: "moon-waning-crescent",
        label: "moon-waning-crescent",
        vibe: "brand",
        note: "after-work night vibe",
      },
      {
        lib: "mci",
        name: "binoculars",
        label: "binoculars",
        vibe: "brand",
        note: "discover nearby",
      },

      // ===== Social / core =====
      {
        lib: "mci",
        name: "account-group",
        label: "account-group",
        vibe: "social",
      },
      { lib: "mci", name: "handshake", label: "handshake", vibe: "social" },
      {
        lib: "mci",
        name: "chat-processing",
        label: "chat-processing",
        vibe: "social",
      },
      { lib: "mci", name: "bell-ring", label: "bell-ring", vibe: "social" },
      {
        lib: "mci",
        name: "heart-circle",
        label: "heart-circle",
        vibe: "social",
      },
      {
        lib: "mci",
        name: "shield-check",
        label: "shield-check",
        vibe: "social",
      },

      // ===== Activity vibe objects =====
      {
        lib: "mci",
        name: "silverware-fork-knife",
        label: "fork-knife",
        vibe: "food",
      },
      { lib: "mci", name: "coffee", label: "coffee", vibe: "food" },
      { lib: "mci", name: "noodles", label: "noodles", vibe: "food" },
      { lib: "mci", name: "martini", label: "martini", vibe: "night" },
      { lib: "mci", name: "music", label: "music", vibe: "night" },
      {
        lib: "mci",
        name: "microphone-variant",
        label: "microphone",
        vibe: "night",
        note: "karaoke",
      },
      { lib: "mci", name: "glass-cocktail", label: "cocktail", vibe: "night" },

      // ===== Optional map button symbols =====
      {
        lib: "ion",
        name: "map-outline",
        label: "map-outline",
        vibe: "discovery",
      },
      {
        lib: "ion",
        name: "location-outline",
        label: "location-outline",
        vibe: "discovery",
      },
      {
        lib: "mci",
        name: "map-search-outline",
        label: "map-search-outline",
        vibe: "discovery",
      },

      // ===== Actions =====
      {
        lib: "ion",
        name: "add-circle-outline",
        label: "add-circle-outline",
        vibe: "action",
      },
      {
        lib: "mci",
        name: "plus-circle-outline",
        label: "plus-circle-outline",
        vibe: "action",
      },
      {
        lib: "mci",
        name: "creation-outline",
        label: "creation-outline",
        vibe: "action",
      },
    ],
    []
  );

  const renderIcon = (it: IconItem, iconSize: number, color: string) => {
    if (it.lib === "ion") {
      return <Ionicons name={it.name as any} size={iconSize} color={color} />;
    }
    return (
      <MaterialCommunityIcons
        name={it.name as any}
        size={iconSize}
        color={color}
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: text }}>
            All Icons — Pick your App vibe
          </Text>
          <Text style={{ fontSize: 13, color: subtext, lineHeight: 18 }}>
            呢頁係「揀品牌符號」用：你揀中 2–3 個，我再幫你做真正 app icon
            感（比例/背景/重心）。
          </Text>
        </View>

        {/* Size controls */}
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
          <Text style={{ fontWeight: "900", color: text }}>Size</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {[24, 28, 32, 36, 44, 52].map((s) => {
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
          {selected ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  flex: 1,
                }}
              >
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
                  {renderIcon(selected, 46, text)}
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{ fontSize: 16, fontWeight: "900", color: text }}
                  >
                    {selected.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: subtext }}>
                    lib: {selected.lib} · vibe: {selected.vibe}
                  </Text>
                  {selected.note ? (
                    <Text style={{ fontSize: 12, color: subtext }}>
                      {selected.note}
                    </Text>
                  ) : null}
                  <Text style={{ fontSize: 12, color: subtext }}>
                    name: {selected.name}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setSelected(null)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: border,
                  backgroundColor: bg,
                }}
              >
                <Text style={{ fontWeight: "900", color: text }}>clear</Text>
              </Pressable>
            </>
          ) : (
            <Text style={{ color: subtext }}>
              Tap any icon below to preview
            </Text>
          )}
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
            Candidates (tap)
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {icons.map((it) => {
              const active =
                selected?.name === it.name && selected?.lib === it.lib;
              return (
                <Pressable
                  key={`${it.lib}:${it.name}`}
                  onPress={() => setSelected(it)}
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
                    {renderIcon(it, size, text)}
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
            你揀中 2–3 個「brand」類（sparkles / magic-staff / compass-rose /
            send-circle）， 我就幫你做一個「真·App Icon」嘅配方（背景 shape +
            立體感 + 你個 vibe）。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
