import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { pngFilename, zipFilename } from "@/export/filenames";
import { describeMissing, downloadBlob, postAssetKey, renderPostToPng } from "@/export/png";
import { exportBatchZip, missingBatchAssets } from "@/export/zip";
import { scratchRenderCanvas } from "@/render/canvas";
import { renderPost } from "@/render/renderPost";
import { useAssetFailures } from "@/render/assets";
import type { RenderAssets } from "@/render/types";
import { useAppStore } from "@/store/store";
import type { BatchItem, Post } from "@/store/types";
import { BATCH_THUMBNAIL } from "@/templates/constants";
import { templateFor } from "@/templates/registry";
import { getTextCardSplit, subscribeTextCardSplit } from "@/templates/textCard";
import { LoadProblem } from "./Editor";
import { Panel } from "./Panel";
import { COMPACT_BUTTON, PRIMARY_BUTTON } from "@/templates/formStyles";

const smallButton = COMPACT_BUTTON;
const COPIED_MS = 2000;

/** A batch post drawn by the real renderer from its stored data, then scaled down. */
function BatchThumbnail({ post, assets }: { post: Post; assets: RenderAssets }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const assetKey = postAssetKey(post, assets);
  const split = useSyncExternalStore(subscribeTextCardSplit, getTextCardSplit, getTextCardSplit);
  useEffect(() => {
    const out = ref.current?.getContext("2d");
    const scratch = scratchRenderCanvas();
    const ctx = scratch.getContext("2d");
    if (!out || !ctx) return;
    renderPost(ctx, post, assets);
    out.imageSmoothingQuality = "high";
    out.drawImage(scratch, 0, 0, BATCH_THUMBNAIL.width, BATCH_THUMBNAIL.height);
    // Redrawn at full size, so only when an asset this post draws with changes, not every
    // time some other photo or texture finishes loading. `split` is the `?tune` slider.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `assets` is covered by `assetKey`
  }, [post, assetKey, split]);
  return (
    <canvas
      ref={ref}
      width={BATCH_THUMBNAIL.width}
      height={BATCH_THUMBNAIL.height}
      className="block h-auto w-20 shrink-0 rounded-sm border border-neutral-200"
    />
  );
}

/**
 * The posts made this session: rename, caption, edit, duplicate, remove, reorder, and
 * download one or all. docs/prd.md#batch-list-and-export
 */
export function BatchList({ assets }: { assets: RenderAssets }) {
  const batch = useAppStore((s) => s.batch);
  const draft = useAppStore((s) => s.draft);
  const editingId = useAppStore((s) => s.editingId);
  const updateItem = useAppStore((s) => s.updateItem);
  const removeItem = useAppStore((s) => s.removeItem);
  const duplicateItem = useAppStore((s) => s.duplicateItem);
  const moveItem = useAppStore((s) => s.moveItem);
  const loadForEdit = useAppStore((s) => s.loadForEdit);

  const [progress, setProgress] = useState<{ index: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Nothing is saved, so warn before the tab closes with posts in the batch.
  const hasPosts = batch.length > 0;
  useEffect(() => {
    if (!hasPosts) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasPosts]);

  const stillLoading = missingBatchAssets(batch, assets);
  const failures = useAssetFailures();
  const problem = describeMissing(stillLoading, failures.failed);
  const exporting = progress !== null;

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const downloadAll = () =>
    run(async () => {
      try {
        const zip = await exportBatchZip(batch, assets, (index, total) =>
          setProgress({ index, total }),
        );
        downloadBlob(zip, zipFilename(new Date()));
      } finally {
        setProgress(null);
      }
    });

  const downloadOne = (item: BatchItem) =>
    run(async () => downloadBlob(await renderPostToPng(item.post, assets), pngFilename(item.name)));

  const copyCaption = (item: BatchItem) =>
    run(async () => {
      await navigator.clipboard.writeText(item.caption);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId((id) => (id === item.id ? null : id)), COPIED_MS);
    });

  function edit(item: BatchItem) {
    // Already open in the editor: nothing to load, and nothing to lose.
    if (editingId === item.id) return;
    if (draft) {
      const ok = window.confirm(`Edit ${item.name}? The post you’re working on will be discarded.`);
      if (!ok) return;
    }
    loadForEdit(item.id);
  }

  function remove(item: BatchItem) {
    if (window.confirm(`Remove ${item.name} from the batch?`)) removeItem(item.id);
  }

  function endDrag() {
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <Panel
      title="Batch"
      flat
      actions={
        <button
          type="button"
          disabled={!hasPosts || exporting || stillLoading.length > 0}
          onClick={() => void downloadAll()}
          className={PRIMARY_BUTTON}
        >
          {exporting ? `Preparing ${progress.index + 1} of ${progress.total}…` : "Download all"}
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        {error && (
          <p role="alert" className="text-xs text-red-700">
            Couldn’t finish: {error}
          </p>
        )}
        {problem && (
          <p className="text-xs">
            <LoadProblem problem={problem} onRetry={failures.retry} />
          </p>
        )}
        {!hasPosts && (
          <p className="rounded-md border border-dashed border-neutral-300 p-4 text-center text-sm text-[#666]">
            Posts you add appear here.
            <br />
            <span className="text-xs">
              Download all gives one ZIP with every PNG and the captions.
            </span>
          </p>
        )}

        <ol className="flex flex-col gap-3">
          {batch.map((item, index) => (
            <li
              key={item.id}
              data-testid="batch-item"
              onDragOver={(e) => {
                if (dragIndex === null) return;
                e.preventDefault();
                setOverIndex(index);
              }}
              onDrop={(e) => {
                if (dragIndex === null) return;
                e.preventDefault();
                moveItem(dragIndex, index);
                endDrag();
              }}
              className={`flex flex-col gap-2 rounded-md border p-2 ${
                editingId === item.id ? "border-neutral-900" : "border-neutral-200"
              } ${overIndex === index && dragIndex !== index ? "ring-2 ring-neutral-400" : ""} ${
                dragIndex === index ? "opacity-50" : ""
              }`}
            >
              <div className="flex gap-2">
                <BatchThumbnail post={item.post} assets={assets} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-1 text-xs text-[#666]">
                    <span
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", item.name);
                        setDragIndex(index);
                      }}
                      onDragEnd={endDrag}
                      title="Drag to reorder"
                      aria-hidden="true"
                      className="cursor-grab px-0.5 text-[#666] select-none"
                    >
                      ⠿
                    </span>
                    <span className="tabular-nums">{index + 1}.</span>
                    <span>{templateFor(item.post.template).label}</span>
                    {editingId === item.id && <span className="text-neutral-900">· Editing</span>}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveItem(index, index - 1)}
                      aria-label={`Move ${item.name} up`}
                      className="ml-auto min-h-6 min-w-6 px-1 touch:min-h-11 touch:min-w-11 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === batch.length - 1}
                      onClick={() => moveItem(index, index + 1)}
                      aria-label={`Move ${item.name} down`}
                      className="min-h-6 min-w-6 px-1 touch:min-h-11 touch:min-w-11 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                    aria-label="Post name (used as the filename)"
                    className="w-full touch:min-h-11 rounded-md border border-[#8c8c8c] bg-white px-2 py-1 text-sm focus:border-[#2f78ff] focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1">
                    <button type="button" className={smallButton} onClick={() => edit(item)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={smallButton}
                      onClick={() => duplicateItem(item.id)}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className={smallButton}
                      disabled={exporting}
                      onClick={() => void downloadOne(item)}
                    >
                      PNG
                    </button>
                    {/* Off during Download all: the export is still reading this post's photos. */}
                    <button
                      type="button"
                      className={smallButton}
                      disabled={exporting}
                      onClick={() => remove(item)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              <textarea
                value={item.caption}
                onChange={(e) => updateItem(item.id, { caption: e.target.value })}
                rows={3}
                placeholder="Instagram caption"
                aria-label={`Caption for ${item.name}`}
                className="w-full resize-y rounded-md border border-[#8c8c8c] bg-white px-2 py-1 text-sm placeholder:text-[#707070] focus:border-[#2f78ff] focus:outline-none"
              />
              <button
                type="button"
                className={`${smallButton} self-end`}
                disabled={item.caption.trim() === ""}
                onClick={() => void copyCaption(item)}
              >
                {copiedId === item.id ? "Copied" : "Copy caption"}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}
