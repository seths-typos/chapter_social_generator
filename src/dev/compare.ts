/** Dev only. Pure helpers for the comparison view. */

/** Reference renders exist for these templates (`docs/reference/{id}.png`). */
export const COMPARE_IDS = ["cover", "photo", "graphic", "info"] as const;
export type CompareId = (typeof COMPARE_IDS)[number];

/** The `?compare=` value as a template with a reference, or null if it isn't one. */
export function parseCompareParam(value: string | null): CompareId | null {
  return (COMPARE_IDS as readonly string[]).includes(value ?? "") ? (value as CompareId) : null;
}

export const ZOOMS = [
  { id: "fit", label: "Fit", scale: null },
  { id: "100", label: "100%", scale: 1 },
  { id: "200", label: "200%", scale: 2 },
] as const;
export type ZoomId = (typeof ZOOMS)[number]["id"];
