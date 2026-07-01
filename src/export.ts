import type { Entry, Profile } from "./types";
import { fromLbs } from "./units";

function download(filename: string, type: string, content: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCSV(entries: Entry[], profile: Profile): void {
  const csvCell = (v: string | number | undefined) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [
    ["date", `weight_${profile.unit}`, "weight_lbs", "waist_in", "calories", "protein_g", "carbs_g", "fats_g", "note"].join(","),
    ...entries.map((e) =>
      [
        e.date,
        fromLbs(e.weight, profile.unit).toFixed(1),
        e.weight.toFixed(1),
        csvCell(e.waist),
        csvCell(e.calories),
        csvCell(e.protein),
        csvCell(e.carbs),
        csvCell(e.fats),
        csvCell(e.note),
      ].join(",")
    ),
  ];
  download("evolve-metrics.csv", "text/csv;charset=utf-8", rows.join("\n"));
}

export function exportJSON(entries: Entry[], profile: Profile): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    profile,
    entries,
  };
  download(
    "evolve-metrics.json",
    "application/json;charset=utf-8",
    JSON.stringify(payload, null, 2)
  );
}

// ─── Import / restore ────────────────────────────────────────────────────────

export interface ImportResult {
  entries: Entry[];
  profile: Partial<Profile> | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * Parse a backup file produced by exportJSON (also tolerates a bare entries
 * array). Throws with a readable message when the payload isn't usable.
 */
export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Not a valid JSON file");
  }

  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { entries?: unknown }).entries)
    ? (raw as { entries: unknown[] }).entries
    : null;
  if (!list) throw new Error("No entries found in file");

  const num = (v: unknown): number | undefined => {
    const n = typeof v === "number" ? v : NaN;
    return isFinite(n) && n > 0 ? n : undefined;
  };

  const seen = new Set<string>();
  const entries: Entry[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const date = typeof o.date === "string" && ISO_DATE.test(o.date) ? o.date : null;
    const weight = num(o.weight);
    if (!date || !weight || seen.has(date)) continue;
    seen.add(date);
    const e: Entry = {
      id: typeof o.id === "string" && o.id ? o.id : uid(),
      date,
      weight: Math.round(weight * 10) / 10,
    };
    const waist = num(o.waist);
    if (waist) e.waist = Math.round(waist * 10) / 10;
    for (const k of ["protein", "carbs", "fats", "calories"] as const) {
      const v = num(o[k]);
      if (v) e[k] = Math.round(v);
    }
    if (typeof o.note === "string" && o.note.trim()) e.note = o.note.trim().slice(0, 200);
    entries.push(e);
  }
  if (!entries.length) throw new Error("File contained no valid entries");
  entries.sort((a, b) => a.date.localeCompare(b.date));

  let profile: Partial<Profile> | null = null;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const p = (raw as { profile?: unknown }).profile;
    if (p && typeof p === "object") {
      const o = p as Record<string, unknown>;
      profile = {};
      if (num(o.startWeight)) profile.startWeight = o.startWeight as number;
      if (num(o.goalWeight)) profile.goalWeight = o.goalWeight as number;
      if (num(o.heightIn)) profile.heightIn = o.heightIn as number;
      if (typeof o.startDate === "string" && ISO_DATE.test(o.startDate)) profile.startDate = o.startDate;
      if (typeof o.phase === "string" && o.phase.trim()) profile.phase = o.phase.trim().slice(0, 40);
      if (o.unit === "lbs" || o.unit === "kg") profile.unit = o.unit;
      if (!Object.keys(profile).length) profile = null;
    }
  }

  return { entries, profile };
}
