import { Pressable, Text, View } from "react-native";
import { useT } from "../../lib/i18n/useT";
import { useTheme } from "../../src/ui/theme/ThemeProvider";
import type { AppMapProps } from "./MapView.types";

// Web has no native map view — fall back to a "go to list" prompt.
// Kept behind the same AppMapProps interface so the provider swap stays in one
// place (MapView.native.tsx). Only onRequestList is used here.
export default function AppMap({ onRequestList }: AppMapProps) {
  const { t } = useT();
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: 16, gap: 10, backgroundColor: "transparent" }}>
      <Text style={{ color: theme.colors.subtitleText }}>
        {t("browseMap.webNotSupported")}
      </Text>
      <Pressable
        onPress={onRequestList}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          alignSelf: "flex-start",
        }}
      >
        <Text style={{ fontWeight: "700", color: theme.colors.text }}>
          {t("browseMap.goToList")}
        </Text>
      </Pressable>
    </View>
  );
}
