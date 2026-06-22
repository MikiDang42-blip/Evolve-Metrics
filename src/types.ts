export interface Entry {
  id: string;
  /** ISO date string, e.g. 2025-06-13 */
  date: string;
  /** weight in pounds */
  weight: number;
  /** waist circumference in inches (optional) */
  waist?: number;
  /** macros — grams, optional */
  protein?: number;
  carbs?: number;
  fats?: number;
  /** total kcal for the day, optional */
  calories?: number;
  note?: string;
}

export interface Profile {
  startWeight: number; // stored in lbs
  goalWeight: number;  // stored in lbs
  startDate: string;   // ISO date
  phase: string;
  unit: "lbs" | "kg";
  heightIn: number;    // for BMI
}

/** Derived from profile.phase — drives how pace/trend is interpreted. */
export type PhaseMode = "cut" | "bulk" | "maintain" | "recomp";
