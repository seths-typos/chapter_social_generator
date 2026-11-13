import { createElement, useState } from "react";
import { downloadBlob, missingAssets, renderPostToPng } from "@/export/png";
import { pngFilename } from "@/export/filenames";
import { importToPool } from "@/image/importToPool";
import type { FitWarning, RenderAssets } from "@/render/types";
import { defaultName, useAppStore } from "@/store/store";
import type { ImportOutcome } from "@/templates/definition";
import { missingInputs, templateFor, toPost } from "@/templates/registry";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TOOLTIP,
  HINT,
  REQUIRED_MARK,
  SR_ONLY,
} from "@/templates/formStyles";

const REASON_ID = "post-actions-reason";

async function addImage(file: File): Promise<ImportOutcome> {
  const { added, failures } = await importToPool([file]);
  const photoId = added[0];
  return photoId
    ? { ok: true, photoId }
    : { ok: false, message: failures[0] ?? "That file couldn’t be opened." };
}

/** The current template's form, as a run of cards. Renders nothing when there is no draft. */
export function TemplateForm() {
  const draft = useAppStore((s) => s.draft);
  const pool = useAppStore((s) => s.pool);
  const activeSlot = useAppStore((s) => s.activeSlot);
  const setActiveSlot = useAppStore((s) => s.setActiveSlot);
  const editDraft = useAppStore((s) => s.editDraft);
  if (!draft) return null;
  const template = templateFor(draft.template);
  if (!template.Editor) return null;
  return createElement(template.Editor, {
    draft,
    onChange: (fn) => editDraft(draft.template, fn),
    pool,
    activeSlot,
    onActiveSlot: setActiveSlot,
    importImage: addImage,
  });
}

/** What the asterisks mean, shown under the form while a post is being made. */
export function RequiredNote() {
  const hasDraft = useAppStore((s) => s.draft !== null);
  return hasDraft ? <p className={HINT}>{REQUIRED_MARK.trim()} Required</p> : null;
}

interface PostActionsProps {
  /** Fit warnings from the latest preview render. Blocking ones stop Add to batch. */
  warnings: readonly FitWarning[];
  assets: RenderAssets;
}

/**
 * Under the preview: Add to batch and Download PNG at its bottom corners, then what still stands between the draft and a finished post
 * (missing inputs, blocking fit warnings).
 * docs/prd.md#template-selection-and-editing
 */
export function PostActions({ warnings, assets }: PostActionsProps) {
  const draft = useAppStore((s) => s.draft);
  const batch = useAppStore((s) => s.batch);
  const addToBatch = useAppStore((s) => s.addToBatch);
  const editing = useAppStore((s) => s.batch.find((b) => b.id === s.editingId) ?? null);
  const saveEdit = useAppStore((s) => s.saveEdit);
  const cancelEdit = useAppStore((s) => s.cancelEdit);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const missing = draft ? missingInputs(draft) : [];
  const blocking = warnings.filter((w) => w.blocking);
  const post = draft && missing.length === 0 && blocking.length === 0 ? toPost(draft) : null;
  const loading = post ? missingAssets(post, assets) : [];

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

  const status = !draft
    ? batch.length > 0
      ? `Added. ${batch.length} ${batch.length === 1 ? "post" : "posts"} in the batch. Choose a template for the next one.`
      : ""
    : blocking.length > 0
      ? "Shorten the text to finish this post."
      : loading.length > 0
        ? `Still loading: ${loading.join(", ")}`
        : "";

  // The asterisks show what is required; a screen reader also gets it as the reason the
  // buttons are disabled.
  const reason = !draft
    ? "Choose a template first."
    : missing.length > 0
      ? `Still needed: ${missing.join(", ")}.`
      : "";

  // Shown as a tooltip over a disabled button.
  const blocked = !draft
    ? "Choose a template first"
    : missing.length > 0
      ? "Fill in all required fields"
      : blocking.length > 0
        ? "Shorten the text first"
        : "";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="group relative">
          <button
            type="button"
            disabled={!post}
            aria-describedby={reason ? REASON_ID : undefined}
            onClick={() => (editing ? saveEdit() : addToBatch())}
            className={SECONDARY_BUTTON}
          >
            {editing ? "Save changes" : "Add to batch"}
          </button>
          {!post && <span className={`${TOOLTIP} left-0`}>{blocked}</span>}
        </span>
        {editing && (
          <button type="button" onClick={cancelEdit} className={SECONDARY_BUTTON}>
            Cancel
          </button>
        )}
        <span className="group relative ml-auto">
          <button
            type="button"
            disabled={!post || loading.length > 0}
            aria-describedby={reason ? REASON_ID : undefined}
            onClick={() => void downloadPng()}
            className={PRIMARY_BUTTON}
          >
            Download PNG
          </button>
          {(!post || loading.length > 0) && (
            <span className={`${TOOLTIP} right-0`}>{blocked || "Still loading"}</span>
          )}
        </span>
      </div>
      {reason && (
        <span id={REASON_ID} className={SR_ONLY}>
          {reason}
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-0.5 text-[13px] leading-[1.3]">
        {editing && (
          <span className="text-[#555]">
            Editing <strong>{editing.name}</strong>. Save changes to update it in the batch.
          </span>
        )}
        {draft && warnings.length > 0 && (
          <ul role="alert" className="text-red-700">
            {warnings.map((w) => (
              <li key={w.field}>{w.message}</li>
            ))}
          </ul>
        )}
        {downloadError && (
          <span className="text-red-700" role="alert">
            Couldn’t download: {downloadError}
          </span>
        )}
        {status && <span className="text-[#555]">{status}</span>}
      </div>
    </div>
  );
}
