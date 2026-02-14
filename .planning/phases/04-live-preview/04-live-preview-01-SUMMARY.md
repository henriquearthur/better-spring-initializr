---
phase: 04-live-preview
plan: 01
subsystem: ui
tags: [live-preview, spring-initializr, react-query, react-arborist, bff]

requires:
  - phase: 03-dependency-browser
    provides: selected dependency IDs and workspace sidebar interaction flow
provides:
  - BFF preview snapshot function for generated project ZIP contents
  - Deterministic path-to-tree builder for preview nodes
  - Virtualized file tree panel in workspace main preview area
  - Debounced preview query hook keyed by config and dependency selections
affects: [phase-04-live-preview-02, preview-diffing, workspace-main-panel]

tech-stack:
  added: [jszip, react-arborist]
  patterns:
    [sanitized discriminated BFF preview responses, deterministic preview tree IDs, debounced query-keyed preview refresh]

key-files:
  created:
    - src/server/lib/initializr-preview-client.ts
    - src/server/functions/get-project-preview.ts
    - src/lib/preview-tree.ts
    - src/components/workspace/preview-file-tree.tsx
    - src/hooks/use-project-preview.ts
  modified:
    - package.json
    - package-lock.json
    - src/components/workspace/workspace-shell.tsx

key-decisions:
  - "Generate preview snapshots server-side from Spring Initializr starter.zip and sanitize upstream failures behind ok/error responses."
  - "Use react-arborist virtualization with deterministic tree node IDs so large generated projects remain scroll-smooth."
  - "Debounce preview refreshes by 350ms and preserve previous query data to avoid request storms while keeping near-real-time updates."

patterns-established:
  - "Preview data flow: WorkspaceShell config/dependency state -> useProjectPreview query -> getProjectPreview server function -> PreviewFileTree rendering."
  - "Preview normalization contract: flat files[] entries include path, size, binary flag, optional UTF-8 content, and sha256 hash."

duration: 5 min
completed: 2026-02-14
---

# Phase 4 Plan 1: Live Preview Foundation Summary

**Spring Initializr ZIP snapshots now power a virtualized workspace file tree that auto-refreshes from config and dependency changes.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-14T20:02:32Z
- **Completed:** 2026-02-14T20:07:32Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Added a new preview BFF contract (`getProjectPreview`) that generates and normalizes generated-project file snapshots with sanitized error handling.
- Implemented deterministic `buildPreviewTree` transformation and a `react-arborist`-based `PreviewFileTree` component with loading/empty/error states.
- Replaced `WorkspaceShell` main placeholder with live preview integration via `useProjectPreview`, including debounced updates and selected-file state management.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BFF preview snapshot function for generated project files** - `a6b8cf5` (feat)
2. **Task 2: Implement file-tree model builder and virtualized tree component** - `b011d44` (feat)
3. **Task 3: Wire workspace main panel to live preview snapshot and tree selection state** - `7e0cf46` (feat)

## Files Created/Modified
- `src/server/lib/initializr-preview-client.ts` - Calls Spring Initializr starter ZIP endpoint, unpacks archive, and emits normalized file snapshots.
- `src/server/functions/get-project-preview.ts` - Server function wrapper returning discriminated success/error preview payloads.
- `src/lib/preview-tree.ts` - Deterministic flat-path to hierarchical preview tree builder.
- `src/components/workspace/preview-file-tree.tsx` - Virtualized file tree UI using `react-arborist`.
- `src/hooks/use-project-preview.ts` - Debounced TanStack Query hook keyed by config and selected dependency IDs.
- `src/components/workspace/workspace-shell.tsx` - Main panel wiring to live preview query and file selection state.

## Decisions Made
- Kept preview generation in the BFF layer so the browser never calls Spring Initializr directly and error payloads stay sanitized.
- Used deterministic IDs (`dir:path`, `file:path`) in tree nodes to keep virtualized rendering stable across refreshes.
- Preserved previous preview query data during refetch to avoid UI flicker while new snapshots are generated.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added retry fallback when stale bootVersion values return 400 from Spring Initializr**
- **Found during:** Task 3 (live preview wiring verification)
- **Issue:** Existing default boot version values can be stale, causing preview generation to fail even though upstream service is healthy.
- **Fix:** Added a one-time retry that omits `bootVersion` on 400 responses so Spring Initializr resolves with its current default.
- **Files modified:** `src/server/lib/initializr-preview-client.ts`
- **Verification:** `npx --yes tsx -e "...fetchInitializrProjectPreview..."` returned non-empty snapshots; final `npm run build` passed.
- **Committed in:** `7e0cf46` (part of Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix was required for reliable live preview generation with real-world Spring Initializr version drift. No scope creep.

## Authentication Gates

None.

## Issues Encountered
- Temporary local invocation via `tsx` could not import `@tanstack/react-start` server-function modules directly in CJS mode; verification used the preview client helper path instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 01 now satisfies PREV-01 and the file-tree half of PREV-03, with virtualized rendering ready for file viewer/diff work.
- Ready for `04-live-preview-02-PLAN.md` to add syntax-highlighted file content and dependency diff visualization.

---
*Phase: 04-live-preview*
*Completed: 2026-02-14*

## Self-Check: PASSED

- Found summary file: `.planning/phases/04-live-preview/04-live-preview-01-SUMMARY.md`
- Found commits: `a6b8cf5`, `b011d44`, `7e0cf46`
