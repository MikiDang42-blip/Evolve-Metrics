export interface Entry {
  id: string;
  /** ISO date string, e.g. 2025-06-13 */
  date: string;
  /** weight in pounds */
  weight: number;
  note?: string;
}

export interface Profile {
  startWeight: number;
  goalWeight: number;
  startDate: string; // ISO date
  phase: string;
  unit: "lbs" | "kg";
}
