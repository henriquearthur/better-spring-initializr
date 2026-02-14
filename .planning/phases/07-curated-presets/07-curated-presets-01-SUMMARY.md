---
phase: 07-curated-presets
plan: 01
subsystem: ui
tags: [presets, workspace, state, vite]

# Dependency graph
requires:
  - phase: 03-dependency-browser
    provides: dependency browser state and selection controls
  - phase: 04-live-preview
    provides: reactive preview refresh from config/dependency query key
provides:
  - typed curated preset catalog with deterministic apply helpers
  - sidebar preset browser with includes inspection before apply
  - atomic preset application wired into workspace config and dependency state
affects: [workspace-shell, dependency-selection, preview-refresh]

# Tech tracking
tech-stack:
  added: []
  patterns: [code-defined curated preset catalog, browser-only node builtin shims for client bundling]

key-files:
  created:
    - src/lib/curated-presets.ts
    - src/lib/curated-presets.test.ts
    - src/components/workspace/preset-browser.tsx
    - src/lib/polyfills/async-hooks.ts
    - src/lib/polyfills/node-stream.ts
    - src/lib/polyfills/node-stream-web.ts
  modified:
    - src/components/workspace/workspace-shell.tsx
    - src/hooks/use-dependency-browser.ts
    - src/hooks/use-dependency-browser.test.ts
    - vite.config.ts

key-decisions:
  - "Keep curated presets as a static in-repo catalog (no API/database) and expose pure apply helpers for deterministic state transitions."
  - "Add browser-only aliases for node builtins in Vite config to unblock client build while preserving SSR/nitro behavior."

patterns-established:
  - "Preset application path: pure apply helper -> workspace canonical state setters -> existing preview query reacts"
  - "Compatibility surfacing: unresolved dependency IDs are shown as metadata warnings before apply"

# Metrics
duration: 7 min
completed: 2026-02-14
---

# Phase 7 Plan 1: Curated Presets Summary

**Curated preset catalog + sidebar browser now lets users inspect included config/dependencies and apply a preset that updates canonical config/dependency state and refreshes preview.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-14T21:56:18Z
- **Completed:** 2026-02-14T22:03:58Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Added a deterministic `CURATED_PRESETS` catalog with `getCuratedPresetById` and `applyCuratedPreset` helpers.
- Built `PresetBrowser` UI that shows tags, config overrides, dependency IDs/names, and compatibility notes before apply.
- Wired preset apply into `WorkspaceShell` so config + dependency state update together and existing preview reactivity handles refresh.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create curated preset catalog and deterministic apply helpers** - `8bc6bc0` (feat)
2. **Task 2: Build preset browser UI with includes inspection before apply** - `086fe26` (feat)
3. **Task 3: Wire preset apply into canonical workspace config/dependency state and live preview** - `e5c8d94` (feat)

## Files Created/Modified
- `src/lib/curated-presets.ts` - Curated preset types, catalog, lookup, and apply snapshot helper.
- `src/lib/curated-presets.test.ts` - Deterministic tests for lookup, merge, dedupe, and unknown preset behavior.
- `src/components/workspace/preset-browser.tsx` - Sidebar preset browser with includes inspection and apply actions.
- `src/components/workspace/workspace-shell.tsx` - Preset browser integration and apply wiring into canonical state.
- `src/hooks/use-dependency-browser.ts` - Added `setSelectedDependencyIds` API for atomic selection replacement.
- `src/hooks/use-dependency-browser.test.ts` - Added normalization/replacement behavior tests.
- `vite.config.ts` - Browser-only node builtin aliasing for client bundle compatibility.
- `src/lib/polyfills/async-hooks.ts` - AsyncLocalStorage client polyfill used by aliasing.
- `src/lib/polyfills/node-stream.ts` - Readable/PassThrough/Duplex client stream polyfills.
- `src/lib/polyfills/node-stream-web.ts` - ReadableStream export shim for client bundle.

## Decisions Made
- Kept curated presets code-defined in `src/lib/curated-presets.ts` for deterministic v1 behavior and easier URL/state integration.
- Applied presets by deriving a full next snapshot (`config + selectedDependencyIds`) and writing via existing canonical state hooks.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Vite build failures caused by node builtin imports in browser bundle**
- **Found during:** Task 1 verification (`npm run build`)
- **Issue:** Client build failed on `node:stream`/`node:async_hooks` imports from TanStack router/start internals.
- **Fix:** Added browser-focused node builtin aliases and lightweight polyfill modules; scoped aliasing in Vite config to avoid SSR breakage.
- **Files modified:** `vite.config.ts`, `src/lib/polyfills/async-hooks.ts`, `src/lib/polyfills/node-stream.ts`, `src/lib/polyfills/node-stream-web.ts`
- **Verification:** `npm run build` passes after the fix.
- **Committed in:** `8bc6bc0`, `086fe26`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was required to satisfy the plan's build verification gate; no product-scope creep.

## Issues Encountered
- `npm run dev` initially failed due occupied devtools port (`42069`); resolved by clearing stale process before verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 7 plan objective is complete with PRST-01/02/03 behaviors implemented.
- Ready for phase completion/transition flow.

---
*Phase: 07-curated-presets*
*Completed: 2026-02-14*

## Self-Check: PASSED
