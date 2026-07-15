import { Pressable, Text, View } from "react-native";
import { useT } from "../../lib/i18n/useT";
import { useTheme } from "../../src/ui/theme/ThemeProvider";
import type { AppMapProps } from "./MapView.types";

// Base/fallback for the map abstraction (TS resolves the `./MapView` import
// here; Metro picks MapView.native.tsx / MapView.web.tsx per platform at bundle
// time). Renders a "go to list" fallback for any platform without a native map.
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
