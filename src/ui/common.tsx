import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTheme } from "./theme/ThemeProvider";

export function Screen({
  children,
  scroll,
  center,
  padding = 16,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  center?: boolean;
  padding?: number;
}) {
  const theme = useTheme();

  if (scroll) {
    return (
      <ScrollView
        style={{ backgroundColor: theme.colors.bg }}
        contentContainerStyle={{
          padding,
          gap: 12,
          justifyContent: center ? "center" : undefined,
        }}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        padding,
        gap: 12,
        justifyContent: center ? "center" : undefined,
        backgroundColor: theme.colors.bg,
      }}
    >
      {children}
    </View>
  );
}

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: Array<{ value: T; label: string }>;
}) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              opacity: selected ? 1 : 0.6,
            }}
          >
            <Text style={{ fontWeight: "800" }}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        alignItems: "center",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text style={{ fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        padding: 12,
        backgroundColor: theme.colors.surface,
      }}
    >
      {children}
    </View>
  );
}
