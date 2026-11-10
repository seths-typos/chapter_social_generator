/**
 * In-memory cache of decoded render assets: textures and pool photos.
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

// ── Pool photos ───────────────────────────────────────────────────────────────

const photos = new Map<string, ImageBitmap>();
let photoSnapshot: ReadonlyMap<string, ImageBitmap> = new Map();
const photoListeners = new Set<Listener>();

function emitPhotos() {
  photoSnapshot = new Map(photos);
  for (const l of photoListeners) l();
}

export function subscribePhotos(listener: Listener): () => void {
  photoListeners.add(listener);
  return () => photoListeners.delete(listener);
}

export const getPhotosSnapshot = (): ReadonlyMap<string, ImageBitmap> => photoSnapshot;

/** Keep a pool photo's decoded bitmap, keyed by the photo's id. */
export function setPhotoAsset(id: string, bitmap: ImageBitmap): void {
  photos.set(id, bitmap);
  emitPhotos();
}

/** Drop a pool photo's bitmap and free its memory. */
export function removePhotoAsset(id: string): void {
  photos.get(id)?.close();
  if (photos.delete(id)) emitPhotos();
}

/** Test hook: clear everything. */
export function resetTextureCache(): void {
  textures.clear();
  pending.clear();
  errors.clear();
  emit();
  photos.clear();
  emitPhotos();
}
