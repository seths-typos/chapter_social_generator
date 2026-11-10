import { describe, expect, it } from "vitest";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants";

describe("canvas constants", () => {
  it("is Instagram 3:4 portrait at 1080×1440", () => {
    expect(CANVAS_WIDTH).toBe(1080);
    expect(CANVAS_HEIGHT).toBe(1440);
    expect(CANVAS_WIDTH / CANVAS_HEIGHT).toBeCloseTo(3 / 4);
  });
});
