/** The browser side of image import: resizing, thumbnails and HEIC conversion. */

import { decodeImage } from "@/render/textureLibrary";
import type { ImportDeps } from "./importImage";
import { HEIC_JPEG_QUALITY } from "./limits";

function resize(bitmap: ImageBitmap, width: number, height: number): Promise<ImageBitmap> {
  return createImageBitmap(bitmap, {
    resizeWidth: width,
    resizeHeight: height,
    resizeQuality: "high",
  });
}

/** WebP keeps transparency (event graphics); browsers that can't encode it fall back to PNG. */
function thumbnail(bitmap: ImageBitmap, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("No 2D context"));
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Thumbnail failed"))),
      "image/webp",
      0.8,
    ),
  );
}

/** `heic2any` is large, so it is only fetched when a HEIC file needs it. */
async function convertHeic(blob: Blob): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob, toType: "image/jpeg", quality: HEIC_JPEG_QUALITY });
  const jpeg = Array.isArray(out) ? out[0] : out;
  if (!jpeg) throw new Error("HEIC conversion produced nothing");
  return jpeg;
}

export const browserImportDeps = (newId: () => string): ImportDeps => ({
  newId,
  decode: decodeImage,
  convertHeic,
  resize,
  thumbnail,
});
