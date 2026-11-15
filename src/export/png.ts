/**
 * PNG export of one post. The post is re-rendered from its data on a fresh 1080×1440
 * canvas by the same `renderPost` the preview uses. docs/technical-requirements.md#export
 */

import { createRenderCanvas } from "@/render/canvas";
import { renderPost } from "@/render/renderPost";
import { textureKey, type RenderAssets } from "@/render/types";
import type { Post } from "@/store/types";
import { photoIdsInPost, templateFor } from "@/templates/registry";

/**
 * What the post needs that isn't loaded yet. Export must wait for these: a missing
 * texture or photo would otherwise be exported as a blank stand-in.
 */
export function missingAssets(post: Post, assets: RenderAssets): string[] {
  const missing: string[] = [];
  if (!assets.textures.has(textureKey(post.texture))) missing.push("texture");
  if (photoIdsInPost(post).some((id) => !assets.photos.has(id))) missing.push("image");
  if (templateFor(post.template).slots && !assets.frame) missing.push("polaroid frame");
  return missing;
}

/**
 * How to describe missing assets: the ones that failed to load can be retried, the rest
 * are still on their way.
 */
export function describeMissing(
  missing: readonly string[],
  failed: readonly string[],
): { text: string; canRetry: boolean } | null {
  if (missing.length === 0) return null;
  const broken = missing.filter((name) => failed.includes(name));
  return broken.length > 0
    ? { text: `Couldn’t load the ${broken.join(" or the ")}.`, canRetry: true }
    : { text: `Still loading: ${missing.join(", ")}`, canRetry: false };
}

const assetIds = new WeakMap<object, number>();
let nextAssetId = 1;
/** A number that stays the same for the same object. */
function idOf(value: unknown): string {
  if (typeof value !== "object" || value === null) return "-";
  let id = assetIds.get(value);
  if (!id) assetIds.set(value, (id = nextAssetId++));
  return String(id);
}

/**
 * Changes only when one of the assets this post draws with does: its texture, its photos
 * and the polaroid frame. A thumbnail keyed on this skips the redraw when some other
 * photo or texture finishes loading.
 */
export function postAssetKey(post: Post, assets: RenderAssets): string {
  return [
    assets.textures.get(textureKey(post.texture)),
    assets.frame,
    ...photoIdsInPost(post).map((id) => assets.photos.get(id)),
  ]
    .map(idOf)
    .join(",");
}

/** Render a post to a PNG blob. Rejects if an asset is missing or the canvas can't encode. */
export function renderPostToPng(post: Post, assets: RenderAssets): Promise<Blob> {
  const missing = missingAssets(post, assets);
  if (missing.length > 0) {
    return Promise.reject(new Error(`Still loading: ${missing.join(", ")}`));
  }
  // Attached and smoothed like the preview, so the PNG's text is identical to what was shown.
  const canvas = createRenderCanvas();
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return Promise.reject(new Error("Canvas isn’t available in this browser"));
  }
  renderPost(ctx, post, assets);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The PNG couldn’t be created"))),
      "image/png",
    ),
  ).finally(() => canvas.remove());
}

/** Save a blob to the user's downloads through a temporary `<a download>` link. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
