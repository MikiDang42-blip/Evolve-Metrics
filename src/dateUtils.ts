export const MS_PER_DAY = 86400000;

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoToUTCDate(iso: string): Date {
  return new Date(iso + "T00:00:00Z");
}

export function isoAddDays(iso: string, n: number): string {
  const d = isoToUTCDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isoDaysBetween(a: string, b: string): number {
  return Math.round((isoToUTCDate(b).getTime() - isoToUTCDate(a).getTime()) / MS_PER_DAY);
}
