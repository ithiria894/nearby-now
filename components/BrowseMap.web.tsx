import { Pressable, Text, View } from "react-native";
import type { ActivityCardActivity } from "./ActivityCard";
import { useT } from "../lib/i18n/useT";
import { useTheme } from "../src/ui/theme/ThemeProvider";

type Props = {
  items: ActivityCardActivity[];
  onPressCard: (activity: ActivityCardActivity) => void;
  onRequestList?: () => void;
};

export default function BrowseMap({ onRequestList }: Props) {
  const { t } = useT();
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        gap: 10,
        backgroundColor: theme.colors.bg,
      }}
    >
      <Text style={{ opacity: 0.8 }}>{t("browseMap.webNotSupported")}</Text>
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
        <Text style={{ fontWeight: "700" }}>{t("browseMap.goToList")}</Text>
      </Pressable>
    </View>
  );
}
