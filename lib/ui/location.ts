import { Platform } from "react-native";
import * as Location from "expo-location";

export type DeviceLocation = {
  lat: number;
  lng: number;
  accuracy?: number | null;
};

export type AreaLocation = {
  lat: number;
  lng: number;
  label: string;
  approx?: boolean;
  source?: "device" | "ip" | "manual";
};

export type LocationResult =
  | { status: "granted"; location: DeviceLocation }
  | { status: "denied"; location: null }
  | { status: "unavailable"; location: null };

export async function requestDeviceLocation(): Promise<LocationResult> {
  if (Platform.OS === "web") {
    if (!("geolocation" in navigator)) {
      return { status: "unavailable", location: null };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            status: "granted",
            location: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy ?? null,
            },
          });
        },
        () => resolve({ status: "denied", location: null }),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    });
  }

  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== "granted") {
    return { status: "denied", location: null };
  }

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    status: "granted",
    location: {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? null,
    },
  };
}

/**
 * Device location for push targeting WITHOUT ever prompting: returns coords only
 * if foreground location permission is ALREADY granted, else null. Lets us keep
 * push_tokens.location fresh on browse open for users who've opted in, with no
 * disruptive permission dialog. (The nearby-activity push trigger excludes any
 * token whose location_updated_at is stale/NULL, so this write is what makes an
 * opted-in user actually reachable.)
 */
export async function getDeviceLocationIfGranted(): Promise<DeviceLocation | null> {
  if (Platform.OS === "web") return null;
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== "granted") return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? null,
    };
  } catch {
    return null;
  }
}

export async function reverseGeocodeLabel(
  loc: DeviceLocation
): Promise<string | null> {
  if (Platform.OS !== "web") {
    try {
      const rows = await Location.reverseGeocodeAsync({
        latitude: loc.lat,
        longitude: loc.lng,
      });
      const first = rows?.[0];
      if (!first) return null;
      const parts = [
        first.city || first.subregion || first.region,
        first.region || first.country,
      ].filter(Boolean);
      return parts.join(", ") || null;
    } catch {
      return null;
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc.lat}&lon=${loc.lng}`
    );
    const json = await res.json();
    const address = json?.address ?? {};
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      address.state;
    const region = address.state || address.country;
    const parts = [city, region].filter(Boolean);
    return parts.join(", ") || null;
  } catch {
    return null;
  }
}

export async function getIpLocation(): Promise<AreaLocation | null> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const json = await res.json();
    const lat = Number(json?.latitude);
    const lng = Number(json?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const city = (json?.city ?? "").trim();
    const region = (json?.region ?? json?.country_name ?? "").trim();
    const label = [city, region].filter(Boolean).join(", ") || "Nearby";
    return { lat, lng, label, approx: true };
  } catch {
    return null;
  }
}
