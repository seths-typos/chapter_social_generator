/**
 * The polaroid frame (`src/assets/polaroid/frame.png`), decoded once and shared.
 * Loaded when the app starts so the first polaroid doesn't flash a flat stand-in.
 */

import frameUrl from "@/assets/polaroid/frame.png";
import { decodeImage } from "./textureLibrary";

let frame: ImageBitmap | undefined;
let loading: Promise<void> | undefined;
const listeners = new Set<() => void>();

export function subscribeFrame(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getFrameSnapshot = (): ImageBitmap | undefined => frame;

/** Start loading the frame if it isn't loaded or in flight. A failure can be retried. */
export function ensureFrame(): Promise<void> {
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
    });
  return loading;
}
