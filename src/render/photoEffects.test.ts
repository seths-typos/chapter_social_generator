import { describe, expect, it } from "vitest";
import { boxRadii } from "./photoEffects";

describe("boxRadii", () => {
  it.each([1.5, 3, 3.5, 4.67, 7])("three boxes add up to a Gaussian of sigma %s", (sigma) => {
    // A box of width w has variance (w² − 1) / 12; variances add across passes.
    const variance = boxRadii(sigma).reduce((sum, r) => sum + ((2 * r + 1) ** 2 - 1) / 12, 0);
    expect(Math.sqrt(variance)).toBeCloseTo(sigma, 0);
    expect(boxRadii(sigma).every((r) => Number.isInteger(r) && r >= 0)).toBe(true);
  });
});
