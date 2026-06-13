import type { Entry, Profile } from "./types";

export function latestWeight(entries: Entry[]): number | null {
  if (!entries.length) return null;
  return entries[entries.length - 1].weight;
}

export function previousWeight(entries: Entry[]): number | null {
  if (entries.length < 2) return null;
  return entries[entries.length - 2].weight;
}

/** Change since the previous entry (negative means lost weight). */
export function lastChange(entries: Entry[]): number {
  const last = latestWeight(entries);
  const prev = previousWeight(entries);
  if (last == null || prev == null) return 0;
  return Math.round((last - prev) * 10) / 10;
}

/** Total lost from start weight to now. Positive number = pounds lost. */
export function totalLost(entries: Entry[], profile: Profile): number {
  const last = latestWeight(entries);
  if (last == null) return 0;
  return Math.round((profile.startWeight - last) * 10) / 10;
}

/** Progress toward the goal as a 0-100 percentage. */
export function goalProgress(entries: Entry[], profile: Profile): number {
  const last = latestWeight(entries);
  if (last == null) return 0;
  const totalToLose = profile.startWeight - profile.goalWeight;
  if (totalToLose <= 0) return 100;
  const lost = profile.startWeight - last;
  return Math.max(0, Math.min(100, Math.round((lost / totalToLose) * 100)));
}

export function weeksSince(startDate: string): number {
  const start = new Date(startDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7)));
}

export interface TrendPoint {
  date: string;
  label: string;
  weight: number;
}

/** Down-sample entries into a smooth trend series for the chart. */
export function trendSeries(entries: Entry[], maxPoints = 24): TrendPoint[] {
  if (!entries.length) return [];
  const step = Math.max(1, Math.ceil(entries.length / maxPoints));
  const points: TrendPoint[] = [];
  for (let i = 0; i < entries.length; i += step) {
    const e = entries[i];
    points.push({
      date: e.date,
      label: formatShort(e.date),
      weight: e.weight,
    });
  }
  const last = entries[entries.length - 1];
  if (points[points.length - 1]?.date !== last.date) {
    points.push({ date: last.date, label: formatShort(last.date), weight: last.weight });
  }
  return points;
}

export function formatShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatLong(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" }).replace(
    /(\w+) (\d+)/,
    (_m, mon, yr) => `${mon} ${day}${suffix}, ${yr}`
  );
}
