import { describe, expect, it } from "vitest";
import { isOverPolaroid, polaroidCorners, toCanvasSpace } from "@/render/polaroid";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FACE_AREA_FRACTION,
  MULTI_PHOTO_LAYOUT,
  POLAROID,
  SHADOW,
} from "./constants";
import { photoCount, photoPlacements } from "./photo";

const COUNTS = [2, 3, 4] as const;

describe("photoCount", () => {
  it("clamps to 1–4", () => {
    expect([0, 1, 2, 3, 4, 9].map(photoCount)).toEqual([1, 1, 2, 3, 4, 4]);
  });
});

describe("one photo", () => {
  it("is the full-size polaroid", () => {
    const r = POLAROID.rect;
    expect(photoPlacements(1)).toEqual([
      { cx: r.x + r.w / 2, cy: r.y + r.h / 2, scale: 1, rotation: 0 },
    ]);
  });
});

describe("Photo presets for two to four photos", () => {
  it("has one placement per photo, all at the preset's scale", () => {
    for (const count of COUNTS) {
      const placements = photoPlacements(count);
      expect(placements).toHaveLength(count);
      for (const p of placements) expect(p.scale).toBe(MULTI_PHOTO_LAYOUT[count].scale);
    }
  });

  it("keeps every polaroid and its shadow on the canvas", () => {
    for (const count of COUNTS) {
      for (const placement of photoPlacements(count)) {
        // The shadow spreads by its blur on every side and falls further below.
        const blur = SHADOW.blur * placement.scale;
        const drop = SHADOW.offsetY * placement.scale;
        for (const corner of polaroidCorners(placement)) {
          expect(corner.x - blur).toBeGreaterThanOrEqual(0);
          expect(corner.x + blur).toBeLessThanOrEqual(CANVAS_WIDTH);
          expect(corner.y - blur).toBeGreaterThanOrEqual(0);
          expect(corner.y + blur + drop).toBeLessThanOrEqual(CANVAS_HEIGHT);
        }
      }
    }
  });

  it("never covers the centre 60% of a photo with a polaroid above it", () => {
    const w = POLAROID.window;
    const inset = (1 - FACE_AREA_FRACTION) / 2;
    const STEPS = 12;
    for (const count of COUNTS) {
      const placements = photoPlacements(count);
      placements.forEach((placement, i) => {
        for (let a = 0; a <= STEPS; a++) {
          for (let b = 0; b <= STEPS; b++) {
            const point = toCanvasSpace(placement, {
              x: w.x + w.w * (inset + (FACE_AREA_FRACTION * a) / STEPS),
              y: w.y + w.h * (inset + (FACE_AREA_FRACTION * b) / STEPS),
            });
            for (const above of placements.slice(i + 1)) {
              expect(isOverPolaroid(above, point), `count ${count}, slot ${i + 1}`).toBe(false);
            }
          }
        }
      });
    }
  });
});
