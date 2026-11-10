/**
 * Canvas and layout constants. Every value here mirrors docs/template-spec.md.
 * Change the spec and this file together.
 */

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1440;

/** Multi-Photo template: how many polaroids a post may hold. */
export const MULTI_PHOTO_MIN = 2;
export const MULTI_PHOTO_MAX = 4;
export type MultiPhotoCount = 2 | 3 | 4;

/** Photo slot pan/zoom limits. See docs/template-spec.md#polaroid */
export const ZOOM_MIN = 1.0;
export const ZOOM_MAX = 3.0;
