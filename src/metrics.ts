import type { Entry, PhaseMode, Profile } from "./types";
import { isoAddDays, isoToUTCDate, MS_PER_DAY } from "./dateUtils";

// ─── Basic stats ──────────────────────────────────────────────────────────────

export function latestWeight(entries: Entry[]): number | null {
  return entries.length ? entries[entries.length - 1].weight : null;
}

export function previousWeight(entries: Entry[]): number | null {
  return entries.length >= 2 ? entries[entries.length - 2].weight : null;
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
  return Math.max(0, Math.min(100, Math.round(((profile.startWeight - last) / totalToLose) * 100)));
}

export function weeksSince(startDate: string): number {
  return Math.max(0, Math.floor((Date.now() - isoToUTCDate(startDate).getTime()) / (MS_PER_DAY * 7)));
}

// ─── Rate & projection ────────────────────────────────────────────────────────

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
  profile: Profile,
  rateOverride?: number
): string | "reached" | null {
  const remaining = remainingToGoal(entries, profile);
  if (remaining <= 0) return "reached";
  const rate = rateOverride ?? weeklyRate(entries, 28);
  if (rate >= -0.05) return null;
  const weeks = remaining / Math.abs(rate);
  if (!isFinite(weeks) || weeks > 520) return null;
  return isoAddDays(entries[entries.length - 1].date, Math.round(weeks * 7));
}

// ─── 7-day moving average ─────────────────────────────────────────────────────

/** Map of date → 7-day backward-window MA (lbs). */
export function movingAverageMap(entries: Entry[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const e of entries) {
    const cutoff = isoAddDays(e.date, -6);
    const win = entries.filter((x) => x.date >= cutoff && x.date <= e.date);
    map[e.date] = win.reduce((s, x) => s + x.weight, 0) / win.length;
  }
  return map;
}

/** The most recent 7-day average weight (lbs). Falls back to latest daily. */
export function currentMA7(entries: Entry[]): number | null {
  if (!entries.length) return null;
  const map = movingAverageMap(entries);
  const last = entries[entries.length - 1];
  return Math.round((map[last.date] ?? last.weight) * 10) / 10;
}

// ─── Phase awareness ──────────────────────────────────────────────────────────

export function getPhaseMode(phase: string): PhaseMode {
  const p = phase.toLowerCase();
  if (p.includes("bulk")) return "bulk";
  if (p.includes("maint")) return "maintain";
  if (p.includes("recomp")) return "recomp";
  return "cut"; // default / cutting
}

export type TrendDirection = "falling" | "slow_fall" | "flat" | "slow_rise" | "rising";

export function trendDirection(rate: number): TrendDirection {
  if (rate < -0.4) return "falling";
  if (rate < -0.1) return "slow_fall";
  if (rate <= 0.1) return "flat";
  if (rate <= 0.4) return "slow_rise";
  return "rising";
}

export interface TrendDisplay {
  label: string;
  tone: "good" | "neutral" | "warn";
}

export function trendDisplayForPhase(rate: number, mode: PhaseMode): TrendDisplay {
  const dir = trendDirection(rate);
  switch (mode) {
    case "cut":
      return dir === "falling" || dir === "slow_fall"
        ? { label: "trending down", tone: "good" }
        : dir === "flat"
        ? { label: "holding steady", tone: "neutral" }
        : { label: "trending up", tone: "warn" };
    case "bulk":
      return dir === "rising" || dir === "slow_rise"
        ? { label: "trending up", tone: "good" }
        : dir === "flat"
        ? { label: "holding steady", tone: "neutral" }
        : { label: "trending down", tone: "warn" };
    case "maintain":
      return dir === "flat"
        ? { label: "holding steady", tone: "good" }
        : { label: rate < 0 ? "trending down" : "trending up", tone: "neutral" };
    case "recomp":
      return { label: "recomp in progress", tone: "neutral" };
  }
}

// ─── Pace status ──────────────────────────────────────────────────────────────

export type PaceStatus = "ahead" | "on_track" | "behind" | "reached";

export function paceStatus(
  entries: Entry[],
  profile: Profile
): PaceStatus | null {
  const mode = getPhaseMode(profile.phase);
  // Only meaningful for cut / bulk
  if (mode === "maintain" || mode === "recomp") return null;
  const remaining = remainingToGoal(entries, profile);
  if (remaining <= 0) return "reached";
  if (entries.length < 4) return null;
  const overall = weeklyRate(entries, Infinity);
  const recent = weeklyRate(entries, 28);
  const isCut = mode === "cut";
  // For a cut: losing faster is "ahead", gaining is "behind"
  const goodDirection = isCut ? recent < 0 : recent > 0;
  if (!goodDirection) return "behind";
  if (Math.abs(overall) < 0.05) return recent < -0.1 || recent > 0.1 ? "on_track" : "behind";
  const ratio = recent / overall;
  if (ratio >= 1.15) return "ahead";
  if (ratio >= 0.7) return "on_track";
  return "behind";
}

// ─── Plateau ─────────────────────────────────────────────────────────────────

export function isOnPlateau(entries: Entry[], days = 14): boolean {
  if (entries.length < 3) return false;
  const last = entries[entries.length - 1];
  const cutoff = isoAddDays(last.date, -days);
  const recent = entries.filter((e) => e.date >= cutoff);
  if (recent.length < 2) return false;
  return Math.abs(recent[recent.length - 1].weight - recent[0].weight) < 0.5;
}

export interface PlateauCoach {
  currentPaceDate: string | null;
  historicalRate: number;
  historicalPaceDate: string | null;
  requiredRate: number; // lbs/wk needed to match historical pace
}

export function plateauCoach(entries: Entry[], profile: Profile): PlateauCoach | null {
  if (!isOnPlateau(entries)) return null;
  const mode = getPhaseMode(profile.phase);
  if (mode !== "cut") return null; // only coach during a cut

  const historicalRate = weeklyRate(entries, Infinity);
  const currentPaceDate = projectedGoalDate(entries, profile);
  const historicalPaceDate =
    historicalRate < -0.05
      ? projectedGoalDate(entries, profile, historicalRate)
      : null;

  return {
    currentPaceDate: typeof currentPaceDate === "string" ? currentPaceDate : null,
    historicalRate: Math.round(Math.abs(historicalRate) * 10) / 10,
    historicalPaceDate: typeof historicalPaceDate === "string" ? historicalPaceDate : null,
    requiredRate: Math.round(Math.abs(historicalRate) * 10) / 10,
  };
}

// ─── BMI ─────────────────────────────────────────────────────────────────────

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

// ─── Streak ──────────────────────────────────────────────────────────────────

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

// ─── Trend series ─────────────────────────────────────────────────────────────

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

// ─── Waist series ────────────────────────────────────────────────────────────

export function waistSeries(entries: Entry[]): TrendPoint[] {
  return entries
    .filter((e) => e.waist != null)
    .map((e) => ({ date: e.date, label: formatShort(e.date), weight: e.waist! }));
}

// ─── Formatters ──────────────────────────────────────────────────────────────

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

export function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
