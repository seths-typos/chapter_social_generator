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

/** `chapter-posts-{YYYY-MM-DD}.zip`, dated in the user's own time zone. */
export function zipFilename(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `chapter-posts-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.zip`;
}

/**
 * `{NN}-{slug}.png` for each post, numbered from 01 in batch order. The number is at
 * least two digits and wide enough for the whole batch, so the files sort in order.
 */
export function batchFilenames(names: readonly string[]): string[] {
  const width = Math.max(2, String(names.length).length);
  return names.map((name, i) => `${String(i + 1).padStart(width, "0")}-${slugify(name)}.png`);
}

/**
 * The text of `captions.txt`: for each post its filename, the caption on the next line(s),
 * then a blank line. LF line endings.
 */
export function captionsText(entries: readonly { filename: string; caption: string }[]): string {
  return entries
    .map(({ filename, caption }) => {
      const text = caption.replace(/\r\n?/g, "\n").trim();
      return `${filename}\n${text ? `${text}\n` : ""}\n`;
    })
    .join("");
}
