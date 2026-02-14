# Roadmap: Better Spring Initializr

## Overview

This roadmap delivers a modern Spring Boot project generator with workspace UI, live preview, and GitHub integration. It starts with the BFF foundation and workspace shell, layers in configuration and dependency selection, adds live preview with diffs, then delivers generation/sharing, GitHub push, and curated presets. Each phase delivers a verifiable capability that builds toward the complete tool.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Workspace Shell** - BFF proxy, API caching, and workspace layout that opens straight to the tool
- [ ] **Phase 2: Project Configuration** - Sidebar with all project metadata and build options
- [ ] **Phase 3: Dependency Browser** - Searchable, categorized dependency selection with visual cards
- [ ] **Phase 4: Live Preview** - Real-time file tree, file viewer, and diff highlighting
- [ ] **Phase 5: Generation & Sharing** - ZIP download and shareable configuration URLs
- [ ] **Phase 6: GitHub Integration** - OAuth flow and push-to-GitHub functionality
- [ ] **Phase 7: Curated Presets** - Browse and apply pre-configured project templates

## Phase Details

### Phase 1: Foundation & Workspace Shell
**Goal**: Developers see a polished workspace UI immediately on load, backed by a working BFF proxy that serves Spring Initializr metadata
**Depends on**: Nothing (first phase)
**Requirements**: INFR-01, INFR-02, LAYO-01, LAYO-04
**Success Criteria** (what must be TRUE):
  1. App opens directly into a workspace layout with no landing page or splash screen
  2. BFF server functions successfully proxy Spring Initializr API metadata (dependencies, versions, boot versions)
  3. API metadata responses are cached so repeated loads do not hit the upstream API
  4. User can toggle between dark and light theme
**Plans**: 2 plans

Plans:
- [ ] 01-foundation-workspace-shell-01-PLAN.md - TanStack Start setup, direct workspace shell, and dark/light theme toggle
- [ ] 01-foundation-workspace-shell-02-PLAN.md - Spring Initializr metadata BFF server functions with TTL caching and workspace integration

### Phase 2: Project Configuration
**Goal**: Users can fully configure a Spring Boot project's metadata and build settings through an intuitive sidebar
**Depends on**: Phase 1
**Requirements**: CONF-01, CONF-02, CONF-03, CONF-04, CONF-05, CONF-06, LAYO-02, LAYO-05
**Success Criteria** (what must be TRUE):
  1. User can set all project metadata fields (group, artifact, name, description, package name) in the sidebar
  2. User can select Java version, Spring Boot version, build tool (Maven/Gradle), language (Java/Kotlin), and packaging (JAR/WAR) from available options fetched from the API
  3. Sidebar sections are collapsible and organized logically
  4. User's last configuration persists across browser sessions via local storage
**Plans**: TBD

Plans:
- [ ] 02-01: Configuration sidebar with collapsible sections and all form fields
- [ ] 02-02: URL state sync (nuqs) and local storage persistence

### Phase 3: Dependency Browser
**Goal**: Users can discover, search, and select dependencies through an intuitive visual interface
**Depends on**: Phase 2
**Requirements**: DEPS-01, DEPS-02, DEPS-03, DEPS-04, DEPS-05
**Success Criteria** (what must be TRUE):
  1. User can browse dependencies organized by category (Web, Data, Security, etc.) with visual cards showing name, description, and category tags
  2. User can search dependencies by name or description with instant filtering
  3. User can toggle dependencies on/off with clear visual feedback (selected state)
  4. User can see the count of selected dependencies and clear all selections
**Plans**: TBD

Plans:
- [ ] 03-01: Categorized dependency browser with search, cards, and toggle selection

### Phase 4: Live Preview
**Goal**: Users see exactly what their configured project looks like before generating it, with real-time feedback on every change
**Depends on**: Phase 3
**Requirements**: PREV-01, PREV-02, PREV-03, PREV-04, LAYO-03
**Success Criteria** (what must be TRUE):
  1. Main area displays a file tree of the generated project that updates in real-time as configuration changes
  2. User can click any file in the tree to view its contents with syntax highlighting
  3. When user toggles a dependency, diff highlighting shows exactly what changed in affected files
  4. File tree renders smoothly even for projects with many files (virtualized rendering)
**Plans**: TBD

Plans:
- [ ] 04-01: Client-side file tree computation and virtualized tree rendering (react-arborist)
- [ ] 04-02: File content viewer with syntax highlighting and diff display

### Phase 5: Generation & Sharing
**Goal**: Users can download their configured project and share their configuration with others
**Depends on**: Phase 4
**Requirements**: OUTP-01, OUTP-02
**Success Criteria** (what must be TRUE):
  1. User can download the configured project as a ZIP file with one click
  2. User can copy a shareable URL that, when opened by anyone, restores the exact same configuration
**Plans**: TBD

Plans:
- [ ] 05-01: ZIP generation via Spring Initializr API proxy and shareable URL encoding

### Phase 6: GitHub Integration
**Goal**: Users can push their generated project directly to a new GitHub repository without leaving the tool
**Depends on**: Phase 5
**Requirements**: OUTP-03, INFR-03
**Success Criteria** (what must be TRUE):
  1. User can authenticate with GitHub via OAuth with clear permission explanation
  2. User can specify organization and repository name for the new repo
  3. User can push the generated project to GitHub and see a link to the created repository
  4. OAuth tokens are handled securely (server-side, httpOnly cookies, not exposed to client)
**Plans**: TBD

Plans:
- [ ] 06-01: GitHub OAuth flow with secure token management
- [ ] 06-02: Repository creation and project push server function

### Phase 7: Curated Presets
**Goal**: Users can jumpstart their project configuration by browsing and applying curated presets for common use cases
**Depends on**: Phase 2
**Requirements**: PRST-01, PRST-02, PRST-03
**Success Criteria** (what must be TRUE):
  1. User can browse a list of curated presets (e.g., "REST API + Postgres + Docker", "Reactive Microservice")
  2. User can see what a preset includes (dependencies, config) before applying it
  3. User can apply a preset and see the sidebar and preview update with the preset's configuration
**Plans**: TBD

Plans:
- [ ] 07-01: Preset data structure, browsing UI, and apply functionality

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Workspace Shell | 0/2 | Not started | - |
| 2. Project Configuration | 0/2 | Not started | - |
| 3. Dependency Browser | 0/1 | Not started | - |
| 4. Live Preview | 0/2 | Not started | - |
| 5. Generation & Sharing | 0/1 | Not started | - |
| 6. GitHub Integration | 0/2 | Not started | - |
| 7. Curated Presets | 0/1 | Not started | - |
