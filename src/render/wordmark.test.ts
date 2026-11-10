import { describe, expect, it } from "vitest";
import chapterSvg from "@/assets/wordmark/chapter.svg?raw";
import { parseWordmarkSvg } from "./wordmark";

describe("parseWordmarkSvg", () => {
  it("reads the box and the seven glyph paths of the chapter wordmark", () => {
    const { width, height, d } = parseWordmarkSvg(chapterSvg);
    expect(width).toBeCloseTo(700.66);
    expect(height).toBeCloseTo(304.79);
    expect(d).toHaveLength(7);
    for (const path of d) expect(path.startsWith("M")).toBe(true);
  });

  it("rejects an SVG with no paths", () => {
    expect(() => parseWordmarkSvg('<svg viewBox="0 0 1 1"></svg>')).toThrow();
  });
});
