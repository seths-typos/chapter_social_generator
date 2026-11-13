/**
 * "Download all textures": the bundled texture library at full size, zipped with its
 * attribution file. docs/technical-requirements.md#export
 */

import { zipSync } from "fflate";
import { textureFileUrl, texturesBase, type TextureManifestEntry } from "@/render/textureLibrary";

export const TEXTURES_ZIP_FILENAME = "chapter-textures.zip";
/** Who made each texture, and the licence. Shipped next to the images. */
export const ATTRIBUTION_FILENAME = "ATTRIBUTION.md";

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url.split("/").pop()}: HTTP ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Fetch every library texture and build the ZIP. `onProgress` is called before each file
 * is fetched.
 */
export async function exportTexturesZip(
  entries: readonly TextureManifestEntry[],
  onProgress?: (index: number, total: number) => void,
): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};
  for (const [i, entry] of entries.entries()) {
    onProgress?.(i, entries.length);
    files[entry.file] = await fetchBytes(textureFileUrl(entry));
  }
  files[ATTRIBUTION_FILENAME] = await fetchBytes(`${texturesBase()}${ATTRIBUTION_FILENAME}`);
  // JPEGs are already compressed; storing them keeps the export fast.
  const zip = zipSync(files, { level: 0 });
  return new Blob([zip.buffer as ArrayBuffer], { type: "application/zip" });
}
