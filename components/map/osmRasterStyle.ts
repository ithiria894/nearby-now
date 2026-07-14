// Free, keyless OpenStreetMap raster tiles for MapLibre.
// No API key, no billing, no Google. Passed to <Map mapStyle=...> as a JSON
// string (mapStyle accepts string | StyleSpecification; the string form avoids
// coupling to the strict StyleSpecification type).
//
// OSM tile usage policy (operations.osmfoundation.org/policies/tiles): fine for
// a low-volume test with visible attribution; NOT for production traffic. For
// scale, swap the tiles URL to OpenFreeMap (openfreemap.org) — also keyless and
// self-hostable — in this one file. That is the whole point of the abstraction.
export const OSM_RASTER_STYLE_JSON = JSON.stringify({
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap Contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
});
