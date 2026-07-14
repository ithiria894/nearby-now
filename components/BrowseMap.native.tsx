import { useMemo } from "react";
import { Text, View } from "react-native";
import type { ActivityCardActivity } from "../lib/domain/activities";
import { useT } from "../lib/i18n/useT";
import { useTheme } from "../src/ui/theme/ThemeProvider";
import AppMap from "./map/MapView";
import type { MapMarker } from "./map/MapView.types";

type Props = {
  items: ActivityCardActivity[];
  onPressCard: (activity: ActivityCardActivity) => void;
  onRequestList?: () => void;
};

// Vancouver default viewport (the app is Vancouver-local).
const INITIAL_REGION = {
  latitude: 49.2827,
  longitude: -123.1207,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function BrowseMap({
  items,
  onPressCard,
  onRequestList,
}: Props) {
  const { t } = useT();
  const theme = useTheme();

  const mappable = useMemo(
    () =>
      items.filter(
        (a) =>
          Number.isFinite(a.lat as number) && Number.isFinite(a.lng as number)
      ),
    [items]
  );

  const markers = useMemo<MapMarker[]>(
    () =>
      mappable.map((a) => ({
        id: a.id,
        lat: a.lat as number,
        lng: a.lng as number,
        title: a.title_text,
        subtitle: a.place_name ?? a.place_text ?? null,
      })),
    [mappable]
  );

  // Fit the viewport to the markers so the pins are actually visible, instead of
  // always showing the hardcoded Vancouver default. Falls back to Vancouver when
  // there are no markers to frame.
  const initialRegion = useMemo(() => {
    if (markers.length === 0) return INITIAL_REGION;
    const lats = markers.map((m) => m.lat);
    const lngs = markers.map((m) => m.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      // Pad the span so edge pins aren't flush to the frame; clamp to a minimum
      // so a single marker doesn't over-zoom.
      latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.02),
      longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.02),
    };
  }, [markers]);

  const handleMarkerPress = (id: string) => {
    const activity = mappable.find((a) => a.id === id);
    if (activity) onPressCard(activity);
  };

  return (
    <View style={{ flex: 1 }}>
      <AppMap
        markers={markers}
        initialRegion={initialRegion}
        onMarkerPress={handleMarkerPress}
        onRequestList={onRequestList}
      />
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
          {t("browseMap.countInArea", { count: markers.length })}
        </Text>
      </View>
    </View>
  );
}
