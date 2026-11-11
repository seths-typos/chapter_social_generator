# Chapter Social Generator

Make on-brand Instagram posts for [Chapter](https://www.chapter.nyc) in the browser. Pick a template, drop in photos or text, preview the result, and download a batch of ready-to-post 1080×1440 PNGs with their captions.

**For:** Chapter's founder, making event announcement and post-event photo posts.

**Live:** https://seths-typos.github.io/chapter_social_generator/ (deployed from `main` by GitHub Actions)

## Templates

| Template | What it's for |
|---|---|
| Cover | Polaroid photo with the `chapter` wordmark |
| Photo | Post-event polaroid photo |
| Multi-Photo | 2–4 polaroids scattered on a table |
| Graphic | Upcoming event graphic on a texture |
| Info | Event details: `ch. N`, title, description, date and location |

## Stack

Vite, React, TypeScript, Tailwind CSS, Canvas 2D rendering. A static site with no backend. Hosted on GitHub Pages.

## Run locally

```sh
nvm use          # Node 26
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run build    # production build to dist/
```

## Browsers

Use **Chrome on a Mac with Druk installed** for on-brand posts. Druk is licensed, so it isn't part of this repo or the site; Chrome uses the copy installed on the computer. Safari works too, but it can't see installed fonts, so headlines fall back to a system typeface and the tool shows a notice.

## Add a texture

1. Prepare a 3:4 JPEG at **2160×2880** (sRGB, about 1.5 MB or less) and a **240×320** thumbnail.
2. Save them as `public/textures/{id}.jpg` and `public/textures/{id}-thumb.jpg`. The id is lowercase words joined by hyphens, for example `wood-dark-worn`.
3. Add an entry to `public/textures/textures.json`. Its position in the file is its position in the picker:
   ```json
   { "id": "wood-dark-worn", "name": "Dark worn wood", "file": "wood-dark-worn.jpg", "thumb": "wood-dark-worn-thumb.jpg", "width": 2160, "height": 2880 }
   ```
4. Credit the source in `public/textures/ATTRIBUTION.md` and add the id to the [Texture library](docs/template-spec.md#texture-library) table.

No code change is needed. Everything in this repo is public, so only add images you have the right to publish.

## Adjust a template

Every layout value (positions, sizes, type sizes, shadow, film look, Multi-Photo layouts) lives in [`src/templates/constants.ts`](src/templates/constants.ts) and mirrors the [Template Spec](docs/template-spec.md). To change one:

1. Change the value in the spec and in `constants.ts` together.
2. Check it by eye in the comparison view, which shows the render next to the reference: `npm run dev`, then open `/chapter_social_generator/?compare=info` (or `cover`, `photo`, `graphic`).
3. Run `npm run typecheck && npm run lint && npm test`. Layout bounds are unit-tested, so a value that pushes something off the canvas fails.

To add a template, follow the steps at the top of [`src/templates/definition.ts`](src/templates/definition.ts).

## Docs

Planning docs live in [`docs/`](docs/):
- [PRD](docs/prd.md)
- [Template Spec](docs/template-spec.md)
- [Technical Requirements](docs/technical-requirements.md)
- [Implementation Plan](docs/implementation-plan.md)
- [Decisions](docs/decisions/)
