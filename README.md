# Chapter Social Generator

Make on-brand Instagram posts for [Chapter](https://www.chapter.nyc) in the browser. Pick a template, drop in photos or text, preview the result, and download a batch of ready-to-post 1080×1440 PNGs with their captions.

**For:** Chapter's founder, making event announcement and post-event photo posts.

**Live:** https://seths-typos.github.io/chapter_social_generator/ *(available after the first deploy)*

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

## Docs

Planning docs live in [`docs/`](docs/):
- [PRD](docs/prd.md)
- [Template Spec](docs/template-spec.md)
- [Technical Requirements](docs/technical-requirements.md)
- [Implementation Plan](docs/implementation-plan.md)
- [Decisions](docs/decisions/)
