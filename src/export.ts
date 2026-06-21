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
  const rows = [
    ["date", `weight_${profile.unit}`, "weight_lbs"].join(","),
    ...entries.map((e) =>
      [
        e.date,
        fromLbs(e.weight, profile.unit).toFixed(1),
        e.weight.toFixed(1),
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
