CREATE TABLE public.habitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_id text NOT NULL UNIQUE,
  region text NOT NULL DEFAULT 'dehradun-valley',
  name text NOT NULL,
  population integer NOT NULL DEFAULT 0,
  land_area_hectares numeric NOT NULL DEFAULT 1,
  safe_density_threshold numeric NOT NULL DEFAULT 120,
  elevation_meters numeric NOT NULL DEFAULT 0,
  slope_degrees numeric NOT NULL DEFAULT 0,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.habitations TO authenticated;
GRANT ALL ON public.habitations TO service_role;

ALTER TABLE public.habitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officials can view habitations" ON public.habitations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Officials can add habitations" ON public.habitations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Officials can edit habitations" ON public.habitations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Officials can remove habitations" ON public.habitations FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER habitations_set_updated_at
BEFORE UPDATE ON public.habitations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.habitations (settlement_id, region, name, population, land_area_hectares, safe_density_threshold, elevation_meters, slope_degrees, latitude, longitude) VALUES
('STL-001','dehradun-valley','Rampur Khurd',4200,38.5,120,640,12,30.3480,78.0290),
('STL-002','dehradun-valley','Nayagaon',2650,31.0,120,712,7,30.3702,78.0605),
('STL-003','dehradun-valley','Kishanpur Tal',6100,29.4,110,598,19,30.3255,78.0480),
('STL-004','dehradun-valley','Bhaniyawala',1850,44.2,130,655,4,30.2410,78.1620),
('STL-005','dehradun-valley','Sahastradhara Basti',3900,22.8,110,880,24,30.3860,78.1310),
('STL-006','dehradun-valley','Raipur Kalan',5400,52.0,125,690,9,30.3310,78.1105),
('STL-007','dehradun-valley','Doiwala Ghat',7300,41.5,115,560,15,30.1780,78.1210),
('STL-008','dehradun-valley','Maldevta Upper',1200,18.6,120,935,28,30.3975,78.1490),
('STL-009','dehradun-valley','Selaqui Bend',4750,60.3,130,610,3,30.3690,77.8620),
('STL-010','dehradun-valley','Vikasnagar Tola',3300,27.1,115,702,11,30.4690,77.7740),
('STL-011','chamoli-district','Joshimath Ward 4',5200,24.0,100,1875,31,30.5560,79.5650),
('STL-012','chamoli-district','Gopeshwar Talla',3100,33.7,110,1310,17,30.4020,79.3170),
('STL-013','chamoli-district','Karnaprayag Sangam',4400,26.2,105,785,22,30.2570,79.2160),
('STL-014','chamoli-district','Pipalkoti',1600,20.4,110,1260,26,30.4300,79.4200),
('STL-015','chamoli-district','Nandprayag Ghat',2100,17.9,105,914,29,30.3350,79.3170),
('STL-016','chamoli-district','Chamoli Bazaar',3800,21.5,100,1010,20,30.4080,79.3300);