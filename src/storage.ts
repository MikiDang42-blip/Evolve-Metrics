import { useEffect, useState } from "react";
import type { Entry, Profile } from "./types";
import { todayISO, isoAddDays, isoDaysBetween } from "./dateUtils";

const ENTRIES_KEY = "evolve.entries.v1";
const PROFILE_KEY = "evolve.profile.v1";

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const JOURNEY_WEEKS = 35;
const START_WEIGHT = 210.8;
const CURRENT_WEIGHT = 185.3;

function startDateISO(): string {
  return isoAddDays(todayISO(), -JOURNEY_WEEKS * 7);
}

const START_WAIST = 38.5;
const CURRENT_WAIST = 34.2;

const SEED_NOTES: Record<number, string> = {
  2: "Salty takeout last night 🍜",
  6: "Refeed day — up is expected",
  9: "Long run this morning",
};

function seedEntries(): Entry[] {
  const start = startDateISO();
  const totalDays = isoDaysBetween(start, todayISO());
  const totalDrop = START_WEIGHT - CURRENT_WEIGHT;
  const waistDrop = START_WAIST - CURRENT_WAIST;
  const dailyTail = 14;

  const dayOffsets: number[] = [];
  for (let d = 0; d < totalDays - dailyTail; d += 3) dayOffsets.push(d);
  for (let d = Math.max(0, totalDays - dailyTail); d <= totalDays; d++) dayOffsets.push(d);

  const entries: Entry[] = dayOffsets.map((offset) => {
    const t = offset / totalDays;
    const eased = 1 - Math.pow(1 - t, 1.4);
    const noise = (Math.random() - 0.5) * 0.8;
    const e: Entry = {
      id: uid(),
      date: isoAddDays(start, offset),
      weight: Math.round((START_WEIGHT - totalDrop * eased + noise) * 10) / 10,
    };
    // Weekly waist measurement — stalls less than scale weight
    if (offset % 7 === 0 || offset === totalDays) {
      e.waist = Math.round((START_WAIST - waistDrop * eased) * 10) / 10;
    }
    // Recent days carry macros + the occasional note, to showcase both
    const daysAgo = totalDays - offset;
    if (daysAgo <= 6) {
      const p = 175 + Math.round(Math.random() * 15);
      const c = 170 + Math.round(Math.random() * 60);
      const f = 55 + Math.round(Math.random() * 15);
      e.protein = p;
      e.carbs = c;
      e.fats = f;
      e.calories = Math.round((p * 4 + c * 4 + f * 9) / 10) * 10;
    }
    if (SEED_NOTES[daysAgo]) e.note = SEED_NOTES[daysAgo];
    return e;
  });

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
  phase: "Cutting",
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
    return sortEntries(seedEntries());
  });

  useEffect(() => {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = (
    weight: number,
    waist?: number | null,
    note?: string,
    date?: string,
    macros?: { protein?: number; carbs?: number; fats?: number; calories?: number },
  ) => {
    const day = date ?? todayISO();
    setEntries((prev) => {
      const without = prev.filter((e) => e.date !== day);
      const next: Entry = { id: uid(), date: day, weight, note };
      if (waist != null && waist > 0) next.waist = Math.round(waist * 10) / 10;
      if (macros?.protein) next.protein = Math.round(macros.protein);
      if (macros?.carbs) next.carbs = Math.round(macros.carbs);
      if (macros?.fats) next.fats = Math.round(macros.fats);
      if (macros?.calories) next.calories = Math.round(macros.calories);
      return sortEntries([...without, next]);
    });
  };

  const updateEntry = (
    id: string,
    weight: number,
    date: string,
    waist?: number | null,
    macros?: { protein?: number; carbs?: number; fats?: number; calories?: number },
    note?: string | null,
  ) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.id === id);
      if (!existing) return prev;
      const without = prev.filter((e) => e.id !== id && e.date !== date);
      const updated: Entry = { ...existing, weight: Math.round(weight * 10) / 10, date };
      if (waist != null && waist > 0) updated.waist = Math.round(waist * 10) / 10;
      else delete updated.waist;
      // Only touch macros when the caller provides them — undefined means
      // "leave as-is" so callers without macro UI can't wipe logged data.
      if (macros) {
        if (macros.protein) updated.protein = Math.round(macros.protein);
        else delete updated.protein;
        if (macros.carbs) updated.carbs = Math.round(macros.carbs);
        else delete updated.carbs;
        if (macros.fats) updated.fats = Math.round(macros.fats);
        else delete updated.fats;
        if (macros.calories) updated.calories = Math.round(macros.calories);
        else delete updated.calories;
      }
      if (note !== undefined) {
        if (note && note.trim()) updated.note = note.trim().slice(0, 200);
        else delete updated.note;
      }
      return sortEntries([...without, updated]);
    });
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const replaceEntries = (list: Entry[]) => {
    setEntries(sortEntries(list));
  };

  const resetAll = () => {
    setEntries(sortEntries(seedEntries()));
  };

  return { entries, addEntry, updateEntry, removeEntry, replaceEntries, resetAll };
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
