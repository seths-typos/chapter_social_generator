import { describe, expect, it } from "vitest";
import type { Post } from "@/store/types";
import { CANVAS_HEIGHT, CANVAS_WIDTH, INFO_CARD, POLAROID } from "@/templates/constants";
import { newDraft } from "@/templates/registry";
import type { RenderAssets } from "./types";
import { renderPost } from "./renderPost";

/** A minimal CanvasRenderingContext2D stand-in that records fillRect calls in order. */
function fakeCtx() {
  const fills: { x: number; y: number; w: number; h: number; style: string; shadow: boolean }[] =
    [];
  const ctx = {
    fillStyle: "#000" as string,
    shadowColor: "rgba(0, 0, 0, 0)",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "low",
    save() {},
    restore() {
      this.shadowBlur = 0;
      this.shadowOffsetX = 0;
    },
    setTransform() {},
    getTransform: () => new DOMMatrixStub(),
    clearRect() {},
    drawImage() {},
    fillRect(x: number, y: number, w: number, h: number) {
      fills.push({ x, y, w, h, style: this.fillStyle, shadow: this.shadowBlur > 0 });
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, fills };
}

class DOMMatrixStub {
  translate() {
    return this;
  }
  multiply() {
    return this;
  }
}
// drawShadow uses `new DOMMatrix()`; provide it in the node test environment.
(globalThis as { DOMMatrix?: unknown }).DOMMatrix ??= DOMMatrixStub;

const tile = { kind: "library", id: "plaster-white" } as const;

/** Colour stand-ins for the two default textures, so the test has no image decoding. */
function placeholderAssets(): RenderAssets {
  return {
    textures: new Map([
      ["library:wood-dark-worn", { kind: "color", color: "#A0602E" }],
      ["library:plaster-white", { kind: "color", color: "#D9DCE0" }],
    ]),
    photos: new Map(),
  };
}

describe("renderPost", () => {
  it("paints the texture over the whole canvas first, then the template's content", () => {
    const { ctx, fills } = fakeCtx();
    const result = renderPost(ctx, newDraft("info"), placeholderAssets());
    expect(result.warnings).toEqual([]);
    expect(fills[0]).toMatchObject({
      x: 0,
      y: 0,
      w: CANVAS_WIDTH,
      h: CANVAS_HEIGHT,
      style: "#D9DCE0",
    });
    // shadow (drawn with shadowBlur on) precedes the card, which exactly covers the card rect
    const shadow = fills[1]!;
    const card = fills[2]!;
    expect(shadow.shadow).toBe(true);
    expect(card).toMatchObject({ ...INFO_CARD.rect, style: INFO_CARD.fill, shadow: false });
    expect({ x: shadow.x, y: shadow.y, w: shadow.w, h: shadow.h }).toEqual(INFO_CARD.rect);
  });

  it("uses each template's default texture colour and content rect", () => {
    const { ctx, fills } = fakeCtx();
    renderPost(ctx, newDraft("photo"), placeholderAssets());
    expect(fills[0]!.style).toBe("#A0602E");
    expect(fills.at(-1)).toMatchObject({ ...POLAROID.rect, style: POLAROID.paperColor });
  });

  it("falls back to a neutral fill for an unknown texture", () => {
    const { ctx, fills } = fakeCtx();
    const draft = { ...newDraft("photo"), texture: { kind: "upload", id: "gone" } as const };
    renderPost(ctx, draft, placeholderAssets());
    expect(fills[0]!.style).toBe("#BFBFBF");
  });

  it("draws a stored Post exactly as it draws the equivalent Draft", () => {
    const post: Post = {
      template: "info",
      eventNumber: 1,
      title: "T",
      body: "",
      date: "2026-01-01",
      startTime: "18:00",
      location: "L",
      texture: tile,
    };
    const fromPost = fakeCtx();
    const fromDraft = fakeCtx();
    renderPost(fromPost.ctx, post, placeholderAssets());
    renderPost(fromDraft.ctx, newDraft("info"), placeholderAssets());
    expect(fromPost.fills).toEqual(fromDraft.fills);
  });
});
