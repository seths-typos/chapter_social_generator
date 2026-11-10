import { describe, expect, it } from "vitest";
import { grainLevels, mulberry32 } from "./grain";

describe("mulberry32", () => {
  it("gives the same sequence for the same seed, within 0..1", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("gives a different sequence for a different seed", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe("grainLevels", () => {
  it("is identical every time, so preview and export match", () => {
    expect(grainLevels(5000)).toEqual(grainLevels(5000));
  });

  it("is centred on mid-grey, which overlay leaves unchanged", () => {
    const levels = grainLevels(50_000);
    const mean = levels.reduce((sum, v) => sum + v, 0) / levels.length;
    expect(mean).toBeGreaterThan(126);
    expect(mean).toBeLessThan(130);
  });

  it("stays within the amplitude", () => {
    const levels = grainLevels(20_000, 7, 40);
    expect(Math.min(...levels)).toBeGreaterThanOrEqual(88);
    expect(Math.max(...levels)).toBeLessThanOrEqual(168);
    expect(new Set(grainLevels(100, 7, 0))).toEqual(new Set([128]));
  });
});
