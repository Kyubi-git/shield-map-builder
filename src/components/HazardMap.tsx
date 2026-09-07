import { useEffect, useMemo } from "react";
import { CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { FeatureCollection, Polygon } from "geojson";

import { CATEGORY_COLORS } from "@/lib/risk-config";
import type { HazardFeatureProps, ScoredHabitation } from "@/lib/types";

const HAZARD_STYLE: Record<string, { color: string; fill: string }> = {
  high: { color: "#b91c1c", fill: "#ef4444" },
  medium: { color: "#b45309", fill: "#f59e0b" },
  low: { color: "#1d4ed8", fill: "#3b82f6" },
};

function MapController({
  points,
  focus,
}: {
  points: ScoredHabitation[];
  focus: { lat: number; lng: number; key: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [48, 48] },
    );
    // Refit only when the region dataset itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length, points[0]?.region]);

  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], 13, { duration: 0.8 });
  }, [focus, map]);

  return null;
}

export default function HazardMap({
  habitations,
  hazards,
  selectedId,
  onSelect,
  focus,
}: {
  habitations: ScoredHabitation[];
  hazards: FeatureCollection<Polygon, HazardFeatureProps> | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  focus: { lat: number; lng: number; key: number } | null;
}) {
  const center = useMemo<[number, number]>(() => {
    if (habitations.length === 0) return [30.32, 78.03];
    return [habitations[0]!.latitude, habitations[0]!.longitude];
  }, [habitations]);

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: "#0b1220" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {hazards?.features.map((feature) => {
        const style = HAZARD_STYLE[feature.properties.intensity] ?? HAZARD_STYLE["low"]!;
        return (
          <GeoJSON
            key={feature.properties.hazardId}
            data={feature}
            style={{
              color: style.color,
              fillColor: style.fill,
              weight: 2,
              dashArray: "6 4",
              fillOpacity: 0.18,
            }}
          >
            <Tooltip sticky>
              <span className="text-xs font-medium">
                {feature.properties.name} — {feature.properties.hazardType} (
                {feature.properties.intensity})
              </span>
            </Tooltip>
          </GeoJSON>
        );
      })}

      {habitations.map((h) => {
        const color = CATEGORY_COLORS[h.riskCategory];
        const selected = h.id === selectedId;
        return (
          <CircleMarker
            key={h.id}
            center={[h.latitude, h.longitude]}
            radius={selected ? 13 : 9}
            pathOptions={{
              color: selected ? "#ffffff" : color,
              weight: selected ? 3 : 2,
              fillColor: color,
              fillOpacity: 0.9,
            }}
            eventHandlers={{ click: () => onSelect(h.id) }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <span className="text-xs font-semibold">
                {h.name} · {h.riskScore.toFixed(2)} · {h.riskCategory}
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}

      <MapController points={habitations} focus={focus} />
    </MapContainer>
  );
}
