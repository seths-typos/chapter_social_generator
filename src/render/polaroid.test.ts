import { describe, expect, it } from "vitest";
import { POLAROID } from "@/templates/constants";
import { covers } from "./fit";
import {
  deltaToPolaroidSpace,
  drawPolaroid,
  isOverWindow,
  photoRectInPolaroid,
  placementFromRect,
  toPolaroidSpace,
} from "./polaroid";

/** A fake 2D context that records the calls drawPolaroid makes. */
function recorder() {
  const calls: [string, ...unknown[]][] = [];
  const log =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push([name, ...args]);
    };
  const ctx = {
    save: log("save"),
    restore: log("restore"),
    translate: log("translate"),
    rotate: log("rotate"),
    scale: log("scale"),
    beginPath: log("beginPath"),
    rect: log("rect"),
    clip: log("clip"),
    fill: log("fill"),
    fillRect: log("fillRect"),
    drawImage: log("drawImage"),
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    getTransform: () => ({}),
    setTransform: log("setTransform"),
  };
  // drawShadow builds a DOMMatrix; a minimal stand-in is enough here.
  (globalThis as { DOMMatrix?: unknown }).DOMMatrix ??= class {
    translate() {
      return this;
    }
    multiply() {
      return this;
    }
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

const view = { panX: 0, panY: 0, zoom: 1 };
const names = (calls: [string, ...unknown[]][]) => calls.map((c) => c[0]);

describe("placementFromRect", () => {
  it("centres an unrotated, full-size polaroid on the Cover/Photo rect", () => {
    expect(placementFromRect(POLAROID.rect)).toEqual({ cx: 540, cy: 720.5, rotation: 0, scale: 1 });
  });
  it("scales with the rect's width", () => {
    expect(placementFromRect({ x: 0, y: 0, w: 424, h: 510.5 }).scale).toBe(0.5);
  });
});

describe("photoRectInPolaroid", () => {
  it("always covers the window, at any pan and zoom", () => {
    for (const photo of [
      { width: 3000, height: 2000 },
      { width: 2000, height: 3000 },
      { width: 726, height: 753 },
    ]) {
      for (const v of [view, { panX: 1, panY: -1, zoom: 1 }, { panX: -1, panY: 1, zoom: 3 }]) {
        expect(covers(photoRectInPolaroid(photo, v), POLAROID.window)).toBe(true);
      }
    }
  });
});

describe("drawPolaroid", () => {
  const placement = { cx: 540, cy: 720.5, rotation: 10, scale: 0.5 };
  const photo = { width: 3000, height: 2000 } as unknown as ImageBitmap;
  const frame = { frame: true } as unknown as CanvasImageSource;

  it("places the polaroid by centre, rotation and scale", () => {
    const { ctx, calls } = recorder();
    drawPolaroid(ctx, { placement, view });
    expect(calls.slice(1, 5)).toEqual([
      ["translate", 540, 720.5],
      ["rotate", (10 * Math.PI) / 180],
      ["scale", 0.5, 0.5],
      ["translate", -424, -510.5],
    ]);
  });

  it("draws the photo clipped to the window, then the frame over it", () => {
    const { ctx, calls } = recorder();
    drawPolaroid(ctx, { placement, view, photo, frame });
    const images = calls.filter((c) => c[0] === "drawImage");
    expect(images).toHaveLength(2);
    expect(images[0]![1]).toBe(photo);
    expect(images[1]).toEqual(["drawImage", frame, 0, 0, 848, 1021]);
    const w = POLAROID.window;
    expect(calls).toContainEqual(["rect", w.x, w.y, w.w, w.h]);
    const order = names(calls);
    expect(order.indexOf("clip")).toBeLessThan(order.indexOf("drawImage"));
  });

  it("blends grain over the photo, under the frame, and only when asked", () => {
    const grain = { grain: true } as unknown as CanvasImageSource;
    const { ctx, calls } = recorder();
    drawPolaroid(ctx, { placement, view, photo, frame, grain });
    const sources = calls.filter((c) => c[0] === "drawImage").map((c) => c[1]);
    expect(sources).toEqual([photo, grain, frame]);

    const empty = recorder();
    drawPolaroid(empty.ctx, { placement, view, frame, grain });
    expect(empty.calls.filter((c) => c[0] === "drawImage").map((c) => c[1])).toEqual([frame]);
  });

  it("fills the window grey and the paper flat when there is no photo or frame yet", () => {
    const { ctx, calls } = recorder();
    drawPolaroid(ctx, { placement, view });
    expect(names(calls)).not.toContain("drawImage");
    expect(calls).toContainEqual(["fill", "evenodd"]);
  });

  it("leaves the context balanced", () => {
    const { ctx, calls } = recorder();
    drawPolaroid(ctx, { placement, view, photo, frame });
    const n = names(calls);
    expect(n.filter((c) => c === "save").length).toBe(n.filter((c) => c === "restore").length);
  });
});

describe("pointer mapping", () => {
  const straight = placementFromRect(POLAROID.rect);

  it("maps canvas points into the polaroid's own space", () => {
    expect(toPolaroidSpace(straight, { x: 116, y: 210 })).toEqual({ x: 0, y: 0 });
    const half = { cx: 500, cy: 500, rotation: 0, scale: 0.5 };
    expect(toPolaroidSpace(half, { x: 500, y: 500 })).toEqual({ x: 424, y: 510.5 });
    expect(toPolaroidSpace(half, { x: 288, y: 244.75 })).toEqual({ x: 0, y: 0 });
  });

  it("undoes rotation and scale for a drag", () => {
    const turned = { cx: 0, cy: 0, rotation: 90, scale: 2 };
    // Dragging down the canvas moves along the +x axis of a polaroid turned 90° clockwise.
    const d = deltaToPolaroidSpace(turned, 0, 20);
    expect(d.x).toBeCloseTo(10);
    expect(d.y).toBeCloseTo(0);
  });

  it("knows when a point is over the photo window", () => {
    expect(isOverWindow(straight, { x: 540, y: 600 })).toBe(true);
    expect(isOverWindow(straight, { x: 540, y: 1150 })).toBe(false); // the wide bottom border
    expect(isOverWindow(straight, { x: 50, y: 600 })).toBe(false);
  });
});
