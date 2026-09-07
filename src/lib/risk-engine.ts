import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import distance from "@turf/distance";
import explode from "@turf/explode";
import nearestPoint from "@turf/nearest-point";
import { point } from "@turf/helpers";
import type { Feature, FeatureCollection, Polygon } from "geojson";

import {
  CAPACITY_THRESHOLDS,
  DEFAULT_WEIGHTS,
  HAZARD_EXPOSURE_FACTOR_CAP,
  HAZARD_PROXIMITY_CONFIG,
  RISK_THRESHOLDS,
  TERRAIN_CONFIG,
  URGENCY_CONFIG,
  type CapacityStatus,
  type RiskCategory,
  type RiskWeights,
} from "./risk-config";
import type { Habitation, HazardFeatureProps, ScoredHabitation } from "./types";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Step 10.2 — weights are always normalised so they total exactly 1.00. */
export function normalizeWeights(weights: RiskWeights): RiskWeights {
  const total =
    weights.hazardProximityWeight + weights.populationDensityWeight + weights.terrainWeight;
  if (!Number.isFinite(total) || total <= 0) return { ...DEFAULT_WEIGHTS };
  return {
    hazardProximityWeight: weights.hazardProximityWeight / total,
    populationDensityWeight: weights.populationDensityWeight / total,
    terrainWeight: weights.terrainWeight / total,
  };
}

/** Step 2 — hazard proximity via Turf, with a transparent exponential decay. */
export function hazardProximity(
  habitation: Habitation,
  hazards: Feature<Polygon, HazardFeatureProps>[],
): { score: number; nearest: ScoredHabitation["nearestHazard"] } {
  const pt = point([habitation.longitude, habitation.latitude]);
  let best = 0;
  let nearest: ScoredHabitation["nearestHazard"] = null;

  for (const hazard of hazards) {
    const intensity = hazard.properties.intensity;
    let score: number;
    let distanceKm: number;

    if (booleanPointInPolygon(pt, hazard)) {
      distanceKm = 0;
      score = HAZARD_PROXIMITY_CONFIG.insideScoreByIntensity[intensity] ?? 0.8;
    } else {
      const vertices = explode(hazard);
      const closest = nearestPoint(pt, vertices);
      distanceKm = distance(pt, closest, { units: "kilometers" });
      const factor = HAZARD_PROXIMITY_CONFIG.intensityFactor[intensity] ?? 0.6;
      score =
        distanceKm >= HAZARD_PROXIMITY_CONFIG.cutoffKm
          ? 0
          : factor * Math.exp(-distanceKm / HAZARD_PROXIMITY_CONFIG.decayKm);
    }

    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = {
        name: hazard.properties.name,
        hazardType: hazard.properties.hazardType,
        intensity,
        distanceKm,
      };
    }
    if (score > best) best = score;
  }

  return { score: clamp01(best), nearest };
}

/** Step 4 — terrain score driven mainly by slope, with an elevation component. */
export function terrainScore(habitation: Habitation): number {
  const slope = clamp01(habitation.slopeDegrees / TERRAIN_CONFIG.maxSlopeDegrees);
  const elevationSpan =
    TERRAIN_CONFIG.elevationCeilingMeters - TERRAIN_CONFIG.elevationFloorMeters;
  const elevation = clamp01(
    (habitation.elevationMeters - TERRAIN_CONFIG.elevationFloorMeters) / elevationSpan,
  );
  return clamp01(
    slope * TERRAIN_CONFIG.slopeShare + elevation * (1 - TERRAIN_CONFIG.slopeShare),
  );
}

/** Step 6 */
export function categorise(riskScore: number): RiskCategory {
  if (riskScore <= RISK_THRESHOLDS.low) return "Low / Safe";
  if (riskScore <= RISK_THRESHOLDS.moderate) return "Moderate";
  return "Red Zone";
}

/** Step 8 */
export function capacityStatusFor(ratio: number): CapacityStatus {
  if (ratio < CAPACITY_THRESHOLDS.withinCapacity) return "Within Capacity";
  if (ratio <= CAPACITY_THRESHOLDS.monitor) return "Over Capacity (Monitor)";
  return "Needs Relocation";
}

/** Step 9 — isolated so the ranking rule can be tuned in one place. */
export function combinedUrgency(riskScore: number, capacityRatio: number): number {
  const capacityPressure = clamp01(capacityRatio / URGENCY_CONFIG.capacityPressureCeiling);
  return (
    riskScore * URGENCY_CONFIG.riskShare + capacityPressure * URGENCY_CONFIG.capacityShare
  );
}

/**
 * Full engine: pure function over the source data. It never mutates its inputs,
 * so changing weights can never alter the underlying dataset.
 */
export function scoreHabitations(
  habitations: Habitation[],
  hazardCollection: FeatureCollection<Polygon, HazardFeatureProps> | null,
  weights: RiskWeights,
): ScoredHabitation[] {
  const w = normalizeWeights(weights);
  const hazards = (hazardCollection?.features ?? []) as Feature<Polygon, HazardFeatureProps>[];

  // Step 3 — dataset-relative min/max density normalisation.
  const densities = habitations.map((h) =>
    h.landAreaHectares > 0 ? h.population / h.landAreaHectares : 0,
  );
  const minDensity = densities.length ? Math.min(...densities) : 0;
  const maxDensity = densities.length ? Math.max(...densities) : 0;
  const densitySpan = maxDensity - minDensity;

  return habitations.map((habitation, index) => {
    const populationDensity = densities[index] ?? 0;
    const populationDensityScore =
      densitySpan > 0 ? clamp01((populationDensity - minDensity) / densitySpan) : 0;

    const { score: hazardProximityScore, nearest } = hazardProximity(habitation, hazards);
    const terrain = terrainScore(habitation);

    // Step 5
    const riskScore = clamp01(
      w.hazardProximityWeight * hazardProximityScore +
        w.populationDensityWeight * populationDensityScore +
        w.terrainWeight * terrain,
    );

    // Step 7
    const hazardExposureFactor = hazardProximityScore * HAZARD_EXPOSURE_FACTOR_CAP;
    const safeCapacity =
      habitation.landAreaHectares * habitation.safeDensityThreshold * (1 - hazardExposureFactor);
    const capacityRatio = safeCapacity > 0 ? habitation.population / safeCapacity : Infinity;

    return {
      ...habitation,
      populationDensity,
      hazardProximityScore,
      populationDensityScore,
      terrainScore: terrain,
      riskScore,
      riskCategory: categorise(riskScore),
      hazardExposureFactor,
      safeCapacity,
      capacityRatio,
      capacityStatus: capacityStatusFor(capacityRatio),
      urgency: combinedUrgency(riskScore, capacityRatio),
      nearestHazard: nearest,
    };
  });
}

export function relocationPriority(scored: ScoredHabitation[]): ScoredHabitation[] {
  return scored
    .filter((s) => s.riskCategory === "Red Zone" || s.capacityStatus === "Needs Relocation")
    .sort((a, b) => b.urgency - a.urgency);
}
