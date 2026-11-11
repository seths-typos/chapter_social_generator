import { describe, expect, it } from "vitest";
import { hasSlots, slotCount, type Draft } from "@/store/draft";
import type { Post } from "@/store/types";
import {
  acceptPhotoInDraft,
  clearPhotoFromDraft,
  convertDraft,
  fromPost,
  missingInputs,
  newDraft,
  photoIdsInDraft,
  photoIdsInPost,
  photoUsage,
  takesPhotos,
  TEMPLATE_IDS,
  TEMPLATE_LIST,
  TEMPLATES,
  toPost,
  withPhotoCount,
} from "./registry";

const wood = { kind: "library", id: "wood-dark-worn" } as const;
const tile = { kind: "library", id: "plaster-white" } as const;
const upload = { kind: "upload", id: "u1" } as const;
const slot = (photoId: string) => ({ photoId, panX: 0, panY: 0, zoom: 1 });
const photoPost = (photoId: string): Post => ({
  template: "photo",
  slots: [slot(photoId)],
  texture: tile,
  grain: false,
});

describe("newDraft", () => {
  it("is shaped per template", () => {
    expect(newDraft("photo")).toEqual({
      template: "photo",
      slots: [{ photoId: null, panX: 0, panY: 0, zoom: 1 }],
      grain: false,
      textCard: { on: false, heading: "", text: "" },
      texture: wood,
      textureChosen: false,
    });
    expect(newDraft("cover")).not.toHaveProperty("textCard");
    expect(newDraft("multi-photo")).toMatchObject({ template: "multi-photo", grain: false });
    expect(slotCount(newDraft("multi-photo"))).toBe(2);
    expect(newDraft("graphic")).toEqual({
      template: "graphic",
      graphicId: null,
      texture: tile,
      textureChosen: false,
    });
    expect(newDraft("info")).toMatchObject({
      template: "info",
      texture: tile,
      info: { title: "" },
    });
    expect(hasSlots(newDraft("info"))).toBe(false);
  });

  it("uses a supplied texture (e.g. the session's last-used) over the template default", () => {
    const d = newDraft("info", upload);
    expect(d.texture).toEqual(upload);
    expect(d.textureChosen).toBe(false);
  });
});

describe("convertDraft", () => {
  const none = { lastUsedTexture: null };

  it("returns the same draft for the same template", () => {
    const d = newDraft("photo");
    expect(convertDraft(d, "photo", none)).toBe(d);
  });

  it("carries photos and grain between photo templates", () => {
    const d = newDraft("photo");
    if (!hasSlots(d)) throw new Error();
    d.slots[0] = { photoId: "p1", panX: 0.5, panY: 0, zoom: 2 };
    d.grain = true;
    const multi = convertDraft(d, "multi-photo", none);
    expect(multi).toMatchObject({ template: "multi-photo", grain: true });
    expect(hasSlots(multi) && multi.slots.map((s) => s.photoId)).toEqual(["p1", null]);
    const cover = convertDraft(multi, "cover", none);
    expect(hasSlots(cover) && cover.slots).toEqual([
      { photoId: "p1", panX: 0.5, panY: 0, zoom: 2 },
    ]);
  });

  it("multi → single keeps the first filled photo", () => {
    let d = newDraft("multi-photo");
    d = withPhotoCount(d, 3);
    if (!hasSlots(d)) throw new Error();
    d.slots[1]!.photoId = "b";
    d.slots[2]!.photoId = "c";
    const photo = convertDraft(d, "photo", none);
    expect(hasSlots(photo) && photo.slots[0]!.photoId).toBe("b");
  });

  it("drops info text and graphic when leaving those templates", () => {
    const info = newDraft("info");
    if (info.template !== "info") throw new Error();
    info.info.title = "Hello";
    const photo = convertDraft(info, "photo", none);
    expect(photo.template).toBe("photo");
    expect("info" in photo).toBe(false);
    const back = convertDraft(photo, "info", none);
    expect(back.template === "info" && back.info.title).toBe("");
  });

  it("applies the new template's default texture unless one was chosen or carried over", () => {
    expect(convertDraft(newDraft("photo"), "info", none).texture).toEqual(tile);
    const chosen = { ...newDraft("photo"), texture: upload, textureChosen: true };
    expect(convertDraft(chosen, "info", none).texture).toEqual(upload);
    const carried = newDraft("photo", upload);
    expect(convertDraft(carried, "info", { lastUsedTexture: upload }).texture).toEqual(upload);
  });
});

describe("withPhotoCount", () => {
  it("resizes multi-photo slots, keeping photos, and clamps to 2–4", () => {
    let d = newDraft("multi-photo");
    if (!hasSlots(d)) throw new Error();
    d.slots[0]!.photoId = "a";
    d = withPhotoCount(d, 4);
    expect(hasSlots(d) && d.slots.map((s) => s.photoId)).toEqual(["a", null, null, null]);
    d = withPhotoCount(d, 2);
    expect(slotCount(d)).toBe(2);
    expect(slotCount(withPhotoCount(d, 9 as 4))).toBe(4);
    expect(slotCount(withPhotoCount(d, 1 as 2))).toBe(2);
  });

  it("is a no-op for other templates", () => {
    const d = newDraft("photo");
    expect(withPhotoCount(d, 4)).toBe(d);
  });
});

describe("toPost / missingInputs", () => {
  it("photo: needs one photo", () => {
    const d = newDraft("photo");
    expect(missingInputs(d)).toEqual(["photo"]);
    expect(toPost(d)).toBeNull();
    if (!hasSlots(d)) throw new Error();
    d.slots[0] = { photoId: "p1", panX: 0, panY: 0, zoom: 1.5 };
    expect(toPost(d)).toEqual({
      template: "photo",
      slots: [{ photoId: "p1", panX: 0, panY: 0, zoom: 1.5 }],
      texture: wood,
      grain: false,
    });
  });

  it("multi-photo: needs every slot filled", () => {
    let d = newDraft("multi-photo");
    d = withPhotoCount(d, 3);
    if (!hasSlots(d)) throw new Error();
    d.slots[0]!.photoId = "a";
    d.slots[1]!.photoId = "b";
    expect(missingInputs(d)).toEqual(["1 of 3 photos"]);
    d.slots[2]!.photoId = "c";
    const post = toPost(d);
    expect(post && "slots" in post ? post.slots.map((s) => s.photoId) : null).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("graphic: needs a graphic", () => {
    const d = newDraft("graphic");
    expect(missingInputs(d)).toEqual(["graphic"]);
    if (d.template !== "graphic") throw new Error();
    d.graphicId = "g1";
    expect(toPost(d)).toEqual({ template: "graphic", graphicId: "g1", texture: tile });
  });

  it("info: lists every missing field; body and end time are optional", () => {
    const d = newDraft("info");
    expect(missingInputs(d)).toEqual(["event number", "title", "date", "start time", "location"]);
    if (d.template !== "info") throw new Error();
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
      texture: tile,
    });
    expect(post && "endTime" in post).toBe(false);
  });

  it("info: whitespace-only title or location counts as missing", () => {
    const d = newDraft("info");
    if (d.template !== "info") throw new Error();
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
  it("round-trips every template and marks the texture as chosen", () => {
    const posts: Post[] = [
      {
        template: "cover",
        slots: [{ photoId: "p", panX: 0.2, panY: -0.1, zoom: 2 }],
        texture: tile,
        grain: true,
        wordmark: "dark",
      },
      {
        template: "multi-photo",
        slots: [
          { photoId: "a", panX: 0, panY: 0, zoom: 1 },
          { photoId: "b", panX: 0, panY: 0, zoom: 1 },
          { photoId: "c", panX: 0, panY: 0, zoom: 1 },
          { photoId: "d", panX: 0, panY: 0, zoom: 1 },
        ],
        texture: tile,
        grain: false,
      },
      { template: "graphic", graphicId: "g", texture: tile },
      {
        template: "info",
        eventNumber: 12,
        title: "T",
        body: "B",
        date: "2026-05-01",
        startTime: "18:00",
        endTime: "21:00",
        location: "L",
        texture: tile,
      },
    ];
    for (const post of posts) {
      const draft = fromPost(post);
      expect(draft.textureChosen).toBe(true);
      expect(toPost(draft)).toEqual(post);
    }
  });
});

describe("registry", () => {
  it("keys every definition by its own id, in picker order", () => {
    for (const id of TEMPLATE_IDS) expect(TEMPLATES[id].id).toBe(id);
    expect(TEMPLATE_LIST.map((t) => t.id)).toEqual([
      "cover",
      "photo",
      "multi-photo",
      "graphic",
      "info",
    ]);
  });

  it("gives every template a unique label and a library default texture", () => {
    const labels = TEMPLATE_LIST.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const t of TEMPLATE_LIST) expect(t.defaultTexture.kind).toBe("library");
  });

  it("starts every template with an incomplete draft of its own kind", () => {
    for (const id of TEMPLATE_IDS) {
      const d = newDraft(id);
      expect(d.template).toBe(id);
      expect(missingInputs(d).length).toBeGreaterThan(0);
      expect(toPost(d)).toBeNull();
    }
  });
});

describe("cover wordmark", () => {
  it("is light by default, also after switching from another template", () => {
    expect(newDraft("cover")).toMatchObject({ wordmark: "light" });
    expect(convertDraft(newDraft("photo"), "cover", { lastUsedTexture: null })).toMatchObject({
      wordmark: "light",
    });
  });

  it("is stored on the post, and only on a cover", () => {
    const dark = { ...acceptPhotoInDraft(newDraft("cover"), "a"), wordmark: "dark" } as Draft;
    expect(toPost(dark)).toMatchObject({ template: "cover", wordmark: "dark" });
    const photo = toPost(acceptPhotoInDraft(newDraft("photo"), "a"))!;
    expect("wordmark" in photo).toBe(false);
  });
});

describe("acceptPhotoInDraft", () => {
  it("fills the first empty slot, then swaps the last one", () => {
    let multi = acceptPhotoInDraft(newDraft("multi-photo"), "a");
    expect(photoIdsInDraft(multi)).toEqual(["a"]);
    multi = acceptPhotoInDraft(multi, "b");
    expect(photoIdsInDraft(multi)).toEqual(["a", "b"]);
    multi = acceptPhotoInDraft(multi, "c");
    expect(photoIdsInDraft(multi)).toEqual(["a", "c"]);
  });

  it("fills the given position when there is one", () => {
    let multi = acceptPhotoInDraft(newDraft("multi-photo"), "a", 1);
    expect(multi).toMatchObject({ slots: [{ photoId: null }, { photoId: "a" }] });
    multi = acceptPhotoInDraft(multi, "b", 1);
    expect(multi).toMatchObject({ slots: [{ photoId: null }, { photoId: "b" }] });
    expect(photoIdsInDraft(acceptPhotoInDraft(multi, "c", 9))).toEqual(["c", "b"]);
  });

  it("swaps the photo of a one-slot template and resets its view", () => {
    const first = acceptPhotoInDraft(newDraft("cover"), "a");
    const zoomed = { ...first, slots: [{ photoId: "a", panX: 1, panY: 0, zoom: 2 }] } as Draft;
    expect(acceptPhotoInDraft(zoomed, "b")).toMatchObject({
      slots: [{ photoId: "b", panX: 0, panY: 0, zoom: 1 }],
    });
  });

  it("sets the graphic, and leaves Info alone", () => {
    expect(acceptPhotoInDraft(newDraft("graphic"), "g")).toMatchObject({ graphicId: "g" });
    const info = newDraft("info");
    expect(acceptPhotoInDraft(info, "g")).toBe(info);
    expect(takesPhotos(info)).toBe(false);
    expect(takesPhotos(newDraft("photo"))).toBe(true);
    expect(takesPhotos(newDraft("graphic"))).toBe(true);
  });
});

describe("photoIdsInDraft and photoUsage", () => {
  it("lists the photos a draft uses so far", () => {
    expect(photoIdsInDraft(newDraft("info"))).toEqual([]);
    expect(photoIdsInDraft(newDraft("photo"))).toEqual([]);
    expect(photoIdsInDraft({ ...newDraft("graphic"), graphicId: "g" } as Draft)).toEqual(["g"]);
    expect(photoIdsInDraft(fromPost(photoPost("a")))).toEqual(["a"]);
  });

  it("counts posts per photo, once per post", () => {
    const multi: Post = {
      template: "multi-photo",
      slots: [slot("a"), slot("a"), slot("b")],
      texture: tile,
      grain: false,
    };
    const usage = photoUsage([photoPost("a"), multi]);
    expect(usage.get("a")).toBe(2);
    expect(usage.get("b")).toBe(1);
    expect(usage.has("c")).toBe(false);
  });
});

describe("photoIdsInPost", () => {
  it("lists slot photos, the graphic, or nothing", () => {
    expect(
      photoIdsInPost({ template: "photo", slots: [slot("a")], texture: tile, grain: false }),
    ).toEqual(["a"]);
    expect(
      photoIdsInPost({
        template: "multi-photo",
        slots: [slot("a"), slot("b")],
        texture: tile,
        grain: false,
      }),
    ).toEqual(["a", "b"]);
    expect(photoIdsInPost({ template: "graphic", graphicId: "g", texture: tile })).toEqual(["g"]);
    expect(photoIdsInPost(toPost(fromPost(infoPost))!)).toEqual([]);
  });
});

describe("clearPhotoFromDraft", () => {
  it("empties the slots that used the photo and resets their view", () => {
    let d = withPhotoCount(newDraft("multi-photo"), 3);
    if (!hasSlots(d)) throw new Error();
    d.slots[0] = { photoId: "a", panX: 0.5, panY: 0, zoom: 2 };
    d.slots[1] = { photoId: "b", panX: 0, panY: 0, zoom: 1 };
    d.slots[2] = { photoId: "a", panX: 0, panY: 0, zoom: 1 };
    d = clearPhotoFromDraft(d, "a");
    expect(hasSlots(d) && d.slots).toEqual([
      { photoId: null, panX: 0, panY: 0, zoom: 1 },
      { photoId: "b", panX: 0, panY: 0, zoom: 1 },
      { photoId: null, panX: 0, panY: 0, zoom: 1 },
    ]);
  });

  it("clears the graphic, and leaves an Info draft alone", () => {
    const g = { ...newDraft("graphic"), graphicId: "g" };
    expect(clearPhotoFromDraft(g, "g")).toMatchObject({ graphicId: null });
    expect(clearPhotoFromDraft(g, "other")).toBe(g);
    const info = newDraft("info");
    expect(clearPhotoFromDraft(info, "g")).toBe(info);
  });
});

const infoPost: Post = {
  template: "info",
  eventNumber: 1,
  title: "T",
  body: "",
  date: "2026-01-01",
  startTime: "18:00",
  location: "L",
  texture: tile,
};

describe("fixtures", () => {
  it("fill a draft completely, so the reference render can be reproduced", () => {
    for (const t of TEMPLATE_LIST) {
      if (!t.fixture) continue;
      const filled = t.fixture(newDraft(t.id));
      expect(filled.template).toBe(t.id);
      expect(missingInputs(filled)).toEqual([]);
    }
    expect(TEMPLATES.info.fixture).toBeDefined();
  });
});
