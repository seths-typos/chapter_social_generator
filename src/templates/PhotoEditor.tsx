import { createElement, type ComponentType, type ReactNode } from "react";
import { emptySlot } from "@/store/draft";
import { PHOTO_SLOTS } from "./constants";
import type { EditorProps } from "./definition";
import { PhotoSlotEditor } from "./PhotoSlotEditor";
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
    const slots = Array.from({ length: count }, (_, i) => draft.slots[i] ?? emptySlot());
    onChange((d) => ({ ...d, slots }));
    // Keep the selection on a position that exists, and move it off a filled one to the
    // first empty one, so the next photo clicked fills the new space.
    const firstEmpty = slots.findIndex((s) => s.photoId === null);
    const current = Math.min(activeSlot, count - 1);
    const next = slots[current]?.photoId !== null && firstEmpty !== -1 ? firstEmpty : current;
    if (next !== activeSlot) onActiveSlot(next);
  };

  // The count sits at the top of the photo card, so choosing and filling read as one input.
  const header = (
    <div className="flex items-center gap-2">
      <span className={LABEL}>Photos{REQUIRED_MARK}</span>
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
