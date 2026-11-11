import { describe, expect, it } from "vitest";
import type { RenderAssets, TextureAsset } from "@/render/types";
import type { Post } from "@/store/types";
import { missingAssets } from "./png";

const tile = { kind: "library", id: "plaster-white" } as const;
const color: TextureAsset = { kind: "color", color: "#fff" };
const bitmap = {} as ImageBitmap;
const graphic: Post = { template: "graphic", graphicId: "g1", texture: tile };

const assets = (textures: string[], photos: string[]): RenderAssets => ({
  textures: new Map(textures.map((k) => [k, color])),
  photos: new Map(photos.map((k) => [k, bitmap])),
});

describe("missingAssets", () => {
  it("is empty when the texture and every image are loaded", () => {
    expect(missingAssets(graphic, assets(["library:plaster-white"], ["g1"]))).toEqual([]);
  });

  it("names what is still loading", () => {
    expect(missingAssets(graphic, assets([], ["g1"]))).toEqual(["texture"]);
    expect(missingAssets(graphic, assets(["library:plaster-white"], []))).toEqual(["image"]);
    expect(missingAssets(graphic, assets([], []))).toEqual(["texture", "image"]);
  });

  it("needs the polaroid frame for a photo post, not for a graphic", () => {
    const photo: Post = {
      template: "photo",
      slots: [{ photoId: "p1", panX: 0, panY: 0, zoom: 1 }],
      texture: tile,
      grain: false,
      frame: true,
    };
    const loaded = assets(["library:plaster-white"], ["p1"]);
    expect(missingAssets(photo, loaded)).toEqual(["polaroid frame"]);
    expect(missingAssets(photo, { ...loaded, frame: bitmap })).toEqual([]);
  });
});
