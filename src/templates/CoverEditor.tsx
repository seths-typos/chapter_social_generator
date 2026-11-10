import { createElement, type ComponentType } from "react";
import type { WordmarkTone } from "@/store/types";
import type { EditorProps } from "./definition";
import { PhotoSlotEditor } from "./PhotoSlotEditor";

const TONES: readonly { id: WordmarkTone; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

/** The Cover form: the photo slot, plus the wordmark colour (dark for light photos). */
export function CoverEditor(props: EditorProps<"cover">) {
  const { draft, onChange } = props;
  return (
    <div className="flex flex-col gap-3">
      {createElement(PhotoSlotEditor as ComponentType<EditorProps<"cover">>, props)}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          Wordmark
        </span>
        <div role="group" aria-label="Wordmark colour" className="ml-auto flex gap-1">
          {TONES.map((tone) => (
            <button
              key={tone.id}
              type="button"
              aria-pressed={draft.wordmark === tone.id}
              onClick={() => onChange((d) => ({ ...d, wordmark: tone.id }))}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                draft.wordmark === tone.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              {tone.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
