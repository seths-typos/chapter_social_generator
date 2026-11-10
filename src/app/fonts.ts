/**
 * Font loading gate. See docs/technical-requirements.md#fonts
 *
 * The template renderer draws text on canvas, which silently falls back to another
 * family if a font isn't loaded. So before the first render we load every font the
 * templates need and confirm each one is really available. A PNG must never be
 * exported with a fallback font.
 */

export interface RequiredFont {
  /** CSS font-family as declared in fonts.css */
  family: string;
  weight: 400 | 500 | 700;
  /** Human-readable name for error messages */
  label: string;
}

/** Fonts the template renderer depends on. Geist is UI-only, so it isn't gated. */
export const REQUIRED_FONTS: readonly RequiredFont[] = [
  { family: "Chapter Druk", weight: 500, label: "Druk Medium" },
  { family: "Chapter Druk", weight: 700, label: "Druk Bold" },
  { family: "Instrument Serif", weight: 400, label: "Instrument Serif" },
];

/** CSS font shorthand understood by FontFaceSet.load() / check(). */
export function fontSpec(font: RequiredFont): string {
  return `${font.weight} 100px "${font.family}"`;
}

/** The subset of FontFaceSet this module uses, so tests can pass a fake. */
export type FontLoader = Pick<FontFaceSet, "load" | "check">;

export type FontLoadResult = { ok: true } | { ok: false; missing: RequiredFont[] };

/**
 * Load all required fonts and confirm each is available.
 * Never throws: a network or decode failure shows up as a `missing` entry.
 */
export async function ensureFonts(
  fonts: readonly RequiredFont[] = REQUIRED_FONTS,
  loader: FontLoader = document.fonts,
): Promise<FontLoadResult> {
  const results = await Promise.all(
    fonts.map(async (font) => {
      const spec = fontSpec(font);
      try {
        await loader.load(spec);
      } catch {
        return { font, ok: false };
      }
      return { font, ok: loader.check(spec) };
    }),
  );
  const missing = results.filter((r) => !r.ok).map((r) => r.font);
  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}
