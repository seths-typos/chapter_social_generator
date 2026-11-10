import { describe, expect, it } from "vitest";
import { fromPost, missingInputs, newDraft, slotCount, toPost } from "./draft";
import type { Post } from "./types";

const tex = { kind: "library", id: "tile-white" } as const;

describe("newDraft", () => {
  it("uses the template's default texture when none is given", () => {
    expect(newDraft("cover").texture).toEqual({ kind: "library", id: "wood-parquet" });
    expect(newDraft("info").texture).toEqual({ kind: "library", id: "tile-white" });
    expect(newDraft("cover").textureChosen).toBe(false);
  });

  it("marks a supplied texture as chosen", () => {
    const d = newDraft("cover", tex);
    expect(d.texture).toEqual(tex);
    expect(d.textureChosen).toBe(true);
  });
});

describe("slotCount", () => {
  it("is 1 for cover/photo, photoCount for multi-photo, 0 otherwise", () => {
    expect(slotCount({ template: "cover", photoCount: 3 })).toBe(1);
    expect(slotCount({ template: "photo", photoCount: 3 })).toBe(1);
    expect(slotCount({ template: "multi-photo", photoCount: 3 })).toBe(3);
    expect(slotCount({ template: "graphic", photoCount: 3 })).toBe(0);
    expect(slotCount({ template: "info", photoCount: 3 })).toBe(0);
  });
});

describe("toPost / missingInputs", () => {
  it("photo: needs one photo", () => {
    const d = newDraft("photo");
    expect(missingInputs(d)).toEqual(["photo"]);
    expect(toPost(d)).toBeNull();
    d.slots[0]!.photoId = "p1";
    d.slots[0]!.zoom = 1.5;
    expect(toPost(d)).toEqual({
      template: "photo",
      slots: [{ photoId: "p1", panX: 0, panY: 0, zoom: 1.5 }],
      texture: { kind: "library", id: "wood-parquet" },
      grain: false,
    });
  });

  it("multi-photo: needs photoCount photos and only exports that many slots", () => {
    const d = newDraft("multi-photo");
    d.photoCount = 3;
    d.slots[0]!.photoId = "a";
    d.slots[1]!.photoId = "b";
    expect(missingInputs(d)).toEqual(["1 of 3 photos"]);
    d.slots[2]!.photoId = "c";
    d.slots[3]!.photoId = "ignored";
    const post = toPost(d);
    expect(post?.template).toBe("multi-photo");
    expect(post && "slots" in post ? post.slots.map((s) => s.photoId) : null).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("graphic: needs a graphic", () => {
    const d = newDraft("graphic");
    expect(missingInputs(d)).toEqual(["graphic"]);
    d.graphicId = "g1";
    expect(toPost(d)).toEqual({ template: "graphic", graphicId: "g1", texture: tex });
  });

  it("info: lists every missing field; body and end time are optional", () => {
    const d = newDraft("info");
    expect(missingInputs(d)).toEqual(["event number", "title", "date", "start time", "location"]);
    d.info = {
      eventNumber: 4,
      title: "Recess At Night!",
      body: "",
      date: "2026-03-10",
      startTime: "18:30",
      endTime: "",
      location: "Anew Café & Goods, New York, NY",
    };
    const post = toPost(d);
    expect(post).toEqual({
      template: "info",
      eventNumber: 4,
      title: "Recess At Night!",
      body: "",
      date: "2026-03-10",
      startTime: "18:30",
      location: "Anew Café & Goods, New York, NY",
      texture: tex,
    });
    expect(post && "endTime" in post).toBe(false);
  });

  it("info: whitespace-only title or location counts as missing", () => {
    const d = newDraft("info");
    d.info = {
      ...d.info,
      eventNumber: 1,
      title: "  ",
      date: "2026-01-01",
      startTime: "19:00",
      location: " ",
    };
    expect(missingInputs(d)).toEqual(["title", "location"]);
  });
});

describe("fromPost", () => {
  it("round-trips every template", () => {
    const posts: Post[] = [
      {
        template: "cover",
        slots: [{ photoId: "p", panX: 0.2, panY: -0.1, zoom: 2 }],
        texture: tex,
        grain: true,
      },
      {
        template: "multi-photo",
        slots: [
          { photoId: "a", panX: 0, panY: 0, zoom: 1 },
          { photoId: "b", panX: 0, panY: 0, zoom: 1 },
          { photoId: "c", panX: 0, panY: 0, zoom: 1 },
          { photoId: "d", panX: 0, panY: 0, zoom: 1 },
        ],
        texture: tex,
        grain: false,
      },
      { template: "graphic", graphicId: "g", texture: tex },
      {
        template: "info",
        eventNumber: 12,
        title: "T",
        body: "B",
        date: "2026-05-01",
        startTime: "18:00",
        endTime: "21:00",
        location: "L",
        texture: tex,
      },
    ];
    for (const post of posts) {
      const draft = fromPost(post);
      expect(draft.textureChosen).toBe(true);
      expect(toPost(draft)).toEqual(post);
    }
  });
});
