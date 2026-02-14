# Feature Research

**Domain:** Developer Tooling UX Refinements (Spring Initializr workspace)
**Researched:** 2026-02-14
**Confidence:** MEDIUM-HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users now expect in mature tooling once core generation already exists.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Accessible light mode contrast baseline | Professional dev tools are expected to remain legible in both light and dark modes; unreadable text is seen as a product defect, not preference | MEDIUM | Add semantic color tokens and enforce WCAG 2.2 contrast floors (4.5:1 body text). Depends on existing workspace shell theme variables and current theme toggle |
| Notification hygiene and severity control | Mature tools minimize interruption and avoid warning spam; users expect warnings to be actionable and sparse | MEDIUM | Introduce notification policy: dedupe repeated warnings, collapse low-severity messages, persistent dismiss for non-critical notices. Depends on metadata validation, dependency checks, and preview/generation error emitters |
| Progressive disclosure for auth and advanced actions | Users expect "connect accounts" only when needed, not as an up-front blocker | LOW-MEDIUM | Keep GitHub publish hidden/secondary until a successful generation intent exists. Depends on existing generation/share flow and GitHub publish capability |
| Reliable preview states (loading/success/stale/error) | If preview exists, users expect it to be trustworthy and explicit about status | MEDIUM | Add deterministic preview lifecycle: skeleton while loading, stale marker when inputs changed, retry on failure, last-good snapshot fallback. Depends on current live preview service and metadata-config state |
| IA simplification with global header and reduced nesting | Mature dev UIs provide orientation first, then detail; too many nested cards are perceived as noise | MEDIUM | Introduce single global header (context + primary actions) and flatten card hierarchy to 1 level where possible. Depends on workspace shell layout and existing sidebar structure |
| Mobile and narrow viewport adaptation for side panels | Even dev tools are expected to remain usable on laptop splits/small windows | LOW-MEDIUM | Convert sidebars to collapsible/filter menu behavior on narrow viewports; preserve current page context. Depends on existing responsive shell and dependency browser panel logic |

### Differentiators (Competitive Advantage)

Refinement features that create a noticeably better "quality feel" than baseline tools.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Signal-over-noise warning model | Distinguishes blockers vs suggestions and shows a single "quality summary" instead of many labels | MEDIUM-HIGH | Compute severity budget per screen and show one consolidated status rail. Depends on all existing warning sources (dependency browser, preview, generation, GitHub publish) |
| Intent-aware action surfacing | UI reveals actions based on user stage (configure -> preview -> generate -> publish), reducing overwhelm | MEDIUM | Contextual CTA orchestration tied to workflow milestones. Depends on current generation/share and GitHub integration states |
| Preview trust indicators | Explicitly communicates preview fidelity (live, stale, fallback) to improve confidence before generation | MEDIUM | Add freshness timestamp/hash badge and "preview may differ" when degraded mode is active. Depends on preview pipeline + generation request serializer |
| Focus mode for dense configuration sessions | Lets power users collapse non-essential chrome and work with fewer distractions | LOW-MEDIUM | Optional compact mode that hides secondary cards/panels. Depends on workspace shell regions and sidebar toggles |

### Anti-Features (Commonly Requested, Often Problematic)

These sound helpful but usually degrade UX quality in this milestone.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Show every warning inline and globally | Teams fear users missing edge cases | Creates alert fatigue; important blockers are ignored in noise | Severity tiers + capped visible warnings + expandable "all diagnostics" drawer |
| Force GitHub auth before users can generate | Desire to simplify later publishing path | Premature friction and larger pre-generation UI footprint; increases abandonment | Defer auth until user clicks publish, keep generation path auth-free |
| Add more nested cards to "organize" settings | Attempt to group many controls quickly | Increases scanning cost and visual overwhelm, especially in sidebars | Flatten hierarchy, use section headings + progressive disclosure for advanced options |
| Full visual parity with IDE-level panes in v1.0.1 | "Feels professional" request | Scope explosion for a polish milestone; high maintenance burden | Keep focused generator workflow and improve clarity/reliability instead |

## Feature Dependencies

```
[Accessible light mode contrast baseline]
    └──requires──> [Workspace shell theme tokens]

[Notification hygiene and severity control]
    └──requires──> [Metadata validation events]
    └──requires──> [Dependency browser warning events]
    └──requires──> [Preview and generation error events]

[Progressive disclosure for auth]
    └──requires──> [Generation/share workflow state]
    └──requires──> [Existing GitHub publish integration]

[Reliable preview states]
    └──requires──> [Live preview engine]
    └──requires──> [Config state diffing]
    └──enhances──> [Generation confidence]

[IA simplification with global header]
    └──requires──> [Workspace shell layout regions]
    └──enhances──> [Dependency browser + preview readability]

[Focus mode]
    └──requires──> [Global header and panel visibility controls]
    └──enhances──> [All high-density workflows]
```

### Dependency Notes

- **Notification hygiene requires unified event taxonomy:** without normalized warning/error sources, dedupe and severity ranking will be inconsistent.
- **Deferred auth requires stable workflow checkpoints:** publish prompts should appear only after generation is valid, not on initial load.
- **Preview trust indicators require state hashing/versioning:** otherwise stale vs live cannot be communicated reliably.
- **Global header should ship before deeper panel tweaks:** it becomes the anchor for navigation and action placement.

## MVP Definition

### Launch With (v1.0.1)

Minimum refinement scope to resolve current user-reported UX pain.

- [ ] **Accessible light mode contrast baseline** — fixes readability defect and meets expected accessibility floor
- [ ] **Notification hygiene + warning consolidation** — removes warning noise and clarifies blockers
- [ ] **Deferred GitHub auth presentation** — shrinks pre-generation clutter and keeps core flow focused
- [ ] **Preview lifecycle hardening** — makes preview trustworthy via explicit loading/stale/error states
- [ ] **Global header + layout flattening pass** — reduces nested-card overwhelm and improves orientation

### Add After Validation (v1.0.x)

- [ ] **Intent-aware action surfacing** — trigger after telemetry shows remaining confusion in action discovery
- [ ] **Preview trust indicators (freshness/fidelity badges)** — trigger after baseline preview reliability is stable
- [ ] **Focus mode (compact workspace)** — trigger if power users request lower-chrome editing environment

### Future Consideration (v2+)

- [ ] **Role-based UI density profiles** — defer until persona segmentation data exists
- [ ] **Adaptive warning prioritization via usage analytics** — defer until enough interaction data exists

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Accessible light mode contrast baseline | HIGH | MEDIUM | P1 |
| Notification hygiene + warning consolidation | HIGH | MEDIUM | P1 |
| Deferred GitHub auth presentation | HIGH | LOW-MEDIUM | P1 |
| Preview lifecycle hardening | HIGH | MEDIUM | P1 |
| Global header + layout flattening | HIGH | MEDIUM | P1 |
| Intent-aware action surfacing | MEDIUM-HIGH | MEDIUM | P2 |
| Preview trust indicators | MEDIUM-HIGH | MEDIUM | P2 |
| Focus mode | MEDIUM | LOW-MEDIUM | P2 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have after P1 stabilization
- P3: Future milestone candidate

## Competitor Feature Analysis

| Feature | Mature Pattern in VS Code/GitHub/Spring tooling | Current Gap (from feedback) | Recommended v1.0.1 Approach |
|---------|---------------------------------------------------|-----------------------------|------------------------------|
| Message density | VS Code recommends minimal notifications, one at a time, avoid repeated interruptions | Too many warnings/noise labels | Single prioritized diagnostics surface + dedupe + dismiss memory |
| Navigation orientation | GitHub/Primer patterns emphasize clear top-level header and streamlined choices | Missing global header, nested cards/sidebar overwhelm | Add persistent global header and flatten hierarchy |
| Progressive disclosure | Mature products reveal advanced controls/contextual actions only when needed | GitHub auth UI oversized before generation | Show publish/auth controls at publish step, not initial step |
| Loading/preview feedback | GitHub/Primer loading guidance uses explicit state transitions and scoped loaders | Preview quality/reliability issues | Deterministic preview state machine + retry/fallback |
| Accessibility baseline | WCAG contrast minimum treated as baseline for text legibility | Light mode text unreadable | Enforce token-level contrast checks in CI and theme definitions |

## Sources

- W3C WCAG 2.2, Contrast Minimum (updated 2025-10-31): https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html (HIGH)
- VS Code UX Guidelines, Notifications (dated 2026-02-04): https://code.visualstudio.com/api/ux-guidelines/notifications (HIGH)
- GitHub Docs, OAuth app best practices (2026 docs): https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app (HIGH)
- GitHub Primer, Navigation pattern guidance: https://primer.style/product/ui-patterns/navigation/ (MEDIUM-HIGH)
- GitHub Primer, Loading pattern guidance: https://primer.style/product/ui-patterns/loading/ (MEDIUM-HIGH)
- GitHub Primer, Progressive disclosure pattern guidance: https://primer.style/product/ui-patterns/progressive-disclosure/ (MEDIUM-HIGH)
- GitHub Primer, PageHeader component guidance: https://primer.style/product/components/page-header/ (MEDIUM-HIGH)
- Spring Initializr service behavior (root/help): https://start.spring.io (HIGH)
- NN/g progressive disclosure and error-message guidelines (industry research, not vendor spec): https://www.nngroup.com/articles/progressive-disclosure/ and https://www.nngroup.com/articles/error-message-guidelines/ (MEDIUM)

---
*Feature research for: Better Spring Initializr v1.0.1 UX refinements*
*Researched: 2026-02-14*
*Confidence: MEDIUM-HIGH (official docs for accessibility/notification/auth patterns; some UX heuristics sourced from NN/g)*
