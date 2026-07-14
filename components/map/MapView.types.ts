// Map abstraction layer — provider-agnostic interface.
//
// The whole app talks to the map ONLY through this interface, so the underlying
// provider (free OpenStreetMap now; could be Google/Apple/MapTiler later) is
// swappable in ONE place: MapView.native.tsx. No consumer imports a map library
// directly.

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title?: string | null;
  subtitle?: string | null;
};

export type MapRegion = {
  latitude: number;
  longitude: number;
  /** Latitude span of the viewport (degrees). */
  latitudeDelta: number;
  /** Longitude span of the viewport (degrees). */
  longitudeDelta: number;
};

export type AppMapProps = {
  markers: MapMarker[];
  initialRegion: MapRegion;
  onMarkerPress?: (id: string) => void;
  /** Shown on platforms with no native map (e.g. web) as a "go to list" action. */
  onRequestList?: () => void;
};
