# Better Spring Initializr

## What This Is

A workspace-first Spring Boot project generator built on top of Spring Initializr. It opens directly into configuration, dependency selection, and live preview, then supports generation/download, share links, and direct GitHub publish.

## Core Value

Developers can visually configure and preview a Spring Boot project with real-time feedback, then generate or publish it instantly.

## Current State

- **Shipped version:** v1.0 MVP (2026-02-14)
- **Milestone scope:** Phases 1-7 complete, 14 plans executed
- **Delivered capabilities:**
  - Workspace-first UX (no landing page), theme toggle, collapsible sidebar controls
  - Metadata-driven project configuration with URL/localStorage persistence
  - Searchable dependency browser with selected-count and clear-all flow
  - Live preview pipeline (virtualized file tree, syntax highlighting, dependency diffs)
  - ZIP generation/download, shareable configuration URLs
  - GitHub OAuth and create-and-push repository flow
  - Curated presets with dependency includes inspection and dependency-only apply behavior

## Next Milestone Goals

- Define v1.1 scope and fresh requirements via `/gsd-new-milestone`
- Expand preset strategy (custom/community sharing and import)
- Add stronger compatibility guidance (dependency conflicts, upgrade cues)
- Improve productivity UX (keyboard workflows and broader responsive polish)

## Requirements Snapshot

### Validated

- v1 MVP requirements are archived as shipped in `.planning/milestones/v1.0-REQUIREMENTS.md`

### Active

- None yet (to be defined in next milestone)

### Out of Scope (still true after v1.0)

- Full browser IDE
- User account system beyond GitHub OAuth for publish
- Real-time collaboration
- AI code generation
- Custom dependency registries

## Context

- Spring Initializr remains the upstream generation engine; this product differentiates through UX, live preview, and workflow speed.
- v1 established reliable BFF contracts, deterministic state handling, and a complete "configure -> preview -> output" flow.
- Post-v1 feedback clarified preset behavior: preset apply should not overwrite project metadata/build fields.

## Constraints

- **Upstream dependency:** Availability/behavior of Spring Initializr API
- **Tech stack baseline:** TanStack Start + server functions, React, Tailwind, shadcn/ui-style component patterns
- **OAuth dependency:** GitHub OAuth app credentials required for publish flow
- **No database (current model):** Sharing/presets stay URL and in-repo data driven until next milestone decides otherwise

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TanStack Start for frontend + BFF | Single stack for UI and server functions | ✓ Good (v1.0) |
| Proxy Spring Initializr API | Keep generation source canonical and up to date | ✓ Good (v1.0) |
| No landing page; go straight to workspace | Tool-first UX | ✓ Good (v1.0) |
| URL/localStorage as canonical state persistence | Shareability and deterministic restore without backend state | ✓ Good (v1.0) |
| Curated presets in static catalog | Fast, deterministic v1 rollout | ✓ Good (v1.0) |
| Preset apply behavior adjusted to dependency-only | Protect user-entered metadata/build fields | ✓ Good (post-v1 acceptance) |

---
*Last updated: 2026-02-14 after v1.0 milestone completion*
