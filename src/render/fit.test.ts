import { describe, expect, it } from "vitest";
import { clampView, containFit, coverFit, covers, viewFit } from "./fit";

const slot = { x: 100, y: 200, w: 400, h: 300 };

describe("coverFit", () => {
  it("fills a wider slot from a square source, centred vertically overflowing", () => {
    const r = coverFit({ w: 1000, h: 1000 }, slot);
    expect(r.w).toBeCloseTo(400);
    expect(r.h).toBeCloseTo(400);
    expect(r.x).toBeCloseTo(100);
    expect(r.y).toBeCloseTo(200 - 50);
    expect(covers(r, slot)).toBe(true);
  });

  it("fills a taller slot from a wide source, overflowing horizontally", () => {
    const r = coverFit({ w: 3000, h: 1000 }, { x: 0, y: 0, w: 300, h: 300 });
    expect(r.h).toBeCloseTo(300);
    expect(r.w).toBeCloseTo(900);
    expect(r.x).toBeCloseTo(-300);
  });
});

describe("containFit", () => {
  it("fits inside and centres", () => {
    const r = containFit({ w: 1000, h: 1000 }, slot);
    expect(r.w).toBeCloseTo(300);
    expect(r.h).toBeCloseTo(300);
    expect(r.x).toBeCloseTo(150);
    expect(r.y).toBeCloseTo(200);
  });
});

describe("clampView", () => {
  it("clamps pan to ±1 and zoom to the spec range", () => {
    expect(clampView({ panX: 4, panY: -4, zoom: 0 })).toEqual({ panX: 1, panY: -1, zoom: 1 });
    expect(clampView({ panX: 0, panY: 0, zoom: 99 }).zoom).toBe(3);
  });
});

describe("viewFit", () => {
  const src = { w: 1000, h: 1000 };

  it("at zoom 1 and no pan equals coverFit", () => {
    expect(viewFit(src, slot, { panX: 0, panY: 0, zoom: 1 })).toEqual(coverFit(src, slot));
  });

  it("zoom scales about the slot centre and still covers", () => {
    const r = viewFit(src, slot, { panX: 0, panY: 0, zoom: 2 });
    expect(r.w).toBeCloseTo(800);
    expect(r.x + r.w / 2).toBeCloseTo(slot.x + slot.w / 2);
    expect(covers(r, slot)).toBe(true);
  });

  it("pan ±1 aligns the photo edge to the slot edge, never leaving a gap", () => {
    const left = viewFit(src, slot, { panX: 1, panY: 0, zoom: 2 });
    // panX = +1 pulls the photo left so its right edge meets the slot's right edge
    expect(left.x + left.w).toBeCloseTo(slot.x + slot.w);
    const right = viewFit(src, slot, { panX: -1, panY: 0, zoom: 2 });
    expect(right.x).toBeCloseTo(slot.x);
    const down = viewFit(src, slot, { panX: 0, panY: 1, zoom: 1 });
    expect(down.y + down.h).toBeCloseTo(slot.y + slot.h);
    for (const panX of [-1, -0.3, 0, 0.7, 1]) {
      for (const zoom of [1, 1.7, 3]) {
        expect(covers(viewFit(src, slot, { panX, panY: -panX, zoom }), slot)).toBe(true);
      }
    }
  });

  it("an axis with no overflow ignores pan on that axis", () => {
    const r = viewFit({ w: 4, h: 3 }, slot, { panX: 1, panY: 1, zoom: 1 });
    expect(r).toEqual(coverFit({ w: 4, h: 3 }, slot));
  });
});
