import { createElement, type ComponentType } from "react";
import { emptySlot } from "@/store/draft";
import { MULTI_PHOTO_MAX, MULTI_PHOTO_MIN } from "./constants";
import type { EditorProps } from "./definition";
import { PhotoSlotEditor } from "./PhotoSlotEditor";
import { TextCardEditor } from "./TextCardEditor";

const COUNTS = Array.from(
  { length: MULTI_PHOTO_MAX - MULTI_PHOTO_MIN + 1 },
  (_, i) => MULTI_PHOTO_MIN + i,
);

/** The Multi-Photo form: how many polaroids, then the photo for each. */
export function MultiPhotoEditor(props: EditorProps<"multi-photo">) {
  const { draft, onChange } = props;
  // Fewer photos drops the last slots; more adds empty ones. Existing photos stay put.
  const setCount = (count: number) =>
    onChange((d) => ({
      ...d,
      slots: Array.from({ length: count }, (_, i) => d.slots[i] ?? emptySlot()),
    }));

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
      {createElement(PhotoSlotEditor as ComponentType<EditorProps<"multi-photo">>, props)}
      <TextCardEditor
        card={draft.textCard}
        onCard={(textCard) => onChange((d) => ({ ...d, textCard }))}
      />
    </div>
  );
}
