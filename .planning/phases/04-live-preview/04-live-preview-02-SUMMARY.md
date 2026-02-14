---
phase: 04-live-preview
plan: 02
subsystem: ui
tags: [live-preview, shiki, diffing, react-arborist, vitest]

requires:
  - phase: 04-live-preview-01
    provides: preview snapshot query flow, virtualized tree foundation, selected file state wiring
provides:
  - Syntax-highlighted file content viewer with explicit empty/loading/binary fallback states
  - Deterministic snapshot diff utility with file-level and line-level change metadata
  - Dependency-toggle diff indicators in tree rows and line-level highlights in the file viewer
affects: [phase-05-generation-sharing, preview-usability, dependency-change-feedback]

tech-stack:
  added: [shiki]
  patterns:
    [dependency-toggle baseline diffing, deterministic per-path diff metadata, line-gutter change visualization]

key-files:
  created:
    - src/components/workspace/file-content-viewer.tsx
    - src/lib/preview-diff.ts
    - src/lib/preview-diff.test.ts
  modified:
    - package.json
    - package-lock.json
    - src/components/workspace/preview-file-tree.tsx
    - src/components/workspace/workspace-shell.tsx

key-decisions:
  - "Use Shiki for extension-aware syntax highlighting so generated Spring project files render with language-appropriate tokens."
  - "Compute PREV-04 diffs only when dependency selections change by snapshotting a dependency-change baseline and comparing against the refreshed preview."
  - "Represent diff output as deterministic per-file metadata plus line additions/removals to drive both tree badges and viewer gutter highlights."

patterns-established:
  - "Dependency-diff flow: dependency selection key change -> capture current snapshot baseline -> compare against next generated snapshot."
  - "Viewer rendering contract: selected preview file + optional PreviewFileDiff produce syntax-highlighted rows with added/removed indicators."

duration: 6 min
completed: 2026-02-14
---

# Phase 4 Plan 2: Live Preview Diff & Viewer Summary

**Workspace preview now supports syntax-highlighted file reading plus dependency-change file and line diff cues so users can see exactly what toggles changed.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-14T20:09:18Z
- **Completed:** 2026-02-14T20:16:15Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Added `FileContentViewer` with extension-aware highlighting and explicit fallback states for no selection, loading, and binary/unreadable content.
- Implemented `computePreviewDiff` plus focused tests covering unchanged, added, removed, and multiline-modified scenarios with deterministic output.
- Integrated dependency-triggered diff computation into `WorkspaceShell`, added tree-level changed-file badges, and rendered line-level added/removed highlights in the viewer gutter area.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build syntax-highlighted file viewer for selected preview files** - `29e25e1` (feat)
2. **Task 2: Implement diff computation utilities for snapshot changes** - `931419a` (feat)
3. **Task 3: Integrate tree selection, syntax viewer, and dependency-toggle diff highlighting** - `27d84da` (feat)

## Files Created/Modified
- `src/components/workspace/file-content-viewer.tsx` - Syntax-highlighted, read-only viewer with loading/empty/binary states and line-level diff visualization.
- `src/lib/preview-diff.ts` - Deterministic snapshot diff engine for per-file status and text-line additions/removals.
- `src/lib/preview-diff.test.ts` - Unit tests for key diff scenarios and deterministic output expectations.
- `src/components/workspace/preview-file-tree.tsx` - File-row diff badges (added/modified) aligned with computed diff metadata.
- `src/components/workspace/workspace-shell.tsx` - Main panel layout wiring for tree + viewer and dependency-toggle diff baseline/comparison flow.
- `package.json` - Adds `shiki` dependency.
- `package-lock.json` - Locks shiki and transitive dependencies.

## Decisions Made
- Chose Shiki for stable syntax highlighting across Spring project file types (XML, YAML, Java, Gradle/Kotlin DSL, properties, markdown).
- Scoped PREV-04 diff computation specifically to dependency-selection changes to avoid noisy diff states during unrelated config updates.
- Modeled removed lines with `afterLine` anchors so viewer output can render deletion rows near the related current-line context.

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None.

## Issues Encountered
- `vitest` reported a known hanging-process shutdown warning even with passing tests; test results still completed successfully and build verification passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 4 Live Preview is complete for PREV-01 through PREV-04 and LAYO-03 behaviors.
- Ready for Phase 5 generation/download and sharing workflows to build on the validated preview + diff UX.

---
*Phase: 04-live-preview*
*Completed: 2026-02-14*

## Self-Check: PASSED

- Found summary file: `.planning/phases/04-live-preview/04-live-preview-02-SUMMARY.md`
- Found commits: `29e25e1`, `931419a`, `27d84da`
