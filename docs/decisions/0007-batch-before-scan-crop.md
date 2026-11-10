# 0007: Batch and export built before the polaroid scan crop

- **Date:** 2026-11-10
- **Status:** Accepted

## Context

The plan ran Phase 3 (polaroid scan crop) before Phase 4 (batch list, captions, ZIP
export). After the founder approved the Phase 2 build, the owner asked to skip Phase 3
for now and build Phase 4. Nothing in Phase 4 depends on Phase 3.

## Decision

Phase 4 (#23–#26) is built first. Phase 3 (#20–#22) stays in the plan, unscheduled.

## Consequences

- The tool is usable for a real event's posts sooner (the MVP test, #27), without
  scanned polaroids.
- The "Polaroid scan" option in the Photos panel stays disabled until Phase 3 is built.
