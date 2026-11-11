# 0009: Text over photos is an option on Photo and Multi-Photo, not a new template

**Date:** 2026-11-11
**Status:** Accepted

## Context

The client started posting a variation of the photo posts with a white text box above the photos (a heading and a few names). The tool had no way to make it. It could be a sixth template, or an option on the existing photo templates.

## Decision

It is an **optional text card** on Photo and Multi-Photo. When it is on, the canvas is split at the golden ratio (38.2% text area, 61.8% photo area), the card fills the upper part, and the template's existing layout is scaled down as a whole into the lower part. Cover does not get it, because its wordmark already sits over the photo.

## Consequences

- No new layouts to tune: every photo count gets the text version from the one transform, and a later layout change applies to both.
- Scaling by height leaves the condensed layout narrower than the canvas, with wide side margins. That is the cost of keeping the layouts identical.
- The split is a first guess. A temporary slider (`?tune`) changes it live; once the owner chooses a value it becomes the constant and the slider is removed.
- The heading uses a browser-slanted Druk Medium, since no italic Druk face is declared.
- `Post` gains an optional `textCard` on `photo` and `multi-photo`.
