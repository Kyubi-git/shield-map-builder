/**
 * Single source of truth for every tunable value in the HazardShield scoring
 * engine. Nothing in the UI may duplicate these numbers.
 */

export interface RiskWeights {
  hazardProximityWeight: number;
  populationDensityWeight: number;
  terrainWeight: number;
}

export const DEFAULT_WEIGHTS: RiskWeights = {
  hazardProximityWeight: 0.4,
  populationDensityWeight: 0.35,
  terrainWeight: 0.25,
};

export const RISK_THRESHOLDS = {
  /** score <= low => Low / Safe */
  low: 0.33,
  /** score <= moderate => Moderate, above => Red Zone */
  moderate: 0.66,
} as const;

export const CAPACITY_THRESHOLDS = {
  withinCapacity: 1.0,
  monitor: 1.2,
} as const;

export const HAZARD_PROXIMITY_CONFIG = {
  /** score assigned when the settlement sits inside a polygon, by intensity */
  insideScoreByIntensity: { high: 1.0, medium: 0.9, low: 0.8 } as Record<string, number>,
  /** multiplier applied to outside-polygon decay, by intensity */
  intensityFactor: { high: 1.0, medium: 0.8, low: 0.6 } as Record<string, number>,
  /** exponential decay length in kilometres */
  decayKm: 4,
  /** beyond this distance the contribution is treated as 0 */
  cutoffKm: 25,
} as const;

export const TERRAIN_CONFIG = {
  /** slope at or above this is maximum terrain risk */
  maxSlopeDegrees: 35,
  /** weight of slope vs elevation inside the terrain sub-score */
  slopeShare: 0.75,
  /** elevation band used to normalise elevation exposure */
  elevationFloorMeters: 300,
  elevationCeilingMeters: 2200,
} as const;

/** How strongly hazard exposure erodes usable safe capacity. */
export const HAZARD_EXPOSURE_FACTOR_CAP = 0.6;

/** Weighting used to rank the relocation priority list. */
export const URGENCY_CONFIG = {
  riskShare: 0.65,
  capacityShare: 0.35,
  /** capacity ratio treated as maximum pressure */
  capacityPressureCeiling: 2.0,
} as const;

export type RiskCategory = "Low / Safe" | "Moderate" | "Red Zone";
export type CapacityStatus = "Within Capacity" | "Over Capacity (Monitor)" | "Needs Relocation";

export const RISK_CATEGORIES: RiskCategory[] = ["Low / Safe", "Moderate", "Red Zone"];

export const CATEGORY_COLORS: Record<RiskCategory, string> = {
  "Low / Safe": "#4f9b6d",
  Moderate: "#c79543",
  "Red Zone": "#c6534f",
};
