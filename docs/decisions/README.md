# Decision records

Short records of lasting decisions that change the plan: layout values, template behavior, stack, hosting, scope. They explain *why* the docs say what they say.

## When to write one

Write one whenever a change alters a planning doc in `docs/` in a lasting way. Small bug fixes and refactors don't need one.

## Format

- File name: `NNNN-short-title.md`, numbered in order (`0001-…`, `0002-…`).
- Copy [`0000-template.md`](0000-template.md) and fill in every section.
- Status is one of `Proposed`, `Accepted`, or `Superseded by NNNN`.
- Update the affected docs in the same commit and list them under **Docs affected**.

## Decisions made during planning (Nov 2026)

These were settled before the build started and are already reflected in the docs:

- **Output is 3:4 at 1080×1440.** Stories are out of scope for v1.
- **No persistence of any kind.** Uploaded textures are session-only.
- **Hosting:** fonts are self-hosted, except Druk, which is used only when installed locally ([0005](0005-druk-local-only.md) replaced the original plan to bundle it). The site is on GitHub Pages from a public repo, with no login.
- **UI fonts:** Druk for titles, Geist for body text (in place of Favorit).
- **Visual review instead of automated visual tests.**
- **Info date is structured** (pickers, auto-formatted) rather than free text.
