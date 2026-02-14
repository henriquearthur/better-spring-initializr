# Pitfalls Research

**Domain:** Brownfield UX refinement for a developer tooling UI (v1.0.1)
**Researched:** 2026-02-14
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: "Warning Cleanup" Removes Real Risk Signals

**What goes wrong:**
Teams reduce warning noise by hiding or downgrading warnings globally, and users stop getting high-risk signals (destructive actions, auth scope implications, failed preview assumptions).

**Why it happens:**
In brownfield systems, warning channels are already mixed (validation, notifications, blockers), so cleanup is done at presentation layer without reclassifying message severity first.

**How to avoid:**
- Create a message taxonomy first: `blocking error`, `actionable warning`, `informational status`.
- Keep warning text for high-consequence cases only; move non-critical guidance to passive status/inline help.
- Add a severity-to-component map so warnings cannot be rendered as low-visibility toasts by default.
- Require one acceptance test per critical warning path (e.g., failed GitHub publish, preview drift, auth denied).

**Warning signs:**
- Drop in visible warnings but no drop in support tickets.
- Users repeat failed actions because they never saw the warning.
- Critical failures appear only in logs, not in UI.

**Phase to address:**
Phase 1 (Message taxonomy + trust model baseline)

---

### Pitfall 2: Action-Triggered Auth Loses User Intent

**What goes wrong:**
Deferring GitHub auth until publish is correct UX, but after OAuth redirect the original user intent (repo name, visibility, branch choice, pending preview) is lost and users must re-enter data.

**Why it happens:**
Legacy flows were built around an upfront auth state; redirect return path does not serialize pending action context.

**How to avoid:**
- Store a signed, short-lived "pending action" payload before redirect (action type + minimal context).
- Resume the exact action on callback, not just "return to app home".
- Display a post-auth confirmation step with preserved values before final mutate call.
- Treat callback as idempotent resume, not a fresh start.

**Warning signs:**
- Users authenticate successfully but abandon before publish completion.
- Repeated "Why did it forget my settings?" feedback.
- Callback route has high exit rate.

**Phase to address:**
Phase 3 (Auth flow deferral and intent resume)

---

### Pitfall 3: Deferred Auth Becomes Surprise Friction

**What goes wrong:**
Auth is deferred, but users only discover permission and scope requirements at the last click, creating trust loss at the point of highest intent.

**Why it happens:**
Teams remove all auth mentions from the UI to reduce clutter, instead of progressively disclosing what will be required for specific actions.

**How to avoid:**
- Add preflight disclosure next to gated actions ("GitHub sign-in required when publishing").
- Show requested scopes/permissions in plain language before redirect.
- Keep download/preview paths fully usable without auth.
- Provide explicit cancel path from auth prompt back to the same workspace state.

**Warning signs:**
- High click-through on "Publish" followed by auth cancel.
- Scope/permission confusion in issue reports.
- Users perceive OAuth prompt as unexpected or suspicious.

**Phase to address:**
Phase 2 (Readability + action affordance copy updates)

---

### Pitfall 4: Preview Reliability Regresses from Stale Responses

**What goes wrong:**
Fast option changes produce out-of-order responses; stale preview payloads overwrite newer state, so file tree/diff no longer matches current selections.

**Why it happens:**
Brownfield data-fetch code assumes "latest response wins" without cancellation or request versioning.

**How to avoid:**
- Use cancellation (`AbortSignal`) end-to-end in preview fetches.
- Tag each preview request with a monotonic revision and discard late responses.
- Keep "requested config hash" and "rendered config hash" visible in debug telemetry.
- Add contract tests for rapid toggling and network delay simulation.

**Warning signs:**
- Preview occasionally shows files for previously selected dependencies.
- Mismatch between selected options and generated diff.
- Intermittent, non-reproducible "wrong preview" bug reports.

**Phase to address:**
Phase 4 (Preview reliability hardening)

---

### Pitfall 5: Query Defaults Create Noise and Retry Storms

**What goes wrong:**
Background refetches, retries, and focus-triggered reloads generate duplicate loading states and repeated error banners, increasing perceived instability.

**Why it happens:**
Existing TanStack Query defaults are left untouched in a UX refinement milestone, while new messaging surfaces every transient failure.

**How to avoid:**
- Tune per-query defaults for preview endpoints (`staleTime`, retry policy, focus/refetch behavior).
- Suppress user-facing alerts for cancelled requests; only surface actionable failures.
- Separate transport retry telemetry from user-visible errors.
- Add anti-duplication guard for repeated identical notifications.

**Warning signs:**
- Error toast appears 2-3 times for one user action.
- Refocus tab triggers visible UI churn.
- Cancelled requests logged as user-facing failures.

**Phase to address:**
Phase 4 (Preview reliability hardening)

---

### Pitfall 6: Readability Tweaks Break Accessibility Semantics

**What goes wrong:**
Typography/contrast cleanup improves visual clarity for most users but silently breaks WCAG contrast and status announcement semantics for assistive tech users.

**Why it happens:**
Brownfield refactors change tokens/components, but no regression checks exist for contrast ratios, live regions, or focus behavior.

**How to avoid:**
- Enforce contrast thresholds in design tokens and CI checks.
- Map status classes to correct ARIA roles (`status` vs `alert`).
- Keep error summary + inline error linkage for forms/actions.
- Re-test keyboard and screen-reader paths after any message/UI copy changes.

**Warning signs:**
- "Looks cleaner" updates followed by accessibility bug reports.
- Important status updates are visible but not announced.
- Focus lands inconsistently after validation failures.

**Phase to address:**
Phase 2 (Readability and messaging pass)

---

### Pitfall 7: Reliability Fixes Add Hidden Complexity Debt

**What goes wrong:**
Quick fixes (extra caches, duplicate state stores, ad-hoc retry wrappers) stabilize one path but create multi-source-of-truth bugs across the app.

**Why it happens:**
In an existing codebase, teams patch local reliability issues instead of aligning with current state boundaries (URL state, query cache, UI store).

**How to avoid:**
- Define one owner per state type (server, URL, ephemeral UI) and enforce boundaries.
- Prefer adapter-layer fixes over component-local side effects.
- Require architecture note for any new cache/store introduced in v1.0.1.
- Track all "temporary" reliability shims with expiry criteria.

**Warning signs:**
- Same value stored in multiple places with drift.
- Fixing one reliability bug introduces another in adjacent flow.
- Growing number of "sync" effects between stores.

**Phase to address:**
Phase 1 (Integration audit and state-boundary guardrails)

---

### Pitfall 8: No Safe Rollout Path for UX Refinements

**What goes wrong:**
Small UX/reliability changes ship together with no feature gating or observability, making rollback coarse and root-cause isolation slow.

**Why it happens:**
Milestone is labeled "just UX polish," so release discipline is relaxed despite touching auth flow and preview correctness.

**How to avoid:**
- Gate major behavior changes (deferred auth, warning policy, preview cancellation strategy).
- Add success/failure funnel metrics before rollout.
- Roll out in slices and keep kill switches for high-risk behavior changes.
- Define "trust regressions" as release blockers (not cosmetic issues).

**Warning signs:**
- Post-release issue spike with unclear culprit.
- Rollback requires reverting unrelated UI work.
- No baseline metrics for preview mismatch or auth drop-off.

**Phase to address:**
Phase 5 (Release hardening and staged rollout)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hide most warnings without severity model | Cleaner UI quickly | Trust erosion and hidden failure modes | Never |
| Keep upfront-auth logic while adding deferred entrypoint | Faster delivery | Two competing auth flows and inconsistent state | Never |
| Add local "ignore stale response" checks per component | Fast patch | Fragmented reliability logic and regressions | Only as temporary hotfix with tracked removal |
| Surface every fetch error as toast/banner | Easy implementation | Notification fatigue and reduced signal quality | Never |
| Add a second cache for preview data | Local performance gain | Multi-source-of-truth drift | Only with documented ownership + deprecation plan |
| Ship all UX refinements in one release | Less release overhead | Hard diagnosis and rollback risk | Only for tiny copy-only changes |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub OAuth | Missing/weak `state` handling on deferred auth callback | Use unguessable `state`, verify on callback, short TTL, single-use |
| GitHub OAuth | Omitting `scope` and unintentionally inheriting broader existing grants | Request explicit minimal scopes per action path |
| GitHub REST API | Bursty concurrent/mutative calls during publish | Queue calls, avoid high concurrency, pause between mutative calls |
| GitHub REST API | Ignoring `retry-after` / rate-limit headers | Backoff per headers and exponential retry policy |
| Preview API/BFF | No request cancellation and stale response overwrite | Propagate `AbortSignal` and reject late revisions |
| UI status messaging | Using toasts for critical blocking failures | Use persistent inline/error-summary patterns with clear recovery actions |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Uncancelled preview requests | Flicker, stale preview, high network load | Cancel in-flight requests and discard late revisions | Rapid toggling + high latency networks |
| Default auto-refetch on focus for heavy preview queries | UI churn after tab switch | Tune query stale/focus settings per endpoint | Power users switching between tabs frequently |
| Over-animated status indicators | Input lag and visual distraction | Reserve motion for high-priority transitions only | Low-end devices and dense workflows |
| Multiple render passes for each config change | Sluggish preview updates | Batch state updates and debounce non-critical work | Large dependency sets or many quick edits |
| Global banner re-renders on each transient event | Perceived instability | Dedupe events and aggregate transient statuses | Sessions with intermittent network failures |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Missing OAuth `state` validation in resumed flow | CSRF and session confusion | Generate, persist, validate, and invalidate `state` |
| Requesting broad scopes for convenience | Excess blast radius if token compromised | Request minimal explicit scope for each action |
| Logging callback/query params with sensitive context | Token/state leakage in logs | Redact auth artifacts and sensitive params |
| Treating private-resource `404` as true absence | Broken recovery and misleading UX | Handle auth/permission checks before "not found" messaging |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Removing too many warnings to reduce clutter | Users miss high-risk conditions | Keep only actionable high-severity warnings, downgrade the rest |
| Requiring auth unexpectedly at final step | Trust drop and abandonment | Progressive disclosure: indicate requirement near action ahead of time |
| Using ephemeral toasts for critical failures | Users miss failure details and next steps | Persistent inline/banners with explicit recovery actions |
| Non-specific preview errors ("something failed") | Cannot self-recover | Explain what failed and how to retry/fallback |
| Readability changes that only optimize visual users | Accessibility regressions | Pair visual cleanup with semantic and contrast validation |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Warning reduction:** Severity taxonomy exists and is mapped to UI patterns.
- [ ] **Deferred auth:** Callback resumes original intent, not generic home route.
- [ ] **OAuth security:** `state` is random, validated, single-use, and expires.
- [ ] **Scope trust:** OAuth request uses explicit minimal scopes per action.
- [ ] **Preview consistency:** Request cancellation + stale response guards verified.
- [ ] **Error hygiene:** Cancelled/transient fetches do not produce user-facing noise.
- [ ] **Accessibility:** Contrast and status announcements verified after readability updates.
- [ ] **Critical failures:** No critical error is toast-only or auto-dismissed.
- [ ] **Rate-limit handling:** `retry-after` and backoff behavior tested.
- [ ] **Rollout safety:** Feature flags and rollback switches exist for high-risk changes.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Warning over-pruning | MEDIUM | Re-enable high-severity warning channel, hotfix taxonomy map, review hidden failures from telemetry |
| Lost intent after OAuth redirect | MEDIUM | Reconstruct from saved draft/context if available, patch callback resume logic, add regression test |
| Stale preview mismatch | LOW-MEDIUM | Force-refresh preview with latest revision, ship cancellation/version guard fix |
| Notification noise flood | LOW | Dedupe error emissions, classify transient vs actionable failures, reduce alert severity |
| Accessibility regression from readability pass | MEDIUM | Revert offending token/component changes, re-run a11y checks, patch semantic roles |
| Rate-limit lockout during publish | MEDIUM | Pause mutative queue, respect retry headers, surface clear "try again after" guidance |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Warning cleanup removes risk signals | Phase 1 | Severity map reviewed; critical warning paths pass acceptance tests |
| Deferred auth loses user intent | Phase 3 | OAuth callback resumes exact pending action in integration tests |
| Deferred auth becomes surprise friction | Phase 2 | Action affordances disclose auth requirement before click |
| Preview stale-response mismatch | Phase 4 | Rapid-toggle and delayed-network tests show no state drift |
| Query defaults cause noise/retry storms | Phase 4 | No duplicate user-facing errors for single failure scenario |
| Readability tweaks break accessibility semantics | Phase 2 | Contrast + screen-reader status-message checks pass |
| Reliability fixes add hidden complexity debt | Phase 1 | State ownership doc approved; no new unowned cache/store |
| No safe rollout path | Phase 5 | Feature flags, telemetry baselines, and rollback drill completed |

## Sources

- HIGH: GitHub OAuth best practices (minimal scopes, credential/token handling, breach planning): https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app
- HIGH: GitHub OAuth authorization details (`state`, PKCE, callback behavior, scope behavior, multiple tokens): https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- HIGH: GitHub REST rate limits (primary/secondary, retries, backoff, concurrency constraints): https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- HIGH: GitHub REST API best practices (avoid concurrent requests, pause mutative calls, handle rate-limit headers): https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api
- HIGH: GitHub REST troubleshooting (rate-limit behavior, auth-related 404 behavior, timeout patterns): https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api
- HIGH: TanStack Query important defaults (staleness, refetch triggers, retries): https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
- HIGH: TanStack Query cancellation semantics (`AbortSignal`, revert behavior, manual cancel): https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation
- HIGH: W3C WCAG 2.2 contrast minimum understanding (SC 1.4.3): https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- HIGH: W3C WCAG 2.2 status messages (SC 4.1.3, avoid overly chatty alerts): https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- MEDIUM: GOV.UK design system error summary and warning patterns (high-signal messaging semantics): https://design-system.service.gov.uk/components/error-summary/ and https://design-system.service.gov.uk/components/warning-text/
- MEDIUM: NN/g progressive disclosure and status/error communication guidance (industry UX research, non-official standard): https://www.nngroup.com/articles/progressive-disclosure/ and https://www.nngroup.com/articles/error-message-guidelines/ and https://www.nngroup.com/articles/indicators-validations-notifications/

---
*Pitfalls research for: Better Spring Initializr v1.0.1 UX refinements*
*Researched: 2026-02-14*
