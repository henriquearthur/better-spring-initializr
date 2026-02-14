# Requirements: Better Spring Initializr

**Defined:** 2026-02-14
**Core Value:** Developers can visually configure and preview a Spring Boot project with real-time feedback, then generate it instantly

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Configuration

- [ ] **CONF-01**: User can set project metadata (group, artifact, name, description, package name)
- [ ] **CONF-02**: User can select Java version from available options
- [ ] **CONF-03**: User can select Spring Boot version from available versions
- [ ] **CONF-04**: User can choose build tool (Maven or Gradle)
- [ ] **CONF-05**: User can choose language (Java or Kotlin)
- [ ] **CONF-06**: User can choose packaging (JAR or WAR)

### Dependencies

- [ ] **DEPS-01**: User can browse dependencies organized by category (Web, Data, Security, etc.)
- [ ] **DEPS-02**: User can search dependencies by name or description
- [ ] **DEPS-03**: User sees dependency cards with name, description, and category tags
- [ ] **DEPS-04**: User can toggle dependencies on/off with visual feedback
- [ ] **DEPS-05**: User can see selected dependency count and clear all

### Preview

- [ ] **PREV-01**: User sees live file tree of the generated project in the main area
- [ ] **PREV-02**: User can click any file in the tree to view its contents with syntax highlighting
- [ ] **PREV-03**: User sees file tree and contents update in real-time as config changes
- [ ] **PREV-04**: User sees diff highlighting when toggling dependencies (what changed)

### Output

- [ ] **OUTP-01**: User can download generated project as ZIP
- [ ] **OUTP-02**: User can share current configuration via URL (shareable link)
- [ ] **OUTP-03**: User can push generated project to a new GitHub repository via OAuth

### Presets

- [ ] **PRST-01**: User can browse curated presets (e.g., "REST API + Postgres + Docker")
- [ ] **PRST-02**: User can apply a preset to auto-fill config and dependencies
- [ ] **PRST-03**: User can see what a preset includes before applying it

### Layout & UI

- [ ] **LAYO-01**: App opens directly into workspace -- no landing page
- [ ] **LAYO-02**: Left sidebar contains all configuration sections (collapsible)
- [ ] **LAYO-03**: Main area shows live preview (file tree + file viewer)
- [ ] **LAYO-04**: User can toggle dark/light theme
- [ ] **LAYO-05**: User's last configuration persists across browser sessions via local storage

### Infrastructure

- [ ] **INFR-01**: BFF proxy via TanStack Start server functions wrapping Spring Initializr API
- [ ] **INFR-02**: API metadata (dependencies, versions) cached to avoid excessive upstream calls
- [ ] **INFR-03**: GitHub OAuth flow handled securely via server functions

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Features

- **ENHC-01**: User can save/share custom presets as community presets
- **ENHC-02**: User can import community presets from other users
- **ENHC-03**: User sees dependency compatibility warnings for known conflicts
- **ENHC-04**: User sees migration path indicators (Spring Boot 2.x -> 3.x breaking changes)
- **ENHC-05**: User can navigate with keyboard shortcuts for common actions
- **ENHC-06**: Auto-generated README based on selected dependencies
- **ENHC-07**: Mobile-responsive workspace layout
- **ENHC-08**: Export as tar.gz format

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full browser IDE | Massive scope creep; users open in their IDE after download |
| User accounts / authentication | Local storage + shareable links cover 90% of use cases; avoids backend complexity |
| Real-time collaboration | WebSocket infrastructure and conflict resolution too costly for v1 |
| AI code generation | Out of scope; focus on configuration excellence |
| Custom dependency registries | Enterprise concern; focus on public Spring ecosystem |
| Dependency graph visualization | High complexity, requires data not in Spring Initializr API |
| Multi-project / monorepo templates | Major scope expansion beyond single project generation |
| Landing page / marketing | Dev tool, not a product site -- straight to workspace |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONF-01 | Phase 2 | Pending |
| CONF-02 | Phase 2 | Pending |
| CONF-03 | Phase 2 | Pending |
| CONF-04 | Phase 2 | Pending |
| CONF-05 | Phase 2 | Pending |
| CONF-06 | Phase 2 | Pending |
| DEPS-01 | Phase 3 | Pending |
| DEPS-02 | Phase 3 | Pending |
| DEPS-03 | Phase 3 | Pending |
| DEPS-04 | Phase 3 | Pending |
| DEPS-05 | Phase 3 | Pending |
| PREV-01 | Phase 4 | Pending |
| PREV-02 | Phase 4 | Pending |
| PREV-03 | Phase 4 | Pending |
| PREV-04 | Phase 4 | Pending |
| OUTP-01 | Phase 5 | Pending |
| OUTP-02 | Phase 5 | Pending |
| OUTP-03 | Phase 6 | Pending |
| PRST-01 | Phase 7 | Pending |
| PRST-02 | Phase 7 | Pending |
| PRST-03 | Phase 7 | Pending |
| LAYO-01 | Phase 1 | Pending |
| LAYO-02 | Phase 2 | Pending |
| LAYO-03 | Phase 4 | Pending |
| LAYO-04 | Phase 1 | Pending |
| LAYO-05 | Phase 2 | Pending |
| INFR-01 | Phase 1 | Pending |
| INFR-02 | Phase 1 | Pending |
| INFR-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-02-14*
*Last updated: 2026-02-14 after roadmap creation*
