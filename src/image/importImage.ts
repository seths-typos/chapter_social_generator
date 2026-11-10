/**
 * Bring image files into the session: check the type, convert HEIC, decode (respecting
 * EXIF rotation), downscale, and make a thumbnail. docs/technical-requirements.md#image-handling
 *
 * The browser work (decoding, resizing, HEIC) comes in through `ImportDeps`, so the rules
 * here are unit-tested with fakes. The real ones are in `browserImage.ts`.
 */

import type { PoolPhoto } from "@/store/types";
import { IMPORT_CONCURRENCY, LOW_RES_SHORT_EDGE, MAX_LONG_EDGE, THUMBNAIL_WIDTH } from "./limits";

export type ImportResult =
  { ok: true; photo: PoolPhoto; bitmap: ImageBitmap } | { ok: false; message: string };

export interface ImportDeps {
  newId: () => string;
  /** Decode a blob, honouring EXIF orientation. Rejects if the browser can't read it. */
  decode: (blob: Blob) => Promise<ImageBitmap>;
  /** Convert a HEIC/HEIF blob to JPEG. */
  convertHeic: (blob: Blob) => Promise<Blob>;
  /** A resized copy of `bitmap`. */
  resize: (bitmap: ImageBitmap, width: number, height: number) => Promise<ImageBitmap>;
  /** A small encoded preview of `bitmap`. */
  thumbnail: (bitmap: ImageBitmap, width: number, height: number) => Promise<Blob>;
}

export type FileKind = "image" | "heic" | "unsupported";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const HEIC_EXTENSIONS = new Set(["heic", "heif"]);

/** Decide from the MIME type, or from the extension when the browser gives no type (common for HEIC). */
export function classifyFile(file: { type: string; name?: string }): FileKind {
  const type = file.type.toLowerCase();
  if (IMAGE_TYPES.has(type)) return "image";
  if (HEIC_TYPES.has(type)) return "heic";
  if (type !== "") return "unsupported";
  const ext = file.name?.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (HEIC_EXTENSIONS.has(ext)) return "heic";
  return "unsupported";
}

/** The size to keep: the long edge capped at `maxLongEdge`, proportions kept, never enlarged. */
export function downscaleSize(
  width: number,
  height: number,
  maxLongEdge = MAX_LONG_EDGE,
): { width: number; height: number } {
  const long = Math.max(width, height);
  if (long <= maxLongEdge) return { width, height };
  const scale = maxLongEdge / long;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** The thumbnail size: `THUMBNAIL_WIDTH` wide, proportions kept, never enlarged. */
export function thumbnailSize(width: number, height: number): { width: number; height: number } {
  if (width <= THUMBNAIL_WIDTH) return { width, height };
  return {
    width: THUMBNAIL_WIDTH,
    height: Math.max(1, Math.round((height * THUMBNAIL_WIDTH) / width)),
  };
}

/** True when the short edge is under 1080 px: the photo may look soft. */
export const isLowResolution = (photo: { width: number; height: number }): boolean =>
  Math.min(photo.width, photo.height) < LOW_RES_SHORT_EDGE;

const nameOf = (file: Blob): string =>
  "name" in file && typeof file.name === "string" && file.name !== "" ? file.name : "";
const quoted = (name: string): string => (name ? `“${name}”` : "That file");

export const unsupportedMessage = (name: string): string =>
  `${quoted(name)} isn’t a photo this tool can use. Use JPEG, PNG, WebP or HEIC.`;
export const unreadableMessage = (name: string): string =>
  `${quoted(name)} couldn’t be opened. The file may be damaged.`;
export const heicMessage = (name: string): string =>
  `${quoted(name)} couldn’t be converted from HEIC. Try exporting it as a JPEG.`;

/** Import one file. Never throws: a failure comes back as a plain-language message. */
export async function importImage(file: Blob, deps: ImportDeps): Promise<ImportResult> {
  const name = nameOf(file);
  const kind = classifyFile({ type: file.type, name });
  if (kind === "unsupported") return { ok: false, message: unsupportedMessage(name) };

  let bitmap: ImageBitmap;
  try {
    // Try the browser first, even for HEIC: Safari decodes it natively.
    bitmap = await deps.decode(file);
  } catch {
    if (kind !== "heic") return { ok: false, message: unreadableMessage(name) };
    try {
      bitmap = await deps.decode(await deps.convertHeic(file));
    } catch {
      return { ok: false, message: heicMessage(name) };
    }
  }

  try {
    const size = downscaleSize(bitmap.width, bitmap.height);
    if (size.width !== bitmap.width || size.height !== bitmap.height) {
      const small = await deps.resize(bitmap, size.width, size.height);
      bitmap.close();
      bitmap = small;
    }
    const thumb = thumbnailSize(bitmap.width, bitmap.height);
    const thumbnail = await deps.thumbnail(bitmap, thumb.width, thumb.height);
    const photo: PoolPhoto = {
      id: deps.newId(),
      name,
      thumbnail,
      width: bitmap.width,
      height: bitmap.height,
      mode: "regular",
    };
    return { ok: true, photo, bitmap };
  } catch {
    bitmap.close();
    return { ok: false, message: unreadableMessage(name) };
  }
}

/**
 * Import several files, a few at a time. `onResult` is called once per file, in the order
 * the files were given, as soon as that file and all the ones before it are done.
 */
export async function importImages<F>(
  files: readonly F[],
  importOne: (file: F) => Promise<ImportResult>,
  onResult: (result: ImportResult, index: number) => void,
  concurrency = IMPORT_CONCURRENCY,
): Promise<void> {
  const results: (ImportResult | undefined)[] = files.map(() => undefined);
  let next = 0;
  let flushed = 0;
  const worker = async () => {
    while (next < files.length) {
      const i = next++;
      results[i] = await importOne(files[i]!);
      for (let r = results[flushed]; r; r = results[flushed]) {
        onResult(r, flushed);
        flushed++;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker));
}
