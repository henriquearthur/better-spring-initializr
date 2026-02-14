# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** Developers can visually configure and preview a Spring Boot project with real-time feedback, then generate it instantly
**Current focus:** Phase 6 - GitHub Integration

## Current Position

Phase: 6 of 7 (GitHub Integration)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-14 -- Completed 06-github-integration-01 (GitHub OAuth flow foundation + workspace auth panel wiring)

Progress: [########..] 79%

## Performance Metrics

**Velocity:**
- Total plans completed: 11
- Average duration: 3 min
- Total execution time: 0.56 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Workspace Shell | 2 | 8 min | 4 min |
| 2. Project Configuration | 3 | 5 min | 2 min |
| 3. Dependency Browser | 2 | 4 min | 2 min |

**Recent Trend:**
- Last 5 plans: 1 min, 3 min, 1 min, 3 min, 5 min
- Trend: Stable delivery with low per-plan execution time

*Updated after each plan completion*
| Phase 01 P02 | 5 min | 3 tasks | 11 files |
| Phase 02 P01 | 2 min | 3 tasks | 3 files |
| Phase 02 P02 | 2 min | 3 tasks | 6 files |
| Phase 02 P03 | 1 min | 3 tasks | 1 file |
| Phase 03 P01 | 3 min | 3 tasks | 4 files |
| Phase 03 P02 | 1 min | 2 tasks | 2 files |
| Phase 04-live-preview P01 | 5 min | 3 tasks | 8 files |
| Phase 04-live-preview P02 | 6 min | 3 tasks | 7 files |
| Phase 05-generation-sharing P01 | 3 min | 3 tasks | 6 files |
| Phase 05-generation-sharing P02 | 3 min | 3 tasks | 6 files |
| Phase 06-github-integration P01 | 5 min | 3 tasks | 11 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- TanStack Start for frontend + BFF (server functions handle API proxying)
- shadcn/ui + Tailwind for UI components
- Proxy Spring Initializr API (not self-host)
- No landing page -- straight to workspace
- Presets via URL encoding (no database)
- [Phase 01-foundation-workspace-shell]: Render WorkspaceShell directly from / to enforce no-landing workflow
- [Phase 01-foundation-workspace-shell]: Use CSS variables plus .dark class toggling for global theme token switching
- [Phase 01-foundation-workspace-shell]: Persist theme in localStorage using a dedicated ThemeProvider context
- [Phase 01]: Return discriminated success/error payloads from metadata server function to keep upstream failure details sanitized
- [Phase 01]: Keep metadata caching as a single-entry in-memory TTL cache (5 minutes) for Phase 1
- [Phase 01]: Mount QueryClientProvider at root so metadata hook can use TanStack Query across workspace views
- [Phase 02]: Keep project configuration model in `src/lib/project-config.ts` as React-free helpers for upcoming URL/localStorage persistence
- [Phase 02]: Derive Java and Spring Boot options from BFF metadata with fallback defaults when metadata is unavailable
- [Phase 02]: Keep `WorkspaceShell` as owner of `ProjectConfig` state and pass controlled props to `ConfigurationSidebar`
- [Phase 02]: Use `useProjectConfigState` (nuqs `useQueryStates`) as the single source of truth for workspace configuration state
- [Phase 02]: Enforce precedence `URL query params -> localStorage snapshot -> hard defaults` when hydrating project config
- [Phase 02]: Normalize URL/storage config values in `src/lib/project-config.ts` before UI render and persistence writes
- [Phase 02]: Mounted NuqsAdapter in root route shell so nuqs hooks run inside TanStack Router adapter context
- [Phase 02]: Preserved existing provider ordering and retained URL->storage->defaults hydration precedence without adding fallback state branches
- [Phase 03]: Kept dependency selection and search state local to useDependencyBrowser for Phase 3 interaction scope
- [Phase 03]: Disabled dependency interactions until metadata readiness to preserve loading/error safeguards
- [Phase 03]: Treat WorkspaceShell as canonical owner of useDependencyBrowser in must_haves wiring contracts
- [Phase 03]: Keep DependencyBrowser documented as presentational and fed by parent props
- [Phase 04-live-preview]: Generate preview snapshots server-side from starter.zip with sanitized ok/error payloads.
- [Phase 04-live-preview]: Use react-arborist virtualization with deterministic node IDs for stable scrolling on large trees.
- [Phase 04-live-preview]: Debounce preview refresh by 350ms and keep previous query data to prevent request storms.
- [Phase 04-live-preview]: Use Shiki for extension-aware syntax highlighting so generated Spring project files render with language-appropriate tokens.
- [Phase 04-live-preview]: Compute PREV-04 diffs only when dependency selections change by snapshotting a dependency-change baseline and comparing against the refreshed preview.
- [Phase 04-live-preview]: Represent diff output as deterministic per-file metadata plus line additions/removals to drive both tree badges and viewer gutter highlights.
- [Phase 05-generation-sharing]: Keep generation query output as ordered tuple entries so URLSearchParams serialization remains deterministic in tests and server calls.
- [Phase 05-generation-sharing]: Normalize all download failures to PROJECT_DOWNLOAD_UNAVAILABLE with retryable messaging to preserve BFF error-sanitization guarantees.
- [Phase 05-generation-sharing]: Use explicit `share` token schema versioning (`v: 1`) and null fallback for malformed/unsupported snapshots.
- [Phase 05-generation-sharing]: Generate canonical share links through URL API with only the `share` query param.
- [Phase 05-generation-sharing]: Keep download server-function payload encoding browser-import-safe by avoiding direct `node:buffer` imports.
- [Phase 06-github-integration]: Kept OAuth lifecycle in TanStack Start server functions with sanitized GITHUB_AUTH_* response contracts.
- [Phase 06-github-integration]: Added /api/github/oauth/callback route to complete OAuth round-trip inside WorkspaceShell.
- [Phase 06-github-integration]: Used github-oauth-session.server.ts bridge for server-only session runtime access.

### Pending Todos

None yet.

### Blockers/Concerns

- `npm run build` currently fails with TanStack Router SSR stream bundling error (`Readable` export from `node:stream`) and needs follow-up before phase-complete verification.

## Session Continuity

Last session: 2026-02-14
Stopped at: Completed 06-github-integration-01-PLAN.md
Resume file: None
