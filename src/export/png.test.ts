import { describe, expect, it } from "vitest";
import type { RenderAssets, TextureAsset } from "@/render/types";
import type { Post } from "@/store/types";
import { acceptPhotoInDraft, newDraft, toPost } from "@/templates/registry";
import { describeMissing, missingAssets, postAssetKey } from "./png";

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

describe("describeMissing", () => {
  it("says nothing when nothing is missing", () => {
    expect(describeMissing([], ["texture"])).toBeNull();
  });

  it("reports assets still on their way", () => {
    expect(describeMissing(["texture", "image"], [])).toEqual({
      text: "Still loading: texture, image",
      canRetry: false,
    });
  });

  it("offers a retry for the ones that failed, and names only those", () => {
    expect(describeMissing(["texture", "polaroid frame"], ["texture"])).toEqual({
      text: "Couldn’t load the texture.",
      canRetry: true,
    });
    expect(describeMissing(["texture", "polaroid frame"], ["texture", "polaroid frame"])).toEqual({
      text: "Couldn’t load the texture or the polaroid frame.",
      canRetry: true,
    });
  });

  it("ignores a failure the post doesn't depend on", () => {
    expect(describeMissing(["image"], ["texture"])?.canRetry).toBe(false);
  });
});

describe("postAssetKey", () => {
  const post = toPost(acceptPhotoInDraft(newDraft("photo"), "p1")) as Post;
  const newBitmap = () => ({}) as ImageBitmap;
  const withPhotos = (photos: [string, ImageBitmap][], frame?: ImageBitmap): RenderAssets => ({
    textures: new Map(),
    photos: new Map(photos),
    ...(frame ? { frame } : {}),
  });

  it("is unchanged when an asset the post doesn't use arrives", () => {
    const p1 = newBitmap();
    const before = postAssetKey(post, withPhotos([["p1", p1]]));
    const after = postAssetKey(
      post,
      withPhotos([
        ["p1", p1],
        ["other", newBitmap()],
      ]),
    );
    expect(after).toBe(before);
  });

  it("changes when the post's own photo or the frame arrives", () => {
    const p1 = newBitmap();
    const empty = postAssetKey(post, withPhotos([]));
    const withPhoto = postAssetKey(post, withPhotos([["p1", p1]]));
    const withFrame = postAssetKey(post, withPhotos([["p1", p1]], newBitmap()));
    expect(new Set([empty, withPhoto, withFrame]).size).toBe(3);
  });
});
