import { createElement, type ComponentType } from "react";
import type { WordmarkTone } from "@/store/types";
import type { EditorProps } from "./definition";
import { PhotoSlotEditor } from "./PhotoSlotEditor";
import { CARD, LABEL, segment } from "./formStyles";

const TONES: readonly { id: WordmarkTone; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

/** The Cover form: the photo slot, plus the wordmark colour (dark for light photos). */
export function CoverEditor(props: EditorProps<"cover">) {
  const { draft, onChange } = props;
  const slotEditor = createElement(PhotoSlotEditor as ComponentType<EditorProps<"cover">>, props);
  return (
    <>
      {slotEditor}
      <div className={`flex items-center gap-2 ${CARD}`}>
        <span className={LABEL}>Wordmark</span>
        <div role="group" aria-label="Wordmark colour" className="ml-auto flex gap-1">
          {TONES.map((tone) => (
            <button
              key={tone.id}
              type="button"
              aria-pressed={draft.wordmark === tone.id}
              onClick={() => onChange((d) => ({ ...d, wordmark: tone.id }))}
              className={segment(draft.wordmark === tone.id)}
            >
              {tone.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
