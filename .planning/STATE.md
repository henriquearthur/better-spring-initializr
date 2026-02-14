# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** Developers can visually configure and preview a Spring Boot project with real-time feedback, then generate it instantly
**Current focus:** Phase 3 - Dependency Browser

## Current Position

Phase: 3 of 7 (Dependency Browser)
Plan: 2 of 2 in current phase
Status: Complete
Last activity: 2026-02-14 -- Completed 03-dependency-browser-02-PLAN.md

Progress: [######....] 54%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 3 min
- Total execution time: 0.27 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Workspace Shell | 2 | 8 min | 4 min |
| 2. Project Configuration | 3 | 5 min | 2 min |
| 3. Dependency Browser | 1 | 3 min | 3 min |

**Recent Trend:**
- Last 5 plans: 5 min, 2 min, 2 min, 1 min, 3 min
- Trend: Stable delivery with low per-plan execution time

*Updated after each plan completion*
| Phase 01 P02 | 5 min | 3 tasks | 11 files |
| Phase 02 P01 | 2 min | 3 tasks | 3 files |
| Phase 02 P02 | 2 min | 3 tasks | 6 files |
| Phase 02 P03 | 1 min | 3 tasks | 1 file |
| Phase 03 P01 | 3 min | 3 tasks | 4 files |
| Phase 03 P02 | 1 min | 2 tasks | 2 files |

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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-14
Stopped at: Completed 03-02-PLAN.md
Resume file: None
