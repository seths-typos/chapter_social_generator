/**
 * React side of asset loading: the manifest, the texture cache, and making sure the
 * texture the current draft uses is loaded. docs/template-spec.md#texture-library
 */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useAppStore } from "@/store/store";
import { FILM_LOOK } from "@/templates/constants";
import { TEMPLATE_LIST } from "@/templates/registry";
import { getTextCardSplit, subscribeTextCardSplit } from "@/templates/textCard";
import {
  ensureLibraryTexture,
  getPhotosSnapshot,
  getTextureErrorsSnapshot,
  getTexturesSnapshot,
  releaseUnusedLibraryTextures,
  subscribePhotos,
  subscribeTextures,
} from "./assetCache";
import { ensureFrame, getFrameFailed, getFrameSnapshot, subscribeFrame } from "./frame";
import { getGrain } from "./grain";
import { fetchManifest, type TextureManifestEntry } from "./textureLibrary";
import { texturesInUse } from "./texturesInUse";
import { textureKey, type RenderAssets } from "./types";
import { getWordmark } from "./wordmark";

export interface TextureLibraryState {
  entries: TextureManifestEntry[];
  error: string | null;
  loading: boolean;
}

/** The bundled texture manifest, fetched once per page load. */
export function useTextureLibrary(): TextureLibraryState {
  const [state, setState] = useState<TextureLibraryState>({
    entries: [],
    error: null,
    loading: true,
  });
  useEffect(() => {
    let cancelled = false;
    fetchManifest().then(
      (entries) => !cancelled && setState({ entries, error: null, loading: false }),
      (err: unknown) =>
        !cancelled &&
        setState({
          entries: [],
          error: err instanceof Error ? err.message : String(err),
          loading: false,
        }),
    );
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

/** The decoded textures, as a stable snapshot that changes when one finishes loading. */
export function useTextureAssets() {
  return useSyncExternalStore(subscribeTextures, getTexturesSnapshot, getTexturesSnapshot);
}

const DEFAULT_TEXTURES = TEMPLATE_LIST.map((t) => t.defaultTexture);

/** The library entries whose textures the draft, the batch or a template default needs. */
function useWantedTextures(): { wanted: TextureManifestEntry[]; keys: ReadonlySet<string> } {
  const { entries } = useTextureLibrary();
  const current = useAppStore((s) => s.draft?.texture ?? null);
  const batch = useAppStore((s) => s.batch);
  return useMemo(() => {
    const keys = texturesInUse(
      current,
      batch.map((item) => item.post.texture),
      DEFAULT_TEXTURES,
    );
    const wanted = entries.filter((e) => keys.has(textureKey({ kind: "library", id: e.id })));
    return { wanted, keys };
  }, [entries, current, batch]);
}

/**
 * Everything the renderer needs. Also loads the textures in use (the draft's, every batch
 * post's and the template defaults, so the first preview isn't grey) and frees the decoded
 * ones nothing uses any more.
 */
export function useRenderAssets(): RenderAssets {
  const textures = useTextureAssets();
  const { wanted, keys } = useWantedTextures();

  useEffect(() => {
    for (const entry of wanted) void ensureLibraryTexture(entry);
    // Only once the library is known: before that nothing library-backed is "in use" yet.
    if (wanted.length > 0) releaseUnusedLibraryTextures(keys);
  }, [wanted, keys]);

  const photos = useSyncExternalStore(subscribePhotos, getPhotosSnapshot, getPhotosSnapshot);
  const frame = useSyncExternalStore(subscribeFrame, getFrameSnapshot, getFrameSnapshot);
  useEffect(() => void ensureFrame(), []);
  // TEMPORARY: redraw when the text-area tuning slider (`?tune`) changes the split.
  const cardSplit = useSyncExternalStore(
    subscribeTextCardSplit,
    getTextCardSplit,
    getTextCardSplit,
  );
  return useMemo(
    () => ({
      textures,
      photos,
      wordmark: getWordmark(),
      grain: getGrain(),
      effects: FILM_LOOK,
      ...(frame ? { frame } : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `cardSplit` forces a redraw
    [textures, photos, frame, cardSplit],
  );
}

/** Which of the assets in use failed to load, and a way to try them again. */
export interface AssetFailures {
  /** Named as `missingAssets` names them: "texture", "polaroid frame". */
  failed: readonly string[];
  retry: () => void;
}

/**
 * Load failures among the assets in use. Without this a failed download would read as
 * "Still loading" for the rest of the session.
 */
export function useAssetFailures(): AssetFailures {
  const { wanted } = useWantedTextures();
  const errors = useSyncExternalStore(
    subscribeTextures,
    getTextureErrorsSnapshot,
    getTextureErrorsSnapshot,
  );
  const frameFailed = useSyncExternalStore(subscribeFrame, getFrameFailed, getFrameFailed);
  return useMemo(() => {
    const broken = wanted.filter((e) => errors.has(textureKey({ kind: "library", id: e.id })));
    return {
      failed: [
        ...(broken.length > 0 ? ["texture"] : []),
        ...(frameFailed ? ["polaroid frame"] : []),
      ],
      retry: () => {
        for (const entry of broken) void ensureLibraryTexture(entry);
        if (frameFailed) void ensureFrame();
      },
    };
  }, [wanted, errors, frameFailed]);
}
