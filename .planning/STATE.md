# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** Developers can visually configure and preview a Spring Boot project with real-time feedback, then generate it instantly
**Current focus:** Phase 3 - Dependency Browser

## Current Position

Phase: 3 of 7 (Dependency Browser)
Plan: 0 of 1 in current phase
Status: In progress
Last activity: 2026-02-14 -- Completed 02-project-configuration-02-PLAN.md

Progress: [###.......] 33%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 3 min
- Total execution time: 0.20 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Workspace Shell | 2 | 8 min | 4 min |
| 2. Project Configuration | 2 | 4 min | 2 min |

**Recent Trend:**
- Last 5 plans: 3 min, 5 min, 2 min, 2 min
- Trend: Stable delivery with consistent short execution cycles

*Updated after each plan completion*
| Phase 01 P02 | 5 min | 3 tasks | 11 files |
| Phase 02 P01 | 2 min | 3 tasks | 3 files |
| Phase 02 P02 | 2 min | 3 tasks | 6 files |

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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-14
Stopped at: Completed 02-project-configuration-02-PLAN.md
Resume file: None
