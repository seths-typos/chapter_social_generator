import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { isLowResolution } from "@/image/importImage";
import { LOW_RES_SHORT_EDGE, PHOTO_ACCEPT } from "@/image/limits";
import { previewUrl } from "@/image/previewUrl";
import { zoomTo, type Size, type View } from "@/render/fit";
import type { PhotoDraft } from "@/store/draft";
import { emptySlot } from "@/store/draft";
import { POLAROID, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from "./constants";
import type { EditorProps } from "./definition";
import { swapSlots } from "./swapSlots";
import {
  CARD,
  REQUIRED_MARK,
  LABEL,
  FIELD_LABEL,
  HINT,
  ERROR_TEXT,
  CHECK_ROW,
  CHECKBOX,
  COMPACT_BUTTON,
} from "./formStyles";
import { Card } from "./Card";

type SlotTemplate = PhotoDraft["template"];

/**
 * The form for a template with photo slots: select a position, then fill it by clicking a
 * photo in the Photo Library or by uploading one (which also adds it to the pool). docs/prd.md#session-photo-pool
 */
export function PhotoSlotEditor({
  draft,
  onChange,
  pool,
  importImage,
  activeSlot: active,
  onActiveSlot: setActive,
  header,
}: EditorProps<SlotTemplate> & { header?: ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
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

  /** Exchange two slots' photos. The selection stays on the same photo. */
  const swap = (from: number, to: number) => {
    onChange((d) => ({ ...d, slots: swapSlots(d.slots, from, to) }) as typeof d);
    setActive(index === from ? to : index === to ? from : index);
  };
  const endDrag = () => {
    setDragging(null);
    setDropTarget(null);
  };

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
    <>
      <Card className="flex flex-col gap-2">
        {header}
        {draft.slots.length > 1 && (
          <>
            <p className={HINT}>Drag to swap.</p>
            <div className="flex gap-2">
              {draft.slots.map((s, i) => {
                const photo = pool.find((p) => p.id === s.photoId);
                const label = photo ? photo.name || "photo" : "empty";
                return (
                  <button
                    key={i}
                    type="button"
                    draggable
                    aria-pressed={i === index}
                    aria-label={`Photo ${i + 1}: ${label}`}
                    data-testid={`slot-${i + 1}`}
                    onClick={() => setActive(i)}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(i));
                      setDragging(i);
                    }}
                    onDragOver={(e) => {
                      if (dragging === null || dragging === i) return;
                      e.preventDefault();
                      setDropTarget(i);
                    }}
                    onDragLeave={() => setDropTarget((t) => (t === i ? null : t))}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragging !== null) swap(dragging, i);
                      endDrag();
                    }}
                    onDragEnd={endDrag}
                    className={`relative block h-16 w-16 shrink-0 cursor-grab overflow-hidden rounded-sm border bg-neutral-100 ${
                      i === index
                        ? "border-[#3B82F6] ring-2 ring-[#3B82F6] ring-offset-1"
                        : photo
                          ? "border-neutral-200 hover:border-neutral-400"
                          : "border-dashed border-neutral-300 hover:border-neutral-400"
                    } ${dropTarget === i ? "outline-2 outline-offset-2 outline-blue-500" : ""} ${
                      dragging === i ? "opacity-40" : ""
                    }`}
                  >
                    {photo && (
                      <img
                        src={previewUrl(photo.thumbnail)}
                        alt=""
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute top-0.5 left-0.5 rounded-sm bg-neutral-900/80 px-1 text-[10px] leading-4 font-medium text-white">
                      {i + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className={`flex items-center ${header ? "justify-end" : "justify-between"}`}>
          {/* With a header (the photo count), that row is the card's label. */}
          {!header && <span className={LABEL}>Photo{REQUIRED_MARK}</span>}
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={COMPACT_BUTTON}
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
          <p className={HINT}>Upload a photo or select one in the Photo Library.</p>
        )}

        {!current && draft.slots.length === 1 && (
          <p className={HINT}>Upload a photo, or select one in the Photo Library.</p>
        )}

        {current && slot && (
          <div className="flex items-center gap-2">
            <label htmlFor="slot-zoom" className={FIELD_LABEL}>
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
            <span className={`w-9 text-right tabular-nums ${FIELD_LABEL}`}>
              {slot.zoom.toFixed(1)}×
            </span>
            <button
              type="button"
              disabled={slot.zoom === 1 && slot.panX === 0 && slot.panY === 0}
              onClick={() => setView(() => ({ panX: 0, panY: 0, zoom: 1 }))}
              className={COMPACT_BUTTON}
            >
              Reset
            </button>
          </div>
        )}
        {current && slot && (
          <p className={HINT}>
            Drag the photo in the preview to reposition it. Scroll over it to zoom.
          </p>
        )}

        {error && <p className={ERROR_TEXT}>{error}</p>}
        {current && isLowResolution(current) && (
          <p className="text-xs text-amber-700">
            Low resolution: {current.width}×{current.height}. Under {LOW_RES_SHORT_EDGE}px on the
            short side it may look soft.
          </p>
        )}
      </Card>
      <label className={`${CHECK_ROW} ${CARD}`}>
        <input
          type="checkbox"
          className={CHECKBOX}
          checked={draft.grain}
          onChange={(e) => onChange((d) => ({ ...d, grain: e.target.checked }))}
        />
        Add film filter
      </label>
    </>
  );
}
