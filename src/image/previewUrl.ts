/**
 * Object URLs for showing an image blob in the UI, one per blob, made on first use.
 * They live for the session (nothing persists) and are revoked with `releasePreviewUrl`.
 */
const urls = new WeakMap<Blob, string>();

export function previewUrl(blob: Blob): string {
  let url = urls.get(blob);
  if (!url) {
    url = URL.createObjectURL(blob);
    urls.set(blob, url);
  }
  return url;
}

export function releasePreviewUrl(blob: Blob): void {
  const url = urls.get(blob);
  if (url) URL.revokeObjectURL(url);
  urls.delete(blob);
}
