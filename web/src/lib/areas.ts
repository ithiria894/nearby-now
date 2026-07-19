// District list for the location scope pill (WEB_PLAN §3.3 v2). A district is
// just a center + radius fed to get_feed_public's nearby filter — no new
// backend surface. v1 list is HK-wedge districts; swap per market later.
export type Area = {
  key: string;
  label: string;
  lat: number;
  lng: number;
  radiusKm: number;
};

export const AREAS: Area[] = [
  { key: "cwb", label: "Causeway Bay", lat: 22.28, lng: 114.185, radiusKm: 4 },
  {
    key: "central",
    label: "Central",
    lat: 22.2819,
    lng: 114.1582,
    radiusKm: 4,
  },
  { key: "mk", label: "Mong Kok", lat: 22.3193, lng: 114.1694, radiusKm: 4 },
  {
    key: "tst",
    label: "Tsim Sha Tsui",
    lat: 22.2976,
    lng: 114.1722,
    radiusKm: 4,
  },
  { key: "kt", label: "Kwun Tong", lat: 22.3133, lng: 114.2259, radiusKm: 4 },
];
