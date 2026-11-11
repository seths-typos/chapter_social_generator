import { useRef, useState, type ChangeEvent } from "react";
import { PHOTO_ACCEPT } from "@/image/limits";
import { GRAPHIC } from "./constants";
import type { EditorProps } from "./definition";

/** The Graphic template's form: upload the event graphic, or pick an image already in the pool. */
export function GraphicEditor({ draft, onChange, pool, importImage }: EditorProps<"graphic">) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = pool.find((p) => p.id === draft.graphicId);
  const choose = (graphicId: string | null) => onChange((d) => ({ ...d, graphicId }));

  async function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    const result = await importImage(file);
    setBusy(false);
    if (result.ok) choose(result.photoId);
    else setError(result.message);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          Graphic
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium hover:bg-neutral-50 disabled:opacity-40"
        >
          {busy ? "Opening…" : current ? "Upload another…" : "Upload graphic…"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_ACCEPT}
          className="hidden"
          onChange={(e) => void onUpload(e)}
        />
      </div>

      {!current && pool.length > 0 && (
        <p className="text-xs text-neutral-400">
          Or click an image in the Photos panel to use it as the graphic.
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {current && current.width < GRAPHIC.width && (
        <p className="text-xs text-amber-700">
          Low resolution: {current.width}×{current.height}. Under {GRAPHIC.width}px wide it will
          look soft.
        </p>
      )}
      {!current && !error && (
        <p className="text-xs text-neutral-400">
          Any shape works. It is placed {GRAPHIC.width}px wide and keeps its proportions.
        </p>
      )}
    </div>
  );
}
