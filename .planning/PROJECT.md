# Better Spring Initializr

## What This Is

A modern, developer-focused alternative to start.spring.io for generating Spring Boot projects. It wraps the Spring Initializr API in a polished workspace UI inspired by TanStack Builder — no landing page, no marketing fluff, just a tool that opens straight into a configuration workspace with live project preview.

## Core Value

Developers can visually configure and preview a Spring Boot project with real-time feedback, then generate it instantly — faster, clearer, and more enjoyable than start.spring.io.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Workspace UI that loads immediately — no landing page, straight to the tool
- [ ] Left sidebar with collapsible configuration sections (metadata, build config, dependencies, presets)
- [ ] Project metadata configuration (group, artifact, name, description, package name, Java version)
- [ ] Build configuration (Spring Boot version, build tool Maven/Gradle, language Java/Kotlin)
- [ ] Searchable, categorized dependency browser with visual cards and brief descriptions
- [ ] Toggle dependencies on/off with instant preview updates
- [ ] Live file tree preview of the generated project in the main area
- [ ] Click-to-view file contents (pom.xml, build.gradle, application.yml, main class, etc.)
- [ ] Real-time diff highlighting when toggling dependencies — show exactly what changed
- [ ] Download generated project as ZIP
- [ ] Push generated project to GitHub (OAuth flow, pick org/repo name, create + push)
- [ ] Curated presets (e.g., "REST API + Postgres + Docker", "Reactive Microservice")
- [ ] Apply a preset to auto-fill config + dependencies
- [ ] Save current config as a shareable preset (URL or importable)
- [ ] Browse and import community presets
- [ ] BFF proxy via TanStack Start server functions wrapping Spring Initializr API
- [ ] Responsive, polished UI using shadcn/ui + Tailwind with distinctive design

### Out of Scope

- Landing page or marketing content — this is a dev tool, not a product site
- User accounts or authentication (beyond GitHub OAuth for push feature) — presets are shareable via URL, no login required
- Mobile-first design — desktop-first workspace, responsive but not mobile-optimized
- Hosting or running a custom Spring Initializr backend — we proxy the public API
- IDE plugins or CLI — web tool only for v1

## Context

- Spring Initializr (start.spring.io) has a functional but dated UI that hasn't evolved much visually. The dependency selection is a basic search box, there's no live preview of what you'll get, and no way to save/share configurations.
- TanStack Builder represents the modern approach: visual, immediate, workspace-style tools where devs configure and see results in real-time.
- The Spring Initializr project exposes a REST API that returns project metadata (available dependencies, versions, boot versions) and generates project archives. This is the engine we build on top of.
- shadcn/ui provides a strong component foundation but the design must have its own identity — not cookie-cutter AI-generated UI.
- Community presets create a network effect: the more people share presets, the more useful the tool becomes.

## Constraints

- **API dependency**: Spring Initializr public API availability and rate limits — the tool is only as reliable as the upstream API
- **Tech stack**: TanStack Start (frontend + server functions), shadcn/ui + Tailwind CSS — decided during initialization
- **GitHub OAuth**: Required for push-to-GitHub feature — needs GitHub App or OAuth App registration
- **No backend database for v1**: Presets stored as encoded URL params or shareable JSON — no user accounts or persistence layer

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TanStack Start for frontend + BFF | User preference, aligns with TanStack Builder inspiration, server functions handle API proxying | — Pending |
| shadcn/ui + Tailwind for UI | Modern component system with customization, avoids building from scratch | — Pending |
| Proxy Spring Initializr API (not self-host) | Simpler infrastructure, always up-to-date with latest Spring Boot versions | — Pending |
| No landing page — straight to workspace | Tool for devs, no sugar coating needed | — Pending |
| Presets via URL encoding (no database) | Zero infrastructure for sharing, anyone can share a link | — Pending |

---
*Last updated: 2026-02-14 after initialization*
