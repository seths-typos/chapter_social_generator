# 0005: Druk is used only when installed locally, never bundled

- **Date:** 2026-11-10
- **Status:** Accepted

## Context

The plan was to self-host Druk (converted to WOFF2 in `public/fonts/`) alongside the
other fonts, and to block rendering unless it loaded. Deploying to GitHub Pages needs a
public repo, which would have made the Druk font files downloadable by anyone, from both
the site and the repository. Druk is a licensed typeface; the owner does not want it
downloadable.

## Decision

- Druk is **not shipped**: no font files in the repo or the deployed site. The
  `@font-face` rules for "Chapter Druk" use `local("Druk Medium")` / `local("Druk Bold")`
  only, so the browser uses the copy installed on the computer.
- When Druk isn't installed, Druk text falls back to `Impact, "Arial Narrow", sans-serif`.
  Rendering and export still work. A notice under the header names the missing weights
  and says the posts won't match the brand.
- The font gate now blocks only on the bundled template font (Instrument Serif).
- The `chapter` wordmark and `ch.` mark stay as they are: vector logo artwork, not fonts.

## Consequences

- On-brand output needs Druk Medium and Druk Bold installed on the computer, and a
  browser that exposes installed fonts. **Safari does not** (WebKit hides user-installed
  fonts from web pages), so Safari always renders the fallback. Chrome, Edge and Firefox work.
- The rule "a PNG must never be exported with a fallback font" is replaced by "the user is
  always told when the fallback is in use".
- With the fallback, text is wider, so titles wrap and lines shrink sooner. Layout rules
  still hold; the look does not match the references.
- The Druk WOFF2 files had been committed earlier, so they were in the repository's
  history. Before going public the history was rewritten to drop them from every commit,
  and the public repository was created fresh from that cleaned history (same name, issues
  re-created with the same numbers). The original repository is kept private as
  `chapter_social_generator_archive`. Commit hashes from before 2026-11-10 differ between
  the two.
- A possible follow-up if Safari matters: let the user load their Druk font files from
  disk for the session.

## Docs affected

- `docs/technical-requirements.md`: Guiding principles, Fonts, Browser support, project structure.
- `docs/prd.md`: "Fonts are never silently wrong", open item 6, browser note.
- `docs/template-spec.md`: Assets table.
- `docs/implementation-plan.md`: dependencies on the owner.
- `docs/decisions/README.md`, `CLAUDE.md`.
