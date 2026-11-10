import { createElement } from "react";
import type { FitWarning } from "@/render/types";
import { useAppStore } from "@/store/store";
import { missingInputs, templateFor } from "@/templates/registry";
import { Placeholder } from "./Panel";

interface EditorProps {
  /** Fit warnings from the latest preview render. Blocking ones stop Add to batch. */
  warnings: readonly FitWarning[];
}

/**
 * The current template's form, plus what still stands between the draft and the batch:
 * missing inputs and blocking fit warnings. docs/prd.md#template-selection-and-editing
 */
export function Editor({ warnings }: EditorProps) {
  const draft = useAppStore((s) => s.draft);
  const editDraft = useAppStore((s) => s.editDraft);
  const addToBatch = useAppStore((s) => s.addToBatch);
  const batchCount = useAppStore((s) => s.batch.length);

  if (!draft) {
    return (
      <p className="text-sm text-neutral-500">
        {batchCount > 0
          ? `Added. ${batchCount} ${batchCount === 1 ? "post" : "posts"} in the batch. Choose a template for the next one.`
          : "Choose a template to start a post."}
      </p>
    );
  }

  const template = templateFor(draft.template);
  const missing = missingInputs(draft);
  const blocking = warnings.filter((w) => w.blocking);
  const canAdd = missing.length === 0 && blocking.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {template.Editor ? (
        createElement(template.Editor, {
          draft,
          onChange: (fn) => editDraft(draft.template, fn),
        })
      ) : (
        <Placeholder label={`${template.label} controls`} issue="coming in a later issue" />
      )}

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

      <div className="flex items-center justify-end gap-3">
        <span className="text-xs text-neutral-500">
          {missing.length > 0
            ? `Still needed: ${missing.join(", ")}`
            : blocking.length > 0
              ? "Shorten the text above to add this post."
              : ""}
        </span>
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => addToBatch()}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add to batch
        </button>
      </div>
    </div>
  );
}
