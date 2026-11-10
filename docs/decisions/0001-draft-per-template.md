# 0001: One draft per template, created when the template is chosen

- **Date:** 2026-11-09
- **Status:** Accepted

## Context

The first version of the editor state (`Draft`) carried inputs for every template at
once: four photo slots, a graphic id and the Info text fields, regardless of which
template was selected. Each template read its own part and ignored the rest. That made
"switch template, keep compatible inputs" trivial, but the shape didn't match `Post`
(a clean per-template union), fields that were irrelevant to the current template sat
around, and it implied a default template existed before the user picked one.

## Decision

- `Draft` is a per-template union shaped like `Post`, with required inputs allowed to
  be empty (`photoId: null`, `eventNumber: null`, empty strings).
- The store's `draft` is `Draft | null`. `null` means no template has been chosen:
  the editor shows the template picker and an empty preview.
- Choosing a template creates the draft. Choosing a different template while a draft
  exists converts it with `convertDraft`, which carries over **only** the texture (when
  chosen or carried from the session) and photos between Cover / Photo / Multi-Photo.
  Info text and the graphic are dropped when leaving those templates; the template
  picker UI should confirm before discarding typed text.
- After **Add to batch** (and after saving or cancelling an edit) the draft is cleared
  and the editor **returns to the template picker**. The photo pool and last-used
  texture are kept.

## Consequences

- The editor flow is: choose template → fill → add → back to the picker.
- Making several posts of the same template costs one extra click each (choosing the
  template again). Revisit if that proves annoying in the MVP test.
- Draft setters are no-ops when there is no draft or the draft is the wrong template.

## Docs affected

- `docs/prd.md`: Add to batch now returns to the template picker; template switching
  note names what carries over.
- `docs/template-spec.md`: note under the Post data model pointing to `Draft`.
