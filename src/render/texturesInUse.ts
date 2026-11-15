import type { TextureRef } from "@/store/types";
import { textureKey } from "./types";

/**
 * The cache keys of every texture something on screen or in the batch still needs: the
 * post being edited, every post in the batch (their thumbnails and the export read them)
 * and each template's default, which a new post starts from.
 */
export function texturesInUse(
  draft: TextureRef | null,
  batch: readonly TextureRef[],
  defaults: readonly TextureRef[],
): Set<string> {
  const refs = [...defaults, ...batch, ...(draft ? [draft] : [])];
  return new Set(refs.map(textureKey));
}
