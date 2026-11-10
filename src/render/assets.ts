/**
 * React side of asset loading: the manifest, the texture cache, and making sure the
 * texture the current draft uses is loaded. docs/template-spec.md#texture-library
 */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useAppStore } from "@/store/store";
import { TEMPLATE_LIST } from "@/templates/registry";
import {
  ensureLibraryTexture,
  getPhotosSnapshot,
  getTexturesSnapshot,
  subscribePhotos,
  subscribeTextures,
} from "./assetCache";
import { ensureFrame, getFrameSnapshot, subscribeFrame } from "./frame";
import { getGrain, subscribeGrain } from "./grain";
import { fetchManifest, type TextureManifestEntry } from "./textureLibrary";
import type { RenderAssets } from "./types";
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

/**
 * Everything the renderer needs. Also kicks off loading for the draft's current texture
 * and, up front, the two template defaults so the first preview isn't grey.
 */
export function useRenderAssets(): RenderAssets {
  const { entries } = useTextureLibrary();
  const textures = useTextureAssets();
  const current = useAppStore((s) => s.draft?.texture ?? null);

  useEffect(() => {
    if (entries.length === 0) return;
    const wanted = new Set<string>(TEMPLATE_LIST.map((t) => t.defaultTexture.id));
    if (current?.kind === "library") wanted.add(current.id);
    for (const entry of entries) {
      if (wanted.has(entry.id)) void ensureLibraryTexture(entry);
    }
  }, [entries, current]);

  const photos = useSyncExternalStore(subscribePhotos, getPhotosSnapshot, getPhotosSnapshot);
  const frame = useSyncExternalStore(subscribeFrame, getFrameSnapshot, getFrameSnapshot);
  useEffect(() => void ensureFrame(), []);
  const grain = useSyncExternalStore(subscribeGrain, getGrain, getGrain);
  return useMemo(
    () => ({
      textures,
      photos,
      wordmark: getWordmark(),
      grain,
      ...(frame ? { frame } : {}),
    }),
    [textures, photos, frame, grain],
  );
}
