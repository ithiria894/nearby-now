import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import type { UIColors } from "../src/ui/theme/uikit";
import { radius, space } from "../src/ui/theme/uikit";

export type PickerKind = "category" | "vibe" | "sort";

function Pill({
  c,
  label,
  active,
  icon,
  onPress,
}: {
  c: UIColors;
  label: string;
  active: boolean;
  icon?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        borderWidth: 2,
        borderColor: active ? c.brand : c.border,
        backgroundColor: active ? c.brand : c.surface,
      }}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon as any}
          size={14}
          color={active ? c.onBrand : c.subtext}
        />
      ) : null}
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: active ? c.onBrand : c.text,
        }}
      >
        {label}
      </Text>
      <MaterialCommunityIcons
        name="chevron-down"
        size={14}
        color={active ? c.onBrand : c.subtext}
      />
    </Pressable>
  );
}

/**
 * The compact filter/sort row: a List/Map toggle slot (`left`) plus three
 * dropdown pills (Category / Vibe / Sort). Tapping a pill calls `onOpen(kind)`
 * so the parent can present a single shared picker sheet. Rendered both in the
 * scroll header and as the sticky bar, so it's stateless.
 */
export function FeedFilterPills({
  c,
  left,
  catLabel,
  catActive,
  vibeLabel,
  vibeActive,
  sortLabel,
  sortActive,
  onOpen,
}: {
  c: UIColors;
  left?: React.ReactNode;
  catLabel: string;
  catActive: boolean;
  vibeLabel: string;
  vibeActive: boolean;
  sortLabel: string;
  sortActive: boolean;
  onOpen: (kind: PickerKind) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      {left}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        contentContainerStyle={{
          gap: space.sm,
          alignItems: "center",
          paddingVertical: 2,
        }}
      >
        <Pill
          c={c}
          label={catLabel}
          active={catActive}
          onPress={() => onOpen("category")}
        />
        <Pill
          c={c}
          label={vibeLabel}
          active={vibeActive}
          onPress={() => onOpen("vibe")}
        />
        <Pill
          c={c}
          label={sortLabel}
          active={sortActive}
          icon="sort-variant"
          onPress={() => onOpen("sort")}
        />
      </ScrollView>
    </View>
  );
}
