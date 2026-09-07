import type { FeatureCollection, Polygon } from "geojson";

import { supabase } from "@/integrations/supabase/client";
import type { Habitation, HazardFeatureProps } from "./types";

export type HabitationInput = Omit<Habitation, "id">;

const ROW_COLUMNS =
  "id, settlement_id, region, name, population, land_area_hectares, safe_density_threshold, elevation_meters, slope_degrees, latitude, longitude";

interface Row {
  id: string;
  settlement_id: string;
  region: string;
  name: string;
  population: number;
  land_area_hectares: number;
  safe_density_threshold: number;
  elevation_meters: number;
  slope_degrees: number;
  latitude: number;
  longitude: number;
}

function toHabitation(row: Row): Habitation {
  return {
    id: row.id,
    settlementId: row.settlement_id,
    region: row.region,
    name: row.name,
    population: Number(row.population),
    landAreaHectares: Number(row.land_area_hectares),
    safeDensityThreshold: Number(row.safe_density_threshold),
    elevationMeters: Number(row.elevation_meters),
    slopeDegrees: Number(row.slope_degrees),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  };
}

function toRow(input: HabitationInput) {
  return {
    settlement_id: input.settlementId,
    region: input.region,
    name: input.name,
    population: input.population,
    land_area_hectares: input.landAreaHectares,
    safe_density_threshold: input.safeDensityThreshold,
    elevation_meters: input.elevationMeters,
    slope_degrees: input.slopeDegrees,
    latitude: input.latitude,
    longitude: input.longitude,
  };
}

export async function fetchHabitations(region: string): Promise<Habitation[]> {
  const { data, error } = await supabase
    .from("habitations")
    .select(ROW_COLUMNS)
    .eq("region", region)
    .order("settlement_id");
  if (error) throw new Error(error.message);
  return (data as Row[]).map(toHabitation);
}

export async function createHabitation(input: HabitationInput): Promise<void> {
  const { error } = await supabase.from("habitations").insert(toRow(input));
  if (error) throw new Error(error.message);
}

export async function updateHabitation(id: string, input: HabitationInput): Promise<void> {
  const { error } = await supabase.from("habitations").update(toRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteHabitation(id: string): Promise<void> {
  const { error } = await supabase.from("habitations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function fetchHazards(
  region: string,
): Promise<FeatureCollection<Polygon, HazardFeatureProps>> {
  const res = await fetch("/data/hazards.geojson");
  if (!res.ok) throw new Error("Hazard zone dataset could not be loaded.");
  const all = (await res.json()) as FeatureCollection<Polygon, HazardFeatureProps>;
  return {
    type: "FeatureCollection",
    features: all.features.filter((f) => f.properties.region === region),
  };
}
