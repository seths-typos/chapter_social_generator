/**
 * CSS-style cubic-bezier easing, for animating the preview's layout on the canvas.
 * The curve runs from (0,0) to (1,1) with control points (x1,y1) and (x2,y2); y may leave
 * 0–1, which gives an overshoot.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (progress: number): number => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    // x(t) is monotonic for control points in 0–1, so bisect for the t at this progress.
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (at(x1, x2, mid) < progress) lo = mid;
      else hi = mid;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}
