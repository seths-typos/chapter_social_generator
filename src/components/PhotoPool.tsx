import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { isLowResolution } from "@/image/importImage";
import { importToPool } from "@/image/importToPool";
import { LOW_RES_SHORT_EDGE, PHOTO_ACCEPT } from "@/image/limits";
import { previewUrl, releasePreviewUrl } from "@/image/previewUrl";
import { removePhotoAsset } from "@/render/assetCache";
import { hasSlots } from "@/store/draft";
import { useAppStore } from "@/store/store";
import type { PhotoMode, PoolPhoto } from "@/store/types";
import { photoIdsInDraft, photoUsage, takesPhotos } from "@/templates/registry";
import { Panel } from "./Panel";

const hasFiles = (e: DragEvent): boolean => e.dataTransfer?.types.includes("Files") ?? false;

/**
 * The session photo pool: add photos with the button or by dropping files anywhere on
 * the window. docs/prd.md#session-photo-pool
 */
export function PhotoPool() {
  const pool = useAppStore((s) => s.pool);
  const batch = useAppStore((s) => s.batch);
  const draft = useAppStore((s) => s.draft);
  const removePhoto = useAppStore((s) => s.removePhoto);
  const setPhotoMode = useAppStore((s) => s.setPhotoMode);
  const usage = useMemo(() => photoUsage(batch.map((b) => b.post)), [batch]);
  const canUse = draft !== null && takesPhotos(draft);
  const addPhotoToDraft = useAppStore((s) => s.addPhotoToDraft);
  const inDraft = useMemo(() => new Set(draft ? photoIdsInDraft(draft) : []), [draft]);
  const activeSlot = useAppStore((s) => s.activeSlot);
  const slots = draft && hasSlots(draft) ? draft.slots : null;
  /** In a post with several photos, the one in the selected position; otherwise any in the post. */
  const isActive = (id: string) =>
    slots && slots.length > 1 ? slots[activeSlot]?.photoId === id : inDraft.has(id);
  /** Which positions (1-based) of a several-photo post a photo is in. */
  const positionsOf = (id: string) =>
    slots && slots.length > 1 ? slots.flatMap((sl, i) => (sl.photoId === id ? [i + 1] : [])) : [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failures, setFailures] = useState<readonly string[]>([]);
  const [dragging, setDragging] = useState(false);

  async function add(files: readonly File[]) {
    if (files.length === 0) return;
    setFailures([]);
    setProgress({ done: 0, total: files.length });
    const result = await importToPool(files, (done, total) => setProgress({ done, total }));
    setProgress(null);
    setFailures(result.failures);
  }
  const addRef = useRef(add);
  useEffect(() => {
    addRef.current = add;
  });

  // Files dropped anywhere land in the pool. Handling the drop on the window also stops
  // the browser from opening the file in place of the app (which would lose the session).
  useEffect(() => {
    let depth = 0;
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setDragging(true);
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      void addRef.current(Array.from(e.dataTransfer?.files ?? []));
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    void add(files);
  }

  const busy = progress !== null;

  /** A photo in a batch post can't be removed; one in the post being edited asks first. */
  function remove(photo: PoolPhoto) {
    const label = photo.name || "this photo";
    if (
      inDraft.has(photo.id) &&
      !window.confirm(`Remove ${label}? It is in the post you’re editing.`)
    )
      return;
    if (!removePhoto(photo.id)) return;
    removePhotoAsset(photo.id);
    releasePreviewUrl(photo.thumbnail);
  }

  return (
    <Panel
      title="Photos"
      className={dragging ? "ring-2 ring-neutral-900" : ""}
      actions={
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium hover:bg-neutral-50 disabled:opacity-40"
          >
            Add photos…
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={PHOTO_ACCEPT}
            className="hidden"
            data-testid="photo-input"
            onChange={onPick}
          />
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {progress && (
          <p role="status" className="text-xs text-neutral-500">
            Adding {Math.min(progress.done + 1, progress.total)} of {progress.total}…
          </p>
        )}
        {failures.length > 0 && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-2">
            <ul className="flex flex-col gap-1 text-xs text-red-700">
              {failures.map((message, i) => (
                <li key={i}>{message}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setFailures([])}
              className="mt-1 text-xs font-medium text-red-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {pool.length === 0 && !busy ? (
          <p className="rounded-md border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-400">
            {dragging ? "Drop to add" : "Drop photos here, or use Add photos."}
            <br />
            <span className="text-xs">JPEG, PNG, WebP or HEIC</span>
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {pool.map((photo) => {
              const used = usage.get(photo.id) ?? 0;
              const label = photo.name || "photo";
              return (
                <li key={photo.id} className="flex flex-col gap-1">
                  <div
                    className={`relative aspect-square overflow-hidden rounded-sm border bg-neutral-100 ${
                      isActive(photo.id)
                        ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-1"
                        : inDraft.has(photo.id)
                          ? "border-neutral-900"
                          : "border-neutral-200"
                    }`}
                  >
                    <button
                      type="button"
                      disabled={!canUse}
                      onClick={() => addPhotoToDraft(photo.id)}
                      aria-label={`Use ${label} in this post`}
                      title={canUse ? `Use ${label} in this post` : photo.name}
                      className="block h-full w-full enabled:cursor-pointer"
                    >
                      <img
                        src={previewUrl(photo.thumbnail)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                    {used > 0 && (
                      <span
                        title={`In ${used} ${used === 1 ? "post" : "posts"} in the batch`}
                        className="absolute top-1 left-1 rounded-sm bg-neutral-900 px-1 text-[10px] font-medium text-white"
                      >
                        Used in batch
                      </span>
                    )}
                    {positionsOf(photo.id).length > 0 && (
                      <span
                        title="Its position in this post"
                        className="absolute right-1 bottom-1 rounded-sm bg-neutral-900/80 px-1 text-[10px] leading-4 font-medium text-white"
                      >
                        {positionsOf(photo.id).join(", ")}
                      </span>
                    )}
                    {isLowResolution(photo) && (
                      <span
                        title={`${photo.width}×${photo.height}. Under ${LOW_RES_SHORT_EDGE}px on the short side it may look soft.`}
                        className="absolute bottom-1 left-1 rounded-sm bg-amber-100 px-1 text-[10px] font-medium text-amber-800"
                      >
                        Low res
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={used > 0}
                      onClick={() => remove(photo)}
                      aria-label={`Remove ${label}`}
                      title={
                        used > 0
                          ? "Used in the batch. Remove those posts first."
                          : "Remove from this session"
                      }
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-sm bg-white/90 text-xs leading-none text-neutral-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ×
                    </button>
                  </div>
                  <select
                    value={photo.mode}
                    onChange={(e) => setPhotoMode(photo.id, e.target.value as PhotoMode)}
                    aria-label={`How to use ${label}`}
                    className="w-full rounded-sm border border-neutral-200 bg-white px-1 py-0.5 text-[11px] text-neutral-600"
                  >
                    <option value="regular">Regular photo</option>
                    <option value="scan" disabled>
                      Polaroid scan (soon)
                    </option>
                  </select>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}
