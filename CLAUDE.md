# Chapter Social Generator

A static, browser-only tool that turns photos and text into on-brand Instagram grid posts (1080×1440 PNG) for [Chapter](https://www.chapter.nyc), a NYC social club. The founder picks a template (Cover, Photo, Multi-Photo, Graphic, Info), fills it from a session photo pool, previews it, adds it to a batch, and downloads a ZIP of PNGs plus captions. There's no backend, no accounts and no persistence. The point of the tool is **consistent output**: shadow, texture, polaroid frame and type are locked in code.

## Stack

Vite · React 19 · TypeScript (strict) · Tailwind v4 · Zustand (in-memory only) · Canvas 2D rendering · `fflate` (ZIP) · `heic2any` (lazy-loaded) · Vitest · GitHub Pages via GitHub Actions.

## Key conventions

- **One renderer:** `renderPost(ctx, post, assets)` is pure and drives both the preview and the export at 1080×1440.
- **One definition per template:** each file in `src/templates/` exports a `TemplateDefinition`, listed in `registry.ts`. Nothing outside `src/templates/` switches on a template id. To add a template, follow the steps at the top of `src/templates/definition.ts`.
- **No magic numbers:** every layout value lives in `src/templates/constants.ts` and mirrors `docs/template-spec.md`. Change the spec and the constants together.
- **No persistence:** no `localStorage`, `sessionStorage`, IndexedDB or cookies.
- **Fonts:** Instrument Serif (Info body) and Geist (UI body) are self-hosted in `public/fonts/`. **Druk is licensed and must never be committed or served**: it is used via `local()` when installed, with a system fallback and a notice when it isn't. Never render before the bundled fonts are confirmed loaded.
- **Asset paths must respect Vite `base`** (`/chapter_social_generator/`).
- **Template changes are checked by eye** in the dev comparison view (`?compare={template}`) against `docs/reference/*.png`. There are no automated visual tests.
- Unit tests cover pure logic only (formatting, fit math, homography, layout bounds).

## Docs

- @docs/prd.md: what it does, features, acceptance criteria
- @docs/technical-requirements.md: how it's built
- [docs/template-spec.md](docs/template-spec.md): exact layout of every template (read before any template or render work)
- [docs/implementation-plan.md](docs/implementation-plan.md): phases, tasks and definitions of done
- [docs/decisions/](docs/decisions/): decision records

## Standing instructions

- Read the relevant doc in `docs/` before starting work on a feature. The linked spec sections in each issue are the source of truth.
- When a lasting decision changes the plan (layout values, templates, behavior, stack, hosting), update the affected doc in the same change and add a decision record in `docs/decisions/`.
- Reference the related GitHub issue in commits and PRs (`Closes #N`).
- Keep `main` deployable: typecheck, lint, test and build must pass.
