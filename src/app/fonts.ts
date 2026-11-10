/**
 * Font loading. See docs/technical-requirements.md#fonts
 *
 * The template renderer draws text on canvas, which silently uses another family if a
 * font isn't ready. Two kinds of font, handled differently:
 *
 * - Bundled fonts (Instrument Serif) ship with the site and must load. Until they do,
 *   nothing renders; if they fail, nothing can be exported.
 * - Local fonts (Druk) are licensed and never shipped. They are used when installed on the
 *   computer. When one is missing the app still works, on the fallback stack, and tells
 *   the user so.
 */

export interface RequiredFont {
  /** CSS font-family as declared in fonts.css */
  family: string;
  weight: 400 | 500 | 700;
  /** Human-readable name for messages */
  label: string;
}

/** Bundled fonts the renderer cannot work without. Geist is UI-only, so it isn't gated. */
export const REQUIRED_FONTS: readonly RequiredFont[] = [
  { family: "Instrument Serif", weight: 400, label: "Instrument Serif" },
];

/** Fonts used only if installed on this computer. Never bundled. */
export const LOCAL_FONTS: readonly RequiredFont[] = [
  { family: "Chapter Druk", weight: 500, label: "Druk Medium" },
  { family: "Chapter Druk", weight: 700, label: "Druk Bold" },
];

/** CSS font shorthand understood by FontFaceSet.load() / check(). */
export function fontSpec(font: RequiredFont): string {
  return `${font.weight} 100px "${font.family}"`;
}

/** The subset of FontFaceSet this module uses, so tests can pass a fake. */
export type FontLoader = Pick<FontFaceSet, "load" | "check">;

/** The subset of FontFace used to see whether a local font was found. */
export interface FontFaceLike {
  family: string;
  weight: string;
  status: FontFaceLoadStatus;
  load(): Promise<unknown>;
}

export type FontLoadResult =
  { ok: true; missingLocal: RequiredFont[] } | { ok: false; missing: RequiredFont[] };

const unquote = (family: string): string => family.replace(/^["']|["']$/g, "");

/**
 * Which local fonts aren't installed. A `local()`-only face loads when the computer has
 * the font and errors when it doesn't, so its status is the answer.
 */
export async function findMissingLocalFonts(
  fonts: readonly RequiredFont[] = LOCAL_FONTS,
  faces: Iterable<FontFaceLike> = document.fonts,
): Promise<RequiredFont[]> {
  const all = [...faces];
  const found = await Promise.all(
    fonts.map(async (font) => {
      const face = all.find(
        (f) => unquote(f.family) === font.family && f.weight === String(font.weight),
      );
      if (!face) return false;
      try {
        await face.load();
      } catch {
        // Not installed.
      }
      return face.status === "loaded";
    }),
  );
  return fonts.filter((_, i) => !found[i]);
}

/**
 * Load the bundled fonts and confirm each is available, then look for the local ones.
 * Never throws: a network or decode failure shows up as a `missing` entry.
 */
export async function ensureFonts(
  fonts: readonly RequiredFont[] = REQUIRED_FONTS,
  loader: FontLoader = document.fonts,
  findMissingLocal: () => Promise<RequiredFont[]> = findMissingLocalFonts,
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
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, missingLocal: await findMissingLocal().catch(() => [...LOCAL_FONTS]) };
}
