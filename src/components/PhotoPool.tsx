import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { isLowResolution } from "@/image/importImage";
import { importToPool } from "@/image/importToPool";
import { LOW_RES_SHORT_EDGE, PHOTO_ACCEPT } from "@/image/limits";
import { previewUrl } from "@/image/previewUrl";
import { useAppStore } from "@/store/store";
import { Panel } from "./Panel";

const hasFiles = (e: DragEvent): boolean => e.dataTransfer?.types.includes("Files") ?? false;

/**
 * The session photo pool: add photos with the button or by dropping files anywhere on
 * the window. docs/prd.md#session-photo-pool
 */
export function PhotoPool() {
  const pool = useAppStore((s) => s.pool);
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
            {pool.map((photo) => (
              <li
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-sm border border-neutral-200 bg-neutral-100"
              >
                <img
                  src={previewUrl(photo.thumbnail)}
                  alt={photo.name}
                  title={photo.name}
                  className="h-full w-full object-cover"
                />
                {isLowResolution(photo) && (
                  <span
                    title={`${photo.width}×${photo.height}. Under ${LOW_RES_SHORT_EDGE}px on the short side it may look soft.`}
                    className="absolute bottom-1 left-1 rounded-sm bg-amber-100 px-1 text-[10px] font-medium text-amber-800"
                  >
                    Low res
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
