import type { CapacityStatus, RiskCategory } from "./risk-config";

export interface Habitation {
  id: string;
  settlementId: string;
  region: string;
  name: string;
  population: number;
  landAreaHectares: number;
  safeDensityThreshold: number;
  elevationMeters: number;
  slopeDegrees: number;
  latitude: number;
  longitude: number;
}

export interface HazardFeatureProps {
  hazardId: string;
  region: string;
  hazardType: string;
  intensity: "low" | "medium" | "high";
  name: string;
}

export interface ScoredHabitation extends Habitation {
  populationDensity: number;
  hazardProximityScore: number;
  populationDensityScore: number;
  terrainScore: number;
  riskScore: number;
  riskCategory: RiskCategory;
  hazardExposureFactor: number;
  safeCapacity: number;
  capacityRatio: number;
  capacityStatus: CapacityStatus;
  urgency: number;
  nearestHazard: { name: string; hazardType: string; intensity: string; distanceKm: number } | null;
}

export interface Region {
  id: string;
  name: string;
  description: string;
}
