import { useEffect, useState } from "react";
import type { Entry, Profile } from "./types";

const ENTRIES_KEY = "evolve.entries.v1";
const PROFILE_KEY = "evolve.profile.v1";

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const JOURNEY_WEEKS = 35;
const START_WEIGHT = 210.8;
const CURRENT_WEIGHT = 185.3;

const MS_PER_DAY = 86400000;

/** Today as an ISO date string (UTC), matching what addEntry uses for "today". */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Add n days to an ISO date string using UTC arithmetic (no DST/rounding drift). */
function isoAddDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Whole days between two ISO dates (UTC midnight, so always an exact integer). */
function isoDaysBetween(a: string, b: string): number {
  const ms = new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime();
  return Math.round(ms / MS_PER_DAY);
}

/** First day of the journey: ~35 weeks before today, so the app always reads current. */
function startDateISO(): string {
  return isoAddDays(todayISO(), -JOURNEY_WEEKS * 7);
}

/** Build a realistic seed dataset matching the mockup (start 210.8 -> ~185.3). */
function seedEntries(): Entry[] {
  const start = startDateISO();
  const totalDays = isoDaysBetween(start, todayISO());
  const totalDrop = START_WEIGHT - CURRENT_WEIGHT;
  // ~3-day cadence for most of the journey, then daily for the last 14 days
  const dailyTail = 14;

  const dayOffsets: number[] = [];
  for (let d = 0; d < totalDays - dailyTail; d += 3) dayOffsets.push(d);
  for (let d = Math.max(0, totalDays - dailyTail); d <= totalDays; d += 1) {
    dayOffsets.push(d);
  }

  const entries: Entry[] = dayOffsets.map((offset) => {
    // smooth downward progress (slightly faster early on) plus daily wobble
    const t = offset / totalDays;
    const eased = 1 - Math.pow(1 - t, 1.4);
    const noise = (Math.random() - 0.5) * 0.8;
    const weight = START_WEIGHT - totalDrop * eased + noise;
    return {
      id: uid(),
      date: isoAddDays(start, offset),
      weight: Math.round(weight * 10) / 10,
    };
  });

  // pin the headline numbers and make the final tick read as a loss (mockup: -0.3)
  if (entries.length >= 2) {
    entries[0].weight = START_WEIGHT;
    entries[entries.length - 1].weight = CURRENT_WEIGHT;
    entries[entries.length - 2].weight = CURRENT_WEIGHT + 0.3;
  }
  return entries;
}

const defaultProfile: Profile = {
  startWeight: START_WEIGHT,
  goalWeight: 168,
  startDate: startDateISO(),
  phase: "Cutting Phase",
  unit: "lbs",
  heightIn: 70,
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>(() => {
    const existing = load<Entry[] | null>(ENTRIES_KEY, null);
    if (existing && existing.length) return sortEntries(existing);
    const seeded = seedEntries();
    return sortEntries(seeded);
  });

  useEffect(() => {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = (weight: number, note?: string, date?: string) => {
    const day = date ?? new Date().toISOString().slice(0, 10);
    setEntries((prev) => {
      // replace if same day already logged
      const without = prev.filter((e) => e.date !== day);
      const next: Entry = { id: uid(), date: day, weight, note };
      return sortEntries([...without, next]);
    });
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const resetAll = () => {
    setEntries(sortEntries(seedEntries()));
  };

  return { entries, addEntry, removeEntry, resetAll };
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(() => ({
    ...defaultProfile,
    ...load<Partial<Profile>>(PROFILE_KEY, {}),
  }));
  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);
  return { profile, setProfile };
}

export function sortEntries(list: Entry[]): Entry[] {
  return [...list].sort((a, b) => a.date.localeCompare(b.date));
}
