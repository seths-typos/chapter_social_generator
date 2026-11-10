import { describe, expect, it, vi } from "vitest";
import { REQUIRED_FONTS } from "@/app/fonts";
import { FONTS } from "@/templates/constants";
import {
  drawLines,
  fitBlock,
  fitHeadline,
  fitLine,
  fitWarnings,
  fontString,
  measureLine,
  wrapText,
  type DrawContext,
} from "./text";

const font = { family: "Test", weight: 500 };

/**
 * Fake context: every character is half the font size wide. Ascent is 0.7 × size for
 * text with capitals or digits, 0.5 × size for lowercase-only text.
 */
function fakeCtx() {
  const ctx = {
    font: "",
    textBaseline: "top" as CanvasTextBaseline,
    textAlign: "start" as CanvasTextAlign,
    fillStyle: "" as string | CanvasGradient | CanvasPattern,
    strokeStyle: "" as string | CanvasGradient | CanvasPattern,
    lineWidth: 1,
    lineJoin: "miter" as CanvasLineJoin,
    measureText(text: string) {
      const size = Number(/(\d+(?:\.\d+)?)px/.exec(ctx.font)?.[1]);
      return {
        width: text.length * size * 0.5,
        actualBoundingBoxAscent: size * (/[A-Z0-9]/.test(text) ? 0.7 : 0.5),
        actualBoundingBoxDescent: size * 0.2,
      };
    },
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
  };
  return ctx satisfies DrawContext;
}

describe("fontString", () => {
  it("builds a canvas font shorthand", () => {
    expect(fontString({ family: "Chapter Druk", weight: 700 }, 108)).toBe(
      '700 108px "Chapter Druk"',
    );
  });

  it("every template font is covered by the font loading gate", () => {
    for (const f of Object.values(FONTS)) {
      expect(REQUIRED_FONTS).toContainEqual(expect.objectContaining(f));
    }
  });
});

describe("measureLine", () => {
  it("returns width and glyph-box extents at the given size", () => {
    const ctx = fakeCtx();
    expect(measureLine(ctx, "ABCD", font, 100)).toEqual({ width: 200, ascent: 70, descent: 20 });
    expect(ctx.textBaseline).toBe("alphabetic");
  });
});

describe("wrapText", () => {
  // At size 20 a character is 10 px wide.
  it("wraps greedily at word boundaries", () => {
    expect(wrapText(fakeCtx(), "aaa bbb ccc ddd", font, 20, 70)).toEqual(["aaa bbb", "ccc ddd"]);
  });

  it("keeps a line that exactly fits", () => {
    expect(wrapText(fakeCtx(), "aaaa bbbb", font, 20, 90)).toEqual(["aaaa bbbb"]);
  });

  it("honours explicit newlines and keeps blank lines between paragraphs", () => {
    expect(wrapText(fakeCtx(), "aaa bbb\n\nccc", font, 20, 200)).toEqual(["aaa bbb", "", "ccc"]);
  });

  it("collapses repeated spaces and trims the ends", () => {
    expect(wrapText(fakeCtx(), "  aaa   bbb \r\n ccc \n\n", font, 20, 200)).toEqual([
      "aaa bbb",
      "ccc",
    ]);
  });

  it("leaves an over-long word whole on its own line", () => {
    expect(wrapText(fakeCtx(), "aa bbbbbbbbbbbb cc", font, 20, 50)).toEqual([
      "aa",
      "bbbbbbbbbbbb",
      "cc",
    ]);
  });

  it("returns no lines for blank text", () => {
    expect(wrapText(fakeCtx(), "  \n ", font, 20, 100)).toEqual([]);
  });
});

describe("fitLine", () => {
  const opts = { font, maxSize: 100, minSize: 60, maxWidth: 400 };

  it("keeps the preferred size when the text fits", () => {
    const fit = fitLine(fakeCtx(), "ABCDEFGH", opts); // 8 × 50 = 400
    expect(fit).toMatchObject({ size: 100, lines: ["ABCDEFGH"], width: 400, fits: true });
  });

  it("shrinks to the largest whole size that fits", () => {
    const fit = fitLine(fakeCtx(), "ABCDEFGHIJ", opts); // 10 chars: 400 / 5 = 80
    expect(fit).toMatchObject({ size: 80, width: 400, fits: true });
  });

  it("stops at the minimum and reports the overflow", () => {
    const fit = fitLine(fakeCtx(), "A".repeat(20), opts); // 20 × 30 = 600 at 60
    expect(fit).toMatchObject({ size: 60, width: 600, fits: false });
  });

  it("treats blank text as fitting with nothing to draw", () => {
    expect(fitLine(fakeCtx(), "   ", opts)).toMatchObject({ size: 100, lines: [], fits: true });
  });
});

describe("fitHeadline", () => {
  const opts = {
    font,
    maxSize: 100,
    minSize: 60,
    maxWidth: 400,
    maxLines: 2,
    wrappedLineHeightRatio: 0.95,
  };

  it("stays on one line while shrinking is enough", () => {
    const fit = fitHeadline(fakeCtx(), "ABCDE FGHIJ", opts); // 11 chars → 72
    expect(fit).toMatchObject({ size: 72, lines: ["ABCDE FGHIJ"], fits: true });
  });

  it("wraps to two lines at the minimum size with the wrapped line-height", () => {
    // 19 chars × 30 = 570 at 60: too wide for one line.
    const fit = fitHeadline(fakeCtx(), "AAAA BBBB CCCC DDDD", opts);
    expect(fit).toMatchObject({ size: 60, lines: ["AAAA BBBB", "CCCC DDDD"], fits: true });
    expect(fit.lineHeight).toBeCloseTo(57);
    expect(fit.height).toBeCloseTo(114);
  });

  it("balances the two lines instead of leaving a short last word", () => {
    // Greedy would give "AAAA BBBB CCC" / "DD"; balanced is more even.
    const fit = fitHeadline(fakeCtx(), "AAAA BBBB CCC DD", opts);
    expect(fit.lines).toEqual(["AAAA BBBB", "CCC DD"]);
    expect(fit.fits).toBe(true);
  });

  it("reports overflow when two lines are not enough", () => {
    const fit = fitHeadline(fakeCtx(), "AAAAAAAAAA BBBBBBBBBB CCCCCCCCCC", opts);
    expect(fit.lines).toHaveLength(3);
    expect(fit.fits).toBe(false);
  });

  it("reports overflow when a single word is too wide", () => {
    const fit = fitHeadline(fakeCtx(), "A".repeat(20), opts);
    expect(fit).toMatchObject({ size: 60, fits: false });
  });
});

describe("fitBlock", () => {
  // Line-height 1.2×. At size 20: 10 px per char, 24 px per line.
  const opts = {
    font,
    maxSize: 20,
    minSize: 16,
    maxWidth: 100,
    maxHeight: 48,
    lineHeightRatio: 1.2,
  };

  it("keeps the preferred size when the block is short enough", () => {
    const fit = fitBlock(fakeCtx(), "aaaa bbbb cccc dddd", opts);
    expect(fit).toMatchObject({ size: 20, lines: ["aaaa bbbb", "cccc dddd"], fits: true });
    expect(fit.lineHeight).toBeCloseTo(24);
    expect(fit.height).toBeCloseTo(48);
  });

  it("shrinks 1 px at a time until the block fits the height", () => {
    // 3 lines at 20 (72 px tall). At 18: 9 px per char, 11 chars per line → 2 lines, 43.2 px.
    const fit = fitBlock(fakeCtx(), "aaaa bbbbbb cccc dddd", opts);
    expect(fit.size).toBe(18);
    expect(fit.lines).toEqual(["aaaa bbbbbb", "cccc dddd"]);
    expect(fit.lineHeight).toBeCloseTo(21.6);
    expect(fit.fits).toBe(true);
  });

  it("reports overflow at the minimum size", () => {
    const fit = fitBlock(fakeCtx(), "aaaa bbbb cccc dddd eeee ffff gggg hhhh", opts);
    expect(fit.size).toBe(16);
    expect(fit.height).toBeGreaterThan(48);
    expect(fit.fits).toBe(false);
  });

  it("reports overflow when one word is wider than the block", () => {
    expect(fitBlock(fakeCtx(), "a".repeat(30), opts).fits).toBe(false);
  });

  it("handles blank text", () => {
    expect(fitBlock(fakeCtx(), "", opts)).toMatchObject({ lines: [], height: 0, fits: true });
  });
});

describe("fitWarnings", () => {
  it("is empty when the text fits", () => {
    const fit = fitLine(fakeCtx(), "AB", { font, maxSize: 100, minSize: 60, maxWidth: 400 });
    expect(fitWarnings(fit, "title", "Title too long")).toEqual([]);
  });

  it("returns a blocking warning when it does not", () => {
    const fit = fitLine(fakeCtx(), "A".repeat(40), {
      font,
      maxSize: 100,
      minSize: 60,
      maxWidth: 400,
    });
    expect(fitWarnings(fit, "title", "Title too long")).toEqual([
      { field: "title", message: "Title too long", blocking: true },
    ]);
  });
});

describe("drawLines", () => {
  const base = {
    font,
    size: 100,
    lineHeight: 95,
    x: 540,
    baseline: 511,
    align: "center" as const,
    color: "#000000",
  };

  it("draws the first line on the baseline with the font, alignment and colour set", () => {
    const ctx = fakeCtx();
    drawLines(ctx, ["TITLE"], base);
    expect(ctx.fillText).toHaveBeenCalledWith("TITLE", 540, 511);
    expect(ctx.textAlign).toBe("center");
    expect(ctx.fillStyle).toBe("#000000");
    expect(ctx.font).toBe('500 100px "Test"');
    expect(ctx.textBaseline).toBe("alphabetic");
    expect(ctx.strokeText).not.toHaveBeenCalled();
  });

  it("keeps the same baseline whatever the text's ink height", () => {
    const ctx = fakeCtx();
    drawLines(ctx, ["moon"], base);
    expect(ctx.fillText).toHaveBeenCalledWith("moon", 540, 511);
  });

  it("steps later lines by the line-height and skips blank lines", () => {
    const ctx = fakeCtx();
    drawLines(ctx, ["ONE", "", "TWO"], base);
    expect(ctx.fillText).toHaveBeenCalledTimes(2);
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, "ONE", 540, 511);
    expect(ctx.fillText).toHaveBeenNthCalledWith(2, "TWO", 540, 701);
  });

  it("outlines the glyphs when a stroke width is given", () => {
    const ctx = fakeCtx();
    drawLines(ctx, ["presents"], { ...base, strokeWidth: 0.75 });
    expect(ctx.strokeText).toHaveBeenCalledWith("presents", 540, 511);
    expect(ctx.lineWidth).toBe(0.75);
    expect(ctx.strokeStyle).toBe("#000000");
  });

  it("draws nothing for no lines and restores the context", () => {
    const ctx = fakeCtx();
    drawLines(ctx, [], base);
    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(ctx.save).not.toHaveBeenCalled();
    drawLines(ctx, ["A"], base);
    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });
});
