import { beforeEach, describe, expect, it } from "vitest";
import { hasSlots } from "./draft";
import { createAppStore, defaultName } from "./store";
import type { PoolPhoto } from "./types";

const photo = (id: string): PoolPhoto => ({
  id,
  name: `${id}.jpg`,
  thumbnail: new Blob(["x"], { type: "image/webp" }),
  width: 3000,
  height: 2000,
  mode: "regular",
});

const wood = { kind: "library", id: "wood-dark-worn" } as const;
const tile = { kind: "library", id: "plaster-white" } as const;
const upload = { kind: "upload", id: "u1" } as const;

let store: ReturnType<typeof createAppStore>;
const s = () => store.getState();
/** The draft's slots, asserting it has some. */
const slots = () => {
  const d = s().draft;
  if (!d || !hasSlots(d)) throw new Error("draft has no slots");
  return d.slots;
};

beforeEach(() => {
  store = createAppStore();
});

/** Start a photo draft with one pool photo in its slot, ready for addToBatch. */
function readyPhotoPost(photoId = "p1") {
  if (!s().pool.some((p) => p.id === photoId)) s().addPhotos([photo(photoId)]);
  s().setTemplate("photo");
  s().setSlotPhoto(0, photoId);
}

describe("initial state", () => {
  it("starts empty, at the template picker (no draft)", () => {
    expect(s().pool).toEqual([]);
    expect(s().batch).toEqual([]);
    expect(s().sessionTextures).toEqual([]);
    expect(s().lastUsedTexture).toBeNull();
    expect(s().editingId).toBeNull();
    expect(s().draft).toBeNull();
  });

  it("is isolated per createAppStore() call (no shared or persisted state)", () => {
    s().addPhotos([photo("p1")]);
    expect(createAppStore().getState().pool).toEqual([]);
  });

  it("draft setters are no-ops with no draft", () => {
    s().setSlotPhoto(0, "p1");
    s().setInfo({ title: "x" });
    s().setTexture(upload);
    s().setGrain(true);
    expect(s().draft).toBeNull();
    expect(s().addToBatch()).toBeNull();
  });
});

describe("photo pool", () => {
  it("adds and removes photos", () => {
    s().addPhotos([photo("a"), photo("b")]);
    expect(s().pool.map((p) => p.id)).toEqual(["a", "b"]);
    expect(s().removePhoto("a")).toBe(true);
    expect(s().pool.map((p) => p.id)).toEqual(["b"]);
  });

  it("blocks removing a photo that a batch post uses", () => {
    readyPhotoPost("p1");
    s().addToBatch();
    expect(s().usageCount("p1")).toBe(1);
    expect(s().removePhoto("p1")).toBe(false);
    expect(s().pool).toHaveLength(1);
  });

  it("clears a removed photo from the draft's slots", () => {
    s().addPhotos([photo("p1")]);
    s().setTemplate("photo");
    s().setSlotPhoto(0, "p1");
    s().removePhoto("p1");
    expect(slots()[0]!.photoId).toBeNull();
  });

  it("clears a removed photo from a graphic draft", () => {
    s().addPhotos([photo("g1")]);
    s().setTemplate("graphic");
    s().setGraphic("g1");
    s().removePhoto("g1");
    expect(s().draft).toMatchObject({ template: "graphic", graphicId: null });
  });

  it("sets scan mode with corners, and drops corners when back to regular", () => {
    s().addPhotos([photo("p1")]);
    const corners: PoolPhoto["scanCorners"] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    s().setPhotoMode("p1", "scan", corners);
    expect(s().pool[0]!.mode).toBe("scan");
    expect(s().pool[0]!.scanCorners).toEqual(corners);
    s().setPhotoMode("p1", "regular");
    expect(s().pool[0]!.mode).toBe("regular");
    expect(s().pool[0]!.scanCorners).toBeUndefined();
  });
});

describe("choosing and switching templates", () => {
  it("setTemplate starts a draft with the template's default texture", () => {
    s().setTemplate("info");
    expect(s().draft).toMatchObject({ template: "info", texture: tile });
    s().clearDraft();
    expect(s().draft).toBeNull();
    s().setTemplate("cover");
    expect(s().draft).toMatchObject({ template: "cover", texture: wood });
  });

  it("switching template converts the draft: default texture until one is chosen", () => {
    s().setTemplate("cover");
    s().setTemplate("info");
    expect(s().draft?.texture).toEqual(tile);
    s().setTexture(upload);
    s().setTemplate("photo");
    expect(s().draft?.texture).toEqual(upload);
  });

  it("switching template keeps photos between photo templates and drops info text", () => {
    s().addPhotos([photo("p1")]);
    s().setTemplate("photo");
    s().setSlotPhoto(0, "p1");
    s().setGrain(true);
    s().setTemplate("multi-photo");
    expect(slots().map((x) => x.photoId)).toEqual(["p1", null]);
    expect(s().draft).toMatchObject({ grain: true });
    s().setTemplate("info");
    s().setInfo({ title: "Hello" });
    s().setTemplate("photo");
    expect(slots()[0]!.photoId).toBeNull(); // photos don't survive via Info
    expect("info" in s().draft!).toBe(false);
  });

  it("clamps pan, zoom and photo count", () => {
    s().setTemplate("multi-photo");
    s().setSlotView(0, { panX: 5, panY: -5, zoom: 10 });
    expect(slots()[0]).toMatchObject({ panX: 1, panY: -1, zoom: 3 });
    s().setSlotView(0, { zoom: 0.1 });
    expect(slots()[0]!.zoom).toBe(1);
    s().resetSlotView(0);
    expect(slots()[0]).toMatchObject({ panX: 0, panY: 0, zoom: 1 });
    s().setPhotoCount(9 as 4);
    expect(slots()).toHaveLength(4);
  });

  it("choosing a new photo for a slot resets that slot's view", () => {
    s().setTemplate("photo");
    s().setSlotView(0, { zoom: 2 });
    s().setSlotPhoto(0, "p9");
    expect(slots()[0]).toEqual({ photoId: "p9", panX: 0, panY: 0, zoom: 1 });
  });

  it("patches info fields only on an info draft", () => {
    s().setTemplate("photo");
    s().setInfo({ title: "ignored" });
    expect("info" in s().draft!).toBe(false);
    s().setTemplate("info");
    s().setInfo({ title: "Hi", eventNumber: 3 });
    expect(s().draft).toMatchObject({ info: { title: "Hi", eventNumber: 3, body: "" } });
  });

  it("editDraft edits only a draft of the named template", () => {
    s().setTemplate("graphic");
    const before = s().draft;
    s().editDraft("info", (d) => ({ ...d, info: { ...d.info, title: "nope" } }));
    expect(s().draft).toBe(before);
    s().editDraft("graphic", (d) => ({ ...d, graphicId: "g1" }));
    expect(s().draft).toMatchObject({ template: "graphic", graphicId: "g1" });
    s().clearDraft();
    s().editDraft("graphic", (d) => ({ ...d, graphicId: "g2" }));
    expect(s().draft).toBeNull();
  });
});

describe("batch", () => {
  it("addToBatch returns null for an incomplete draft and adds nothing", () => {
    s().setTemplate("photo");
    expect(s().addToBatch()).toBeNull();
    expect(s().batch).toEqual([]);
    expect(s().draft).not.toBeNull();
  });

  it("addToBatch snapshots the post, names it, remembers the texture and returns to the picker", () => {
    readyPhotoPost("p1");
    s().setTexture(upload);
    s().setGrain(true);
    const id = s().addToBatch();
    expect(id).not.toBeNull();
    expect(s().batch).toHaveLength(1);
    expect(s().batch[0]).toMatchObject({
      id,
      name: "photo-1",
      caption: "",
      post: { template: "photo", texture: upload, grain: true },
    });
    expect(s().draft).toBeNull();
    expect(s().lastUsedTexture).toEqual(upload);
    expect(s().pool).toHaveLength(1);
  });

  it("the next draft starts from the last-used texture, whatever the template", () => {
    readyPhotoPost("p1");
    s().setTexture(upload);
    s().addToBatch();
    s().setTemplate("info");
    expect(s().draft?.texture).toEqual(upload);
    s().setTemplate("cover");
    expect(s().draft?.texture).toEqual(upload);
  });

  it("names count per template", () => {
    readyPhotoPost("p1");
    s().addToBatch();
    readyPhotoPost("p1");
    s().addToBatch();
    s().setTemplate("cover");
    s().setSlotPhoto(0, "p1");
    s().addToBatch();
    expect(s().batch.map((b) => b.name)).toEqual(["photo-1", "photo-2", "cover-1"]);
    expect(defaultName("photo", s().batch)).toBe("photo-3");
  });

  it("updateItem edits name and caption only", () => {
    readyPhotoPost("p1");
    const id = s().addToBatch()!;
    s().updateItem(id, { name: "opening night", caption: "we had fun" });
    expect(s().batch[0]).toMatchObject({ name: "opening night", caption: "we had fun" });
  });

  it("removeItem frees the photo for removal", () => {
    readyPhotoPost("p1");
    const id = s().addToBatch()!;
    s().removeItem(id);
    expect(s().batch).toEqual([]);
    expect(s().removePhoto("p1")).toBe(true);
  });

  it("duplicateItem inserts a deep copy right after the source with a fresh name", () => {
    readyPhotoPost("p1");
    const id = s().addToBatch()!;
    s().updateItem(id, { caption: "cap" });
    const copyId = s().duplicateItem(id)!;
    expect(s().batch.map((b) => b.id)).toEqual([id, copyId]);
    expect(s().batch[1]).toMatchObject({ name: "photo-2", caption: "cap" });
    expect(s().batch[1]!.post).toEqual(s().batch[0]!.post);
    expect(s().batch[1]!.post).not.toBe(s().batch[0]!.post);
  });

  it("moveItem reorders and ignores out-of-range indices", () => {
    readyPhotoPost("p1");
    const a = s().addToBatch()!;
    readyPhotoPost("p1");
    const b = s().addToBatch()!;
    readyPhotoPost("p1");
    const c = s().addToBatch()!;
    s().moveItem(2, 0);
    expect(s().batch.map((x) => x.id)).toEqual([c, a, b]);
    s().moveItem(5, 0);
    expect(s().batch.map((x) => x.id)).toEqual([c, a, b]);
  });
});

describe("editing a batch item", () => {
  it("loadForEdit → saveEdit updates in place and returns to the picker", () => {
    readyPhotoPost("p1");
    const id = s().addToBatch()!;
    s().loadForEdit(id);
    expect(s().editingId).toBe(id);
    expect(slots()[0]!.photoId).toBe("p1");
    s().setGrain(true);
    expect(s().saveEdit()).toBe(true);
    expect(s().batch).toHaveLength(1);
    expect(s().batch[0]!.post).toMatchObject({ grain: true });
    expect(s().editingId).toBeNull();
    expect(s().draft).toBeNull();
  });

  it("saveEdit fails when not editing or when the draft is incomplete", () => {
    expect(s().saveEdit()).toBe(false);
    readyPhotoPost("p1");
    const id = s().addToBatch()!;
    s().loadForEdit(id);
    s().setSlotPhoto(0, null);
    expect(s().saveEdit()).toBe(false);
    expect(s().editingId).toBe(id);
  });

  it("cancelEdit discards changes", () => {
    readyPhotoPost("p1");
    const id = s().addToBatch()!;
    s().loadForEdit(id);
    s().setGrain(true);
    s().cancelEdit();
    expect(s().editingId).toBeNull();
    expect(s().draft).toBeNull();
    expect(s().batch[0]!.post).toMatchObject({ grain: false });
  });

  it("removing the item being edited clears the editor", () => {
    readyPhotoPost("p1");
    const id = s().addToBatch()!;
    s().loadForEdit(id);
    s().removeItem(id);
    expect(s().editingId).toBeNull();
    expect(s().draft).toBeNull();
  });
});
