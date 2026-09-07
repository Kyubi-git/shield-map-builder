import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HabitationInput } from "@/lib/habitations";
import type { Habitation } from "@/lib/types";

const FIELDS: {
  key: keyof HabitationInput;
  label: string;
  step?: string;
  type?: string;
}[] = [
  { key: "settlementId", label: "Settlement ID", type: "text" },
  { key: "name", label: "Name", type: "text" },
  { key: "population", label: "Population", step: "1" },
  { key: "landAreaHectares", label: "Land area (hectares)", step: "0.1" },
  { key: "safeDensityThreshold", label: "Safe density threshold (people/ha)", step: "1" },
  { key: "elevationMeters", label: "Elevation (m)", step: "1" },
  { key: "slopeDegrees", label: "Slope (degrees)", step: "0.1" },
  { key: "latitude", label: "Latitude", step: "0.0001" },
  { key: "longitude", label: "Longitude", step: "0.0001" },
];

function emptyDraft(region: string): HabitationInput {
  return {
    settlementId: "",
    region,
    name: "",
    population: 0,
    landAreaHectares: 1,
    safeDensityThreshold: 120,
    elevationMeters: 0,
    slopeDegrees: 0,
    latitude: 30.32,
    longitude: 78.03,
  };
}

export function HabitationForm({
  open,
  onOpenChange,
  region,
  editing,
  onSubmit,
  onDelete,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  region: string;
  editing: Habitation | null;
  onSubmit: (input: HabitationInput) => void;
  onDelete?: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<HabitationInput>(emptyDraft(region));
  const [initialisedFor, setInitialisedFor] = useState<string | null>(null);

  const identity = `${open}-${editing?.id ?? "new"}-${region}`;
  if (open && initialisedFor !== identity) {
    setInitialisedFor(identity);
    if (editing) {
      const { id: _id, ...rest } = editing;
      setDraft(rest);
    } else {
      setDraft(emptyDraft(region));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit habitation" : "Add habitation"}</DialogTitle>
          <DialogDescription>
            Risk score, category and carrying capacity are recalculated the moment this record is
            saved.
          </DialogDescription>
        </DialogHeader>

        <form
          id="habitation-form"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ ...draft, region });
          }}
        >
          {FIELDS.map((field) => (
            <div
              key={field.key}
              className={field.key === "name" || field.key === "settlementId" ? "col-span-1" : ""}
            >
              <Label htmlFor={field.key} className="text-xs">
                {field.label}
              </Label>
              <Input
                id={field.key}
                className="mt-1"
                required
                type={field.type ?? "number"}
                step={field.step}
                value={String(draft[field.key] ?? "")}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    [field.key]:
                      field.type === "text" ? e.target.value : Number(e.target.value),
                  }))
                }
              />
            </div>
          ))}
        </form>

        <DialogFooter className="gap-2 sm:justify-between">
          {editing && onDelete ? (
            <Button type="button" variant="ghost" className="text-destructive" onClick={onDelete}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="habitation-form" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add habitation"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
