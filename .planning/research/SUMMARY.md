# Project Research Summary

**Project:** Better Spring Initializr (Milestone v1.0.1 UX Refinements)
**Domain:** Brownfield UX and reliability refinements for a workspace-style Spring project generator
**Researched:** 2026-02-14
**Confidence:** HIGH

## Executive Summary

This milestone is not a rebuild; it is a quality and trust pass on an existing TanStack Start + React application. The research converges on a brownfield strategy: keep the current stack and architecture boundaries, refine the workspace information hierarchy, and harden reliability in preview and publish flows. Experts build this kind of milestone by reducing UI noise, improving state determinism, and preserving proven integration contracts instead of introducing new platforms.

The recommended approach is to ship an action-first workflow around generation outputs (download/share/publish), defer GitHub auth until publish intent, and move OAuth callback completion to a route boundary so it cannot break when UI panels change. In parallel, tighten preview behavior with query cancellation, targeted retry policies, and stable rendering primitives (Shiki with transformers and highlighter caching). For styling, use existing Tailwind v4 tokens to fix light-mode contrast and flatten nested card chrome; do not add a new design system.

The key risks are trust regressions disguised as UX cleanup: hiding critical warnings while reducing noise, losing publish intent across OAuth redirects, stale preview data overwriting newer selections, and accessibility regressions from visual-only tweaks. Mitigation is explicit: establish message taxonomy first, preserve user intent across auth redirects, enforce cancellation/revision guards in preview flow, and gate rollout with telemetry and kill switches for high-risk behavior changes.

## Key Findings

### Recommended Stack

For v1.0.1, the stack recommendation is conservative and focused: keep core framework/runtime packages, update only preview rendering dependencies where needed, and implement reliability via existing TanStack Query capabilities instead of adding new fetch/retry libraries.

**Core technologies:**
- TanStack Start (`@tanstack/react-start@^1.132.0`): app shell + server functions; supports refactor without architecture migration.
- React 19 (`react@^19.2.0`): sufficient for all component-level UX refinements in milestone scope.
- Tailwind CSS v4 (`tailwindcss@^4.1.18`): token-level contrast and spacing cleanup in existing visual language.
- TanStack Query (`@tanstack/react-query@^5.90.21`): preview reliability via built-in retry, backoff, and cancellation.
- Shiki (`shiki@^3.22.0`): syntax highlighting consistency for code preview; update from older v3 patch line.
- `@shikijs/transformers` (`^3.22.0`): indentation/whitespace readability improvements without Monaco migration.

**Critical version notes:**
- Keep `shiki` and `@shikijs/transformers` on aligned `^3.22.0` to avoid runtime/transformer drift.
- No framework/runtime migrations are required for this milestone.

### Expected Features

v1.0.1 table stakes focus on clarity and trust for existing workflows, not net-new product surface area.

**Must have (table stakes):**
- Accessible light mode contrast baseline (WCAG 2.2 target for body text).
- Notification hygiene with severity control and warning consolidation.
- Progressive disclosure for GitHub auth (auth shown when publishing, not upfront).
- Reliable preview lifecycle (loading/success/stale/error with fallback behavior).
- IA simplification (global header + reduced nested card hierarchy).

**Should have (competitive):**
- Signal-over-noise warning model with consolidated quality summary.
- Intent-aware action surfacing across configure -> preview -> generate -> publish.
- Preview trust indicators (freshness/fidelity badges).
- Optional focus mode for dense configuration sessions.

**Defer (v2+):**
- Role-based UI density profiles.
- Adaptive warning prioritization driven by usage analytics.

### Architecture Approach

Architecture guidance is explicit: keep current boundaries, refactor composition. `WorkspaceShell` remains orchestration root, `workspace-output-actions` becomes an action-first hub, and a dedicated publish flow encapsulates auth/push state. OAuth completion must be route-owned (`api.github.oauth.callback.tsx`), not panel-owned side effects. Preview reliability should use a two-stage pipeline (snapshot retrieval then rendering), with query cancellation and stale-result safeguards. Shiki highlighter lifecycle should be singleton/cached, with graceful plain-text fallback.

**Major components:**
1. `WorkspaceShell` - cross-panel layout/state owner; reduced card nesting and clearer hierarchy.
2. `OutputActionHub` + `PublishFlowPanel` - action-first output UX; deferred auth and publish orchestration.
3. OAuth callback route - deterministic callback completion and status handoff independent of panel mount.
4. `useProjectPreview` + preview rendering components - debounce, cancellation, fallback, and display reliability.
5. Shared highlight/render primitives (`preview-code-viewport`, `shiki-highlighter`) - stable code readability behavior.

### Critical Pitfalls

1. **Warning cleanup hides real risk** - prevent with severity taxonomy (`blocking`, `actionable`, `info`) before UI cleanup.
2. **Deferred auth loses intent after redirect** - persist signed short-lived pending action context and resume idempotently.
3. **Deferred auth feels like surprise friction** - disclose auth/scopes near publish affordance before redirect.
4. **Stale preview responses overwrite current state** - propagate `AbortSignal`, add request revisioning, discard late responses.
5. **Query defaults amplify noise/retry storms** - tune preview query defaults and suppress user-facing canceled-request noise.

## Implications for Roadmap

Based on combined findings, this milestone should be delivered in five brownfield phases aligned to existing boundaries and risk controls.

### Phase 1: Trust Model and Integration Guardrails
**Rationale:** Message taxonomy and state ownership must be defined first to avoid rework and hidden complexity debt.
**Delivers:** Severity model, status-to-component mapping, state-boundary rules, baseline telemetry for trust regressions.
**Addresses:** Notification hygiene foundation and warning consolidation prerequisites.
**Avoids:** Pitfall 1 (over-pruned warnings) and Pitfall 7 (multi-source-of-truth reliability debt).

### Phase 2: Readability and Information Architecture Pass
**Rationale:** Visual clarity and orientation improvements are low-risk, high-impact, and unblock later workflow changes.
**Delivers:** Light-mode contrast fixes, global header, flattened card hierarchy, auth requirement copy near gated actions.
**Addresses:** Contrast baseline, IA simplification, progressive disclosure copy.
**Uses:** Existing Tailwind v4 tokens and workspace components.
**Avoids:** Pitfall 3 (surprise auth friction) and Pitfall 6 (a11y semantic regressions).

### Phase 3: Action-First Publish Flow + OAuth Decoupling
**Rationale:** Publish/auth refactor depends on prior IA clarity and trust messaging; callback decoupling is prerequisite safety.
**Delivers:** OutputActionHub behavior, publish-only auth trigger, callback route completion, intent resume after redirect.
**Addresses:** Deferred GitHub auth presentation and intent-aware action surfacing baseline.
**Implements:** `use-github-publish-flow`, `publish-flow-panel`, callback route boundary.
**Avoids:** Pitfall 2 (intent loss after OAuth redirect).

### Phase 4: Preview Reliability and Code Readability Hardening
**Rationale:** Once interaction flow stabilizes, tune preview data plane and rendering internals to eliminate stale/noisy states.
**Delivers:** Query cancellation/retry tuning, stale guard behavior, stable file selection/tree rendering, Shiki transformer upgrades.
**Addresses:** Reliable preview lifecycle and preview trust foundation.
**Uses:** TanStack Query retry/cancel primitives, Shiki `^3.22.0`, `@shikijs/transformers`.
**Avoids:** Pitfall 4 (stale response mismatch) and Pitfall 5 (retry/noise storms).

### Phase 5: Release Hardening and Staged Rollout
**Rationale:** This milestone touches auth and reliability paths; rollout discipline is mandatory even for "UX" scope.
**Delivers:** Feature flags/kill switches, funnel and error telemetry baselines, staged rollout and rollback playbook.
**Addresses:** Safe adoption across existing user workflows.
**Avoids:** Pitfall 8 (no safe rollout path).

### Phase Ordering Rationale

- Order follows architectural dependencies from `ARCHITECTURE.md`: callback boundary and publish orchestration before panel retirement; preview tuning after UI interaction patterns settle.
- Grouping keeps brownfield risk localized: composition and copy first, behavior changes second, reliability tuning third.
- Pitfall prevention is front-loaded: trust taxonomy and state boundaries before visual cleanup; OAuth intent preservation before auth deferral goes live.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** OAuth intent resume details (signed pending-action payload shape, TTL, idempotent callback semantics) should get focused implementation research.
- **Phase 5:** Rollout instrumentation thresholds (preview mismatch, publish drop-off, warning effectiveness) need project-specific metric baselines.

Phases with standard patterns (skip research-phase):
- **Phase 2:** Contrast/token adjustments and header/layout flattening are established, well-documented UI refactor patterns.
- **Phase 4:** TanStack Query cancellation/retry tuning and Shiki transformer adoption are well-supported by official docs.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Recommendations are incremental and backed by official package/docs with current version checks. |
| Features | MEDIUM-HIGH | Strong pattern alignment from WCAG/VS Code/Primer plus product heuristics; some prioritization still product-context dependent. |
| Architecture | HIGH | Built directly on current repo structure and brownfield-safe boundary changes. |
| Pitfalls | MEDIUM-HIGH | Risks are well-documented in official OAuth/Query/WCAG sources; exact impact size needs local telemetry validation. |

**Overall confidence:** HIGH

### Gaps to Address

- OAuth intent payload contract and replay safeguards: define exact stored fields, signing scheme, TTL, and one-time consumption rules during Phase 3 planning.
- Preview trust indicator semantics: decide canonical freshness marker (hash/timestamp/version) and user-facing copy thresholds before shipping badges.
- Warning policy effectiveness targets: set measurable goals (reduced noise without increased support incidents) before rollout.
- Accessibility regression checks in CI: confirm concrete automation approach for contrast/status semantics in this repo.

## Sources

### Primary (HIGH confidence)
- TanStack Query docs - retries, query functions, cancellation, defaults: https://tanstack.com/query/latest/docs/framework/react/
- TanStack Start server functions docs: https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
- Shiki docs (install + transformers): https://shiki.style/guide/install and https://shiki.style/packages/transformers
- GitHub OAuth and REST best practices/rate limits: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/ and https://docs.github.com/en/rest/using-the-rest-api/
- WCAG 2.2 contrast/status guidance: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html and https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- Spring Initializr service reference: https://start.spring.io

### Secondary (MEDIUM confidence)
- GitHub Primer product UI patterns (navigation, loading, progressive disclosure, page header): https://primer.style/product/ui-patterns/
- VS Code notification UX guidelines: https://code.visualstudio.com/api/ux-guidelines/notifications
- NN/g progressive disclosure and error messaging heuristics: https://www.nngroup.com/articles/progressive-disclosure/ and https://www.nngroup.com/articles/error-message-guidelines/
- GOV.UK error-summary/warning-text semantics: https://design-system.service.gov.uk/components/error-summary/ and https://design-system.service.gov.uk/components/warning-text/

### Tertiary (LOW confidence)
- None identified in current milestone synthesis.

---
*Research completed: 2026-02-14*
*Ready for roadmap: yes*
