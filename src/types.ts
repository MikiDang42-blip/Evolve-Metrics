export interface Entry {
  id: string;
  /** ISO date string, e.g. 2025-06-13 */
  date: string;
  /** weight in pounds */
  weight: number;
  note?: string;
}

export interface Profile {
  startWeight: number; // stored in lbs
  goalWeight: number; // stored in lbs
  startDate: string; // ISO date
  phase: string;
  unit: "lbs" | "kg";
  heightIn: number; // height in inches, for BMI
}
