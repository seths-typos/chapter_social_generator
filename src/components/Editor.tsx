import { createElement, useState } from "react";
import { downloadBlob, missingAssets, renderPostToPng } from "@/export/png";
import { pngFilename } from "@/export/filenames";
import { importToPool } from "@/image/importToPool";
import type { FitWarning, RenderAssets } from "@/render/types";
import { defaultName, useAppStore } from "@/store/store";
import type { ImportOutcome } from "@/templates/definition";
import { missingInputs, templateFor, toPost } from "@/templates/registry";

interface EditorProps {
  /** Fit warnings from the latest preview render. Blocking ones stop Add to batch. */
  warnings: readonly FitWarning[];
  assets: RenderAssets;
}

const buttonClass =
  "rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40";

/**
 * The current template's form, plus what still stands between the draft and a finished
 * post: missing inputs and blocking fit warnings. docs/prd.md#template-selection-and-editing
 */
export function Editor({ warnings, assets }: EditorProps) {
  const draft = useAppStore((s) => s.draft);
  const pool = useAppStore((s) => s.pool);
  const activeSlot = useAppStore((s) => s.activeSlot);
  const setActiveSlot = useAppStore((s) => s.setActiveSlot);
  const batch = useAppStore((s) => s.batch);
  const editDraft = useAppStore((s) => s.editDraft);
  const addToBatch = useAppStore((s) => s.addToBatch);
  const editing = useAppStore((s) => s.batch.find((b) => b.id === s.editingId) ?? null);
  const saveEdit = useAppStore((s) => s.saveEdit);
  const cancelEdit = useAppStore((s) => s.cancelEdit);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!draft) {
    return (
      <p className="text-sm text-neutral-500">
        {batch.length > 0
          ? `Added. ${batch.length} ${batch.length === 1 ? "post" : "posts"} in the batch. Choose a template for the next one.`
          : "Choose a template to start a post."}
      </p>
    );
  }

  const template = templateFor(draft.template);
  const missing = missingInputs(draft);
  const blocking = warnings.filter((w) => w.blocking);
  const post = missing.length === 0 && blocking.length === 0 ? toPost(draft) : null;
  const loading = post ? missingAssets(post, assets) : [];

  async function addImage(file: File): Promise<ImportOutcome> {
    const { added, failures } = await importToPool([file]);
    const photoId = added[0];
    return photoId
      ? { ok: true, photoId }
      : { ok: false, message: failures[0] ?? "That file couldn’t be opened." };
  }

  async function downloadPng() {
    if (!post) return;
    setDownloadError(null);
    try {
      const blob = await renderPostToPng(post, assets);
      downloadBlob(blob, pngFilename(editing?.name ?? defaultName(post.template, batch)));
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : String(err));
    }
  }

  const status =
    missing.length > 0
      ? `Still needed: ${missing.join(", ")}`
      : blocking.length > 0
        ? "Shorten the text above to finish this post."
        : loading.length > 0
          ? `Still loading: ${loading.join(", ")}`
          : "";

  return (
    <div className="flex flex-col gap-3">
      {editing && (
        <p className="rounded-md bg-neutral-100 px-2.5 py-1.5 text-sm text-neutral-700">
          Editing <strong>{editing.name}</strong>. Save changes to update it in the batch.
        </p>
      )}
      {template.Editor &&
        createElement(template.Editor, {
          draft,
          onChange: (fn) => editDraft(draft.template, fn),
          pool,
          activeSlot,
          onActiveSlot: setActiveSlot,
          importImage: addImage,
        })}

      {warnings.length > 0 && (
        <ul className="flex flex-col gap-1" role="alert">
          {warnings.map((w) => (
            <li
              key={w.field}
              className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-sm text-red-800"
            >
              {w.message}
            </li>
          ))}
        </ul>
      )}
      {downloadError && (
        <p className="text-sm text-red-700" role="alert">
          Couldn’t download: {downloadError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="mr-auto text-xs text-neutral-500">{status}</span>
        <button
          type="button"
          disabled={!post || loading.length > 0}
          onClick={() => void downloadPng()}
          className={`${buttonClass} border border-neutral-300 text-neutral-900 hover:bg-neutral-50`}
        >
          Download PNG
        </button>
        {editing && (
          <button
            type="button"
            onClick={cancelEdit}
            className={`${buttonClass} border border-neutral-300 text-neutral-900 hover:bg-neutral-50`}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={!post}
          onClick={() => (editing ? saveEdit() : addToBatch())}
          className={`${buttonClass} bg-neutral-900 text-white`}
        >
          {editing ? "Save changes" : "Add to batch"}
        </button>
      </div>
    </div>
  );
}
