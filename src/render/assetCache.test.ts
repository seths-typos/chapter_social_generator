import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TextureRef } from "@/store/types";
import {
  ensureLibraryTexture,
  getTextureErrorsSnapshot,
  getTexturesSnapshot,
  releaseUnusedLibraryTextures,
  resetTextureCache,
  setTextureAsset,
} from "./assetCache";
import type { TextureManifestEntry } from "./textureLibrary";

const lib = (id: string): TextureRef => ({ kind: "library", id });
const entry = (id: string): TextureManifestEntry => ({
  id,
  name: id,
  file: `${id}.jpg`,
  thumb: `${id}-thumb.jpg`,
  width: 2160,
  height: 2880,
});

/** Put a stand-in bitmap in the cache and return its `close` spy. */
function load(ref: TextureRef) {
  const close = vi.fn();
  const image = { close } as unknown as ImageBitmap;
  setTextureAsset(ref, { kind: "image", image, width: 1, height: 1 });
  return close;
}

beforeEach(() => {
  resetTextureCache();
  vi.unstubAllGlobals();
});

describe("releaseUnusedLibraryTextures", () => {
  it("closes and drops library textures nothing uses, beyond the spare allowance", () => {
    const kept = load(lib("kept"));
    const a = load(lib("a"));
    const b = load(lib("b"));
    releaseUnusedLibraryTextures(new Set(["library:kept"]), 0);
    expect([...getTexturesSnapshot().keys()]).toEqual(["library:kept"]);
    expect(kept).not.toHaveBeenCalled();
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it("never releases an uploaded texture", () => {
    const upload = load({ kind: "upload", id: "u1" });
    releaseUnusedLibraryTextures(new Set(), 0);
    expect(getTexturesSnapshot().has("upload:u1")).toBe(true);
    expect(upload).not.toHaveBeenCalled();
  });

  it("keeps the most recently wanted spares", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const old = load(lib("old"));
    const recent = load(lib("recent"));
    // Asking for a texture, even one already loaded, marks it as recently wanted.
    await ensureLibraryTexture(entry("old"));
    await ensureLibraryTexture(entry("recent"));
    releaseUnusedLibraryTextures(new Set(), 1);
    expect([...getTexturesSnapshot().keys()]).toEqual(["library:recent"]);
    expect(old).toHaveBeenCalledOnce();
    expect(recent).not.toHaveBeenCalled();
  });
});

describe("a texture that fails to load", () => {
  it("is reported, and asking again retries and clears the report", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await ensureLibraryTexture(entry("wood"));
    expect(getTextureErrorsSnapshot().get("library:wood")).toBe("HTTP 503");

    const fetchAgain = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal("fetch", fetchAgain);
    await ensureLibraryTexture(entry("wood"));
    expect(fetchAgain).toHaveBeenCalledOnce();
    expect(getTextureErrorsSnapshot().get("library:wood")).toBe("HTTP 404");
  });
});
