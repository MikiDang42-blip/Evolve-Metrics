import type { Entry } from "./types";
import { isoDaysBetween } from "./dateUtils";

export interface PeriodGroup {
  key: string;
  /** human title, e.g. "Week 35" or "June 2026" */
  title: string;
  /** date-range subtitle, e.g. "Jun 14 – Jun 20" */
  range: string;
  /** average (true) weight in lbs across the bucket */
  avgWeight: number;
  /** net change vs the previous bucket's avg, in lbs (negative = lost) */
  netChange: number | null;
  /** signed change within the bucket: last entry − first entry, in lbs (negative = lost) */
  lostInPeriod: number;
  /** entries in the bucket, chronological */
  entries: Entry[];
}

function rangeLabel(first: string, last: string): string {
  const fmt = (iso: string) =>
    new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return first === last ? fmt(first) : `${fmt(first)} – ${fmt(last)}`;
}

/**
 * Bucket entries into journey-weeks measured from `startDate`.
 * Returns most-recent-first.
 */
export function groupByWeek(entries: Entry[], startDate: string): PeriodGroup[] {
  if (!entries.length) return [];
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const buckets = new Map<number, Entry[]>();
  for (const e of sorted) {
    const days = isoDaysBetween(startDate, e.date);
    const week = Math.max(0, Math.floor(days / 7));
    if (!buckets.has(week)) buckets.set(week, []);
    buckets.get(week)!.push(e);
  }

  const weekNums = [...buckets.keys()].sort((a, b) => a - b);
  let prevAvg: number | null = null;
  const groups: PeriodGroup[] = [];

  for (const wk of weekNums) {
    const list = buckets.get(wk)!;
    const avg = list.reduce((s, e) => s + e.weight, 0) / list.length;
    const avgRounded = Math.round(avg * 10) / 10;
    groups.push({
      key: `w${wk}`,
      title: `Week ${wk + 1}`,
      range: rangeLabel(list[0].date, list[list.length - 1].date),
      avgWeight: avgRounded,
      netChange: prevAvg == null ? null : Math.round((avgRounded - prevAvg) * 10) / 10,
      lostInPeriod: Math.round((list[list.length - 1].weight - list[0].weight) * 10) / 10,
      entries: list,
    });
    prevAvg = avgRounded;
  }

  return groups.reverse();
}

/**
 * Bucket entries by calendar month. Returns most-recent-first.
 */
export function groupByMonth(entries: Entry[]): PeriodGroup[] {
  if (!entries.length) return [];
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const buckets = new Map<string, Entry[]>();
  for (const e of sorted) {
    const ym = e.date.slice(0, 7); // YYYY-MM
    if (!buckets.has(ym)) buckets.set(ym, []);
    buckets.get(ym)!.push(e);
  }

  const months = [...buckets.keys()].sort();
  let prevAvg: number | null = null;
  const groups: PeriodGroup[] = [];

  for (const ym of months) {
    const list = buckets.get(ym)!;
    const avg = list.reduce((s, e) => s + e.weight, 0) / list.length;
    const avgRounded = Math.round(avg * 10) / 10;
    const title = new Date(ym + "-01T00:00:00Z").toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    groups.push({
      key: ym,
      title,
      range: rangeLabel(list[0].date, list[list.length - 1].date),
      avgWeight: avgRounded,
      netChange: prevAvg == null ? null : Math.round((avgRounded - prevAvg) * 10) / 10,
      lostInPeriod: Math.round((list[list.length - 1].weight - list[0].weight) * 10) / 10,
      entries: list,
    });
    prevAvg = avgRounded;
  }

  return groups.reverse();
}
