import { describe, expect, it } from "vitest";
import { isOverPolaroid, polaroidCorners, toCanvasSpace, unframed } from "@/render/polaroid";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FACE_AREA_FRACTION,
  MULTI_PHOTO_LAYOUT,
  POLAROID,
  SHADOW,
} from "./constants";
import { photoCount, photoPlacements } from "./photo";
import { acceptPhotoInDraft, fromPost, newDraft, toPost } from "./registry";

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

describe("without the frame", () => {
  const corners = (count: number) =>
    photoPlacements(count).map((p) => ({
      framed: polaroidCorners(p),
      bare: polaroidCorners(unframed(p)),
    }));

  it("makes the photo as wide as the polaroid was, centred where it was", () => {
    const [{ framed, bare }] = corners(1) as [ReturnType<typeof corners>[number]];
    const width = (c: { x: number }[]) => c[1]!.x - c[0]!.x;
    const centre = (c: { x: number; y: number }[]) => ({
      x: (c[0]!.x + c[2]!.x) / 2,
      y: (c[0]!.y + c[2]!.y) / 2,
    });
    expect(width(bare)).toBeCloseTo(width(framed));
    expect(centre(bare).x).toBeCloseTo(centre(framed).x);
    expect(centre(bare).y).toBeCloseTo(centre(framed).y);
    // Same shape as the window.
    expect((bare[3]!.y - bare[0]!.y) / width(bare)).toBeCloseTo(
      POLAROID.window.h / POLAROID.window.w,
    );
  });

  it("keeps every photo and its shadow on the canvas at every count", () => {
    for (const count of [1, 2, 3, 4]) {
      for (const placement of photoPlacements(count).map(unframed)) {
        const blur = SHADOW.blur * placement.scale;
        for (const corner of polaroidCorners(placement)) {
          expect(corner.x - blur).toBeGreaterThanOrEqual(0);
          expect(corner.x + blur).toBeLessThanOrEqual(CANVAS_WIDTH);
          expect(corner.y - blur).toBeGreaterThanOrEqual(0);
          expect(corner.y + blur).toBeLessThanOrEqual(CANVAS_HEIGHT);
        }
      }
    }
  });

  it("only counts the photo itself as the position", () => {
    const [placement] = photoPlacements(1).map(unframed);
    const below = toCanvasSpace(placement!, {
      x: 424,
      y: POLAROID.window.y + POLAROID.window.h + 40,
    });
    expect(isOverPolaroid(placement!, below)).toBe(false);
    expect(isOverPolaroid({ ...placement!, frameless: undefined } as never, below)).toBe(true);
  });

  it("starts framed and round-trips through a post", () => {
    const draft = acceptPhotoInDraft(newDraft("photo"), "a");
    expect(draft).toMatchObject({ frame: true });
    const post = toPost({ ...draft, frame: false } as typeof draft)!;
    expect(post).toMatchObject({ frame: false });
    expect(fromPost(post)).toMatchObject({ frame: false });
    expect(newDraft("cover")).not.toHaveProperty("frame");
  });
});
