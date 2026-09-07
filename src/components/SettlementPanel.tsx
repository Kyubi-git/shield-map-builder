import { Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CATEGORY_COLORS } from "@/lib/risk-config";
import type { ScoredHabitation } from "@/lib/types";
import { cn } from "@/lib/utils";

function Factor({ label, value, weight }: { label: string; value: number; weight: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">
          {label} <span className="opacity-60">× {weight.toFixed(2)}</span>
        </span>
        <span className="font-mono font-semibold tabular-nums">{value.toFixed(2)}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function SettlementPanel({
  settlement,
  weights,
  onClose,
  onEdit,
}: {
  settlement: ScoredHabitation;
  weights: { hazardProximityWeight: number; populationDensityWeight: number; terrainWeight: number };
  onClose: () => void;
  onEdit: () => void;
}) {
  const color = CATEGORY_COLORS[settlement.riskCategory];

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-l border-border bg-card">
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {settlement.settlementId}
            </div>
            <h2 className="text-lg font-semibold leading-tight">{settlement.name}</h2>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit habitation">
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 py-4">
        <div
          className="rounded-lg border p-3"
          style={{ borderColor: `${color}66`, backgroundColor: `${color}1a` }}
        >
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Risk score
              </div>
              <div className="font-mono text-3xl font-bold tabular-nums" style={{ color }}>
                {settlement.riskScore.toFixed(2)}
              </div>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {settlement.riskCategory}
            </span>
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Why this classification
          </h3>
          <Factor
            label="Hazard proximity"
            value={settlement.hazardProximityScore}
            weight={weights.hazardProximityWeight}
          />
          <Factor
            label="Population density"
            value={settlement.populationDensityScore}
            weight={weights.populationDensityWeight}
          />
          <Factor label="Terrain" value={settlement.terrainScore} weight={weights.terrainWeight} />
          {settlement.nearestHazard && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Nearest hazard:{" "}
              <span className="text-foreground">{settlement.nearestHazard.name}</span> (
              {settlement.nearestHazard.hazardType}, {settlement.nearestHazard.intensity}) —{" "}
              {settlement.nearestHazard.distanceKm === 0
                ? "settlement lies inside this hazard zone"
                : `${settlement.nearestHazard.distanceKm.toFixed(2)} km away`}
              .
            </p>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Carrying capacity
          </h3>
          <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Capacity ratio
              </div>
              <div className="font-mono text-xl font-bold tabular-nums">
                {Number.isFinite(settlement.capacityRatio)
                  ? settlement.capacityRatio.toFixed(2)
                  : "—"}
              </div>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                settlement.capacityStatus === "Within Capacity" && "bg-emerald-500/15 text-emerald-400",
                settlement.capacityStatus === "Over Capacity (Monitor)" && "bg-amber-500/15 text-amber-400",
                settlement.capacityStatus === "Needs Relocation" && "bg-red-500/15 text-red-400",
              )}
            >
              {settlement.capacityStatus}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Safe capacity {Math.round(settlement.safeCapacity).toLocaleString()} people · hazard
            exposure factor {settlement.hazardExposureFactor.toFixed(2)}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <Stat label="Population" value={settlement.population.toLocaleString()} />
          <Stat label="Land area" value={`${settlement.landAreaHectares} ha`} />
          <Stat label="Elevation" value={`${settlement.elevationMeters} m`} />
          <Stat label="Slope" value={`${settlement.slopeDegrees}°`} />
          <Stat label="Density" value={`${settlement.populationDensity.toFixed(1)} /ha`} />
          <Stat label="Safe density" value={`${settlement.safeDensityThreshold} /ha`} />
        </section>
      </div>
    </aside>
  );
}
