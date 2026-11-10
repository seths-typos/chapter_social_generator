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
| Photo fit | Cover-fit into the window, centered by default. Optional pan and zoom (zoom 1.0–3.0×). Pan is stored as −1..1 per axis, a fraction of the spare photo on that axis, so no stored value can expose an empty gap. Zooming keeps the part of the photo at the window's centre in place. |
| Draw order | Shadow on the full 848×1021 rect, then the photo clipped to the window, then the frame on top |
| Empty state | Before a photo is chosen the window is a flat `#C9CCD1`. It is never exported. |
| Placement | A polaroid is drawn in its own 848×1021 space and placed by a centre, a rotation and a uniform scale (`PolaroidPlacement`). Cover and Photo use centre (540, 720.5), no rotation, scale 1. The shadow's blur and offset scale with it. |

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
- **Algorithm:** one monochrome noise value per canvas pixel from a seeded generator (`mulberry32`, seed **1986**), so the preview and export match exactly. Each value is mid-grey plus or minus up to the amplitude (two random numbers averaged, so most grains are subtle). The field is blended over the photo with `overlay`, inside the photo clip, before the frame is drawn. It is drawn in canvas pixels, so the grain is the same size on every polaroid whatever its scale or rotation.
- **Values:** amplitude **127**, opacity **0.30**. *tune*: these are starting values (`GRAIN` in `src/templates/constants.ts`).

## Templates

### Cover (`cover`)

Reference: `CoverPost.ai`, `First Post@2x.png`

| Layer | Spec |
|---|---|
| Texture | Default: wood parquet |
| Polaroid | Rect **(116, 210) 848×1021**, with shadow |
| Wordmark | The `chapter` wordmark (vector, `assets/wordmark/chapter.svg`), fill **`#F4F6F9`** (light, the default and the reference) or **`#000000`** (dark, for photos too light for the wordmark to read), chosen per post, bounding box **x 190 → 890, y 481 → 786** (700×305, including the `p` descender). Not clipped to the photo window. |

**Parameters:** 1 photo slot, wordmark colour (light or dark), texture, grain.

### Photo (`photo`)

Reference: `polaroidArtboard 3@2x.png`. This is an Instagram mock-up on a different texture, so it shows the look, not the layout: the layout is Cover's.

Identical to **Cover**, without the wordmark.

**Parameters:** 1 photo slot, texture, grain.

### Multi-Photo (`multi-photo`)

New template, not in the original designs. Concept: 2–4 polaroids scattered on a table, slightly rotated and overlapping.

| Property | Value |
|---|---|
| Photo count | **2, 3, or 4**, chosen by the user |
| Polaroid | Same construction as above (each slot can be regular or scan), uniformly scaled. The shadow's blur and offset scale with it. |
| Z-order | Slot 1 at the bottom, last slot on top |
| Layout | A fixed preset per count (below). Center points are in canvas px, rotation in degrees (clockwise is positive). *tune* |

| Count | Scale | Slot 1 | Slot 2 | Slot 3 | Slot 4 |
|---|---|---|---|---|---|
| 2 | 0.60 (509×613) | (390, 470) −4° | (690, 960) +3° | — | — |
| 3 | 0.50 (424×511) | (300, 380) −5° | (760, 560) +4° | (470, 1030) −2° | — |
| 4 | 0.46 (390×470) | (290, 360) −4° | (790, 400) +3° | (300, 1050) +3° | (780, 1080) −5° |

**Acceptance:** at every count, every polaroid (including its shadow) stays fully inside the canvas, and each photo's face area (the center 60% of its window) is not covered by another polaroid. Both are unit-tested against the presets (`src/templates/multiPhoto.test.ts`), so a retuned value that breaks either fails the tests. The values above are the starting presets, unchanged after the first build.

**Editing:** changing the count keeps the photos already placed (fewer drops the last slots). A photo clicked in the pool goes to the first empty slot. Each photo is dragged and zoomed in the preview on its own; the zoom slider acts on the slot selected in the controls.

**Parameters:** photo count, 2–4 photo slots (pan and zoom per slot), texture, grain. Swapping two slots' photos is a nice-to-have.

### Graphic (`graphic`)

Reference: `GraphicPost.ai`, `graphic.png`

| Layer | Spec |
|---|---|
| Texture | Default: white tile |
| Graphic | The user's uploaded image, **keeping its own aspect ratio**. Width **847 px**, height = 847 ÷ (image aspect). Centered at **(540, 708)**, the center of the reference graphic (116.9,277.6 → 964,1138.8). |
| Max height | **1240 px**. A taller graphic is scaled to 1240 tall, keeps its aspect ratio, and stays centered horizontally. |
| Shadow | Standard shadow on the graphic's rectangle |
| Empty state | Before a graphic is chosen, a blank `#C9CCD1` card with the standard shadow fills the reference slot (117,278 → 964,1139). It is never exported. |
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
| Badge circle | Center **(148.5, 172)**, diameter **204**, fill **`#EBCBFE`**, stroke **9 px `#CB7FF8`** centred on the edge (so **213** across the outside of the stroke). Fixed colors. Overlaps the card's top-left corner. Drawn last. |
| Badge text | `ch. {N}`, Druk Bold **108**, `#000000`, centered on the circle at x 148.5, baseline y **209** |
| "chapter presents" | **Fixed.** The `chapter` wordmark (vector, black) in the box **(292.4, 217.4) 226×98.3**, followed by "presents" in Druk Bold **104**, black, left edge x **529.8**, baseline y **295.9**, outlined with a **0.75 px** black stroke (as in the design, to match the wordmark's weight). The line spans x 292 → 788. |
| Title | Druk Medium **167**, black, centered at x 540, baseline y **511**. Max width **772** (x 154 → 926). Wrapped to two lines: first baseline y **437** *tune*. |
| Rule 1 | y **589**, x 154 → 926, 1 px, `#231F20` |
| Body | Instrument Serif Regular **45**, line-height **54** (1.2×), black, **left-aligned** at x **216**, max width **648** (216 → 864). The block is vertically centered on y **818**, midway between the rules: baselines are spaced evenly around it, then moved down **0.233 em**. The reference's five lines land on baselines 720.5 → 936.5. |
| Rule 2 | y **1047**, x 154 → 926, 1 px, `#231F20` (the reference spans 150 → 932, normalized to match Rule 1) |
| Date/time line | Druk Medium **65**, black, centered at x 540, baseline y **1155**. Rendered **uppercase**. |
| Location line | Druk Medium **65**, black, centered at x 540, baseline y **1233**. Rendered as typed. |

**Text is positioned by baseline.** The values above are the baselines in `InfoPost.ai`. When text shrinks to fit, its baseline stays put. See [decision 0004](decisions/0004-text-positioned-by-baseline.md).

**Known differences from the reference render:** the reference title starts with a stray space (it sits about 8 px right of center) and its badge text sits about 5 px left of the circle's center. The template centers both.

#### Fields and overflow

| Field | Input | Rule |
|---|---|---|
| Event number | Integer 1–999 | Renders `ch. {N}` (`ch.` while empty). If it's wider than 170 px, shrink to fit (minimum 72). |
| Title | Text, 1 line by default | Shrink to fit within 772 px: 167 → minimum **120**. Still too wide at 120: wrap to 2 lines at 120 with line-height 0.95, breaking where the two lines come out most even. Still overflowing: show a "Title too long" warning and block **Add to batch**. |
| Body | Multi-line text | At 45/54: if the block is taller than **430 px** (the space between the rules minus padding), shrink in 1 px steps down to minimum **36** (line-height stays at 1.2×). Still overflowing: show a warning and block **Add to batch**. |
| Date | Date picker + start time + optional end time | Formatted automatically as `TUESDAY, MARCH 10, 6:30 PM - 9:00 PM`: full weekday, full month, no leading zeros, ` - ` between times, uppercase. With no end time the line ends after the start time. Shrink to fit 772 px down to minimum **48**. |
| Location | Text, e.g. `Anew Café & Goods, New York, NY` | Shrink to fit 772 px down to minimum **48**. Still too wide: warn and block **Add to batch**. |

**Why the date is structured:** a free-text date drifts in format from post to post, so the date is built from pickers to keep it consistent.

**Parameters:** event number, title, body, date, start time, end time, location, texture.

## Post data model

What a batch item stores. The renderer is a pure function of this data plus the loaded assets.

```ts
type PhotoMode = "regular" | "scan";

interface PoolPhoto {
  id: string;
  name: string;            // original file name, for labels
  thumbnail: Blob;         // 240 px-wide preview; the full image is a cached ImageBitmap keyed by id
  width: number;           // size of the kept bitmap, after downscaling on import
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
  | { template: "cover"; slots: [PhotoSlot]; texture: TextureRef; grain: boolean;
      wordmark: "light" | "dark" }
  | { template: "photo"; slots: [PhotoSlot]; texture: TextureRef; grain: boolean }
  | { template: "multi-photo"; slots: PhotoSlot[] /* 2–4 */; texture: TextureRef; grain: boolean }
  | { template: "graphic"; graphicId: string; texture: TextureRef }
  | { template: "info"; eventNumber: number; title: string; body: string;
      date: string /* YYYY-MM-DD */; startTime: string /* HH:mm */; endTime?: string;
      location: string; texture: TextureRef };

interface BatchItem { id: string; name: string; caption: string; post: Post; }
```

While a post is being built, the editor holds a `Draft`: the same per-template shape with required inputs allowed to be empty. It becomes a `Post` only when complete. See `src/store/draft.ts` and [decision 0001](decisions/0001-draft-per-template.md).

Adding a template means adding a variant to both unions and one definition file. The steps are in [Technical Requirements: Template definitions](technical-requirements.md#template-definitions).

## Texture library

| Property | Value |
|---|---|
| Count | **16** bundled textures (Unsplash photos supplied by the owner; see `public/textures/ATTRIBUTION.md`). The brief prefers photos of floors and tables from real events, so these can be swapped or added to later with no code change. |
| Ids | `tile-encaustic-red`, `linen-burgundy`, `chalkboard-black`, `mesh-grey`, `brick-herringbone-grey`, `concrete-stained`, `paper-crumpled-kraft`, `paper-tissue-white`, `linen-white`, `marble-white`, `paper-white`, `plaster-white`, `osb-board`, `plywood-weathered`, `wood-planks-burnt`, `wood-dark-worn` (in picker order, which is the manifest's order) |
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
| Druk Medium, Druk Bold | Not in the repo. Used from the computer via `local("Druk Medium")` / `local("Druk Bold")`. | Chapter's license; installed by each user | ✅ Done. Falls back to Impact when not installed. |
| Instrument Serif Regular | `public/fonts/instrument-serif-regular.woff2` | Google Fonts (OFL), self-hosted | ✅ Done |
| `chapter` wordmark | `src/assets/wordmark/chapter.svg` | The 7 vector glyph paths in `CoverPost.ai` (viewBox 700.66×304.79, `fill="currentColor"`) | ✅ Done |
| `ch.` mark | `src/assets/wordmark/ch.svg` | "ch." shaped in Druk Bold (matches `Secondary Wordmark (Black)@2x.png`) | ✅ Done. For the UI header and favicon |
| Polaroid frame | `src/assets/polaroid/frame.png` | Scan in `CoverPost.ai`, with the window cut out, at 1696×2042 | ✅ Done |
| Reference renders | `docs/reference/{cover,photo,graphic,info}.png` | `cover`, `graphic`, `info` rendered from the `.ai` files at 1080×1440 (stray swatch label removed from `cover`); `photo` scaled from `polaroidArtboard 3@2x.png` | ✅ Done. For visual review (dev comparison view) |
| Fixture images | `docs/reference/fixtures/{graphic.png,cover.jpg,photo.jpg}` | `graphic`: the 958×974 event graphic embedded in `GraphicPost.ai`. `cover`: the photo area of the polaroid scan embedded in `CoverPost.ai`. `photo`: the photo cropped out of `polaroidArtboard 3@2x.png`. | ✅ Done. Inputs for the fixtures (dev comparison view only) |

## Open items

| # | Item | Notes |
|---|---|---|
| 1 | Grain values | Algorithm built. Amplitude and opacity are starting values, to be tuned by eye. |
| 2 | Shadow blur and offset | Starting values above. Verify against the reference renders. |
| 3 | Multi-Photo presets | Starting positions above. Tune visually. A future "shuffle" option could add variety. |
| 4 | Textures (10, including terrazzo) | Supplied by the user during the build. Solid-color placeholders until then. |
| 5 | Dedicated blank polaroid frame scan | Optional upgrade over the frame cut from the Cover scan |
