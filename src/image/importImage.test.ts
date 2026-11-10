import { describe, expect, it } from "vitest";
import { importImage, NOT_AN_IMAGE } from "./importImage";

const file = new Blob(["x"], { type: "image/png" });
const bitmap = { width: 958, height: 974 } as ImageBitmap;

describe("importImage", () => {
  it("describes a decoded image as a regular pool photo", async () => {
    const result = await importImage(
      file,
      () => "id-1",
      () => Promise.resolve(bitmap),
    );
    expect(result).toEqual({
      ok: true,
      bitmap,
      photo: { id: "id-1", file, width: 958, height: 974, mode: "regular" },
    });
  });

  it("returns a plain-language message when the file can't be decoded", async () => {
    const result = await importImage(
      file,
      () => "id-1",
      () => Promise.reject(new Error("decode failed")),
    );
    expect(result).toEqual({ ok: false, message: NOT_AN_IMAGE });
  });
});
