import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { Camera, Map, Marker } from "@maplibre/maplibre-react-native";
import { OSM_RASTER_STYLE_JSON } from "./osmRasterStyle";
import type { AppMapProps } from "./MapView.types";

// Native map implementation — MapLibre v11 + free OpenStreetMap tiles (no API
// key, no billing, no Google). The ONLY file that imports a map library; swap
// the provider here without touching any consumer.

// Approximate a MapRegion's longitudeDelta (degrees of viewport width) into a
// MapLibre zoom level. delta 0.08 (~city cluster) -> ~zoom 12.
function zoomFromDelta(longitudeDelta: number): number {
  const z = Math.log2(360 / Math.max(longitudeDelta, 0.0001));
  return Math.min(20, Math.max(1, z));
}

const PIN_COLOR = "#4C5BD4"; // brand indigo (matches app icon)

export default function AppMap({ markers, initialRegion, onMarkerPress }: AppMapProps) {
  const center = useMemo<[number, number]>(
    () => [initialRegion.longitude, initialRegion.latitude],
    [initialRegion.longitude, initialRegion.latitude],
  );
  const zoom = useMemo(
    () => zoomFromDelta(initialRegion.longitudeDelta),
    [initialRegion.longitudeDelta],
  );

  return (
    <Map style={{ flex: 1 }} mapStyle={OSM_RASTER_STYLE_JSON}>
      <Camera center={center} zoom={zoom} />
      {markers.map((m) => (
        <Marker key={m.id} lngLat={[m.lng, m.lat]}>
          <Pressable onPress={() => onMarkerPress?.(m.id)} hitSlop={10}>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: PIN_COLOR,
                borderWidth: 2,
                borderColor: "#ffffff",
              }}
            />
          </Pressable>
        </Marker>
      ))}
    </Map>
  );
}
