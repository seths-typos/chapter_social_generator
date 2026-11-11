/**
 * The glow and fade parts of the film look (grain is in `grain.ts`). The values are
 * `FILM_LOOK`.
 * docs/template-spec.md#film-look
 */

export interface PhotoEffects {
  /** Soft glow: blur radius of the glow layer in px, for a full-size polaroid. */
  glowRadius: number;
  /** Soft glow: how strongly the blurred copy is screened over the photo, 0–1. */
  glowStrength: number;
  /** Faded film: how far blacks are lifted toward grey, 0–1 (0.2 = a clear fade). */
  fadeLift: number;
  /** Faded film: how much the whites are pulled down, 0–1. */
  fadeHighlights: number;
  /** Faded film: how much colour is taken out, 0–1 (1 = black and white). */
  fadeDesaturate: number;
}

const grey = (level: number): string => {
  const v = Math.round(255 * Math.min(1, Math.max(0, level)));
  return `rgb(${v}, ${v}, ${v})`;
};

/**
 * Soft glow: the photo drawn again, blurred, and screened over itself, so bright areas
 * bloom. `draw` must draw the photo onto the context it is given exactly as it was first
 * drawn. `scale` is the polaroid's. Uses the canvas blur filter where it exists (Chrome,
 * Firefox) and `blurredCopy` where it doesn't (Safari).
 */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  effects: PhotoEffects,
  scale: number,
  draw: (target: CanvasRenderingContext2D) => void,
): void {
  if (effects.glowStrength <= 0 || effects.glowRadius <= 0) return;
  // The blur is in canvas px, so it is scaled to keep the same look on a smaller polaroid.
  const sigma = effects.glowRadius * scale;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = Math.min(1, effects.glowStrength);
  // Typed as always present, but Safari has no canvas filters.
  const hasFilter = "filter" in (ctx as object);
  if (hasFilter) {
    ctx.filter = `blur(${sigma}px)`;
    draw(ctx);
  } else {
    const copy = blurredCopy(ctx, sigma, draw);
    if (copy) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(copy, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }
  ctx.restore();
}

/** The blur is done on a copy this many times smaller than its standard deviation allows. */
const BLUR_WORKING_SIGMA = 3;

/**
 * For browsers without canvas filters: the photo drawn on a small copy of the canvas and
 * blurred there with three box blurs (close to a Gaussian of standard deviation `sigma`
 * canvas px). The caller draws the copy back at full size.
 */
function blurredCopy(
  ctx: CanvasRenderingContext2D,
  sigma: number,
  draw: (target: CanvasRenderingContext2D) => void,
): HTMLCanvasElement | undefined {
  const shrink = Math.max(1, Math.floor(sigma / BLUR_WORKING_SIGMA));
  const w = Math.ceil(ctx.canvas.width / shrink);
  const h = Math.ceil(ctx.canvas.height / shrink);
  const copy = document.createElement("canvas");
  copy.width = w;
  copy.height = h;
  const small = copy.getContext("2d");
  if (!small) return undefined;
  small.setTransform(new DOMMatrix().scale(1 / shrink, 1 / shrink).multiply(ctx.getTransform()));
  draw(small);

  const image = small.getImageData(0, 0, w, h);
  const data = image.data;
  // Blur with alpha premultiplied, so transparent pixels don't darken the photo's edge.
  const a = new Float32Array(data.length);
  const b = new Float32Array(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]! / 255;
    a[i] = data[i]! * alpha;
    a[i + 1] = data[i + 1]! * alpha;
    a[i + 2] = data[i + 2]! * alpha;
    a[i + 3] = data[i + 3]!;
  }
  for (const radius of boxRadii(sigma / shrink)) {
    boxBlur(a, b, w, h, radius, true);
    boxBlur(b, a, w, h, radius, false);
  }
  for (let i = 0; i < data.length; i += 4) {
    const alpha = a[i + 3]! / 255;
    data[i] = alpha > 0 ? a[i]! / alpha : 0;
    data[i + 1] = alpha > 0 ? a[i + 1]! / alpha : 0;
    data[i + 2] = alpha > 0 ? a[i + 2]! / alpha : 0;
    data[i + 3] = a[i + 3]!;
  }
  small.putImageData(image, 0, 0);
  return copy;
}

/** Radii of three box blurs that together approximate a Gaussian of the given sigma. */
export function boxRadii(sigma: number): [number, number, number] {
  const ideal = Math.sqrt((12 * sigma * sigma) / 3 + 1);
  let lower = Math.floor(ideal);
  if (lower % 2 === 0) lower--;
  const lowerCount = Math.round(
    (12 * sigma * sigma - 3 * lower * lower - 12 * lower - 9) / (-4 * lower - 4),
  );
  const radius = (i: number) => ((i < lowerCount ? lower : lower + 2) - 1) / 2;
  return [radius(0), radius(1), radius(2)];
}

/** One box blur pass over RGBA floats, along rows or columns. Edges see transparency. */
function boxBlur(
  src: Float32Array,
  dst: Float32Array,
  w: number,
  h: number,
  radius: number,
  horizontal: boolean,
): void {
  const lines = horizontal ? h : w;
  const length = horizontal ? w : h;
  const step = (horizontal ? 1 : w) * 4;
  const size = radius * 2 + 1;
  for (let line = 0; line < lines; line++) {
    const start = (horizontal ? line * w : line) * 4;
    for (let c = 0; c < 4; c++) {
      let sum = 0;
      for (let i = 0; i <= radius && i < length; i++) sum += src[start + i * step + c]!;
      for (let i = 0; i < length; i++) {
        dst[start + i * step + c] = sum / size;
        const enter = i + radius + 1;
        const leave = i - radius;
        if (enter < length) sum += src[start + enter * step + c]!;
        if (leave >= 0) sum -= src[start + leave * step + c]!;
      }
    }
  }
}

/**
 * Faded film over whatever the current clip allows: blacks lifted (screen with a dark
 * grey), whites pulled down (multiply with a light grey), colour muted.
 */
export function drawFade(
  ctx: CanvasRenderingContext2D,
  effects: PhotoEffects,
  width: number,
  height: number,
): void {
  const fill = (operation: GlobalCompositeOperation, color: string, alpha = 1) => {
    ctx.globalCompositeOperation = operation;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  };
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (effects.fadeDesaturate > 0)
    fill("saturation", grey(0.5), Math.min(1, effects.fadeDesaturate));
  if (effects.fadeHighlights > 0) fill("multiply", grey(1 - effects.fadeHighlights));
  if (effects.fadeLift > 0) fill("screen", grey(effects.fadeLift));
  ctx.restore();
}
