/**
 * The polaroid frame (`src/assets/polaroid/frame.png`), decoded once and shared.
 * Loaded when the app starts so the first polaroid doesn't flash a flat stand-in.
 */

import frameUrl from "@/assets/polaroid/frame.png";
import { decodeImage } from "./textureLibrary";

let frame: ImageBitmap | undefined;
let loading: Promise<void> | undefined;
let failed = false;
const listeners = new Set<() => void>();

export function subscribeFrame(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getFrameSnapshot = (): ImageBitmap | undefined => frame;

/** True when the last attempt to load the frame failed and nothing has succeeded since. */
export const getFrameFailed = (): boolean => failed;

/**
 * Start loading the frame if it isn't loaded or in flight. Calling it again after a failure
 * retries.
 */
export function ensureFrame(): Promise<void> {
  if (!loading && failed) {
    failed = false;
    for (const l of listeners) l();
  }
  loading ??= fetch(frameUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob();
    })
    .then(decodeImage)
    .then((bitmap) => {
      frame = bitmap;
      for (const l of listeners) l();
    })
    .catch(() => {
      loading = undefined;
      failed = true;
      for (const l of listeners) l();
    });
  return loading;
}
