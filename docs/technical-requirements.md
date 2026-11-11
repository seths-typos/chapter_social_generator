# Technical Requirements

How the Chapter Social Generator is built. Read with the [PRD](prd.md) (what it does) and the [Template Spec](template-spec.md) (exactly what it draws).

## Technical goals and constraints

| Goal / constraint | Implication |
|---|---|
| **Consistent, pixel-accurate output** is the reason the tool exists. | One deterministic renderer drives both the preview and the export. No randomness that isn't seeded. |
| **Static and client-only.** | No server, API, database or serverless functions. The build output is a static `dist/` folder. |
| **No persistence.** | All state lives in memory. No `localStorage`, `sessionStorage`, IndexedDB, cookies or service-worker caches of user content. |
| **Fonts are never silently wrong.** | Instrument Serif and Geist are bundled and self-hosted, and rendering waits for them. Druk is used from the computer when installed; when it isn't, a system fallback is used and the app says so. See [Fonts](#fonts). |
| **Simple hosting.** | Public GitHub repo, deployed to GitHub Pages. No login gate. |
| **Ad hoc maintenance.** The owner maintains it occasionally, on demand. | Prefer boring, well-known tools. Keep dependencies few, code readable, and template constants in one place. |

## Stack

| Area | Choice | Notes |
|---|---|---|
| Build | **Vite** | Static output to `dist/` |
| Language | **TypeScript** (strict) | |
| UI | **React 19** | |
| State | **Zustand** | One in-memory store: photo pool, session textures, editor draft, batch |
| Styling | **Tailwind CSS v4** | Neutral UI. Brand tokens in the theme (lavender accent `#EBCBFE`/`#CB7FF8`). |
| ZIP | **`fflate`** | `zipSync`, store-only (level 0), since PNGs are already compressed |
| HEIC | **`heic2any`** | Loaded with a dynamic `import()` only when a HEIC/HEIF file is added |
| Unit tests | **Vitest** | Pure logic only (see [Testing](#testing)) |
| Lint/format | ESLint + Prettier | |
| Runtime | Node 26 LTS, npm | Pin in `.nvmrc` and `package.json#engines` |

No other runtime dependencies without a reason recorded in `docs/decisions/`.

## Fonts

Instrument Serif and Geist are **self-hosted** in `public/fonts/` and declared with `@font-face` (`url()` sources, `font-display: block`). **Druk is never shipped with the site**: it is licensed, so it is used only when it is installed on the user's computer. Nothing is loaded from a third-party font CDN. See [decision 0005](decisions/0005-druk-local-only.md).

| Font | Use | Files | Source |
|---|---|---|---|
| **Druk** Medium (500), Bold (700) | Templates (headlines, badge, date/location); UI titles and headings | None. `local()` only. | The copy installed on the computer (Chapter's Druk license) |
| **Instrument Serif** Regular | Templates (Info body) | `instrument-serif-regular.woff2` | Google Fonts (OFL) |
| **Geist** Regular (400), Medium (500) | UI body: labels, inputs, buttons, help text | `geist-regular.woff2`, `geist-medium.woff2` | [Geist by Vercel](https://vercel.com/font) (OFL). Self-hosted, not loaded from npm or a CDN at runtime. |

```css
@font-face { font-family: "Chapter Druk"; font-weight: 500; src: local("Druk Medium"), local("Druk-Medium"); }
@font-face { font-family: "Chapter Druk"; font-weight: 700; src: local("Druk Bold"), local("Druk-Bold"); }
/* Instrument Serif and Geist use url("/fonts/…") sources */
```

- **Loading gate (bundled fonts):**
  1. Before the first render, `document.fonts.load()` Instrument Serif 400, then confirm with `document.fonts.check()`.
  2. Until that resolves, show a short loading state.
  3. If it fails to load, show an error and nothing can be rendered or exported.
- **Druk (local font):**
  1. After the gate, each Druk `FontFace` is loaded. A `local()`-only face ends as `loaded` when the font is installed and `error` when it isn't.
  2. **Installed:** templates render in Druk, identical to the designs.
  3. **Not installed:** Druk text falls back to `Impact, "Arial Narrow", sans-serif` (`DRUK_FALLBACK` in `constants.ts`, appended to every Druk font string). The shrink-to-fit rules still apply, so nothing overflows, but the post is off-brand. A notice under the header says which weights are missing and to install them and reload. Rendering and export are **not** blocked.
  4. `?nodruk` (dev builds) simulates a computer without Druk.
- **Safari:** WebKit doesn't expose user-installed fonts to web pages, so `local()` can't find Druk there and Safari always gets the fallback. On-brand posts need Chrome (or Firefox or Edge).
- **UI fallback stack:** `"Geist", system-ui, sans-serif` for body text and `"Chapter Druk", Impact, "Arial Narrow", "Geist", sans-serif` for titles. Swapping the UI body font later (e.g. to Favorit, if licensed for this use) means replacing the two files and changing one font-family token.
- **Paths:** use Vite's `import.meta.env.BASE_URL` (or relative URLs) so fonts resolve under the GitHub Pages project subpath.

### Brand marks

The `chapter` wordmark and `ch.` mark are logo artwork, stored as `src/assets/wordmark/chapter.svg` and `ch.svg`. They're extracted from the vector paths in the `.ai` files or traced from the wordmark PNGs.

## Rendering engine

### Approach

All templates are drawn with the **Canvas 2D API**. There is no HTML/DOM-to-image conversion, because Canvas gives exact control over shadow, rotation, clipping and blend modes, and it's deterministic.

```ts
// src/render/renderPost.ts
function renderPost(ctx: CanvasRenderingContext2D, post: Post, assets: RenderAssets): RenderResult;
// RenderResult = { warnings: FitWarning[] }   // e.g. title too long, used to block "Add to batch"
```

- **Pure:** output depends only on `post` and `assets` (decoded images, frame, textures, wordmark paths). No reading from the store, the DOM or the clock.
- **One code path:** the preview canvas is a real **1080×1440** canvas, scaled down with CSS (`width: 100%`). Export calls `renderPost` on a fresh, hidden 1080×1440 canvas and then `canvas.toBlob("image/png")`.
- **Template code** lives in `src/templates/{cover,photo,multiPhoto,graphic,info}.ts`, one definition per file (see [Template definitions](#template-definitions)). Every coordinate, size and color comes from `src/templates/constants.ts`, which mirrors the Template Spec one-to-one.
- **Draws from a `Draft`:** templates render the editor's `Draft`, so a half-filled post can be previewed. `renderPost` loads a stored `Post` into a draft first, so preview and export still share one code path.
- **Text smoothing:** canvas text takes its smoothing from the canvas element's CSS, and only while the element is in the document. Every canvas the renderer draws on (preview, export, thumbnails) is therefore in the document with `-webkit-font-smoothing: antialiased`; the export canvas is created hidden by `createRenderCanvas()` in `src/render/canvas.ts`. A detached canvas draws text heavier on macOS, which would make the PNG differ from the preview. Antialiased is also what matches the reference renders.
- **Re-rendering:** the preview re-renders on input change, throttled with `requestAnimationFrame`. Target: under 50 ms per render on a recent MacBook.

### Template definitions

Each template file exports one `TemplateDefinition` (`src/templates/definition.ts`), and `src/templates/registry.ts` lists them. The store, renderer and UI go through the registry, so nothing outside `src/templates/` switches on a template id. See [decision 0003](decisions/0003-template-definitions.md).

| Member | Purpose |
|---|---|
| `id`, `label`, `defaultTexture` | Identity, picker name, and the texture used until one is chosen |
| `slots` (optional) | `{ min, max }` photo slots. Present on Cover, Photo and Multi-Photo, which share their draft operations through `slotDraftOps`. |
| `newDraft`, `missingInputs`, `toPost`, `fromPost` | The template's `Draft`: create it, check it, convert it to and from a `Post` |
| `photoIds`, `clearPhoto` | Which pool photos a post uses, and removing one from a draft |
| `render` | Draws everything above the background texture and returns fit warnings |
| `Editor` (optional) | The template's own form fields. It gets its draft, an `onChange`, the photo pool and an `importImage` function as props, and never imports the store. |
| `placeholder` (optional) | Marks a template whose render is still a stand-in. The picker shows it disabled, labelled "Soon". |
| `hasTypedText` (optional) | Whether the draft holds typed text that switching template would discard. The picker asks before switching. |
| `fixture` (optional) | Fills a draft with the inputs of the reference render. Dev only: `?template={id}&fixture`, and the comparison view. |

**To add a template:**

1. Write its section in the Template Spec and add its values to `constants.ts`.
2. Add its variant to the `Post` union (`src/store/types.ts`) and the `Draft` union (`src/store/draft.ts`).
3. Create `src/templates/{name}.ts` exporting its definition.
4. Add it to `TEMPLATES` in `registry.ts`. Its position there is its position in the picker.
5. Add a reference render to `docs/reference/` if there is a design to match.

Template-specific fields are edited through the store's `editDraft(template, fn)`.

### Primitives (`src/render/`)

| Module | Responsibility |
|---|---|
| `texture.ts` | Cover-fit an image (or a solid placeholder color) to the canvas |
| `shadow.ts` | Draw the standard shadow for a rectangle: `shadowColor rgba(0,0,0,0.75)`, `shadowBlur 12`, `shadowOffsetY 6`, scaled by a factor. Draw the shape with the shadow, then draw the content on top without it. |
| `polaroid.ts` | `drawPolaroid(ctx, { placement, photo, view, frame })`. Regular mode: shadow, clip to the window, draw the photo with pan and zoom, draw `frame.png`. Placed by centre, rotation and scale (for Multi-Photo). Scan mode (Phase 3): draw the warped scan, contain-fit. |
| `fit.ts` | Pure fit math: cover/contain fit, `viewFit` (pan and zoom → draw rect), and its inverses `panByPixels` and `zoomTo`, which the preview drag, scroll and zoom slider use. Unit tested. |
| `frame.ts` | Loads `frame.png` once when the app starts. Export of a polaroid post waits for it. |
| `grain.ts` | A seeded noise field the size of the canvas (`mulberry32`, fixed seed), built once and passed in `RenderAssets.grain`. `drawGrain` composites it with `globalCompositeOperation = "overlay"` inside the photo clip, in canvas pixels. Strength is the `GRAIN` constant. |
| `photoEffects.ts` | The other parts of the film look: `drawGlow` (a blurred copy of the photo screened over it, using `ctx.filter`) and `drawFade` (saturation, multiply and screen fills inside the photo clip). Values are the `FILM_LOOK` constant, passed in `RenderAssets.effects`. |
| `text.ts` | Measuring, word-wrapping and shrink-to-fit, following the Template Spec rules. Draws text by baseline, using the baselines measured from the design files. |
| `wordmark.ts` | The `chapter` wordmark as `Path2D` vector paths read from `chapter.svg`, filled in any colour and scaled to a rectangle. |

### Visual review aid

There are no automated visual tests. Visual review is done by eye with a dev-only comparison view:

- `?compare={cover|photo|graphic|info}` renders the template from its `fixture` inputs and lays `docs/reference/{template}.png` over it.
- Controls: a reference **opacity slider**, a **Difference** toggle (the reference is blended with `mix-blend-mode: difference`, so identical pixels turn black), a zoom of Fit, 100% or 200%, and links to switch template.
- Fixture images (for example the event graphic placed in `GraphicPost.ai`) live in `docs/reference/fixtures/{name}.{png,jpg}` and are referred to by the pool-photo id `fixture-{name}`. `?template={id}&fixture` opens the normal editor with the same inputs.
- A template without a fixture renders empty. The reference backgrounds use textures that aren't in the library, so the background always differs.
- This view is only available in dev builds. It and the fixture loader are imported on demand behind `import.meta.env.DEV`, so neither they nor the reference images reach the production bundle.
- Reference PNGs are rendered once from the `.ai` files at 1080×1440 and committed. They're images of the designs, not font files.

## Image handling

| Step | Requirement |
|---|---|
| Accepted types | JPEG, PNG, WebP, HEIC/HEIF, decided by MIME type, or by extension when the browser gives no type. Anything else gets a friendly error that names the file. |
| Adding files | A multi-file picker, or files dropped anywhere on the window (which also stops the browser opening a dropped file in place of the app). Files are processed three at a time and appear in the pool in the order given. |
| HEIC | The browser decodes it if it can (Safari). Otherwise it is converted to JPEG (quality 0.92) with `heic2any`, lazy-loaded, then decoded. |
| Decode | `createImageBitmap(blob, { imageOrientation: "from-image" })` to respect EXIF rotation |
| Downscale on import | Long edge capped at **3000 px**, enough for the largest slot (848 px) with room for zoom and scan cropping. The downscaled bitmap is kept and the original file is released ([decision 0006](decisions/0006-pool-photos-keep-no-original.md)). |
| Low-resolution warning | A photo whose short edge is under 1080 px is flagged in the pool. It isn't blocked. |
| Thumbnails | A 240 px-wide WebP blob per pool photo (`PoolPhoto.thumbnail`), shown through an object URL |
| Template picker thumbnails | Drawn by the real renderer (`renderPost` on a scratch 1080×1440 canvas, scaled to 180×240), using the template's `fixture` inputs when it has them. The background is a flat mid-grey (`#808080`) rather than a texture. |
| Memory | A target of 50 photos per session without the tab crashing. Bitmaps are `.close()`d when removed. |

### Perspective crop (Polaroid scan mode)

- **UI:** four draggable corner handles over the photo, a magnifier loupe while dragging, and a live preview of the corrected result.
- **Math:** compute a 3×3 **homography** from the four source corners to an output rectangle. The output size uses the average lengths of opposite edges, capped at a 2000 px long edge. Implemented in `src/image/homography.ts` with no dependencies.
- **Warp:** a small **WebGL2** fragment shader samples the source through the inverse homography with bilinear filtering. It's in `src/image/warp.ts` and has no dependencies.
- **Caching:** the warped result is computed once when the crop is confirmed and cached as an `ImageBitmap` on the pool photo. Renders use the cached bitmap.

## Export

| Item | Requirement |
|---|---|
| PNG | `canvas.toBlob("image/png")` at 1080×1440, sRGB |
| Single download | "Download PNG" in the editor: an `<a download>` link to an object URL, named `{slugified-name}.png` (the name the post would get in the batch, e.g. `info-1.png`). Disabled until the post is complete, has no blocking fit warning, and its texture and images are loaded. |
| ZIP | `fflate.zipSync` (stored, not recompressed) → `chapter-posts-{YYYY-MM-DD}.zip` (local date) containing `{NN}-{slug}.png` (in batch order, zero-padded to at least two digits) and `captions.txt` |
| `captions.txt` | UTF-8, LF line endings. For each post: `{filename}`, a newline, the caption (trimmed), then a blank line. A post with no caption is its filename and a blank line. |
| Render at export | Each post is re-rendered from its stored `Post` data (not from cached preview pixels) |
| Clipboard | `navigator.clipboard.writeText(caption)`, with a "Copied" confirmation |
| Unload guard | A `beforeunload` handler is active while the batch isn't empty |
| Batch thumbnails | Each stored `Post` drawn by `renderPost` on the shared scratch canvas, scaled to 270×360 |
| Waiting for assets | "Download all" is disabled while any batch post's texture, image or the polaroid frame is still loading |

## Browser support

| Browser | Support |
|---|---|
| **Chrome** (current), macOS | **Primary target.** Must be fully working. |
| Edge (current) | Should work (same engine as Chrome). Not actively tested. |
| **Safari** (current), macOS | **Supported, with the fallback headline typeface.** Everything must work, but Safari can't see an installed Druk (see [Fonts](#fonts)), so on-brand posts need Chrome. |
| Firefox (current) | Should work. Not actively tested. |
| Mobile | Not a v1 target. The layout is designed for a laptop. Nothing actively prevents use on a phone, but the four-corner crop and the three-panel layout aren't optimized for it. |

The minimum required features are WebGL2, `createImageBitmap` with `imageOrientation`, `OffscreenCanvas` (optional), the async clipboard API, and `document.fonts`.

## Project structure

```
/
├─ docs/                      planning docs, decisions, reference renders
│  └─ reference/              cover.png, photo.png, graphic.png, info.png
│     └─ fixtures/            images the template fixtures use
├─ public/
│  ├─ fonts/                  instrument-serif-regular.woff2, geist-*.woff2 (Druk is not shipped)
│  └─ textures/               textures.json, *.jpg, *-thumb.jpg
├─ src/
│  ├─ app/                    App shell, layout, font-loading gate
│  ├─ components/             PhotoPool, TemplatePicker, Editor, SlotEditor,
│  │                          PerspectiveCrop, TexturePicker, BatchList, ...
│  ├─ store/                  Zustand store + types (Post, Draft, BatchItem, PoolPhoto)
│  ├─ templates/              constants.ts, definition.ts, registry.ts + one file per template
│  ├─ render/                 renderPost + primitives
│  ├─ image/                  import, heic, homography, warp
│  ├─ export/                 png, zip, captions, filenames
│  ├─ assets/                 wordmark/*.svg, polaroid/frame.png
│  └─ dev/                    compare view, fixture loader, URL params (dev only)
├─ .github/workflows/ci.yml
├─ CLAUDE.md
└─ package.json
```

## Testing

There are **unit tests only** (Vitest), and they run in CI. No automated visual tests. Template appearance is checked by visual review using the [comparison view](#visual-review-aid).

Unit tests cover the pure logic:
- Date and time formatting (`TUESDAY, MARCH 10, 6:30 PM - 9:00 PM`, no end time, noon and midnight, single-digit days)
- Filename slugging and numbering, and `captions.txt` contents
- Cover/contain math and pan/zoom clamping
- Homography: known corner sets map to the expected points
- Shrink-to-fit and wrap decisions, using a mocked `measureText`
- Multi-Photo presets: every polaroid's rotated bounds, plus shadow, stay inside the canvas

## Hosting and deployment

| Item | Choice |
|---|---|
| Repo | `seths-typos/chapter_social_generator`, **made public** before the first deploy (the free plan's GitHub Pages requires a public repo) |
| Host | **GitHub Pages** at `https://seths-typos.github.io/chapter_social_generator/` |
| Access | Public, no login. The URL isn't advertised. |
| Vite base | `base: "/chapter_social_generator/"` in `vite.config.ts`. All asset paths (fonts, textures, frame) must respect it. |
| Deploy | GitHub Actions: on push to `main`, after CI passes, build and publish `dist/` with `actions/upload-pages-artifact` and `actions/deploy-pages`. Pages source set to "GitHub Actions". |
| Domain | Default `github.io` URL for now. A custom domain (e.g. `posts.chapter.nyc`) can be added later via a `CNAME`. Changing it means updating `base` to `/`. |
| Indexing | `<meta name="robots" content="noindex">` and a `robots.txt` disallowing all, so search engines don't list the tool |

## Version control and CI

- Work happens on `main` or short-lived branches.
- **CI** (`.github/workflows/ci.yml`, runs on every PR and on pushes to branches other than `main`): `npm ci` → typecheck → lint → `vitest run` → `vite build`.
- **Deploy** (`.github/workflows/deploy.yml`): on push to `main`, runs the same checks by calling `ci.yml`, then builds and deploys to GitHub Pages. It can also be run by hand from the Actions tab.

## Out of scope (v1)

Analytics, error tracking, backend or APIs, accounts, any storage, PWA or offline support, mobile-optimized layout, and internationalization.

## Open items

| # | Item | Notes |
|---|---|---|
| 1 | Make the repo public | Before the first GitHub Pages deploy |
