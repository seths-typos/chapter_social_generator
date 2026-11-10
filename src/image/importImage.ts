/**
 * Bring one image file into the session: decode it (respecting EXIF rotation) and describe
 * it as a pool photo. docs/technical-requirements.md#image-handling
 *
 * This is the single-file core. HEIC conversion, downscaling and multi-file import land
 * with the photo pool in #14.
 */

import { decodeImage } from "@/render/textureLibrary";
import type { PoolPhoto } from "@/store/types";

export type ImportResult =
  { ok: true; photo: PoolPhoto; bitmap: ImageBitmap } | { ok: false; message: string };

export const NOT_AN_IMAGE = "That file isn’t an image the browser can open.";

export async function importImage(
  file: Blob,
  newId: () => string,
  decode: (blob: Blob) => Promise<ImageBitmap> = decodeImage,
): Promise<ImportResult> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await decode(file);
  } catch {
    return { ok: false, message: NOT_AN_IMAGE };
  }
  const photo: PoolPhoto = {
    id: newId(),
    file,
    width: bitmap.width,
    height: bitmap.height,
    mode: "regular",
  };
  return { ok: true, photo, bitmap };
}
