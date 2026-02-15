# Requirements: Better Spring Initializr

**Defined:** 2026-02-14
**Core Value:** Developers can visually configure and preview a Spring Boot project with real-time feedback, then generate or publish it instantly.

## v1 Requirements

Requirements for milestone v1.0.1 UX Refinements.

### Layout & Readability

- [ ] **LAYO-06**: User can read all primary workspace text in light mode without low-contrast sections.
- [ ] **LAYO-07**: User sees a top header with product identity and quick links (including GitHub).
- [ ] **LAYO-08**: User can use a workspace layout with reduced card nesting and clearer section hierarchy.
- [ ] **LAYO-09**: User can collapse non-essential configuration sections to reduce overwhelm.
- [ ] **LAYO-10**: User can toggle a focus mode that minimizes non-essential UI chrome.

### Messaging & Guidance

- [ ] **WARN-01**: User sees only actionable warnings in the primary workflow; non-actionable notices are hidden or collapsed.
- [ ] **WARN-02**: User can distinguish blocking issues from non-blocking guidance at a glance.

### Output & Publish Flow

- [ ] **OUTP-04**: User can generate, download, and share without seeing GitHub authentication first.
- [ ] **OUTP-05**: After generation, user can choose output action (download, share, or publish).
- [ ] **OUTP-06**: User only sees GitHub authentication when selecting publish.

### Preview Quality & Reliability

- [ ] **PREV-05**: User sees code preview with correct padding and cursor behavior.
- [ ] **PREV-06**: User sees properly indented preview content.
- [ ] **PREV-07**: User sees stable preview state transitions (loading, success, error) with recovery on temporary failures.

## v2 Requirements

Deferred to a future milestone.

### Messaging & Insights

- **WARN-03**: User can open an optional diagnostics drawer for full warning details without cluttering the main workspace.

### Preview Confidence

- **PREV-08**: User sees freshness/fidelity indicators that explain whether preview is live, stale, or fallback.

### Workspace Density

- **LAYO-11**: User can choose role-based density presets for different workflows.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full visual redesign | User requested refinement only; keep current visual identity |
| Forced GitHub auth before generation | Adds friction and clutter before user chooses publish |
| IDE-style multi-pane expansion | Scope expansion beyond UX refinement milestone |
| New persistence backend/database | Current milestone focuses on UX and reliability in existing architecture |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAYO-06 | TBD (roadmap pending) | Pending |
| LAYO-07 | TBD (roadmap pending) | Pending |
| LAYO-08 | TBD (roadmap pending) | Pending |
| LAYO-09 | TBD (roadmap pending) | Pending |
| LAYO-10 | TBD (roadmap pending) | Pending |
| WARN-01 | TBD (roadmap pending) | Pending |
| WARN-02 | TBD (roadmap pending) | Pending |
| OUTP-04 | TBD (roadmap pending) | Pending |
| OUTP-05 | TBD (roadmap pending) | Pending |
| OUTP-06 | TBD (roadmap pending) | Pending |
| PREV-05 | TBD (roadmap pending) | Pending |
| PREV-06 | TBD (roadmap pending) | Pending |
| PREV-07 | TBD (roadmap pending) | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 0
- Unmapped: 13 (roadmap pending)

---
*Requirements defined: 2026-02-14*
*Last updated: 2026-02-14 after milestone v1.0.1 requirement definition*
