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

/** Average change in lbs/week over a recent window (negative = losing). */
export function weeklyRate(entries: Entry[], windowDays = 28): number {
  if (entries.length < 2) return 0;
  const last = entries[entries.length - 1];
  const cutoff = new Date(last.date);
  cutoff.setDate(cutoff.getDate() - windowDays);
  const recent = entries.filter((e) => new Date(e.date) >= cutoff);
  const series = recent.length >= 2 ? recent : entries;
  const a = series[0];
  const b = series[series.length - 1];
  const days = Math.max(1, (new Date(b.date).getTime() - new Date(a.date).getTime()) / 86400000);
  const perDay = (b.weight - a.weight) / days;
  return Math.round(perDay * 7 * 100) / 100;
}

/** Pounds still to lose to reach goal (0 if already at/under goal). */
export function remainingToGoal(entries: Entry[], profile: Profile): number {
  const last = latestWeight(entries);
  if (last == null) return 0;
  return Math.max(0, Math.round((last - profile.goalWeight) * 10) / 10);
}

/**
 * Projected goal date based on the recent rate.
 * Returns "reached" if already at goal, or null if not trending toward it.
 */
export function projectedGoalDate(entries: Entry[], profile: Profile): string | "reached" | null {
  const remaining = remainingToGoal(entries, profile);
  if (remaining <= 0) return "reached";
  const rate = weeklyRate(entries); // negative when losing
  if (rate >= -0.05) return null; // flat or gaining
  const weeks = remaining / Math.abs(rate);
  if (!isFinite(weeks) || weeks > 520) return null; // cap at ~10 years
  const d = new Date(entries[entries.length - 1].date);
  d.setDate(d.getDate() + Math.round(weeks * 7));
  return d.toISOString().slice(0, 10);
}

export function bmi(weightLbs: number, heightIn: number): number {
  if (!heightIn) return 0;
  return Math.round(((703 * weightLbs) / (heightIn * heightIn)) * 10) / 10;
}

export function bmiCategory(value: number): string {
  if (value <= 0) return "—";
  if (value < 18.5) return "Underweight";
  if (value < 25) return "Healthy";
  if (value < 30) return "Overweight";
  return "Obese";
}

/** Consecutive days logged, counting back from the most recent entry. */
export function loggingStreak(entries: Entry[]): number {
  if (!entries.length) return 0;
  const days = new Set(entries.map((e) => e.date));
  let streak = 0;
  const cursor = new Date(entries[entries.length - 1].date);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function formatMonthDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
