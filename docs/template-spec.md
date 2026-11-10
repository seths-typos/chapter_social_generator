# Template Spec

This is the source of truth for how each template renders. The renderer is built from it, and changes to a template's look are made here first.

Measurements come from the Illustrator files `CoverPost.ai`, `GraphicPost.ai` and `InfoPost.ai` (artboard 1080×1440 pt, so 1 pt = 1 output px). Values marked *tune* are starting points to verify against the reference renders during the build.

## Canvas

| Property | Value |
|---|---|
| Output size | **1080×1440 px** (3:4), PNG, sRGB, no transparency |
| Coordinate system | Origin top-left, x right, y down, units in output px |
| Preview | The same renderer at the same 1080×1440 resolution, scaled down with CSS. Preview and export must be identical. |
| Render resolution | Render at exactly 1080×1440. No 2× supersampling for export. |

### Layer order (all templates)

1. Background texture
2. Drop shadow(s)
3. Content object(s): polaroid, graphic, or card
4. Grain (photo areas only, when enabled)
5. Overlays: wordmark (Cover), badge (Info)

## Shared elements

### Background texture

- **Fit:** scaled to *cover* 1080×1440, preserving aspect ratio, centered, and cropped to the canvas.
- **Source:** a bundled texture from the library (see [Texture library](#texture-library)) or a session-only upload.
- **Minimum source size:** 1080×1440. Smaller uploads are accepted with a low-resolution warning.

### Drop shadow

Every content object (polaroid, graphic, Info card) gets the same shadow. It's taken from Illustrator's rasterized shadow in `InfoPost.ai`: black, Darken blend, 75% opacity.

| Property | Value |
|---|---|
| Color | `#000000` |
| Opacity | 0.75 |
| Offset | x **0**, y **+6 px** |
| Blur | Gaussian, σ ≈ **6 px** (canvas `shadowBlur: 12`). Fades out about 14 px beyond the object's edge. *tune* |
| Shape | Same rectangle as the object, unrotated relative to it |
| Scaling | In Multi-Photo, offset and blur scale with the polaroid's scale factor |

**Acceptance:** the rendered shadow around the Info card matches `InfoPost.ai`'s shadow (rect 102,110 → 980,1342) when checked side by side in the dev comparison view.

### Polaroid

A polaroid is an **848×1021** object (about the 88×107 mm Polaroid 600 ratio). It's built one of two ways, depending on the photo's input mode.

#### Regular photo: generated frame

| Part | Value |
|---|---|
| Frame asset | `src/assets/polaroid/frame.png`: the scanned polaroid from `CoverPost.ai` with its photo window cut out (transparent), stored at 2× output size (1696×2042, ~1.1 MB). Keeps real paper texture and edges. Can be replaced later with a dedicated blank scan. |
| Frame size | 848×1021 |
| Photo window (relative to the frame) | x **60**, y **57**, w **726**, h **753** (ratio ≈ 0.964). Measured from the scan's dark photo area, rounded outward so the transparent cut covers it fully. The cut in `frame.png` is exactly this rectangle, so the photo drawn behind it must fill it exactly. |
| Photo fit | Cover-fit into the window, centered by default. Optional pan and zoom (zoom 1.0–3.0×). Panning can never expose an empty gap. |
| Draw order | Photo clipped to the window, then the frame on top |

#### Polaroid scan: user-cropped

| Part | Value |
|---|---|
| Source | The user's photo of a real polaroid, cropped with the 4-corner tool and perspective-corrected to a rectangle |
| Fit | Contain-fit inside the 848×1021 polaroid box, centered. If the scan's ratio differs (e.g. Instax), the box shrinks to the scan's shape. |
| Frame | None. The scan *is* the polaroid. |
| Shadow | Follows the scan's actual rectangle |

### Grain

- **Toggle:** off by default. One toggle per post applies to every photo in that post.
- **Applies to:** the photo window only (regular mode) or the whole scan (scan mode). It never applies to the texture, frame, card or text.
- **Algorithm and values:** TBD, *tune* during the build. Likely monochrome noise in overlay/soft-light blend with a fixed seed, so the preview and export match exactly.

## Templates

### Cover (`cover`)

Reference: `CoverPost.ai`, `First Post@2x.png`

| Layer | Spec |
|---|---|
| Texture | Default: wood parquet |
| Polaroid | Rect **(116, 210) 848×1021**, with shadow |
| Wordmark | The `chapter` wordmark (vector, `assets/wordmark/chapter.svg`), fill **`#F4F6F9`**, bounding box **x 190 → 890, y 481 → 786** (700×305, including the `p` descender). Not clipped to the photo window. |

**Parameters:** 1 photo slot, texture, grain.

### Photo (`photo`)

Reference: `polaroidArtboard 3@2x.png`

Identical to **Cover**, without the wordmark.

**Parameters:** 1 photo slot, texture, grain.

### Multi-Photo (`multi-photo`)

New template, not in the original designs. Concept: 2–4 polaroids scattered on a table, slightly rotated and overlapping.

| Property | Value |
|---|---|
| Photo count | **2, 3, or 4**, chosen by the user |
| Polaroid | Same construction as above (each slot can be regular or scan), uniformly scaled |
| Z-order | Slot 1 at the bottom, last slot on top |
| Layout | A fixed preset per count (below). Center points are in canvas px, rotation in degrees (clockwise is positive). *tune* |

| Count | Scale | Slot 1 | Slot 2 | Slot 3 | Slot 4 |
|---|---|---|---|---|---|
| 2 | 0.60 (509×613) | (390, 470) −4° | (690, 960) +3° | — | — |
| 3 | 0.50 (424×511) | (300, 380) −5° | (760, 560) +4° | (470, 1030) −2° | — |
| 4 | 0.46 (390×470) | (290, 360) −4° | (790, 400) +3° | (300, 1050) +3° | (780, 1080) −5° |

**Acceptance:** at every count, every polaroid (including its shadow) stays fully inside the canvas, and each photo's face area (the center 60% of its window) is not covered by another polaroid.

**Parameters:** photo count, 2–4 photo slots (pan and zoom per slot), texture, grain. Swapping two slots' photos is a nice-to-have.

### Graphic (`graphic`)

Reference: `GraphicPost.ai`, `graphic.png`

| Layer | Spec |
|---|---|
| Texture | Default: white tile |
| Graphic | The user's uploaded image, **keeping its own aspect ratio**. Width **847 px**, height = 847 ÷ (image aspect). Centered at **(540, 709)**, the center of the reference slot (117,278 → 964,1139). |
| Max height | **1240 px**. A taller graphic is scaled to 1240 tall, keeps its aspect ratio, and stays centered horizontally. |
| Shadow | Standard shadow on the graphic's rectangle |
| Grain | Not available (the graphic is artwork, not a photo) |

**Parameters:** graphic image (from the pool or uploaded), texture.

Note: `GraphicPost.ai` contains two hidden 1 px rules (y=333 and y=997). They aren't part of the template. Ignore them.

### Info (`info`)

Reference: `InfoPost.ai`, `text_preferred.png`

#### Layers

| Layer | Spec |
|---|---|
| Texture | Default: white tile |
| Card | Rect **(116, 120) 848×1200**, fill **`#FDFFFD`**, standard shadow |
| Badge circle | Center **(148.5, 172)**, outer diameter **205** (including stroke), fill **`#EBCBFE`**, stroke **9 px `#CB7FF8`**. Fixed colors. Overlaps the card's top-left corner. |
| Badge text | `ch. {N}`, Druk Bold **108**, `#000000`, centered in the circle (reference glyph box 82,95 → 205,232) |
| "chapter presents" | **Fixed.** The `chapter` wordmark (vector, black) followed by "presents" in Druk Bold **104**, black, on a shared baseline. The line spans x **292 → 788**, centered at x 540, cap/x-height zone around y 221–318. |
| Title | Druk Medium **167**, black, centered at x 540, top of glyph box at y **335**. Max width **772** (x 154 → 926). |
| Rule 1 | y **589**, x 154 → 926, 1 px, `#231F20` |
| Body | Instrument Serif Regular **45**, line-height **54**, black, **left-aligned** at x **216**, max width **648** (216 → 864). The block is vertically centered between the rules (reference block y 676 → 950). |
| Rule 2 | y **1047**, x 154 → 926, 1 px, `#231F20` (the reference spans 150 → 932, normalized to match Rule 1) |
| Date/time line | Druk Medium **65**, black, centered at x 540, glyph box top y **1087**. Rendered **uppercase**. |
| Location line | Druk Medium **65**, black, centered at x 540, glyph box top y **1165**. Rendered as typed. |

#### Fields and overflow

| Field | Input | Rule |
|---|---|---|
| Event number | Integer 1–999 | Renders `ch. {N}`. If it's wider than the circle's inner width (170 px), shrink to fit (minimum 72). |
| Title | Text, 1 line by default | Shrink to fit within 772 px: 167 → minimum **120**. Still too wide at 120: wrap to 2 lines at 120 with line-height 0.95, breaking where the two lines come out most even. Still overflowing: show a "Title too long" warning and block **Add to batch**. |
| Body | Multi-line text | At 45/54: if the block is taller than **430 px** (the space between the rules minus padding), shrink in 1 px steps down to minimum **36** (line-height stays at 1.2×). Still overflowing: show a warning and block **Add to batch**. |
| Date | Date picker + start time + optional end time | Formatted automatically as `TUESDAY, MARCH 10, 6:30 PM - 9:00 PM`: full weekday, full month, no leading zeros, ` - ` between times, uppercase. Shrink to fit 772 px down to minimum **48**. |
| Location | Text, e.g. `Anew Café & Goods, New York, NY` | Shrink to fit 772 px down to minimum **48**. Still too wide: warn and block **Add to batch**. |

**Why the date is structured:** a free-text date drifts in format from post to post, so the date is built from pickers to keep it consistent.

**Parameters:** event number, title, body, date, start time, end time, location, texture.

## Post data model

What a batch item stores. The renderer is a pure function of this data plus the loaded assets.

```ts
type PhotoMode = "regular" | "scan";

interface PoolPhoto {
  id: string;
  file: Blob;              // original upload (HEIC converted to JPEG on import)
  width: number;
  height: number;
  mode: PhotoMode;
  scanCorners?: [Pt, Pt, Pt, Pt]; // TL, TR, BR, BL in source px; required when mode = "scan"
}

interface PhotoSlot {
  photoId: string;
  panX: number;            // −1..1, 0 = centered
  panY: number;
  zoom: number;            // 1.0..3.0
}

interface TextureRef { kind: "library" | "upload"; id: string; }

type Post =
  | { template: "cover" | "photo"; slots: [PhotoSlot]; texture: TextureRef; grain: boolean }
  | { template: "multi-photo"; slots: PhotoSlot[] /* 2–4 */; texture: TextureRef; grain: boolean }
  | { template: "graphic"; graphicId: string; texture: TextureRef }
  | { template: "info"; eventNumber: number; title: string; body: string;
      date: string /* YYYY-MM-DD */; startTime: string /* HH:mm */; endTime?: string;
      location: string; texture: TextureRef };

interface BatchItem { id: string; name: string; caption: string; post: Post; }
```

While a post is being built, the editor holds a `Draft`: the same per-template shape with required inputs allowed to be empty. It becomes a `Post` only when complete. See `src/store/draft.ts` and [decision 0001](decisions/0001-draft-per-template.md).

## Texture library

| Property | Value |
|---|---|
| Count | **16** bundled textures (Unsplash photos supplied by the owner; see `public/textures/ATTRIBUTION.md`). The brief prefers photos of floors and tables from real events, so these can be swapped or added to later with no code change. |
| Ids | `wood-dark-worn`, `wood-planks-burnt`, `plywood-weathered`, `osb-board`, `plaster-white`, `paper-white`, `marble-white`, `linen-white`, `paper-tissue-white`, `paper-crumpled-kraft`, `concrete-stained`, `brick-herringbone-grey`, `mesh-grey`, `chalkboard-black`, `linen-burgundy`, `tile-encaustic-red` |
| Location | `public/textures/{id}.jpg` plus `public/textures/{id}-thumb.jpg` (240×320) |
| Manifest | `public/textures/textures.json`: `[{ "id": "plaster-white", "name": "White plaster", "file": "plaster-white.jpg", "thumb": "plaster-white-thumb.jpg", "width": 2160, "height": 2880 }]`. Ids are kebab-case and unique; the loader validates this. |
| Processing | Centre-cropped to 3:4, resized to **2160×2880**, converted to sRGB, progressive JPEG at quality 85, stepped down (to a floor of 70) toward 1.5 MB. Most land at 0.7–1.5 MB; two fine-grained textures (`linen-white`, `concrete-stained`) are 1.6–1.8 MB at quality 70. Thumbnails JPEG quality 80. |
| Template defaults | Cover, Photo and Multi-Photo: `wood-dark-worn`. Graphic and Info: `plaster-white`. After the first post, the last-used texture carries over within the session. (See [decision 0002](decisions/0002-texture-library-set.md).) |
| Loading | The manifest is fetched once. Each texture image is fetched and decoded the first time it's needed (the two defaults up front), then cached in memory for the session. |
| Session uploads | Decoded in the browser, added to the picker with an "Uploaded" tag, selectable like library textures. Never persisted. Below 1080×1440 a low-resolution notice is shown. |
| Colour fallback | The renderer still accepts a `{ "kind": "color" }` texture asset (used in tests and as a stand-in while an image loads). |

## Assets

| Asset | Path | Source | Status |
|---|---|---|---|
| Druk Medium, Druk Bold | `public/fonts/druk-medium.woff2`, `public/fonts/druk-bold.woff2` | Chapter's license (OTFs supplied: `Druk-Medium.otf`, `Druk-Bold.otf`) | ✅ Done |
| Instrument Serif Regular | `public/fonts/instrument-serif-regular.woff2` | Google Fonts (OFL), self-hosted | ✅ Done |
| `chapter` wordmark | `src/assets/wordmark/chapter.svg` | The 7 vector glyph paths in `CoverPost.ai` (viewBox 700.66×304.79, `fill="currentColor"`) | ✅ Done |
| `ch.` mark | `src/assets/wordmark/ch.svg` | "ch." shaped in Druk Bold (matches `Secondary Wordmark (Black)@2x.png`) | ✅ Done. For the UI header and favicon |
| Polaroid frame | `src/assets/polaroid/frame.png` | Scan in `CoverPost.ai`, with the window cut out, at 1696×2042 | ✅ Done |
| Reference renders | `docs/reference/{cover,photo,graphic,info}.png` | `cover`, `graphic`, `info` rendered from the `.ai` files at 1080×1440 (stray swatch label removed from `cover`); `photo` scaled from `polaroidArtboard 3@2x.png` | ✅ Done. For visual review (dev comparison view) |

## Open items

| # | Item | Notes |
|---|---|---|
| 1 | Grain algorithm and values | *tune* in the build |
| 2 | Shadow blur and offset | Starting values above. Verify against the reference renders. |
| 3 | Multi-Photo presets | Starting positions above. Tune visually. A future "shuffle" option could add variety. |
| 4 | Textures (10, including terrazzo) | Supplied by the user during the build. Solid-color placeholders until then. |
| 5 | Dedicated blank polaroid frame scan | Optional upgrade over the frame cut from the Cover scan |
