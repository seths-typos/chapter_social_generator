# Implementation Plan

The build order for the Chapter Social Generator. **Claude Code** builds it one task (GitHub issue) at a time, and the owner then does a UX/UI pass. Timeline: as soon as possible, with no fixed deadline.

Backlog: each phase is a [GitHub milestone](https://github.com/seths-typos/chapter_social_generator/milestones) and each task is an issue (numbers in parentheses below).

Related docs: [PRD](prd.md) · [Template Spec](template-spec.md) · [Technical Requirements](technical-requirements.md)

## Build principles

- **One task = one issue = one PR-sized change.** Each task below can be finished in a single Claude Code session. Reference the issue in the commit or PR (`Closes #N`).
- **Read before building.** Each task links to the doc sections it implements. Those sections are the spec, and where they're specific, they override intuition.
- **Every phase ends in something working and deployed.** `main` always builds, and GitHub Pages always shows the latest working version.
- **Template work is checked visually** in the dev comparison view (`?compare=`) against `docs/reference/*.png` before the task is closed.
- **Constants, not magic numbers.** Every layout value lives in `src/templates/constants.ts`, mirroring the Template Spec.
- **Keep docs in sync.** If a task changes a decision (layout values, behavior, stack), update the affected doc and add a record to `docs/decisions/` in the same change.

## Milestones at a glance

| Phase | Milestone | Release point |
|---|---|---|
| 0 | Foundation | Empty app deployed to GitHub Pages |
| 1 | Render core + Info & Graphic | Upcoming-event posts can be made one at a time |
| 2 | Photo templates | **Founder check-in #1 (#19):** first photo posts |
| 3 | Polaroid scan crop | |
| 4 | Batch & export | **MVP:** founder tests real use (everything except Multi-Photo) |
| 5 | Multi-Photo | |
| 6 | Polish & handoff | **Founder check-in #2**, then v1 done |

---

## Phase 0: Foundation

**Goal:** a deployed, empty app with the toolchain, fonts and dev comparison view in place, so later phases only add features.

| # | Task | Acceptance criteria | Spec |
|---|---|---|---|
| 0.1 | **Scaffold the project** (#1) | Vite, React 19, TypeScript (strict), Tailwind v4, Zustand, ESLint and Prettier. `npm run dev`, `build`, `lint`, `typecheck` and `test` all work. `.nvmrc` pins Node 26. The folder structure matches the Tech Reqs. | [Stack](technical-requirements.md#stack), [Project structure](technical-requirements.md#project-structure) |
| 0.2 | **Fonts and loading gate** (#2) | Druk Medium/Bold converted to WOFF2. Instrument Serif and Geist downloaded. All in `public/fonts/`, declared with `@font-face`. The app shows a loading state until `document.fonts` confirms Druk 500/700 and Instrument Serif 400, and shows an error if any fail. The UI uses Druk for titles and Geist for body text. | [Fonts](technical-requirements.md#fonts) |
| 0.3 | **CI and GitHub Pages deploy** (#3) | Repo made public. `ci.yml` (typecheck, lint, test, build) runs on push and PR. `deploy.yml` deploys `main` to `https://seths-typos.github.io/chapter_social_generator/`. Vite `base` is set. Fonts load on the deployed site. `noindex` meta tag and `robots.txt` are in place. | [Hosting and deployment](technical-requirements.md#hosting-and-deployment), [Version control and CI](technical-requirements.md#version-control-and-ci) |
| 0.4 | **Reference renders and brand assets** (#4) | `docs/reference/{cover,photo,graphic,info}.png` at 1080×1440 (rendered from the `.ai` files; `photo` from `polaroidArtboard 3@2x.png`, scaled). `chapter.svg` and `ch.svg` extracted to `src/assets/wordmark/`. `frame.png` made from the Cover scan with the photo window (60, 59, 725×748) cut out to transparent. | [Assets](template-spec.md#assets), [Polaroid](template-spec.md#polaroid) |
| 0.5 | **App shell layout** (#5) | The three-region layout (photo pool, preview and controls, batch) with placeholder panels, the `ch.` mark in the header, and the favicon. Neutral styling. | [App flow](prd.md#app-flow), [Generator UI notes](prd.md#generator-ui-notes) |

**Definition of done:** the deployed URL shows the app shell in the right fonts, CI is green, and the reference renders and assets are committed.

---

## Phase 1: Render core + Info & Graphic

**Goal:** the shared rendering pipeline is in place and proven on the two templates that don't need the photo pool. He could make upcoming-event posts one at a time.

| # | Task | Acceptance criteria | Spec |
|---|---|---|---|
| 1.1 | **Data model and store** (#6) | `Post`, `BatchItem`, `PoolPhoto` and `TextureRef` types exactly as in the spec. A Zustand store with an editor draft, plus slices for the session textures, pool and batch. Nothing persists. | [Post data model](template-spec.md#post-data-model) |
| 1.2 | **Render core and primitives** (#7) | `renderPost(ctx, post, assets)`, plus `texture.ts` (cover-fit and solid-color placeholders), `shadow.ts`, `fit.ts` and `constants.ts`. A 1080×1440 preview canvas scaled with CSS, re-rendering throttled with `requestAnimationFrame`. | [Rendering engine](technical-requirements.md#rendering-engine), [Drop shadow](template-spec.md#drop-shadow), [Background texture](template-spec.md#background-texture) |
| 1.3 | **Texture library and picker** (#8) | `public/textures/textures.json` with the placeholder entries (`wood-parquet` `#A0602E`, `tile-white` `#D9DCE0`). A picker with thumbnails or swatches. Session-only texture upload. Per-template defaults, and the last-used texture carries over. | [Texture library](template-spec.md#texture-library) |
| 1.4 | **Text engine** (#9) | `text.ts`: measure, word-wrap, shrink-to-fit with minimum sizes, glyph-box-top positioning, and a `FitWarning` output. Unit tests with a mocked `measureText`. | [Info: fields and overflow](template-spec.md#fields-and-overflow) |
| 1.5 | **Info template** (#10) | Card, badge, "chapter presents" lockup, title, rules, body, date and location, all per spec. Form fields: event number, title, body, date picker, start and end time, location. Date formatting has unit tests. Overflow warnings block Add. Matches `docs/reference/info.png` in the comparison view. | [Info](template-spec.md#info-info) |
| 1.6 | **Graphic template** (#11) | Upload a graphic. 847px wide, keeps its aspect ratio, centered at (540, 709), max height 1240, with shadow. Matches `docs/reference/graphic.png`. | [Graphic](template-spec.md#graphic-graphic) |
| 1.7 | **Template picker and single PNG download** (#12) | Thumbnail picker for the templates built so far. A "Download PNG" button re-renders on a fresh canvas and saves a 1080×1440 PNG. | [Template selection](prd.md#template-selection-and-editing), [Export](technical-requirements.md#export) |
| 1.8 | **Dev comparison view** (#13) | `?compare={template}` (dev builds only) renders fixture inputs over the reference PNG, with an opacity slider and a difference-blend toggle. | [Visual review aid](technical-requirements.md#visual-review-aid) |

**Definition of done:** Info and Graphic posts can be made and downloaded from the deployed site. Both match their references by eye in the comparison view. Text overflow is handled per spec.

---

## Phase 2: Photo templates

**Goal:** the session photo pool and the regular-photo polaroid, used in Cover and Photo.

| # | Task | Acceptance criteria | Spec |
|---|---|---|---|
| 2.1 | **Photo import** (#14) | Multi-file picker and drag-and-drop. JPEG, PNG, WebP, plus HEIC through a lazy-loaded `heic2any`. EXIF orientation is respected. Downscaled to a 3000px long edge. A low-resolution warning under 1080px on the short edge. Friendly errors. 20 photos import in a few seconds. | [Image handling](technical-requirements.md#image-handling) |
| 2.2 | **Photo pool panel** (#15) | Thumbnails, a used marker and count, remove (with confirmation if the photo is in use), and a mode toggle (Regular / Polaroid scan; the scan option is disabled until Phase 3). | [Session photo pool](prd.md#session-photo-pool) |
| 2.3 | **Polaroid primitive (regular mode)** (#16) | `polaroid.ts`: photo cover-fit into the window (60, 59, 725×748), then the frame drawn on top, with shadow. Supports a translate/rotate/scale transform (for Multi-Photo later). | [Polaroid](template-spec.md#polaroid) |
| 2.4 | **Cover and Photo templates** (#17) | Polaroid at (116, 210) 848×1021. Cover adds the wordmark (`#F4F6F9`, x 190→890, y 481→786). Photo slots are filled from the pool. Both match their references. | [Cover](template-spec.md#cover-cover), [Photo](template-spec.md#photo-photo) |
| 2.5 | **Pan and zoom** (#18) | Drag to pan, plus a zoom slider (1–3×) and scroll to zoom. Clamped so no gap shows. Reset button. Clamping has unit tests. | [Template selection](prd.md#template-selection-and-editing) |

**Definition of done:** Cover and Photo posts made from pool photos, including HEIC from an iPhone, download correctly and match their references.

**Founder check-in #1:** share the URL and ask him to make a Cover, Photo, Info and Graphic post. Collect feedback as issues.

---

## Phase 3: Polaroid scan crop

**Goal:** photos of real polaroids can be cropped and straightened, then used in place of the generated frame.

| # | Task | Acceptance criteria | Spec |
|---|---|---|---|
| 3.1 | **Homography and WebGL2 warp** (#20) | `homography.ts` (3×3 solve, unit tested on known corner sets) and `warp.ts` (WebGL2 bilinear warp to a rectangle sized from the averaged edge lengths, capped at a 2000px long edge). | [Perspective crop](technical-requirements.md#perspective-crop-polaroid-scan-mode) |
| 3.2 | **Four-corner crop UI** (#21) | A modal with four draggable handles, a loupe while dragging, a live corrected preview, and confirm/cancel. The result is cached as an `ImageBitmap` on the pool photo. The corners can be edited again later. | [Photo input modes](prd.md#photo-input-modes) |
| 3.3 | **Scan mode in templates** (#22) | A scan-mode photo renders contain-fit in the 848×1021 polaroid box, with no generated frame and the shadow on its actual rectangle. Works in Cover and Photo. | [Polaroid scan: user-cropped](template-spec.md#polaroid-scan-user-cropped) |

**Definition of done:** a phone photo of a real polaroid, taken at an angle, comes out straight and clean in a Photo post.

---

## Phase 4: Batch & export (MVP)

**Goal:** the full session workflow: build many posts, then download them all.

| # | Task | Acceptance criteria | Spec |
|---|---|---|---|
| 4.1 | **Batch list** (#23) | "Add to batch" snapshots the post, then resets the editor while keeping the pool and texture. The list shows a thumbnail (rendered at 270×360), template type, name and caption. Edit loads a post back into the editor, and saving updates it in place. Duplicate, remove (with confirmation), and drag to reorder. | [Batch list and export](prd.md#batch-list-and-export) |
| 4.2 | **Names, captions and copy** (#24) | Editable name, defaulting to `{template}-{n}`. Multi-line caption field. A Copy button using the clipboard API, with "Copied" feedback. | [Batch list and export](prd.md#batch-list-and-export) |
| 4.3 | **ZIP export** (#25) | "Download all" produces `chapter-posts-{YYYY-MM-DD}.zip` with `{NN}-{slug}.png` (re-rendered from `Post` data) and `captions.txt`. Single-item download too. Filename and caption formatting have unit tests. | [Export](technical-requirements.md#export) |
| 4.4 | **Leave-page guard** (#26) | A `beforeunload` prompt while the batch isn't empty. | [Batch list and export](prd.md#batch-list-and-export) |

**Definition of done:** a mixed batch of 5 posts can be made and downloaded as one ZIP in under 10 minutes. Files are numbered in order and the captions are correct.

**MVP test (#27):** the founder uses it for a real event's posts. Feedback is logged as issues and triaged into Phase 6.

---

## Phase 5: Multi-Photo

**Goal:** 2–4 polaroids scattered in one post.

| # | Task | Acceptance criteria | Spec |
|---|---|---|---|
| 5.1 | **Multi-Photo template** (#28) | A photo count selector (2/3/4), with slots filled from the pool. Uses the layout presets (scale, center, rotation) from the spec. Z-order is slot 1 at the bottom. Shadow scales with the polaroid. Mixed regular and scan slots work. Per-slot pan and zoom. | [Multi-Photo](template-spec.md#multi-photo-multi-photo) |
| 5.2 | **Preset bounds tests and tuning** (#29) | Unit tests prove every rotated polaroid plus its shadow stays on the canvas, for each count. Presets are tuned by eye. Any changed values are written back to the Template Spec. | [Multi-Photo](template-spec.md#multi-photo-multi-photo) |

**Definition of done:** 2-, 3- and 4-photo posts look intentional and on-brand, with no clipping and no faces covered.

---

## Phase 6: Polish & handoff

**Goal:** final visual fidelity, real textures, the owner's UX/UI pass, and the founder's sign-off.

| # | Task | Acceptance criteria | Spec |
|---|---|---|---|
| 6.1 | **Grain** (#30) | `grain.ts` with seeded noise in overlay blend, applied to the photo area only. Strength tuned by eye with the owner. Values recorded in the Template Spec. | [Grain](template-spec.md#grain) |
| 6.2 | **Shadow fine-tune** (#31) | Blur, offset and opacity confirmed against all references in the comparison view. Final values recorded in the Template Spec. | [Drop shadow](template-spec.md#drop-shadow) |
| 6.3 | **Real texture library** (#32) | 10 textures supplied by the owner, processed (JPEG, around 85 quality, under 1.5 MB, plus 240×320 thumbnails) and added to the manifest. Placeholders removed. Template defaults point to real textures. | [Texture library](template-spec.md#texture-library) |
| 6.4 | **UX/UI pass (owner)** (#33) | The owner reviews and restyles the tool UI. Claude Code implements the resulting issues. | [Generator UI notes](prd.md#generator-ui-notes) |
| 6.5 | **MVP feedback fixes** (#34) | All issues from the MVP test are triaged and the v1 ones are fixed. | — |
| 6.6 | **Cross-browser check and README** (#35) | Full flow verified in current Chrome and Safari on macOS. The README covers what the tool is, the URL, how to run it locally, how to add a texture, and how to adjust template constants. | [Browser support](technical-requirements.md#browser-support) |

**Definition of done:** the founder makes a real batch without help and signs off. All PRD success criteria are met.

---

## Dependencies on the owner

| Needed | By | Notes |
|---|---|---|
| Druk Medium/Bold OTFs | Phase 0 | ✅ Supplied (`~/Downloads/Druk`) |
| `.ai` template files and reference PNGs | Phase 0 | ✅ Supplied |
| Founder availability for check-in #1 | End of Phase 2 | |
| Founder availability for the MVP test (a real event) | End of Phase 4 | |
| 10 texture images (including terrazzo) | Phase 6 | At least 1080×1440, ideally 2160×2880 |
| UX/UI pass | Phase 6 | |

## Risks

| Risk | Mitigation |
|---|---|
| Canvas text positioning drifts from Illustrator's | Position by glyph box (`actualBoundingBoxAscent`) and check every text template in the comparison view before closing the task |
| Shadow or grain differ between Chrome and Safari | Check both browsers in 6.2 and 6.6. If they differ noticeably, pre-render the shadow as a blurred bitmap instead of using canvas `shadowBlur`. |
| The frame cut from the Cover scan looks off with some photos | Swap in a dedicated blank polaroid scan later (Template Spec open item) |
| HEIC conversion is slow for big batches | Convert one at a time with a per-photo spinner. `heic2any` only loads when a HEIC file is added. |
| Memory pressure with many large photos | Downscale on import to a 3000px long edge, and close bitmaps when photos are removed |
