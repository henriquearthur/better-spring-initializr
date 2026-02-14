---
phase: 05-generation-sharing
plan: 01
subsystem: api
tags: [spring-initializr, bff, tanstack-start, server-functions, vitest]
requires:
  - phase: 04-live-preview
    provides: Spring Initializr workspace config and dependency selection model
provides:
  - Deterministic mapping from workspace state to starter.zip query parameters
  - Server-side ZIP fetch client with normalized metadata and typed failure modes
  - Download server function returning discriminated base64 payloads with sanitized errors
affects: [generation-ui, sharing-links, download-flow]
tech-stack:
  added: []
  patterns:
    - Pure query-param builder reusable across server and future share/deep-link flows
    - BFF proxy contract with discriminated ok/error payloads and retryable user-safe messaging
key-files:
  created:
    - src/lib/initializr-generate-params.ts
    - src/lib/initializr-generate-params.test.ts
    - src/server/lib/initializr-generate-client.ts
    - src/server/lib/initializr-generate-client.test.ts
    - src/server/functions/download-initializr-project.ts
    - src/server/functions/download-initializr-project.test.ts
  modified: []
key-decisions:
  - Keep generation query output as ordered tuple entries so URLSearchParams serialization remains deterministic in tests and server calls.
  - Normalize all download failures to PROJECT_DOWNLOAD_UNAVAILABLE with retryable messaging to preserve BFF error-sanitization guarantees.
patterns-established:
  - "Generation mapping is pure and network-free in src/lib for cross-phase reuse."
  - "Server functions return discriminated contracts and never expose upstream raw status/body details."
duration: 3 min
completed: 2026-02-14
---

# Phase 5 Plan 1: Generation Backend Path Summary

**Workspace configuration now maps to Spring Initializr starter.zip parameters and returns archive bytes through a sanitized BFF download contract.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-14T17:27:00-03:00
- **Completed:** 2026-02-14T20:30:26.883Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Added deterministic generation query-param builder with stable ordering and dependency serialization.
- Implemented server-side starter.zip fetch utility with content-type/filename normalization and typed upstream/invalid-response errors.
- Added TanStack Start download server function returning discriminated success/error payloads with base64 archive metadata.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create deterministic Initializr generation param builder** - `aebb19d` (feat)
2. **Task 2: Implement server-side Spring Initializr ZIP client** - `090ab39` (feat)
3. **Task 3: Add download server function contract for client consumption** - `c6e1362` (feat)

## Files Created/Modified
- `src/lib/initializr-generate-params.ts` - Pure mapping utility from workspace config/dependencies to Initializr query entries.
- `src/lib/initializr-generate-params.test.ts` - Coverage for required mapping, optional omission, and dependency serialization.
- `src/server/lib/initializr-generate-client.ts` - Server ZIP fetch utility with response metadata normalization and typed errors.
- `src/server/lib/initializr-generate-client.test.ts` - Success/non-OK/network/invalid payload coverage for ZIP client behavior.
- `src/server/functions/download-initializr-project.ts` - BFF server function exposing base64 archive payload and sanitized retryable error shape.
- `src/server/functions/download-initializr-project.test.ts` - Contract tests for success payload metadata and sanitized failure response.

## Decisions Made
- Kept generation params as ordered tuple entries rather than URLSearchParams objects to guarantee deterministic assertion order and serialization behavior.
- Used one client-safe error code (`PROJECT_DOWNLOAD_UNAVAILABLE`) for all download failures to avoid upstream leakage and keep UI retry handling simple.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Backend generation/download contract is ready for Phase 5 UI wiring.
- Plan 02 can consume `downloadInitializrProject` without redefining generation semantics.

## Self-Check: PASSED
- Found `.planning/phases/05-generation-sharing/05-generation-sharing-01-SUMMARY.md` on disk.
- Verified commits `aebb19d`, `090ab39`, and `c6e1362` exist in git history.

---
*Phase: 05-generation-sharing*
*Completed: 2026-02-14*
