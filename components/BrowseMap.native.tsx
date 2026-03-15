import { Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import type { ActivityCardActivity } from "./ActivityCard";
import { useT } from "../lib/i18n/useT";
import { useTheme } from "../src/ui/theme/ThemeProvider";

type Props = {
  items: ActivityCardActivity[];
  onPressCard: (activity: ActivityCardActivity) => void;
  onRequestList?: () => void;
};

export default function BrowseMap({ items, onPressCard }: Props) {
  const { t } = useT();
  const theme = useTheme();
  const mapRegion = {
    latitude: 49.2827,
    longitude: -123.1207,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  const mappable = items.filter(
    (a) => Number.isFinite(a.lat as number) && Number.isFinite(a.lng as number)
  );

  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }} initialRegion={mapRegion}>
        {mappable.map((a) => (
          <Marker
            key={a.id}
            coordinate={{
              latitude: a.lat as number,
              longitude: a.lng as number,
            }}
            title={a.title_text}
            description={a.place_name ?? a.place_text ?? undefined}
            onPress={() => onPressCard(a)}
          />
        ))}
      </MapView>
      <View
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 16,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "700", color: theme.colors.subtitleText }}>
          {t("browseMap.countInArea", { count: mappable.length })}
        </Text>
      </View>
    </View>
  );
}
