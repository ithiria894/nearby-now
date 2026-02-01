// app/icon-preview.tsx
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

type IconSet = "Ionicons" | "MaterialCommunityIcons";

type IconItem = {
  set: IconSet;
  name: string;
};

const ICONS: IconItem[] = [
  // ---- Ionicons: map / location / explore vibes ----
  { set: "Ionicons", name: "map" },
  { set: "Ionicons", name: "map-outline" },
  { set: "Ionicons", name: "navigate" },
  { set: "Ionicons", name: "navigate-outline" },
  { set: "Ionicons", name: "navigate-circle" },
  { set: "Ionicons", name: "navigate-circle-outline" },
  { set: "Ionicons", name: "location" },
  { set: "Ionicons", name: "location-outline" },
  { set: "Ionicons", name: "location-sharp" },
  { set: "Ionicons", name: "pin" },
  { set: "Ionicons", name: "pin-outline" },
  { set: "Ionicons", name: "compass" },
  { set: "Ionicons", name: "compass-outline" },
  { set: "Ionicons", name: "trail-sign" },
  { set: "Ionicons", name: "trail-sign-outline" },
  { set: "Ionicons", name: "earth" },
  { set: "Ionicons", name: "earth-outline" },
  { set: "Ionicons", name: "search" },
  { set: "Ionicons", name: "search-outline" },

  // ---- MaterialCommunityIcons: map / navigation (often more choices) ----
  { set: "MaterialCommunityIcons", name: "map" },
  { set: "MaterialCommunityIcons", name: "map-outline" },
  { set: "MaterialCommunityIcons", name: "map-marker" },
  { set: "MaterialCommunityIcons", name: "map-marker-outline" },
  { set: "MaterialCommunityIcons", name: "map-marker-radius" },
  { set: "MaterialCommunityIcons", name: "map-marker-radius-outline" },
  { set: "MaterialCommunityIcons", name: "map-marker-path" },
  { set: "MaterialCommunityIcons", name: "compass" },
  { set: "MaterialCommunityIcons", name: "compass-outline" },
  { set: "MaterialCommunityIcons", name: "compass-rose" },
  { set: "MaterialCommunityIcons", name: "navigation" },
  { set: "MaterialCommunityIcons", name: "navigation-outline" },
  { set: "MaterialCommunityIcons", name: "crosshairs-gps" },
  { set: "MaterialCommunityIcons", name: "crosshairs" },
  { set: "MaterialCommunityIcons", name: "radar" },
  { set: "MaterialCommunityIcons", name: "radar" },
  { set: "MaterialCommunityIcons", name: "google-maps" },
  { set: "MaterialCommunityIcons", name: "near-me" },
  { set: "MaterialCommunityIcons", name: "near-me" },
];

function renderIcon(set: IconSet, name: string, size: number, color: string) {
  if (set === "Ionicons")
    return <Ionicons name={name as any} size={size} color={color} />;
  return (
    <MaterialCommunityIcons name={name as any} size={size} color={color} />
  );
}

export default function IconPreviewScreen() {
  const [q, setQ] = useState("");
  const [setFilter, setSetFilter] = useState<IconSet | "All">("All");

  const data = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return ICONS.filter((x) => {
      const okSet = setFilter === "All" ? true : x.set === setFilter;
      const okQ = !qq ? true : x.name.toLowerCase().includes(qq);
      return okSet && okQ;
    });
  }, [q, setFilter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F2EA" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: "#2E2A25" }}>
          Icon Preview
        </Text>

        {/* search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderWidth: 1,
            borderColor: "#E4DCCE",
            backgroundColor: "#F1ECE3",
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Ionicons name="search" size={18} color="#8B847B" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="search icon name… e.g. map / location / compass"
            placeholderTextColor="#9C9388"
            style={{ flex: 1, fontSize: 14, color: "#3A342E" }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            onPress={() => setQ("")}
            hitSlop={10}
            style={{ padding: 2 }}
          >
            <Ionicons name="close-circle" size={18} color="#9C9388" />
          </Pressable>
        </View>

        {/* set filter */}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {(["All", "Ionicons", "MaterialCommunityIcons"] as const).map((v) => {
            const selected = setFilter === v;
            return (
              <Pressable
                key={v}
                onPress={() => setSetFilter(v)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "#D6E6C8",
                  backgroundColor: selected ? "#EAF4E2" : "#FFFFFF",
                  opacity: selected ? 1 : 0.75,
                }}
              >
                <Text style={{ fontWeight: "800", color: "#2E2A25" }}>{v}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ opacity: 0.7, color: "#3A342E" }}>
          Showing {data.length} icons — tap one to see its name.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: 10,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {data.map((x) => (
          <Pressable
            key={`${x.set}:${x.name}`}
            onPress={() => Alert.alert("Icon name", `${x.set} / ${x.name}`)}
            style={({ pressed }) => ({
              width: "30%",
              minWidth: 110,
              borderWidth: 1,
              borderColor: "#E7DFD2",
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 10,
              alignItems: "center",
              gap: 10,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {renderIcon(x.set, x.name, 28, "#4F7E40")}
            <Text style={{ fontSize: 12, fontWeight: "800", color: "#3A342E" }}>
              {x.name}
            </Text>
            <Text style={{ fontSize: 11, opacity: 0.6, color: "#3A342E" }}>
              {x.set}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
