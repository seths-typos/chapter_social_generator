import { describe, expect, it } from "vitest";
import { polaroidCorners } from "@/render/polaroid";
import type { MeasureContext } from "@/render/text";
import type { PhotoDraft } from "@/store/draft";
import { CANVAS_HEIGHT, CANVAS_WIDTH, TEXT_CARD } from "./constants";
import { photoPlacements } from "./photo";
import {
  acceptPhotoInDraft,
  fromPost,
  losesTypedText,
  missingInputs,
  newDraft,
  toPost,
} from "./registry";
import { cardLines, condense, fitCard, textCardRect } from "./textCard";

/** Fake context: every character is half the font size wide. */
function fakeCtx(): MeasureContext {
  const ctx = {
    font: "",
    textBaseline: "top" as CanvasTextBaseline,
    measureText(text: string) {
      const size = Number(/(\d+(?:\.\d+)?)px/.exec(ctx.font)?.[1]);
      return {
        width: text.length * size * 0.5,
        actualBoundingBoxAscent: size * 0.7,
        actualBoundingBoxDescent: size * 0.2,
      };
    },
  };
  return ctx;
}

const line = (text: string) => ({ text, heading: false });
const withCard = (draft: PhotoDraft, heading: string, text: string): PhotoDraft =>
  ({ ...draft, textCard: { on: true, heading, text } }) as PhotoDraft;

describe("cardLines", () => {
  it("puts the heading first and drops blank lines", () => {
    expect(cardLines({ heading: " food and art: ", text: "Nom  Wah" })).toEqual([
      { text: "food and art:", heading: true },
      { text: "Nom Wah", heading: false },
    ]);
    expect(cardLines({ heading: "", text: "Nom Wah" })).toEqual([
      { text: "Nom Wah", heading: false },
    ]);
    expect(cardLines({ heading: " ", text: " " })).toEqual([]);
  });
});

describe("textCardRect and condense", () => {
  it("ends the card at the split line", () => {
    const r = textCardRect(0.382);
    expect(r.y).toBe(TEXT_CARD.marginTop);
    expect(r.y + r.h).toBeCloseTo(CANVAS_HEIGHT * 0.382);
  });

  it("leaves a placement alone when the card is off", () => {
    const p = { cx: 300, cy: 400, scale: 0.5, rotation: 3 };
    expect(condense(p, false)).toBe(p);
  });

  it("maps the full canvas onto the area below the split, centred", () => {
    const at = 0.382;
    const top = condense({ cx: CANVAS_WIDTH / 2, cy: 0, scale: 1, rotation: 0 }, true, at);
    const bottom = condense({ cx: 0, cy: CANVAS_HEIGHT, scale: 1, rotation: -4 }, true, at);
    expect(top).toMatchObject({ cx: CANVAS_WIDTH / 2, cy: CANVAS_HEIGHT * at, scale: 1 - at });
    expect(bottom.cy).toBeCloseTo(CANVAS_HEIGHT);
    expect(bottom.cx).toBeCloseTo((CANVAS_WIDTH / 2) * at);
    expect(bottom.rotation).toBe(-4);
  });

  it("keeps every polaroid below the card and on the canvas", () => {
    const cardBottom = textCardRect().y + textCardRect().h;
    for (const count of [1, 2, 3, 4]) {
      for (const p of photoPlacements(count, true)) {
        for (const c of polaroidCorners(p)) {
          expect(c.y).toBeGreaterThan(cardBottom);
          expect(c.y).toBeLessThan(CANVAS_HEIGHT);
          expect(c.x).toBeGreaterThan(0);
          expect(c.x).toBeLessThan(CANVAS_WIDTH);
        }
      }
    }
  });
});

describe("fitCard", () => {
  const rect = textCardRect(TEXT_CARD.split);
  const heading = { text: "food and art:", heading: true };

  it("holds the heading and the text at full size in the built-in card", () => {
    const fit = fitCard(fakeCtx(), [heading, line("Nom Wah")], rect);
    expect(fit).toMatchObject({ size: TEXT_CARD.size, fits: true });
    expect(fit.lines[0]!.size).toBeCloseTo(TEXT_CARD.size * TEXT_CARD.headingScale);
    expect(fit.lines[1]!.size).toBe(TEXT_CARD.size);
    expect(fit.lines[1]!.baseline).toBeGreaterThan(fit.lines[0]!.baseline);
  });

  it("centres a lone line on the card", () => {
    const fit = fitCard(fakeCtx(), [line("Nom Wah")], rect);
    expect(fit.lines[0]!.baseline).toBeCloseTo(
      rect.y + rect.h / 2 + TEXT_CARD.size * TEXT_CARD.baselineShiftEm,
    );
  });

  it("shrinks for a long line", () => {
    const fit = fitCard(fakeCtx(), [heading, line("x".repeat(20))], rect);
    expect(fit.fits).toBe(true);
    expect(fit.size).toBeLessThan(TEXT_CARD.size);
    expect(20 * fit.size * 0.5).toBeLessThanOrEqual(rect.w - 2 * TEXT_CARD.padding);
  });

  it("reports text that doesn't fit at the minimum size", () => {
    const fit = fitCard(fakeCtx(), [line("x".repeat(80))], rect);
    expect(fit).toMatchObject({ size: TEXT_CARD.minSize, fits: false });
  });
});

describe("text card in drafts and posts", () => {
  const filled = acceptPhotoInDraft(newDraft("photo"), "a") as PhotoDraft;

  it("is left out of the post while switched off", () => {
    expect(toPost(filled)).not.toHaveProperty("textCard");
  });

  it("needs text once switched on", () => {
    expect(missingInputs(withCard(filled, "", " "))).toEqual(["card text"]);
    expect(missingInputs(withCard(filled, "", "Nom Wah"))).toEqual([]);
  });

  it("round-trips through a post", () => {
    const post = toPost(withCard(filled, "food and art:", "Nom Wah"))!;
    expect(post).toMatchObject({ textCard: { heading: "food and art:", text: "Nom Wah" } });
    expect(fromPost(post)).toMatchObject({
      textCard: { on: true, heading: "food and art:", text: "Nom Wah" },
    });
  });

  it("warns before switching template would lose it", () => {
    const draft = withCard(filled, "", "Nom Wah");
    expect(losesTypedText(draft, "cover")).toBe(true);
    expect(losesTypedText(filled, "cover")).toBe(false);
  });
});
