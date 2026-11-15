import { createElement, type ComponentType, type ReactNode } from "react";
import { PHOTO_SLOTS } from "./constants";
import type { EditorProps } from "./definition";
import { PhotoSlotEditor } from "./PhotoSlotEditor";
import { selectionAfterCount, withSlotCount } from "./slotEdits";
import { TextCardEditor } from "./TextCardEditor";
import { CARD, REQUIRED_MARK, LABEL, CHECK_ROW, CHECKBOX, segment } from "./formStyles";

type SlotEditorProps = EditorProps<"photo"> & { header?: ReactNode };

const COUNTS = Array.from(
  { length: PHOTO_SLOTS.max - PHOTO_SLOTS.min + 1 },
  (_, i) => PHOTO_SLOTS.min + i,
);

/** The Photo form: how many photos, the photo for each, the frame option and the text card. */
export function PhotoEditor(props: EditorProps<"photo">) {
  const { draft, onChange, activeSlot, onActiveSlot } = props;
  // Fewer photos drops the last slots; more adds empty ones. Existing photos stay put.
  const setCount = (count: number) => {
    onChange((d) => ({ ...d, slots: withSlotCount(d.slots, count) }));
    const next = selectionAfterCount(withSlotCount(draft.slots, count), activeSlot);
    if (next !== activeSlot) onActiveSlot(next);
  };

  // The count sits at the top of the photo card, so choosing and filling read as one input.
  const header = (
    <div className="flex items-center gap-2">
      <h2 className={LABEL}>Photos{REQUIRED_MARK}</h2>
      <div role="group" aria-label="Number of photos" className="ml-auto flex gap-1">
        {COUNTS.map((count) => (
          <button
            key={count}
            type="button"
            aria-pressed={draft.slots.length === count}
            onClick={() => setCount(count)}
            className={segment(draft.slots.length === count)}
          >
            {count}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <>
      {createElement(PhotoSlotEditor as ComponentType<SlotEditorProps>, { ...props, header })}
      <label className={`${CHECK_ROW} ${CARD}`}>
        <input
          type="checkbox"
          className={CHECKBOX}
          checked={!draft.frame}
          onChange={(e) => onChange((d) => ({ ...d, frame: !e.target.checked }))}
        />
        Remove polaroid frames
      </label>
      <TextCardEditor
        card={draft.textCard}
        onCard={(textCard) => onChange((d) => ({ ...d, textCard }))}
      />
    </>
  );
}
