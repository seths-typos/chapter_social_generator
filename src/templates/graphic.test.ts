import { describe, expect, it } from "vitest";
import { GRAPHIC } from "./constants";
import { graphicRect } from "./graphic";

describe("graphicRect", () => {
  it("puts the reference graphic in the reference slot", () => {
    // The graphic in GraphicPost.ai is 958×974 and sits at (116.9, 277.6) 847×861.
    const r = graphicRect({ width: 958, height: 974 });
    expect(r.w).toBe(847);
    expect(r.h).toBeCloseTo(861.1, 1);
    expect(r.x).toBeCloseTo(116.5);
    expect(r.y).toBeCloseTo(277.4, 1);
  });

  it("keeps the aspect ratio and stays centred for a wide graphic", () => {
    const r = graphicRect({ width: 1600, height: 900 });
    expect(r.w).toBe(847);
    expect(r.w / r.h).toBeCloseTo(16 / 9);
    expect(r.x + r.w / 2).toBeCloseTo(GRAPHIC.centerX);
    expect(r.y + r.h / 2).toBeCloseTo(GRAPHIC.centerY);
  });

  it("caps a tall graphic at the maximum height and narrows it to match", () => {
    const r = graphicRect({ width: 1080, height: 1920 });
    expect(r.h).toBe(GRAPHIC.maxHeight);
    expect(r.w).toBeCloseTo(GRAPHIC.maxHeight * (1080 / 1920));
    expect(r.x + r.w / 2).toBeCloseTo(GRAPHIC.centerX);
    expect(r.y + r.h / 2).toBeCloseTo(GRAPHIC.centerY);
    expect(r.y).toBeGreaterThan(0);
    expect(r.y + r.h).toBeLessThan(1440);
  });

  it("is exactly at the limit when 847 wide gives 1240 tall", () => {
    const r = graphicRect({ width: 847, height: 1240 });
    expect(r.w).toBeCloseTo(847);
    expect(r.h).toBeCloseTo(1240);
  });
});
