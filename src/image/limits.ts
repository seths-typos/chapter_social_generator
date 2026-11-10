/** Image import limits. docs/technical-requirements.md#image-handling */

/** Photos are downscaled on import so their long edge is at most this many px. */
export const MAX_LONG_EDGE = 3000;
/** A photo whose short edge is under this is flagged as low resolution (not blocked). */
export const LOW_RES_SHORT_EDGE = 1080;
/** Width of the pool thumbnail, in px. */
export const THUMBNAIL_WIDTH = 240;
/** JPEG quality for HEIC conversion. */
export const HEIC_JPEG_QUALITY = 0.92;
/** How many files are decoded at once during a multi-file import. */
export const IMPORT_CONCURRENCY = 3;
/** `accept` for photo file inputs. Extensions are listed because HEIC files often have no MIME type. */
export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
