import { describe, expect, it } from "vitest";
import type { DraftSlot } from "@/store/draft";
import {
  selectionAfterCount,
  selectionAfterSwap,
  withSlotCount,
  withSlotPhoto,
  withSlotView,
} from "./slotEdits";

const slot = (photoId: string | null, zoom = 1): DraftSlot => ({ photoId, panX: 0, panY: 0, zoom });

describe("withSlotPhoto", () => {
  it("fills one position and leaves the others alone", () => {
    const slots = [slot("a", 2), slot(null)];
    const next = withSlotPhoto(slots, 1, "b");
    expect(next.map((s) => s.photoId)).toEqual(["a", "b"]);
    expect(next[0]).toBe(slots[0]);
  });

  it("starts the new photo centred and unzoomed", () => {
    const zoomed = { photoId: "a", panX: 0.4, panY: -0.2, zoom: 2.5 };
    expect(withSlotPhoto([zoomed], 0, "b")[0]).toEqual({ photoId: "b", panX: 0, panY: 0, zoom: 1 });
  });

  it("empties a position, and ignores one that doesn't exist", () => {
    expect(withSlotPhoto([slot("a")], 0, null)[0]!.photoId).toBeNull();
    expect(withSlotPhoto([slot("a")], 3, "b")).toEqual([slot("a")]);
  });
});

describe("withSlotCount", () => {
  it("adds empty positions and keeps the photos already placed", () => {
    const next = withSlotCount([slot("a", 2)], 4);
    expect(next.map((s) => s.photoId)).toEqual(["a", null, null, null]);
    expect(next[0]).toEqual(slot("a", 2));
  });

  it("drops the last positions, and never goes below one", () => {
    const three = [slot("a"), slot("b"), slot("c")];
    expect(withSlotCount(three, 2).map((s) => s.photoId)).toEqual(["a", "b"]);
    expect(withSlotCount(three, 0)).toHaveLength(1);
  });
});

describe("withSlotView", () => {
  it("changes only the given position's pan and zoom", () => {
    const next = withSlotView([slot("a"), slot("b")], 1, (s) => ({ zoom: s.zoom + 1, panX: 0.5 }));
    expect(next[0]).toEqual(slot("a"));
    expect(next[1]).toEqual({ photoId: "b", panX: 0.5, panY: 0, zoom: 2 });
  });
});

describe("selectionAfterCount", () => {
  it("moves off a filled position to the first empty one", () => {
    expect(selectionAfterCount([slot("a"), slot(null), slot(null)], 0)).toBe(1);
  });

  it("stays put on an empty position, or when every position is filled", () => {
    expect(selectionAfterCount([slot("a"), slot(null), slot(null)], 2)).toBe(2);
    expect(selectionAfterCount([slot("a"), slot("b")], 1)).toBe(1);
  });

  it("comes back inside the range when positions were dropped", () => {
    expect(selectionAfterCount([slot("a"), slot("b")], 3)).toBe(1);
    expect(selectionAfterCount([slot(null)], 3)).toBe(0);
  });
});

describe("selectionAfterSwap", () => {
  it("follows the selected photo to its new position", () => {
    expect(selectionAfterSwap(0, 0, 2)).toBe(2);
    expect(selectionAfterSwap(2, 0, 2)).toBe(0);
    expect(selectionAfterSwap(1, 0, 2)).toBe(1);
  });
});
