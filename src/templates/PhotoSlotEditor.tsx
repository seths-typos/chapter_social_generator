import { useRef, useState, type ChangeEvent } from "react";
import { isLowResolution } from "@/image/importImage";
import { LOW_RES_SHORT_EDGE, PHOTO_ACCEPT } from "@/image/limits";
import { previewUrl } from "@/image/previewUrl";
import { zoomTo, type Size, type View } from "@/render/fit";
import type { PhotoDraft } from "@/store/draft";
import { emptySlot } from "@/store/draft";
import { POLAROID, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from "./constants";
import type { EditorProps } from "./definition";

type SlotTemplate = PhotoDraft["template"];

/**
 * The form for a template with photo slots: for each slot, pick a photo from the pool or
 * upload one (which also adds it to the pool). docs/prd.md#session-photo-pool
 */
export function PhotoSlotEditor({ draft, onChange, pool, importImage }: EditorProps<SlotTemplate>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const index = Math.min(active, draft.slots.length - 1);
  const slot = draft.slots[index];
  const current = pool.find((p) => p.id === slot?.photoId);

  /** Change the pan and zoom of the active slot's photo. */
  const setView = (change: (size: Size, view: View) => View) => {
    if (!current) return;
    const size = { w: current.width, h: current.height };
    onChange(
      (d) =>
        ({
          ...d,
          slots: d.slots.map((s, i) => (i === index ? { ...s, ...change(size, s) } : s)),
        }) as typeof d,
    );
  };

  const setPhoto = (slot: number, photoId: string | null) =>
    onChange(
      (d) =>
        ({
          ...d,
          slots: d.slots.map((s, i) => (i === slot ? { ...emptySlot(), photoId } : s)),
        }) as typeof d,
    );

  async function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    const result = await importImage(file);
    setBusy(false);
    if (result.ok) setPhoto(index, result.photoId);
    else setError(result.message);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          {draft.slots.length > 1 ? `Photo ${index + 1} of ${draft.slots.length}` : "Photo"}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium hover:bg-neutral-50 disabled:opacity-40"
        >
          {busy ? "Opening…" : "Upload photo…"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_ACCEPT}
          className="hidden"
          data-testid="slot-input"
          onChange={(e) => void onUpload(e)}
        />
      </div>

      {draft.slots.length > 1 && (
        <div className="flex gap-1">
          {draft.slots.map((slot, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={i === index}
              onClick={() => setActive(i)}
              className={`rounded-md border px-2 py-1 text-xs ${
                i === index ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
              }`}
            >
              {i + 1}
              {slot.photoId ? "" : " (empty)"}
            </button>
          ))}
        </div>
      )}

      {pool.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {pool.map((photo) => {
            const chosen = photo.id === draft.slots[index]?.photoId;
            return (
              <button
                key={photo.id}
                type="button"
                aria-pressed={chosen}
                aria-label={`Use ${photo.name || "this photo"}`}
                onClick={() => setPhoto(index, photo.id)}
                className={`block h-16 w-16 shrink-0 overflow-hidden rounded-sm border bg-neutral-100 ${
                  chosen
                    ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-1"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                <img
                  src={previewUrl(photo.thumbnail)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-neutral-400">
          Upload a photo here, or add several in the Photos panel and pick one.
        </p>
      )}

      {current && slot && (
        <div className="flex items-center gap-2">
          <label htmlFor="slot-zoom" className="text-xs text-neutral-500">
            Zoom
          </label>
          <input
            id="slot-zoom"
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={slot.zoom}
            onChange={(e) =>
              setView((size, view) => zoomTo(size, POLAROID.window, view, Number(e.target.value)))
            }
            className="min-w-0 flex-1"
          />
          <span className="w-9 text-right text-xs text-neutral-500 tabular-nums">
            {slot.zoom.toFixed(1)}×
          </span>
          <button
            type="button"
            disabled={slot.zoom === 1 && slot.panX === 0 && slot.panY === 0}
            onClick={() => setView(() => ({ panX: 0, panY: 0, zoom: 1 }))}
            className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-50 disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      )}
      {current && slot && (
        <p className="text-xs text-neutral-400">
          Drag the photo in the preview to reposition it. Scroll over it to zoom.
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {current && isLowResolution(current) && (
        <p className="text-xs text-amber-700">
          Low resolution: {current.width}×{current.height}. Under {LOW_RES_SHORT_EDGE}px on the
          short side it may look soft.
        </p>
      )}
    </div>
  );
}
