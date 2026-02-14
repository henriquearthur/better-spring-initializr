---
phase: 06-github-integration
plan: 01
subsystem: auth
tags: [github-oauth, pkce, session-cookie, tanstack-start]

requires:
  - phase: 05-generation-sharing
    provides: Workspace output actions and BFF response hygiene patterns
provides:
  - GitHub OAuth start/callback/session/disconnect server functions
  - PKCE-based OAuth client utilities with typed error mapping
  - Workspace GitHub auth panel with connect/disconnect UX and callback round-trip
affects: [06-github-integration-02, github-push, oauth-session]

tech-stack:
  added: []
  patterns:
    - Discriminated `ok: true/false` contracts for OAuth lifecycle responses
    - Server-side OAuth token persistence through secure session cookie helpers
    - Callback route handoff to workspace shell for OAuth completion

key-files:
  created:
    - src/server/lib/github-oauth-client.ts
    - src/server/lib/github-oauth-session.ts
    - src/server/functions/github-oauth.ts
    - src/components/workspace/github-auth-panel.tsx
    - src/routes/api.github.oauth.callback.tsx
  modified:
    - src/components/workspace/workspace-shell.tsx
    - src/routeTree.gen.ts

key-decisions:
  - "Kept OAuth lifecycle in TanStack Start server functions with sanitized domain error codes for UI safety."
  - "Added a dedicated callback route at /api/github/oauth/callback that reuses WorkspaceShell and completes OAuth in-panel."
  - "Bridged session runtime logic through a server-only module to keep cookie operations out of client-side code paths."

patterns-established:
  - "OAuth Error Hygiene: map upstream GitHub failures to GITHUB_AUTH_* codes with retryable hints"
  - "Auth Panel Wiring: UI calls start/get/disconnect server functions directly and resolves callback state on mount"

duration: 5 min
completed: 2026-02-14
---

# Phase 6 Plan 1: GitHub OAuth Foundation Summary

**GitHub OAuth PKCE flow now runs through server functions with secure session cookies and a workspace connect/disconnect panel.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-14T17:55:29-03:00
- **Completed:** 2026-02-14T21:00:49Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Implemented reusable OAuth primitives for GitHub auth URL generation, code exchange, and identity/org membership fetch.
- Added state + session cookie helpers for PKCE validation and server-side token persistence.
- Delivered OAuth lifecycle server functions and connected WorkspaceShell UI for connect/callback/disconnect flow visibility.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build GitHub OAuth client and secure server-side session helpers** - `0bb82f5` (feat)
2. **Task 2: Implement OAuth lifecycle server functions with sanitized responses** - `6d88819` (feat)
3. **Task 3: Add workspace GitHub auth panel with permission explanation** - `b4392b9` (feat)

## Files Created/Modified
- `src/server/lib/github-oauth-client.ts` - PKCE URL/token exchange/user+org identity utilities.
- `src/server/lib/github-oauth-session.ts` - OAuth state verification and secure cookie option/session helpers.
- `src/server/functions/github-oauth.ts` - start/callback/session/disconnect server function contracts.
- `src/components/workspace/github-auth-panel.tsx` - Connect/disconnect UI and callback completion logic.
- `src/components/workspace/workspace-shell.tsx` - Auth panel integration into output/actions area.

## Decisions Made
- Kept all client-visible responses sanitized through `GITHUB_AUTH_*` domain errors instead of leaking upstream GitHub payloads.
- Implemented callback completion on `/api/github/oauth/callback` inside workspace UI to preserve existing shell context.
- Used a server-only bridge module (`github-oauth-session.server.ts`) for session runtime imports.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added server-only session bridge to avoid runtime import coupling in OAuth server functions**
- **Found during:** Task 2
- **Issue:** OAuth lifecycle function wiring needed a server-only module boundary for session runtime helpers.
- **Fix:** Added `src/server/lib/github-oauth-session.server.ts` and routed OAuth server-function imports through it.
- **Files modified:** `src/server/lib/github-oauth-session.server.ts`, `src/server/functions/github-oauth.ts`, `src/server/functions/github-oauth.test.ts`
- **Verification:** `npm test -- src/server/functions/github-oauth.test.ts` passes
- **Committed in:** `6d88819`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Deviation kept scope intact and unblocked Task 2 implementation.

## Authentication Gates

None.

## Issues Encountered
- `npm run build` fails in current project setup with `Readable is not exported by __vite-browser-external` from TanStack Router SSR stream transform while client build runs.

## User Setup Required

External services require manual configuration before full OAuth runtime verification:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_OAUTH_CALLBACK_URL`
- `GITHUB_SESSION_SECRET`

## Next Phase Readiness
- OAuth connect/disconnect/session contract is in place for repository owner selection and push pipeline work in plan 02.
- Build pipeline issue should be resolved before phase-complete verification.

---
*Phase: 06-github-integration*
*Completed: 2026-02-14*

## Self-Check: PASSED
- Verified key implementation files exist on disk.
- Verified task commits `0bb82f5`, `6d88819`, and `b4392b9` exist in git history.
