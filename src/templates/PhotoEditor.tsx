import { createElement, type ComponentType } from "react";
import { emptySlot } from "@/store/draft";
import { PHOTO_SLOTS } from "./constants";
import type { EditorProps } from "./definition";
import { PhotoSlotEditor } from "./PhotoSlotEditor";
import { TextCardEditor } from "./TextCardEditor";

const COUNTS = Array.from(
  { length: PHOTO_SLOTS.max - PHOTO_SLOTS.min + 1 },
  (_, i) => PHOTO_SLOTS.min + i,
);

/** The Photo form: how many polaroids, the photo for each, then the optional text card. */
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">Photos</span>
        <div role="group" aria-label="Number of photos" className="ml-auto flex gap-1">
          {COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              aria-pressed={draft.slots.length === count}
              onClick={() => setCount(count)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                draft.slots.length === count
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>
      {createElement(PhotoSlotEditor as ComponentType<EditorProps<"photo">>, props)}
      <TextCardEditor
        card={draft.textCard}
        onCard={(textCard) => onChange((d) => ({ ...d, textCard }))}
      />
    </div>
  );
}
