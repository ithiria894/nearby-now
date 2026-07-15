import React from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "./theme/ThemeProvider";

// Tap-to-dismiss-keyboard wrapper. On web, react-native-web's
// TouchableWithoutFeedback fires onPress for clicks that BUBBLE up from
// children (including TextInputs), so wrapping the screen here would call
// Keyboard.dismiss() on every field tap and immediately blur the input —
// making typing impossible. Web has no soft keyboard to dismiss anyway, so we
// only apply the wrapper on native.
function DismissKeyboardWrapper({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") return <>{children}</>;
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </TouchableWithoutFeedback>
  );
}

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
      <DismissKeyboardWrapper>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
          <ScrollView
            style={{ backgroundColor: theme.colors.bg }}
            contentContainerStyle={{
              padding,
              gap: 12,
              justifyContent: center ? "center" : undefined,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </SafeAreaView>
      </DismissKeyboardWrapper>
    );
  }

  return (
    <DismissKeyboardWrapper>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.colors.bg,
        }}
      >
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
      </SafeAreaView>
    </DismissKeyboardWrapper>
  );
}

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: NoInfer<T>) => void;
  items: Array<{ value: T; label: string }>;
}) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <PillButton
            key={item.value}
            label={item.label}
            onPress={() => onChange(item.value)}
            selected={selected}
            textColor={theme.colors.segmentedTabTextInactive}
          />
        );
      })}
    </View>
  );
}

export function PillButton({
  label,
  onPress,
  selected,
  disabled,
  tone = "default",
  textColor,
  icon,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  tone?: "default" | "success" | "danger";
  textColor?: string;
  icon?: React.ReactNode;
}) {
  const theme = useTheme();
  const isSelected = !!selected;
  const isSuccess = tone === "success";
  const isDanger = tone === "danger";

  const baseBorder = isSuccess
    ? theme.colors.okBorder
    : isDanger
      ? theme.colors.dangerBorder
      : isSelected
        ? theme.colors.brandBorder
        : theme.colors.border;

  const baseBg = isSuccess
    ? theme.colors.okBg
    : isDanger
      ? theme.colors.dangerBg
      : isSelected
        ? theme.colors.brandSurfaceAlt
        : theme.colors.surface;

  const pressedBg = isSuccess
    ? theme.colors.okBg
    : isDanger
      ? theme.colors.dangerBg
      : isSelected
        ? theme.colors.brandSurfacePressed
        : theme.colors.surfaceAlt;

  const labelColor = isSuccess
    ? theme.colors.okText
    : isDanger
      ? theme.colors.dangerText
      : isSelected
        ? theme.colors.text
        : (textColor ?? theme.colors.text);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: baseBorder,
        backgroundColor: pressed ? pressedBg : baseBg,
        opacity: disabled ? 0.6 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {icon}
        <Text style={{ fontWeight: "800", color: labelColor }}>{label}</Text>
      </View>
    </Pressable>
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

export function PageTitle({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontFamily: "ShortStack",
        fontSize: 24,
        fontWeight: "800",
        color: theme.colors.ink,
        letterSpacing: 0.2,
      }}
    >
      {children}
    </Text>
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
