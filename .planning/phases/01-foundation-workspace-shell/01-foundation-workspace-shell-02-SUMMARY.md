---
phase: 01-foundation-workspace-shell
plan: 02
subsystem: api
tags: [tanstack-start, bff, spring-initializr, caching, react-query]

requires:
  - phase: 01-foundation-workspace-shell
    provides: workspace shell scaffold and root route/theme foundation
provides:
  - BFF metadata proxy server function for Spring Initializr metadata
  - In-memory TTL metadata cache with hit/miss instrumentation
  - Workspace metadata hook and readiness state indicators
affects: [phase-02-project-configuration, metadata-driven-forms, workspace-data-layer]

tech-stack:
  added: [@tanstack/react-query]
  patterns: [cache-first server function proxy, normalized metadata contract, status-driven workspace readiness UI]

key-files:
  created:
    - src/server/lib/initializr-client.ts
    - src/server/lib/metadata-cache.ts
    - src/server/functions/get-initializr-metadata.ts
    - src/hooks/use-initializr-metadata.ts
  modified:
    - src/components/workspace/workspace-shell.tsx
    - src/routes/__root.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "Return discriminated success/error payloads from metadata server function to keep upstream failure details sanitized"
  - "Keep metadata caching as a single-entry in-memory TTL cache (5 minutes) for Phase 1"
  - "Mount QueryClientProvider at root so metadata hook can use TanStack Query across workspace views"

patterns-established:
  - "BFF metadata flow: client hook -> server function -> cache -> normalized upstream fetch"
  - "Metadata status contract: loading/error/success cards in workspace driven by query state"

duration: 5 min
completed: 2026-02-14
---

# Phase 1 Plan 2: Metadata Proxy and Cache Summary

**Spring Initializr metadata now flows through a cache-backed TanStack Start server function into workspace UI status cards with safe error handling.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-14T17:55:32Z
- **Completed:** 2026-02-14T18:01:16Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Built a dedicated Spring Initializr metadata client that normalizes dependencies, Java versions, and Spring Boot versions.
- Added an in-memory TTL cache utility with explicit hit/miss instrumentation for deterministic cache behavior checks.
- Implemented a cache-first BFF server function with sanitized error payloads and connected it to workspace via `useInitializrMetadata`.
- Added loading/error/success metadata readiness UI in workspace shell, including source/cache indicators for visibility.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Spring Initializr server-side client and metadata cache utilities** - `ac93219` (feat)
2. **Task 2: Implement TanStack Start BFF server function for metadata proxy** - `41b1890` (feat)
3. **Task 3: Connect workspace to metadata hook and show loading/error-ready state** - `6118db9` (feat)

## Files Created/Modified
- `src/server/lib/initializr-client.ts` - Fetches and normalizes upstream metadata into a stable app-specific shape.
- `src/server/lib/metadata-cache.ts` - Stores metadata with TTL and exposes hit/miss instrumentation.
- `src/server/functions/get-initializr-metadata.ts` - Cache-first TanStack Start server function with sanitized errors.
- `src/hooks/use-initializr-metadata.ts` - TanStack Query hook for metadata retrieval from BFF.
- `src/components/workspace/workspace-shell.tsx` - Metadata loading/error/success readiness state UI.
- `src/routes/__root.tsx` - Query client provider wiring for app-wide query support.

## Decisions Made
- Returned a discriminated response (`ok: true/false`) from the server function so UI can show safe, actionable errors without exposing upstream internals.
- Kept cache design intentionally simple (single key, in-memory, 5-minute TTL) to satisfy Phase 1 requirements with low complexity.
- Chose root-level QueryClient provider to support current metadata query and future shared workspace queries.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extracted testable core function outside Start runtime context**
- **Found during:** Task 2 (Implement TanStack Start BFF server function for metadata proxy)
- **Issue:** Directly invoking `createServerFn` in Vitest failed because TanStack Start runtime context was unavailable.
- **Fix:** Added `getInitializrMetadataFromBff` as a pure server-side core function and delegated server function handler to it.
- **Files modified:** `src/server/functions/get-initializr-metadata.ts`, `src/server/functions/get-initializr-metadata.test.ts`
- **Verification:** `npm test -- src/server/functions/get-initializr-metadata.test.ts` passes with cache-hit and sanitized-error assertions.
- **Committed in:** `41b1890` (part of Task 2 commit)

**2. [Rule 3 - Blocking] Added QueryClientProvider to support `useQuery` hook execution**
- **Found during:** Task 3 (Connect workspace to metadata hook and show loading/error-ready state)
- **Issue:** Metadata hook required a React Query client provider, which was not present in the existing root shell.
- **Fix:** Wired `QueryClientProvider` in root document with baseline query defaults.
- **Files modified:** `src/routes/__root.tsx`
- **Verification:** `npm run build` succeeds and metadata hook compiles/runs under workspace shell.
- **Committed in:** `6118db9` (part of Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to complete planned behavior and verification without changing architecture.

## Authentication Gates

None.

## Issues Encountered
- Vitest reports a known lingering-process timeout warning after successful completion; test assertions and exit statuses remained successful.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Metadata data plane is ready for Phase 2 project configuration controls (Java/Boot/build options and dependency pickers).
- Workspace now exposes metadata readiness and safe failure messaging, reducing coupling to upstream behavior.

---
*Phase: 01-foundation-workspace-shell*
*Completed: 2026-02-14*

## Self-Check: PASSED

- Found summary file: `.planning/phases/01-foundation-workspace-shell/01-foundation-workspace-shell-02-SUMMARY.md`
- Found commits: `ac93219`, `41b1890`, `6118db9`
