import { describe, expect, it, vi } from "vitest";
import {
  classifyFile,
  downscaleSize,
  heicMessage,
  importImage,
  importImages,
  isLowResolution,
  thumbnailSize,
  unreadableMessage,
  unsupportedMessage,
  type ImportDeps,
  type ImportResult,
} from "./importImage";

const bitmapOf = (width: number, height: number) =>
  ({ width, height, close: vi.fn() }) as unknown as ImageBitmap;
const thumb = new Blob(["t"], { type: "image/webp" });

function deps(over: Partial<ImportDeps> = {}): ImportDeps {
  return {
    newId: () => "id-1",
    decode: () => Promise.resolve(bitmapOf(958, 974)),
    convertHeic: () => Promise.resolve(new Blob(["j"], { type: "image/jpeg" })),
    resize: (_b, w, h) => Promise.resolve(bitmapOf(w, h)),
    thumbnail: () => Promise.resolve(thumb),
    ...over,
  };
}

const png = new File(["x"], "flyer.png", { type: "image/png" });

describe("classifyFile", () => {
  it("accepts JPEG, PNG and WebP by type", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "IMAGE/JPEG"]) {
      expect(classifyFile({ type })).toBe("image");
    }
  });
  it("spots HEIC by type or, with no type, by extension", () => {
    expect(classifyFile({ type: "image/heic" })).toBe("heic");
    expect(classifyFile({ type: "image/heif" })).toBe("heic");
    expect(classifyFile({ type: "", name: "IMG_0042.HEIC" })).toBe("heic");
  });
  it("falls back to the extension when the type is empty", () => {
    expect(classifyFile({ type: "", name: "a.JPG" })).toBe("image");
    expect(classifyFile({ type: "", name: "noextension" })).toBe("unsupported");
  });
  it("rejects everything else", () => {
    for (const type of ["image/gif", "image/svg+xml", "application/pdf", "video/mp4"]) {
      expect(classifyFile({ type, name: "x.jpg" })).toBe("unsupported");
    }
  });
});

describe("sizes", () => {
  it("caps the long edge at 3000 and keeps proportions", () => {
    expect(downscaleSize(6000, 4000)).toEqual({ width: 3000, height: 2000 });
    expect(downscaleSize(3024, 4032)).toEqual({ width: 2250, height: 3000 });
  });
  it("never enlarges", () => {
    expect(downscaleSize(3000, 2000)).toEqual({ width: 3000, height: 2000 });
    expect(downscaleSize(800, 600)).toEqual({ width: 800, height: 600 });
  });
  it("makes 240-wide thumbnails, never enlarged", () => {
    expect(thumbnailSize(3000, 2000)).toEqual({ width: 240, height: 160 });
    expect(thumbnailSize(100, 300)).toEqual({ width: 100, height: 300 });
  });
  it("flags a short edge under 1080", () => {
    expect(isLowResolution({ width: 3000, height: 1079 })).toBe(true);
    expect(isLowResolution({ width: 1080, height: 1440 })).toBe(false);
  });
});

describe("importImage", () => {
  it("describes a decoded image as a regular pool photo", async () => {
    const result = await importImage(png, deps());
    expect(result).toMatchObject({
      ok: true,
      photo: {
        id: "id-1",
        name: "flyer.png",
        thumbnail: thumb,
        width: 958,
        height: 974,
        mode: "regular",
      },
    });
  });

  it("downscales a large photo and closes the full-size bitmap", async () => {
    const big = bitmapOf(6000, 4000);
    const resize = vi.fn((_b: ImageBitmap, w: number, h: number) =>
      Promise.resolve(bitmapOf(w, h)),
    );
    const result = await importImage(png, deps({ decode: () => Promise.resolve(big), resize }));
    expect(resize).toHaveBeenCalledWith(big, 3000, 2000);
    expect(big.close).toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true, photo: { width: 3000, height: 2000 } });
  });

  it("doesn't resize a photo that is already small enough", async () => {
    const resize = vi.fn();
    await importImage(png, deps({ resize }));
    expect(resize).not.toHaveBeenCalled();
  });

  it("rejects an unsupported type without decoding", async () => {
    const decode = vi.fn();
    const pdf = new File(["x"], "notes.pdf", { type: "application/pdf" });
    const result = await importImage(pdf, deps({ decode }));
    expect(result).toEqual({ ok: false, message: unsupportedMessage("notes.pdf") });
    expect(decode).not.toHaveBeenCalled();
  });

  it("gives a plain-language message when the file can't be decoded", async () => {
    const result = await importImage(
      png,
      deps({ decode: () => Promise.reject(new Error("decode failed")) }),
    );
    expect(result).toEqual({ ok: false, message: unreadableMessage("flyer.png") });
  });

  const heic = new File(["x"], "IMG_1.HEIC", { type: "" });

  it("uses a HEIC directly when the browser can decode it", async () => {
    const convertHeic = vi.fn();
    const result = await importImage(heic, deps({ convertHeic }));
    expect(result.ok).toBe(true);
    expect(convertHeic).not.toHaveBeenCalled();
  });

  it("converts a HEIC the browser can't decode, then decodes the JPEG", async () => {
    const jpeg = new Blob(["j"], { type: "image/jpeg" });
    const decode = vi.fn((blob: Blob) =>
      blob === jpeg ? Promise.resolve(bitmapOf(4032, 3024)) : Promise.reject(new Error("no")),
    );
    const result = await importImage(
      heic,
      deps({ decode, convertHeic: () => Promise.resolve(jpeg) }),
    );
    expect(result).toMatchObject({ ok: true, photo: { width: 3000, height: 2250 } });
  });

  it("reports a HEIC that can't be converted", async () => {
    const result = await importImage(
      heic,
      deps({
        decode: () => Promise.reject(new Error("no")),
        convertHeic: () => Promise.reject(new Error("no")),
      }),
    );
    expect(result).toEqual({ ok: false, message: heicMessage("IMG_1.HEIC") });
  });
});

describe("importImages", () => {
  it("reports every file once, in the order given, whatever order they finish in", async () => {
    const delays = [30, 5, 20, 1, 10];
    const seen: number[] = [];
    let running = 0;
    let peak = 0;
    await importImages(
      delays,
      async (ms): Promise<ImportResult> => {
        peak = Math.max(peak, ++running);
        await new Promise((r) => setTimeout(r, ms));
        running--;
        return { ok: false, message: String(ms) };
      },
      (result, index) => {
        expect(result).toEqual({ ok: false, message: String(delays[index]) });
        seen.push(index);
      },
      2,
    );
    expect(seen).toEqual([0, 1, 2, 3, 4]);
    expect(peak).toBe(2);
  });

  it("does nothing for an empty list", async () => {
    const onResult = vi.fn();
    await importImages([], () => Promise.reject(new Error("unused")), onResult);
    expect(onResult).not.toHaveBeenCalled();
  });
});
