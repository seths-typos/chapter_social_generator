import { useRef, useState, type ChangeEvent } from "react";
import { setTextureAsset } from "@/render/assetCache";
import { useTextureLibrary } from "@/render/assets";
import { decodeImage, textureThumbUrl } from "@/render/textureLibrary";
import { newId, useAppStore } from "@/store/store";
import type { TextureRef } from "@/store/types";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/templates/constants";

/**
 * Background texture picker: the bundled library as thumbnails, plus session-only
 * uploads tagged "Uploaded". docs/prd.md#template-selection-and-editing
 */
export function TexturePicker() {
  const { entries, error, loading } = useTextureLibrary();
  const draft = useAppStore((s) => s.draft);
  const sessionTextures = useAppStore((s) => s.sessionTextures);
  const setTexture = useAppStore((s) => s.setTexture);
  const addSessionTexture = useAppStore((s) => s.addSessionTexture);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = draft?.texture ?? null;
  const disabled = draft === null;
  const isSelected = (ref: TextureRef) =>
    selected !== null && selected.kind === ref.kind && selected.id === ref.id;

  async function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setNotice(null);
    let image: ImageBitmap;
    try {
      image = await decodeImage(file);
    } catch {
      setNotice("That file isn’t an image the browser can open.");
      return;
    }
    const id = newId();
    const ref: TextureRef = { kind: "upload", id };
    setTextureAsset(ref, { kind: "image", image, width: image.width, height: image.height });
    addSessionTexture({
      id,
      name: file.name.replace(/\.[^.]+$/, ""),
      file,
      width: image.width,
      height: image.height,
      previewUrl: URL.createObjectURL(file),
    });
    setTexture(ref);
    if (image.width < CANVAS_WIDTH || image.height < CANVAS_HEIGHT) {
      setNotice(
        `Low resolution: ${image.width}×${image.height}. Below ${CANVAS_WIDTH}×${CANVAS_HEIGHT} it will look soft.`,
      );
    }
  }

  const thumbClass = (active: boolean) =>
    `relative block aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-sm border bg-neutral-100 transition ${
      active
        ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-1"
        : "border-neutral-200 hover:border-neutral-400"
    } disabled:cursor-not-allowed disabled:opacity-40`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          Texture
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Upload texture…
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onUpload(e)}
        />
      </div>

      {disabled && <p className="text-xs text-neutral-400">Choose a template first.</p>}
      {error && <p className="text-xs text-red-600">Couldn’t load the texture library: {error}</p>}
      {loading && !error && <p className="text-xs text-neutral-400">Loading textures…</p>}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {entries.map((entry) => {
          const ref: TextureRef = { kind: "library", id: entry.id };
          return (
            <button
              key={entry.id}
              type="button"
              title={entry.name}
              aria-label={entry.name}
              aria-pressed={isSelected(ref)}
              disabled={disabled}
              onClick={() => setTexture(ref)}
              className={thumbClass(isSelected(ref))}
            >
              <img
                src={textureThumbUrl(entry)}
                alt=""
                width={240}
                height={320}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          );
        })}
        {sessionTextures.map((t) => {
          const ref: TextureRef = { kind: "upload", id: t.id };
          return (
            <button
              key={t.id}
              type="button"
              title={`${t.name} (uploaded)`}
              aria-label={`${t.name}, uploaded`}
              aria-pressed={isSelected(ref)}
              disabled={disabled}
              onClick={() => setTexture(ref)}
              className={thumbClass(isSelected(ref))}
            >
              {t.previewUrl && (
                <img src={t.previewUrl} alt="" className="h-full w-full object-cover" />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-neutral-900/70 px-1 py-0.5 text-center text-[9px] leading-none font-medium text-white">
                Uploaded
              </span>
            </button>
          );
        })}
      </div>

      {notice && <p className="text-xs text-amber-700">{notice}</p>}
    </div>
  );
}
