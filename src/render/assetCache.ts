/**
 * In-memory cache of decoded render assets (textures now; photos arrive in #14).
 * Lives outside React and the Zustand store because the values are ImageBitmaps.
 * Components subscribe with `useSyncExternalStore`; the snapshot is replaced on change
 * so the preview re-renders when a texture finishes loading. Nothing persists.
 */

import type { TextureRef } from "@/store/types";
import { decodeImage, textureFileUrl, type TextureManifestEntry } from "./textureLibrary";
import { textureKey, type TextureAsset } from "./types";

type Listener = () => void;

const textures = new Map<string, TextureAsset>();
const pending = new Set<string>();
const errors = new Map<string, string>();
let snapshot: ReadonlyMap<string, TextureAsset> = new Map();
const listeners = new Set<Listener>();

function emit() {
  snapshot = new Map(textures);
  for (const l of listeners) l();
}

export function subscribeTextures(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getTexturesSnapshot = (): ReadonlyMap<string, TextureAsset> => snapshot;

export function setTextureAsset(ref: TextureRef, asset: TextureAsset): void {
  const key = textureKey(ref);
  textures.set(key, asset);
  pending.delete(key);
  errors.delete(key);
  emit();
}

export const hasTexture = (ref: TextureRef): boolean => textures.has(textureKey(ref));
export const textureError = (ref: TextureRef): string | undefined => errors.get(textureKey(ref));

/** Load a library texture into the cache if it isn't there or in flight. */
export async function ensureLibraryTexture(
  entry: TextureManifestEntry,
  base?: string,
): Promise<void> {
  const ref: TextureRef = { kind: "library", id: entry.id };
  const key = textureKey(ref);
  if (textures.has(key) || pending.has(key)) return;
  pending.add(key);
  try {
    const res = await fetch(textureFileUrl(entry, base));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const image = await decodeImage(await res.blob());
    setTextureAsset(ref, { kind: "image", image, width: image.width, height: image.height });
  } catch (err) {
    pending.delete(key);
    errors.set(key, err instanceof Error ? err.message : String(err));
    emit();
  }
}

/** Test hook: clear everything. */
export function resetTextureCache(): void {
  textures.clear();
  pending.clear();
  errors.clear();
  emit();
}
