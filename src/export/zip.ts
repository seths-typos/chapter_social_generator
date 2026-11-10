/**
 * "Download all": every batch post re-rendered from its data, zipped with captions.txt.
 * docs/technical-requirements.md#export
 */

import { zipSync, strToU8 } from "fflate";
import type { RenderAssets } from "@/render/types";
import type { BatchItem } from "@/store/types";
import { batchFilenames, captionsText } from "./filenames";
import { missingAssets, renderPostToPng } from "./png";

export const CAPTIONS_FILENAME = "captions.txt";

/** What the batch still needs loaded before it can be exported, without repeats. */
export function missingBatchAssets(batch: readonly BatchItem[], assets: RenderAssets): string[] {
  return [...new Set(batch.flatMap((item) => missingAssets(item.post, assets)))];
}

/** Render the batch and build the ZIP. `onProgress` is called before each post is rendered. */
export async function exportBatchZip(
  batch: readonly BatchItem[],
  assets: RenderAssets,
  onProgress?: (index: number, total: number) => void,
): Promise<Blob> {
  const filenames = batchFilenames(batch.map((item) => item.name));
  const files: Record<string, Uint8Array> = {};
  for (const [i, item] of batch.entries()) {
    onProgress?.(i, batch.length);
    const png = await renderPostToPng(item.post, assets);
    files[filenames[i]!] = new Uint8Array(await png.arrayBuffer());
  }
  files[CAPTIONS_FILENAME] = strToU8(
    captionsText(batch.map((item, i) => ({ filename: filenames[i]!, caption: item.caption }))),
  );
  // PNGs are already compressed; storing them keeps the export fast.
  const zip = zipSync(files, { level: 0 });
  return new Blob([zip.buffer as ArrayBuffer], { type: "application/zip" });
}
