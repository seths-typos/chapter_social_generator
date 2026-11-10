/** Filenames for exported posts. docs/technical-requirements.md#export */

const FALLBACK = "post";

/**
 * A post name as a safe filename stem: lowercase, accents stripped, anything that isn't a
 * letter or digit collapsed to a single hyphen. Never empty.
 */
export function slugify(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || FALLBACK;
}

/** `{slug}.png`, the name of a single downloaded post. */
export const pngFilename = (name: string): string => `${slugify(name)}.png`;
