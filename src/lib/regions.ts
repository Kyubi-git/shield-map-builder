import type { Region } from "./types";

export const REGIONS: Region[] = [
  {
    id: "dehradun-valley",
    name: "Dehradun Valley",
    description: "Doon valley settlements exposed to river flooding and slope failure.",
  },
  {
    id: "chamoli-district",
    name: "Chamoli District",
    description: "High-altitude habitations with subsidence and landslide exposure.",
  },
];

export const DEFAULT_REGION = REGIONS[0]!.id;
