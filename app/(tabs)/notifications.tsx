import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useT } from "../../lib/i18n/useT";
import { useUIKit } from "../../src/ui/theme/useUIKit";
import { space } from "../../src/ui/theme/uikit";
import {
  BCard,
  BIconButton,
  BScreen,
  BText,
} from "../../src/ui/components/brutal";

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useT();
  const c = useUIKit();

  return (
    <BScreen c={c} scroll>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: c.yellow,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: c.border,
            }}
          >
            <MaterialCommunityIcons name="bell" size={22} color={c.ink} />
          </View>
          <BText c={c} v="h1" color={c.ink}>
            {t("notifications.title")}
          </BText>
        </View>
        <BIconButton
          c={c}
          icon="cog"
          onPress={() => router.push("/settings")}
        />
      </View>

      <BCard c={c}>
        <BText c={c} color={c.subtext}>
          {t("notifications.empty")}
        </BText>
      </BCard>
    </BScreen>
  );
}
