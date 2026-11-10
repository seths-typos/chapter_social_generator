import { describe, expect, it } from "vitest";
import { parseManifest, textureFileUrl, textureThumbUrl } from "./textureLibrary";

const good = {
  id: "wood-dark-worn",
  name: "Dark worn wood",
  file: "wood-dark-worn.jpg",
  thumb: "wood-dark-worn-thumb.jpg",
  width: 2160,
  height: 2880,
};

describe("parseManifest", () => {
  it("accepts a well-formed manifest", () => {
    expect(parseManifest([good])).toEqual([good]);
  });

  it("rejects non-arrays, missing fields, bad ids and duplicates", () => {
    expect(() => parseManifest({})).toThrow(/expected an array/);
    expect(() => parseManifest([{ ...good, thumb: "" }])).toThrow(/missing "thumb"/);
    expect(() => parseManifest([{ ...good, width: 0 }])).toThrow(/bad "width"/);
    expect(() => parseManifest([{ ...good, id: "Wood Dark" }])).toThrow(/kebab-case/);
    expect(() => parseManifest([good, good])).toThrow(/duplicate id/);
  });
});

describe("texture urls", () => {
  it("resolve under the given base path", () => {
    expect(textureFileUrl(good, "/chapter_social_generator/")).toBe(
      "/chapter_social_generator/textures/wood-dark-worn.jpg",
    );
    expect(textureThumbUrl(good, "/")).toBe("/textures/wood-dark-worn-thumb.jpg");
  });
});
