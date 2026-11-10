# 0003: One definition per template, read through a registry

- **Date:** 2026-11-10
- **Status:** Accepted

## Context

Templates will be added and changed in code after v1. Before this change, a template's
details were spread over about 12 places in 6 files: the `Post`, `Draft` and
`RenderInput` unions, five `switch` statements in `src/store/draft.ts`,
`toRenderInput`, the renderer registry, and the label and default-texture tables. An
editor form and a comparison fixture per template were still to come. TypeScript caught
missed spots, but adding a template meant knowing the whole codebase.

Four of the five templates were still placeholders, so restructuring was cheap now and
would cost more after each template issue (#10, #11, #17, #28).

## Decision

- Each file in `src/templates/` exports one `TemplateDefinition` holding everything
  about that template: `id`, `label`, `defaultTexture`, its draft operations
  (`newDraft`, `missingInputs`, `toPost`, `fromPost`, `photoIds`, `clearPhoto`), an
  optional photo `slots` range, and `render`.
- `src/templates/registry.ts` lists the definitions (its key order is the picker order)
  and exports the template-agnostic operations built on them (`newDraft`, `toPost`,
  `fromPost`, `convertDraft`, `withPhotoCount`, `photoIdsInPost`, …). The store, the
  renderer and the UI call these. Nothing outside `src/templates/` switches on a
  template id.
- Templates **draw from a `Draft`**. `renderPost` loads a stored `Post` into a draft
  first. The separate `RenderInput` shape and `toRenderInput` are removed.
- Slot-based templates (Cover, Photo, Multi-Photo) share their draft operations through
  `slotDraftOps` and declare a slot range. The shared slot actions and the carry-over of
  photos when switching template work off that range rather than off template ids.
- The store gains `editDraft(template, fn)` for template-specific fields, so a new
  template doesn't need its own store action.
- The `Post` and `Draft` unions stay hand-written, because they mirror the data model in
  the Template Spec.
- **Not done:** a data-driven template format (layouts and forms described as config).
  The templates have bespoke fit and layout rules, and a plain render function per
  template is easier to read and change at this scale.

## Consequences

- Adding a template is: its spec section and constants, one variant in each of the
  `Post` and `Draft` unions, one new file, and one line in the registry. The steps are
  listed at the top of `src/templates/definition.ts`.
- The definition grows two members as their consumers land: `Editor` (the template's
  form, with #10) and `fixture` (sample inputs for the comparison view, with #13).
- Draft operations and their tests moved from `src/store/draft.ts` to the template files
  and `src/templates/registry.ts`. `src/store/draft.ts` now holds the shapes only.
- The registry needs one type cast (`templateFor`) to hand out a definition for a
  template id that is only known at runtime.
- Behavior is unchanged.

## Docs affected

- `docs/technical-requirements.md`: Rendering engine (template definitions, how to add a
  template) and project structure.
- `docs/template-spec.md`: the note under the Post data model.
- `docs/implementation-plan.md`: task 1.4b added; 1.5 and 1.8 mention `Editor` and `fixture`.
- `CLAUDE.md`: key conventions.
