/** Import files straight into the session photo pool (store + bitmap cache). */

import { setPhotoAsset } from "@/render/assetCache";
import { appStore, newId } from "@/store/store";
import { browserImportDeps } from "./browserImage";
import { importImage, importImages } from "./importImage";

export interface PoolImport {
  /** Ids of the photos added, in the order the files were given. */
  added: string[];
  /** One plain-language message per file that couldn't be used. */
  failures: string[];
}

export async function importToPool(
  files: readonly Blob[],
  onProgress?: (done: number, total: number) => void,
): Promise<PoolImport> {
  const deps = browserImportDeps(newId);
  const out: PoolImport = { added: [], failures: [] };
  await importImages(
    files,
    (file) => importImage(file, deps),
    (result, index) => {
      if (result.ok) {
        setPhotoAsset(result.photo.id, result.bitmap);
        appStore.getState().addPhotos([result.photo]);
        out.added.push(result.photo.id);
      } else {
        out.failures.push(result.message);
      }
      onProgress?.(index + 1, files.length);
    },
  );
  return out;
}
