import { beforeEach, describe, expect, it } from "vitest";
import { createAppStore, defaultName } from "./store";
import type { PoolPhoto } from "./types";

const photo = (id: string): PoolPhoto => ({
  id,
  file: new Blob(["x"], { type: "image/jpeg" }),
  width: 3000,
  height: 2000,
  mode: "regular",
});

const wood = { kind: "library", id: "wood-parquet" } as const;
const tile = { kind: "library", id: "tile-white" } as const;
const upload = { kind: "upload", id: "u1" } as const;

let store: ReturnType<typeof createAppStore>;
const s = () => store.getState();

beforeEach(() => {
  store = createAppStore();
});

/** Fill the draft so addToBatch succeeds with a photo post. */
function readyPhotoPost(photoId = "p1") {
  s().addPhotos([photo(photoId)]);
  s().setTemplate("photo");
  s().setSlotPhoto(0, photoId);
}

describe("initial state", () => {
  it("starts empty with a photo draft on the default texture", () => {
    expect(s().pool).toEqual([]);
    expect(s().batch).toEqual([]);
    expect(s().sessionTextures).toEqual([]);
    expect(s().lastUsedTexture).toBeNull();
    expect(s().editingId).toBeNull();
    expect(s().draft.template).toBe("photo");
    expect(s().draft.texture).toEqual(wood);
  });

  it("is isolated per createAppStore() call (no shared or persisted state)", () => {
    s().addPhotos([photo("p1")]);
    expect(createAppStore().getState().pool).toEqual([]);
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

  it("clears a removed photo from the draft's slots and graphic", () => {
    s().addPhotos([photo("p1")]);
    s().setSlotPhoto(0, "p1");
    s().setGraphic("p1");
    s().removePhoto("p1");
    expect(s().draft.slots[0]!.photoId).toBeNull();
    expect(s().draft.graphicId).toBeNull();
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

describe("draft editing", () => {
  it("switching template applies that template's default texture until one is chosen", () => {
    s().setTemplate("info");
    expect(s().draft.texture).toEqual(tile);
    s().setTemplate("cover");
    expect(s().draft.texture).toEqual(wood);
    s().setTexture(upload);
    s().setTemplate("info");
    expect(s().draft.texture).toEqual(upload);
  });

  it("switching template keeps photos and other compatible inputs", () => {
    s().addPhotos([photo("p1")]);
    s().setSlotPhoto(0, "p1");
    s().setGrain(true);
    s().setTemplate("multi-photo");
    expect(s().draft.slots[0]!.photoId).toBe("p1");
    expect(s().draft.grain).toBe(true);
  });

  it("clamps pan, zoom and photo count", () => {
    s().setSlotView(0, { panX: 5, panY: -5, zoom: 10 });
    expect(s().draft.slots[0]).toMatchObject({ panX: 1, panY: -1, zoom: 3 });
    s().setSlotView(0, { zoom: 0.1 });
    expect(s().draft.slots[0]!.zoom).toBe(1);
    s().resetSlotView(0);
    expect(s().draft.slots[0]).toMatchObject({ panX: 0, panY: 0, zoom: 1 });
    s().setPhotoCount(9 as 4);
    expect(s().draft.photoCount).toBe(4);
  });

  it("choosing a new photo for a slot resets that slot's view", () => {
    s().setSlotView(0, { zoom: 2 });
    s().setSlotPhoto(0, "p9");
    expect(s().draft.slots[0]).toEqual({ photoId: "p9", panX: 0, panY: 0, zoom: 1 });
  });

  it("patches info fields", () => {
    s().setInfo({ title: "Hi", eventNumber: 3 });
    expect(s().draft.info).toMatchObject({ title: "Hi", eventNumber: 3, body: "" });
  });
});

describe("batch", () => {
  it("addToBatch returns null for an incomplete draft and adds nothing", () => {
    expect(s().addToBatch()).toBeNull();
    expect(s().batch).toEqual([]);
  });

  it("addToBatch snapshots the post, names it, carries the texture over and resets the draft", () => {
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
    // draft reset: same template, texture carried over, photo and grain cleared
    expect(s().draft.template).toBe("photo");
    expect(s().draft.texture).toEqual(upload);
    expect(s().draft.slots[0]!.photoId).toBeNull();
    expect(s().draft.grain).toBe(false);
    expect(s().lastUsedTexture).toEqual(upload);
    // pool is kept
    expect(s().pool).toHaveLength(1);
  });

  it("the snapshot is independent of later draft edits", () => {
    readyPhotoPost("p1");
    s().addToBatch();
    s().setSlotPhoto(0, "p1");
    s().setSlotView(0, { zoom: 2.5 });
    expect(s().batch[0]!.post).toMatchObject({ slots: [{ zoom: 1 }] });
  });

  it("names count per template", () => {
    readyPhotoPost("p1");
    s().addToBatch();
    s().setSlotPhoto(0, "p1");
    s().addToBatch();
    s().setTemplate("cover");
    s().setSlotPhoto(0, "p1");
    s().addToBatch();
    expect(s().batch.map((b) => b.name)).toEqual(["photo-1", "photo-2", "cover-1"]);
    expect(defaultName("photo", s().batch)).toBe("photo-3");
  });

  it("after the first post, a new template uses the last-used texture, not its default", () => {
    readyPhotoPost("p1");
    s().addToBatch(); // lastUsedTexture = wood
    s().setTemplate("info");
    expect(s().draft.texture).toEqual(wood);
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
    s().setSlotPhoto(0, "p1");
    const b = s().addToBatch()!;
    s().setSlotPhoto(0, "p1");
    const c = s().addToBatch()!;
    s().moveItem(2, 0);
    expect(s().batch.map((x) => x.id)).toEqual([c, a, b]);
    s().moveItem(5, 0);
    expect(s().batch.map((x) => x.id)).toEqual([c, a, b]);
  });
});

describe("editing a batch item", () => {
  it("loadForEdit → saveEdit updates in place and resets the draft", () => {
    readyPhotoPost("p1");
    const id = s().addToBatch()!;
    s().loadForEdit(id);
    expect(s().editingId).toBe(id);
    expect(s().draft.slots[0]!.photoId).toBe("p1");
    s().setGrain(true);
    expect(s().saveEdit()).toBe(true);
    expect(s().batch).toHaveLength(1);
    expect(s().batch[0]!.post).toMatchObject({ grain: true });
    expect(s().editingId).toBeNull();
    expect(s().draft.slots[0]!.photoId).toBeNull();
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
    expect(s().batch[0]!.post).toMatchObject({ grain: false });
    expect(s().draft.slots[0]!.photoId).toBeNull();
  });

  it("removing the item being edited clears editingId", () => {
    readyPhotoPost("p1");
    const id = s().addToBatch()!;
    s().loadForEdit(id);
    s().removeItem(id);
    expect(s().editingId).toBeNull();
  });
});
