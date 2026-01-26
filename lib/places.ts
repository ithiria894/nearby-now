// Free geocoding via OpenStreetMap Nominatim
export type PlaceCandidate = {
  placeId: string; // Nominatim "place_id" (stringified)
  name: string; // big text
  address: string; // small text
  lat: number;
  lng: number;
};

export async function searchPlacesNominatim(
  query: string
): Promise<PlaceCandidate[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?q=${encodeURIComponent(q)}` +
    "&format=jsonv2" +
    "&addressdetails=1" +
    "&limit=8";

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "nearby-now-mvp/1.0",
    },
  });

  if (!res.ok) return [];

  const raw = (await res.json()) as any[];

  return raw
    .map((r) => {
      const display = String(r.display_name ?? "").trim();
      const name =
        String(r.name ?? "").trim() ||
        (display.includes(",") ? display.split(",")[0].trim() : display) ||
        "Selected place";

      const lat = Number(r.lat);
      const lng = Number(r.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      return {
        placeId: String(r.place_id ?? ""),
        name,
        address: display || name,
        lat,
        lng,
      } satisfies PlaceCandidate;
    })
    .filter(Boolean) as PlaceCandidate[];
}
