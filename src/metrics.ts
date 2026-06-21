import type { Entry, Profile } from "./types";
import { isoAddDays, isoToUTCDate, MS_PER_DAY } from "./dateUtils";

export function latestWeight(entries: Entry[]): number | null {
  if (!entries.length) return null;
  return entries[entries.length - 1].weight;
}

export function previousWeight(entries: Entry[]): number | null {
  if (entries.length < 2) return null;
  return entries[entries.length - 2].weight;
}

export function lastChange(entries: Entry[]): number {
  const last = latestWeight(entries);
  const prev = previousWeight(entries);
  if (last == null || prev == null) return 0;
  return Math.round((last - prev) * 10) / 10;
}

export function totalLost(entries: Entry[], profile: Profile): number {
  const last = latestWeight(entries);
  if (last == null) return 0;
  return Math.round((profile.startWeight - last) * 10) / 10;
}

export function goalProgress(entries: Entry[], profile: Profile): number {
  const last = latestWeight(entries);
  if (last == null) return 0;
  const totalToLose = profile.startWeight - profile.goalWeight;
  if (totalToLose <= 0) return 100;
  const lost = profile.startWeight - last;
  return Math.max(0, Math.min(100, Math.round((lost / totalToLose) * 100)));
}

export function weeksSince(startDate: string): number {
  const start = isoToUTCDate(startDate).getTime();
  return Math.max(0, Math.floor((Date.now() - start) / (MS_PER_DAY * 7)));
}

export interface TrendPoint {
  date: string;
  label: string;
  weight: number;
}

export function trendSeries(entries: Entry[], maxPoints = 24): TrendPoint[] {
  if (!entries.length) return [];
  const step = Math.max(1, Math.ceil(entries.length / maxPoints));
  const points: TrendPoint[] = [];
  for (let i = 0; i < entries.length; i += step) {
    const e = entries[i];
    points.push({ date: e.date, label: formatShort(e.date), weight: e.weight });
  }
  const last = entries[entries.length - 1];
  if (points[points.length - 1]?.date !== last.date) {
    points.push({ date: last.date, label: formatShort(last.date), weight: last.weight });
  }
  return points;
}

/** 7-day backward moving average for each trend point, computed from raw entries. */
export function movingAverageMap(entries: Entry[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const e of entries) {
    const cutoff = isoAddDays(e.date, -6); // 7-day window inclusive
    const window = entries.filter((x) => x.date >= cutoff && x.date <= e.date);
    map[e.date] = window.reduce((s, x) => s + x.weight, 0) / window.length;
  }
  return map;
}

/**
 * Average lbs/week over a recent window (negative = losing weight).
 * Pass windowDays=Infinity for full-journey average.
 */
export function weeklyRate(entries: Entry[], windowDays = 28): number {
  if (entries.length < 2) return 0;
  const last = entries[entries.length - 1];
  let series = entries;
  if (isFinite(windowDays)) {
    const cutoff = isoAddDays(last.date, -windowDays);
    const recent = entries.filter((e) => e.date >= cutoff);
    series = recent.length >= 2 ? recent : entries;
  }
  const a = series[0];
  const b = series[series.length - 1];
  const days = Math.max(
    1,
    (isoToUTCDate(b.date).getTime() - isoToUTCDate(a.date).getTime()) / MS_PER_DAY
  );
  return Math.round(((b.weight - a.weight) / days) * 7 * 100) / 100;
}

export function remainingToGoal(entries: Entry[], profile: Profile): number {
  const last = latestWeight(entries);
  if (last == null) return 0;
  return Math.max(0, Math.round((last - profile.goalWeight) * 10) / 10);
}

export function projectedGoalDate(
  entries: Entry[],
  profile: Profile
): string | "reached" | null {
  const remaining = remainingToGoal(entries, profile);
  if (remaining <= 0) return "reached";
  const rate = weeklyRate(entries, 28);
  if (rate >= -0.05) return null;
  const weeks = remaining / Math.abs(rate);
  if (!isFinite(weeks) || weeks > 520) return null;
  const last = entries[entries.length - 1];
  return isoAddDays(last.date, Math.round(weeks * 7));
}

export type PaceStatus = "ahead" | "on_track" | "behind" | "reached";

/**
 * How recent pace compares to the overall journey average.
 * "ahead"    = recent rate 15 %+ faster than overall
 * "on_track" = within 25 % of overall
 * "behind"   = notably slower, flat, or gaining
 */
export function paceStatus(
  entries: Entry[],
  profile: Profile
): PaceStatus | null {
  const remaining = remainingToGoal(entries, profile);
  if (remaining <= 0) return "reached";
  if (entries.length < 4) return null;

  const overall = weeklyRate(entries, Infinity); // full journey
  const recent = weeklyRate(entries, 28); // last 4 weeks

  if (recent >= 0) return "behind";
  if (overall >= 0) return recent < -0.1 ? "on_track" : "behind";

  // both negative: ratio > 1 means losing faster recently
  const ratio = recent / overall;
  if (ratio >= 1.15) return "ahead";
  if (ratio >= 0.75) return "on_track";
  return "behind";
}

/** True when net weight change over the last `days` days is under 0.5 lbs. */
export function isOnPlateau(entries: Entry[], days = 14): boolean {
  if (entries.length < 3) return false;
  const last = entries[entries.length - 1];
  const cutoff = isoAddDays(last.date, -days);
  const recent = entries.filter((e) => e.date >= cutoff);
  if (recent.length < 2) return false;
  return Math.abs(recent[recent.length - 1].weight - recent[0].weight) < 0.5;
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

export function loggingStreak(entries: Entry[]): number {
  if (!entries.length) return 0;
  const days = new Set(entries.map((e) => e.date));
  let streak = 0;
  let cursor = entries[entries.length - 1].date;
  while (days.has(cursor)) {
    streak++;
    cursor = isoAddDays(cursor, -1);
  }
  return streak;
}

export function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  return d
    .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    .replace(/(\w+) (\d+)/, (_m, mon, yr) => `${mon} ${day}${suffix}, ${yr}`);
}
