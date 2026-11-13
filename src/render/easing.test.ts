import { describe, expect, it } from "vitest";
import { cubicBezier } from "./easing";

describe("cubicBezier", () => {
  it("starts at 0 and ends at 1", () => {
    const ease = cubicBezier(0.843, 0.166, 0, 1.079);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(-1)).toBe(0);
    expect(ease(2)).toBe(1);
  });

  it("is the identity for a straight line", () => {
    const linear = cubicBezier(1 / 3, 1 / 3, 2 / 3, 2 / 3);
    for (const p of [0.1, 0.25, 0.5, 0.9]) expect(linear(p)).toBeCloseTo(p, 5);
  });

  it("matches CSS ease-in-out at the midpoint", () => {
    expect(cubicBezier(0.42, 0, 0.58, 1)(0.5)).toBeCloseTo(0.5, 5);
  });

  it("can overshoot when a control point's y is past 1", () => {
    const ease = cubicBezier(0.843, 0.166, 0, 1.079);
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => ease(i / 100)));
    expect(peak).toBeGreaterThan(1);
  });
});
