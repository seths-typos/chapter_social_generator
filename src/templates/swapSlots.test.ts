import { describe, expect, it } from "vitest";
import { swapSlots } from "./swapSlots";

describe("swapSlots", () => {
  const slots = [
    { photoId: "a", panX: 0.2, panY: 0, zoom: 1.5 },
    { photoId: null, panX: 0, panY: 0, zoom: 1 },
    { photoId: "c", panX: 0, panY: -0.4, zoom: 2 },
  ];

  it("exchanges two slots, each keeping its own pan and zoom", () => {
    expect(swapSlots(slots, 0, 2)).toEqual([slots[2], slots[1], slots[0]]);
  });

  it("can move a photo into an empty slot", () => {
    expect(swapSlots(slots, 0, 1).map((s) => s.photoId)).toEqual([null, "a", "c"]);
  });

  it("returns an equal copy for the same or an out-of-range position", () => {
    expect(swapSlots(slots, 1, 1)).toEqual(slots);
    expect(swapSlots(slots, 0, 5)).toEqual(slots);
    expect(swapSlots(slots, 0, 2)).not.toBe(slots);
  });
});
