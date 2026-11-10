/**
 * Dev only. Loads the images the template fixtures refer to (`docs/reference/fixtures/`)
 * into the photo cache, so a fixture draft renders exactly like its reference.
 * Only ever reached through a dynamic import behind `import.meta.env.DEV`.
 */

import { getPhotosSnapshot, setPhotoAsset } from "@/render/assetCache";
import { decodeImage } from "@/render/textureLibrary";
import { appStore } from "@/store/store";
import { FIXTURE_IMAGE_PREFIX } from "@/templates/constants";

const urls = import.meta.glob<string>("../../docs/reference/fixtures/*.png", {
  query: "?url",
  import: "default",
});

/** `…/fixtures/graphic.png` → `fixture-graphic` */
export const fixtureIdForPath = (path: string): string =>
  `${FIXTURE_IMAGE_PREFIX}${path
    .split("/")
    .pop()!
    .replace(/\.[^.]+$/, "")}`;

let loading: Promise<void> | null = null;

/** Decode every fixture image once. With `addToPool`, also list them in the photo pool. */
export function loadFixtureImages(opts: { addToPool?: boolean } = {}): Promise<void> {
  loading ??= Promise.all(
    Object.entries(urls).map(async ([path, loadUrl]) => {
      const id = fixtureIdForPath(path);
      if (getPhotosSnapshot().has(id)) return;
      const blob = await (await fetch(await loadUrl())).blob();
      const bitmap = await decodeImage(blob);
      setPhotoAsset(id, bitmap);
      if (opts.addToPool && !appStore.getState().pool.some((p) => p.id === id)) {
        appStore
          .getState()
          .addPhotos([
            { id, file: blob, width: bitmap.width, height: bitmap.height, mode: "regular" },
          ]);
      }
    }),
  ).then(() => undefined);
  return loading;
}
