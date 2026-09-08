import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import {
  AlertTriangle,
  Check,
  ChevronsUpDown,
  LayoutList,
  LogOut,
  Map as MapIcon,
  MapPinOff,
  Plus,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { HabitationForm } from "@/components/HabitationForm";
import { SettlementPanel } from "@/components/SettlementPanel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import {
  createHabitation,
  deleteHabitation,
  fetchHabitations,
  fetchHazards,
  updateHabitation,
  type HabitationInput,
} from "@/lib/habitations";
import { DEFAULT_REGION, REGION_BY_ID, REGIONS } from "@/lib/regions";
import {
  CATEGORY_COLORS,
  DEFAULT_WEIGHTS,
  RISK_CATEGORIES,
  type RiskCategory,
  type RiskWeights,
} from "@/lib/risk-config";
import { normalizeWeights, relocationPriority, scoreHabitations } from "@/lib/risk-engine";
import type { Habitation, ScoredHabitation } from "@/lib/types";
import { cn } from "@/lib/utils";

const HazardMap = lazy(() => import("@/components/HazardMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HazardShield GIS — Habitation Risk Dashboard" },
      {
        name: "description",
        content:
          "GIS decision-support dashboard that scores habitation hazard risk, carrying capacity and relocation priority across hazard-prone regions.",
      },
      { property: "og:title", content: "HazardShield GIS — Habitation Risk Dashboard" },
      {
        property: "og:description",
        content:
          "Interactive hazard map, rule-based risk scoring and relocation priorities for disaster management planners.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const WEIGHT_FIELDS: { key: keyof RiskWeights; label: string }[] = [
  { key: "hazardProximityWeight", label: "Hazard proximity" },
  { key: "populationDensityWeight", label: "Population density" },
  { key: "terrainWeight", label: "Terrain" },
];

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [weights, setWeights] = useState<RiskWeights>({ ...DEFAULT_WEIGHTS });
  const [activeCategories, setActiveCategories] = useState<RiskCategory[]>([...RISK_CATEGORIES]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "report">("map");
  const [focus, setFocus] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habitation | null>(null);
  const [saving, setSaving] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthChecked(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authChecked && !session) navigate({ to: "/auth" });
  }, [authChecked, session, navigate]);

  const habitationsQuery = useQuery({
    queryKey: ["habitations", region],
    queryFn: () => fetchHabitations(region),
    enabled: Boolean(session),
  });
  const hazardsQuery = useQuery({
    queryKey: ["hazards", region],
    queryFn: () => fetchHazards(region),
  });

  const loading = habitationsQuery.isPending || hazardsQuery.isPending;
  const loadError = habitationsQuery.error ?? hazardsQuery.error;

  const normalized = useMemo(() => normalizeWeights(weights), [weights]);
  const scored = useMemo(
    () => scoreHabitations(habitationsQuery.data ?? [], hazardsQuery.data ?? null, weights),
    [habitationsQuery.data, hazardsQuery.data, weights],
  );
  const visible = useMemo(
    () => scored.filter((s) => activeCategories.includes(s.riskCategory)),
    [scored, activeCategories],
  );
  const priority = useMemo(() => relocationPriority(scored), [scored]);
  const selected = scored.find((s) => s.id === selectedId) ?? null;
  const counts = useMemo(
    () =>
      RISK_CATEGORIES.map((c) => ({
        category: c,
        count: scored.filter((s) => s.riskCategory === c).length,
      })),
    [scored],
  );

  function toggleCategory(category: RiskCategory) {
    setActiveCategories((current) =>
      current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category],
    );
  }

  function viewOnMap(id: string, lat: number, lng: number) {
    setView("map");
    setSelectedId(id);
    setFocus({ lat, lng, key: Date.now() });
    setControlsOpen(false);
  }

  async function handleSubmit(input: HabitationInput) {
    setSaving(true);
    try {
      if (editing) await updateHabitation(editing.id, input);
      else await createHabitation(input);
      await queryClient.invalidateQueries({ queryKey: ["habitations", region] });
      toast.success(editing ? "Habitation updated — risk recalculated." : "Habitation added — risk calculated.");
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save habitation.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    try {
      await deleteHabitation(editing.id);
      await queryClient.invalidateQueries({ queryKey: ["habitations", region] });
      if (selectedId === editing.id) setSelectedId(null);
      toast.success("Habitation removed.");
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove habitation.");
    }
  }

  if (!authChecked || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Checking your session…
      </div>
    );
  }

  const controlRail = (
    <ControlRail
      counts={counts}
      activeCategories={activeCategories}
      onToggleCategory={toggleCategory}
      weights={weights}
      normalized={normalized}
      onWeights={setWeights}
      visible={visible}
      selectedId={selectedId}
      onSelect={viewOnMap}
      loading={loading}
      totalCount={scored.length}
    />
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2.5 sm:gap-4 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Sheet open={controlsOpen} onOpenChange={setControlsOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="lg:hidden" aria-label="Open controls">
                <SlidersHorizontal className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto p-0">
              <SheetTitle className="sr-only">Dashboard controls</SheetTitle>
              {controlRail}
            </SheetContent>
          </Sheet>

          <div className="grid size-9 shrink-0 place-items-center rounded bg-primary text-primary-foreground">
            <ShieldAlert className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold uppercase tracking-widest">HazardShield GIS</h1>
            <p className="hidden text-[10px] text-muted-foreground sm:block">
              Habitation risk &amp; relocation decision support
            </p>
          </div>
        </div>

        <RegionPicker
          region={region}
          onChange={(v) => {
            setRegion(v);
            setSelectedId(null);
          }}
        />


        <div className="flex rounded-md border border-border p-0.5">
          {([
            { key: "map", label: "Map view", icon: MapIcon },
            { key: "report", label: "Relocation priority", icon: LayoutList },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-label={label}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3",
                view === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="hidden md:inline">{label}</span>
              {key === "report" && priority.length > 0 && (
                <span className="rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                  {priority.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            aria-label="Add habitation"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add habitation</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Sign out"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-border bg-card lg:block">
          {controlRail}
        </aside>

        <main className="relative min-w-0 flex-1">
          {loading ? (
            <div className="h-full p-4">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          ) : loadError ? (
            <div className="grid h-full place-items-center px-6 text-center">
              <div>
                <AlertTriangle className="mx-auto size-8 text-destructive" />
                <p className="mt-2 text-sm font-medium">Required data could not be loaded</p>
                <p className="text-xs text-muted-foreground">{loadError.message}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    habitationsQuery.refetch();
                    hazardsQuery.refetch();
                  }}
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : scored.length === 0 ? (
            <div className="grid h-full place-items-center px-6 text-center">
              <div className="max-w-sm">
                <MapPinOff className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">No habitations recorded for this region</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add the first habitation and its risk score, category and carrying capacity are
                  calculated straight away.
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="size-4" /> Add habitation
                </Button>
              </div>
            </div>
          ) : view === "map" ? (
            <ClientOnly fallback={<MapFallback />}>
              <Suspense fallback={<MapFallback />}>
                <HazardMap
                  habitations={visible}
                  hazards={hazardsQuery.data ?? null}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  focus={focus}
                />
              </Suspense>
            </ClientOnly>
          ) : (
            <RelocationReport priority={priority} onView={viewOnMap} />
          )}

          {view === "map" && !loading && visible.length === 0 && scored.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-4 z-[500] flex justify-center px-4">
              <p className="pointer-events-auto rounded-md border border-border bg-card/95 px-3 py-2 text-xs text-muted-foreground shadow">
                All risk categories are filtered out — tick a category to see habitations again.
              </p>
            </div>
          )}
        </main>

        {selected && view === "map" && !isMobile && (
          <div className="w-80 shrink-0">
            <SettlementPanel
              settlement={selected}
              weights={normalized}
              onClose={() => setSelectedId(null)}
              onEdit={() => {
                setEditing(selected);
                setFormOpen(true);
              }}
            />
          </div>
        )}
      </div>

      {isMobile && (
        <Sheet
          open={Boolean(selected) && view === "map"}
          onOpenChange={(open) => !open && setSelectedId(null)}
        >
          <SheetContent side="bottom" className="h-[80vh] p-0">
            <SheetTitle className="sr-only">Habitation details</SheetTitle>
            {selected && (
              <SettlementPanel
                settlement={selected}
                weights={normalized}
                onClose={() => setSelectedId(null)}
                onEdit={() => {
                  setEditing(selected);
                  setFormOpen(true);
                }}
              />
            )}
          </SheetContent>
        </Sheet>
      )}

      <HabitationForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        region={region}
        editing={editing}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        saving={saving}
      />
    </div>
  );
}

function RegionPicker({
  region,
  onChange,
}: {
  region: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = REGION_BY_ID[region];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select region"
          className="w-40 justify-between font-normal sm:w-56"
        >
          <span className="truncate">{current?.name ?? "Select region"}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[1200] w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search state or region…" />
          <CommandList className="max-h-72">
            <CommandEmpty>No region found.</CommandEmpty>
            <CommandGroup>
              {REGIONS.map((r) => (
                <CommandItem
                  key={r.id}
                  value={`${r.name} ${r.id}`}
                  onSelect={() => {
                    onChange(r.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("size-3.5", r.id === region ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{r.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


function MapFallback() {
  return (
    <div className="h-full p-4">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  );
}

function ControlRail({
  counts,
  activeCategories,
  onToggleCategory,
  weights,
  normalized,
  onWeights,
  visible,
  selectedId,
  onSelect,
  loading,
  totalCount,
}: {
  counts: { category: RiskCategory; count: number }[];
  activeCategories: RiskCategory[];
  onToggleCategory: (c: RiskCategory) => void;
  weights: RiskWeights;
  normalized: RiskWeights;
  onWeights: (updater: (w: RiskWeights) => RiskWeights) => void;
  visible: ScoredHabitation[];
  selectedId: string | null;
  onSelect: (id: string, lat: number, lng: number) => void;
  loading: boolean;
  totalCount: number;
}) {
  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Risk categories
        </h2>
        <div className="mt-2 space-y-1.5">
          {counts.map(({ category, count }) => (
            <label
              key={category}
              className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border/60 bg-muted/20 px-2.5 py-2"
            >
              <Checkbox
                checked={activeCategories.includes(category)}
                onCheckedChange={() => onToggleCategory(category)}
              />
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[category] }}
              />
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{category}</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {loading ? "—" : count}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Risk weights
          </h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-[11px]"
            onClick={() => onWeights(() => ({ ...DEFAULT_WEIGHTS }))}
          >
            <RotateCcw className="size-3" /> Reset
          </Button>
        </div>
        <div className="mt-3 space-y-4">
          {WEIGHT_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between text-xs">
                <Label className="text-xs">{label}</Label>
                <span className="font-mono tabular-nums">{weights[key].toFixed(2)}</span>
              </div>
              <Slider
                className="mt-2"
                min={0}
                max={1}
                step={0.05}
                value={[weights[key]]}
                onValueChange={([v]) => onWeights((w) => ({ ...w, [key]: v ?? 0 }))}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Total{" "}
          <span className="font-mono">
            {(
              weights.hazardProximityWeight +
              weights.populationDensityWeight +
              weights.terrainWeight
            ).toFixed(2)}
          </span>{" "}
          — normalised to {normalized.hazardProximityWeight.toFixed(2)} /{" "}
          {normalized.populationDensityWeight.toFixed(2)} /{" "}
          {normalized.terrainWeight.toFixed(2)} before scoring.
        </p>
      </section>

      <section className="min-h-0">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Habitations ({loading ? "…" : visible.length})
        </h2>
        {loading ? (
          <div className="mt-2 space-y-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-2 rounded-md border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
            {totalCount === 0
              ? "No habitations recorded for this region yet."
              : "No habitation matches the selected risk categories."}
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {visible.map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => onSelect(h.id, h.latitude, h.longitude)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                    selectedId === h.id && "bg-muted",
                  )}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[h.riskCategory] }}
                  />
                  <span className="min-w-0 flex-1 truncate">{h.name}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {h.riskScore.toFixed(2)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RelocationReport({
  priority,
  onView,
}: {
  priority: ReturnType<typeof relocationPriority>;
  onView: (id: string, lat: number, lng: number) => void;
}) {
  return (
    <div className="h-full overflow-y-auto px-4 py-5 sm:px-6">
      <h2 className="text-lg font-semibold">Relocation Priority Report</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Habitations classified as Red Zone or exceeding safe carrying capacity, ranked by combined
        urgency. Decision-support output — not a guaranteed prediction.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">#</th>
              <th className="px-3 py-2 text-left font-semibold">Habitation</th>
              <th className="px-3 py-2 text-right font-semibold">Risk</th>
              <th className="px-3 py-2 text-left font-semibold">Category</th>
              <th className="px-3 py-2 text-right font-semibold">Capacity ratio</th>
              <th className="px-3 py-2 text-left font-semibold">Capacity status</th>
              <th className="px-3 py-2 text-right font-semibold">Urgency</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {priority.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-xs text-muted-foreground">
                  No habitation currently meets the relocation criteria for this region.
                </td>
              </tr>
            )}
            {priority.map((h, i) => (
              <tr key={h.id} className="border-t border-border/60 hover:bg-muted/20">
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{h.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {h.settlementId}
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {h.riskScore.toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                    style={{ backgroundColor: CATEGORY_COLORS[h.riskCategory] }}
                  >
                    {h.riskCategory}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {Number.isFinite(h.capacityRatio) ? h.capacityRatio.toFixed(2) : "—"}
                </td>
                <td className="px-3 py-2 text-xs">{h.capacityStatus}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">
                  {h.urgency.toFixed(3)}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => onView(h.id, h.latitude, h.longitude)}>
                    View on map
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
