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

/** First day of the journey: ~35 weeks before today, so the app always reads current. */
function startDateISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - JOURNEY_WEEKS * 7);
  return d.toISOString().slice(0, 10);
}

/** Build a realistic seed dataset matching the mockup (start 210.8 -> ~185.3). */
function seedEntries(): Entry[] {
  const start = new Date(startDateISO());
  const today = new Date();
  const totalDays = Math.round((today.getTime() - start.getTime()) / 86400000);
  const stepDays = 3;
  const steps = Math.floor(totalDays / stepDays);
  const totalDrop = START_WEIGHT - CURRENT_WEIGHT;

  const entries: Entry[] = [];
  for (let i = 0; i <= steps; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * stepDays);
    // smooth downward progress (slightly faster early on) plus daily wobble
    const t = i / steps;
    const eased = 1 - Math.pow(1 - t, 1.4);
    const noise = (Math.random() - 0.5) * 0.8;
    const weight = START_WEIGHT - totalDrop * eased + noise;
    entries.push({
      id: uid(),
      date: d.toISOString().slice(0, 10),
      weight: Math.round(weight * 10) / 10,
    });
  }
  // pin first and last to the headline numbers
  if (entries.length) {
    entries[0].weight = START_WEIGHT;
    entries[entries.length - 1].weight = CURRENT_WEIGHT;
  }
  return entries;
}

const defaultProfile: Profile = {
  startWeight: START_WEIGHT,
  goalWeight: 168,
  startDate: startDateISO(),
  phase: "Cutting Phase",
  unit: "lbs",
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
  const [profile, setProfile] = useState<Profile>(() =>
    load<Profile>(PROFILE_KEY, defaultProfile)
  );
  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);
  return { profile, setProfile };
}

export function sortEntries(list: Entry[]): Entry[] {
  return [...list].sort((a, b) => a.date.localeCompare(b.date));
}
