export type Unit = "lbs" | "kg";

export const LBS_PER_KG = 2.2046226218;

/** Convert a value entered in the given unit into the canonical lbs we store. */
export function toLbs(value: number, unit: Unit): number {
  return unit === "kg" ? value * LBS_PER_KG : value;
}

/** Convert a stored lbs value into the user's display unit. */
export function fromLbs(lbs: number, unit: Unit): number {
  return unit === "kg" ? lbs / LBS_PER_KG : lbs;
}

/** Format a stored lbs value for display in the chosen unit. */
export function fmtWeight(lbs: number, unit: Unit, digits = 1): string {
  return fromLbs(lbs, unit).toFixed(digits);
}
