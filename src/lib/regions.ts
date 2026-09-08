import type { Region } from "./types";

/**
 * Centralised region catalogue. The first two entries are the original
 * Uttarakhand pilot zones; the remainder are demonstration regions covering
 * every Indian state and union territory. All values are sample data for
 * demonstration only — not verified government records.
 */
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
  { id: "andhra-pradesh", name: "Andhra Pradesh", description: "Coastal delta and cyclone-exposed urban settlements." },
  { id: "arunachal-pradesh", name: "Arunachal Pradesh", description: "Eastern Himalayan valleys with landslide and flash-flood exposure." },
  { id: "assam", name: "Assam", description: "Brahmaputra floodplain habitations with annual inundation risk." },
  { id: "bihar", name: "Bihar", description: "Ganga–Kosi plains with recurrent riverine flooding." },
  { id: "chhattisgarh", name: "Chhattisgarh", description: "Plateau settlements with drought and localised flood exposure." },
  { id: "goa", name: "Goa", description: "Coastal settlements exposed to storm surge and slope failure." },
  { id: "gujarat", name: "Gujarat", description: "Seismic and cyclone-prone coastal and arid habitations." },
  { id: "haryana", name: "Haryana", description: "Plains habitations with urban flooding and seismic exposure." },
  { id: "himachal-pradesh", name: "Himachal Pradesh", description: "Steep Himalayan slopes with cloudburst and landslide risk." },
  { id: "jharkhand", name: "Jharkhand", description: "Mining plateau settlements with subsidence and drought risk." },
  { id: "karnataka", name: "Karnataka", description: "Western Ghats slopes and rapidly densifying urban districts." },
  { id: "kerala", name: "Kerala", description: "Backwater and Ghat habitations with flood and landslide exposure." },
  { id: "madhya-pradesh", name: "Madhya Pradesh", description: "Central plateau habitations with river flooding and heat stress." },
  { id: "maharashtra", name: "Maharashtra", description: "Coastal metros and Ghat towns with flood and landslide exposure." },
  { id: "manipur", name: "Manipur", description: "Valley and hill habitations with landslide and flood exposure." },
  { id: "meghalaya", name: "Meghalaya", description: "High-rainfall plateau with slope failure risk." },
  { id: "mizoram", name: "Mizoram", description: "Steep ridge settlements with landslide exposure." },
  { id: "nagaland", name: "Nagaland", description: "Hill habitations with slope instability and seismic risk." },
  { id: "odisha", name: "Odisha", description: "Cyclone-exposed coastal and delta habitations." },
  { id: "punjab", name: "Punjab", description: "Sutlej–Beas plains with riverine flooding." },
  { id: "rajasthan", name: "Rajasthan", description: "Arid habitations with drought, heat and flash-flood risk." },
  { id: "sikkim", name: "Sikkim", description: "High-altitude habitations with GLOF and landslide exposure." },
  { id: "tamil-nadu", name: "Tamil Nadu", description: "Coastal metros and Nilgiri slopes with cyclone and landslide risk." },
  { id: "telangana", name: "Telangana", description: "Urban lake catchments with flash-flood exposure." },
  { id: "tripura", name: "Tripura", description: "Low hill habitations with flood and landslide exposure." },
  { id: "uttar-pradesh", name: "Uttar Pradesh", description: "Ganga basin habitations with flooding and dense settlement." },
  { id: "uttarakhand", name: "Uttarakhand", description: "Himalayan and terai habitations with landslide and flood exposure." },
  { id: "west-bengal", name: "West Bengal", description: "Delta and Sundarban habitations with cyclone and flood exposure." },
  { id: "andaman-and-nicobar-islands", name: "Andaman and Nicobar Islands", description: "Island habitations with tsunami and cyclone exposure." },
  { id: "chandigarh", name: "Chandigarh", description: "Planned city with seismic and urban flood exposure." },
  { id: "dadra-and-nagar-haveli-and-daman-and-diu", name: "Dadra and Nagar Haveli and Daman and Diu", description: "Coastal and riverine habitations with cyclone exposure." },
  { id: "delhi", name: "Delhi", description: "Yamuna floodplain and dense urban wards with seismic exposure." },
  { id: "jammu-and-kashmir", name: "Jammu and Kashmir", description: "Jhelum valley habitations with flood and seismic exposure." },
  { id: "ladakh", name: "Ladakh", description: "Cold desert habitations with flash-flood and GLOF exposure." },
  { id: "lakshadweep", name: "Lakshadweep", description: "Low-lying atoll habitations with sea-level and storm exposure." },
  { id: "puducherry", name: "Puducherry", description: "Coastal habitations with cyclone and surge exposure." },
];

export const REGION_BY_ID: Record<string, Region> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
);

export const DEFAULT_REGION = REGIONS[0]!.id;
