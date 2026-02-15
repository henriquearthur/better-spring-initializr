# Roadmap: Better Spring Initializr

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7 complete (14 plans, shipped 2026-02-14); archive: `.planning/milestones/v1.0-ROADMAP.md`
- 🚧 **v1.0.1 UX Refinements** — Phases 8-12 planned

## Overview

This milestone refines the shipped workspace experience without redesigning it. The roadmap focuses on readability, reduced cognitive load, output-flow clarity, and preview reliability while preserving the existing visual identity and architecture boundaries.

## Phases

- [ ] **Phase 8: Readability and Orientation** - Improve light-mode legibility and add a clear workspace header with identity and quick links.
- [ ] **Phase 9: Workspace Density Controls** - Simplify hierarchy and let users progressively reveal complex configuration controls.
- [ ] **Phase 10: Actionable Messaging** - Keep primary workflow messaging concise and clearly distinguish blocking from non-blocking guidance.
- [ ] **Phase 11: Action-First Output Flow** - Make users choose output action before any GitHub auth, only gating on publish intent.
- [ ] **Phase 12: Preview Quality and Reliability** - Harden preview formatting and state transitions so users can trust generated output.

## Phase Details

### Phase 8: Readability and Orientation
**Goal**: Users can immediately orient themselves and comfortably read workspace content in light mode.
**Depends on**: Phase 7
**Requirements**: LAYO-06, LAYO-07
**Success Criteria** (what must be TRUE):
  1. User can read primary body text and controls in light mode without low-contrast hotspots.
  2. User can see a persistent top header with product identity from any workspace state.
  3. User can access key links (including GitHub) directly from the header without leaving core workflow context.
**Plans**: TBD

### Phase 9: Workspace Density Controls
**Goal**: Users can reduce visual overwhelm while keeping the familiar workspace structure.
**Depends on**: Phase 8
**Requirements**: LAYO-08, LAYO-09, LAYO-10
**Success Criteria** (what must be TRUE):
  1. User can navigate a flatter workspace hierarchy with less nested card chrome.
  2. User can collapse non-essential configuration groups and keep essential controls visible.
  3. User can toggle focus mode to minimize non-essential UI chrome during configuration work.
**Plans**: TBD

### Phase 10: Actionable Messaging
**Goal**: Users receive concise, trustworthy guidance that highlights what needs action now.
**Depends on**: Phase 9
**Requirements**: WARN-01, WARN-02
**Success Criteria** (what must be TRUE):
  1. User sees only actionable warnings in the primary flow; informational noise is hidden or collapsed.
  2. User can distinguish blocking issues from non-blocking guidance at a glance via clear severity treatment.
  3. User can identify what to do next from warning copy without reading dense technical detail.
**Plans**: TBD

### Phase 11: Action-First Output Flow
**Goal**: Users complete generate/download/share paths without auth friction, and authenticate only when publishing.
**Depends on**: Phase 10
**Requirements**: OUTP-04, OUTP-05, OUTP-06
**Success Criteria** (what must be TRUE):
  1. User can generate, download, and share project output without being prompted to authenticate with GitHub.
  2. User sees a clear post-generation choice between download, share, and publish.
  3. User is prompted for GitHub authentication only after explicitly selecting publish.
**Plans**: TBD

### Phase 12: Preview Quality and Reliability
**Goal**: Users can trust preview readability and recover gracefully from temporary preview failures.
**Depends on**: Phase 11
**Requirements**: PREV-05, PREV-06, PREV-07
**Success Criteria** (what must be TRUE):
  1. User sees code preview with correct padding and stable cursor behavior.
  2. User sees properly indented preview content across generated files.
  3. User observes stable preview transitions between loading, success, and error states.
  4. User can recover from temporary preview failures without losing the ability to continue configuring.
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 8. Readability and Orientation | 0/TBD | Not started | - |
| 9. Workspace Density Controls | 0/TBD | Not started | - |
| 10. Actionable Messaging | 0/TBD | Not started | - |
| 11. Action-First Output Flow | 0/TBD | Not started | - |
| 12. Preview Quality and Reliability | 0/TBD | Not started | - |
