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
/** When each texture was last asked for, as a running count: higher is more recent. */
const lastWanted = new Map<string, number>();
let clock = 0;
let snapshot: ReadonlyMap<string, TextureAsset> = new Map();
let errorSnapshot: ReadonlyMap<string, string> = new Map();
const listeners = new Set<Listener>();

function emit() {
  snapshot = new Map(textures);
  errorSnapshot = new Map(errors);
  for (const l of listeners) l();
}

export function subscribeTextures(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getTexturesSnapshot = (): ReadonlyMap<string, TextureAsset> => snapshot;

/** Why each texture that failed to load failed, keyed like the textures. Cleared on success. */
export const getTextureErrorsSnapshot = (): ReadonlyMap<string, string> => errorSnapshot;

export function setTextureAsset(ref: TextureRef, asset: TextureAsset): void {
  const key = textureKey(ref);
  textures.set(key, asset);
  pending.delete(key);
  errors.delete(key);
  emit();
}

/**
 * Load a library texture into the cache if it isn't there or in flight. Calling it again
 * after a failure retries.
 */
export async function ensureLibraryTexture(
  entry: TextureManifestEntry,
  base?: string,
): Promise<void> {
  const ref: TextureRef = { kind: "library", id: entry.id };
  const key = textureKey(ref);
  lastWanted.set(key, ++clock);
  if (textures.has(key) || pending.has(key)) return;
  pending.add(key);
  if (errors.delete(key)) emit();
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

/** How many library textures no post uses are kept decoded, so going back to one is instant. */
export const SPARE_TEXTURES = 2;

/**
 * Free the decoded library textures that nothing uses any more. A full-size texture is
 * about 25 MB decoded, and trying each one in turn would otherwise hold them all for the
 * session. `keep` holds the keys still in use; the most recently wanted `spare` others stay
 * too. Uploaded textures are never released: there is nowhere to load them from again.
 */
export function releaseUnusedLibraryTextures(
  keep: ReadonlySet<string>,
  spare: number = SPARE_TEXTURES,
): void {
  const unused = [...textures.keys()]
    .filter((key) => key.startsWith("library:") && !keep.has(key))
    .sort((a, b) => (lastWanted.get(b) ?? 0) - (lastWanted.get(a) ?? 0));
  const drop = unused.slice(spare);
  if (drop.length === 0) return;
  for (const key of drop) {
    const asset = textures.get(key);
    if (asset?.kind === "image" && "close" in asset.image) asset.image.close();
    textures.delete(key);
    lastWanted.delete(key);
  }
  emit();
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
  lastWanted.clear();
  clock = 0;
  emit();
  photos.clear();
  emitPhotos();
}
