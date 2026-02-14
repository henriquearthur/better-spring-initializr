# Stack Research

**Domain:** UX and reliability refinements for an existing project generator UI
**Researched:** 2026-02-14
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TanStack Start | keep current (`@tanstack/react-start@^1.132.0`) | App shell + server functions | No architecture change is needed for this milestone. Post-generate action flow (download/share/publish) can be refactored in existing route/component boundaries without adding framework layers. |
| React + React DOM | keep current (`react@^19.2.0`) | UI composition and state | All requested UI refinements are component-level changes. React 19 is already sufficient; no renderer/runtime additions are needed. |
| Tailwind CSS v4 | keep current (`tailwindcss@^4.1.18`) | Light-mode readability and layout simplification | Tailwind v4 + existing CSS variables already support token-level contrast tuning and spacing cleanup. This milestone is better solved by token updates, not a new styling system. |
| TanStack Query | keep current (`@tanstack/react-query@^5.90.21`) | Preview fetch reliability and noise reduction | Query retries, backoff, and cancellation are built in. Use query options and `AbortSignal` in query functions instead of adding a separate fetch/retry library. |
| Shiki | **update** to `^3.22.0` (from `^3.13.0`) | Code preview highlighting | Stay on Shiki (already integrated) but update to current v3 line to improve consistency and keep compatibility with transformer package below. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@shikijs/transformers` | `^3.22.0` | Cleaner code preview rendering (indent guides, whitespace rendering, diff/focus line classes) | Use in `file-content-viewer` to improve indentation clarity and code readability without moving to a full editor dependency. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest + Testing Library (existing) | UX regression checks for warning visibility and post-generate flow | Add focused component tests for "status tone" logic (informational vs warning/error) instead of introducing another test framework. |

## Installation

```bash
# Runtime additions/updates
npm install shiki@^3.22.0 @shikijs/transformers@^3.22.0

# No other new packages needed for this milestone
```

## Integration Points (existing codebase)

- `src/components/workspace/file-content-viewer.tsx`: keep Shiki-based renderer; integrate `@shikijs/transformers` for indentation guides/whitespace and cleaner line semantics, then simplify custom table-like rendering.
- `src/hooks/use-project-preview.ts`: tune query options (`retry`, conditional retry by status, retryDelay) and wire query-function `signal` cancellation path to reduce stale/noisy preview states.
- `src/server/lib/initializr-preview-client.ts`: keep existing client; ensure retry policy stays in Query layer and errors are mapped to user-facing severity levels (info/warn/error) rather than always warning-style panels.
- `src/components/workspace/workspace-shell.tsx` and related panels: refactor composition for post-generate GitHub action placement and reduced nested card chrome; no new state library required.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Shiki + `@shikijs/transformers` | Monaco (`@monaco-editor/react`) | Use Monaco only if this becomes an editable IDE surface with advanced editing needs; for read-only preview refinements it is unnecessary bundle and integration cost. |
| TanStack Query retry/cancellation | `ky` / `axios-retry` / standalone retry libs | Use alternative clients only if the app standardizes on one HTTP client everywhere. For this milestone, Query already provides reliability primitives. |
| Tailwind token refinement | New component/design system | Use a new system only for full redesigns. This milestone explicitly requires preserving existing visual language. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Monaco Editor migration for preview-only improvements | Heavy payload and broader UX change than needed for padding/cursor/indentation refinements | Keep Shiki and add `@shikijs/transformers` + targeted CSS/layout fixes |
| New global state machine library (e.g., XState) for post-generate action flow | Introduces modeling overhead for a small UI flow change | Keep React state/hooks in existing workspace shell boundaries |
| Toast-heavy notification layer for all statuses | Increases noise, conflicts with "reduce warning/noise" objective | Inline contextual status messaging with stricter severity rules |
| Tailwind plugin sprawl for contrast fixes | Adds configuration complexity with little payoff | Adjust existing CSS variables to meet contrast targets in light mode |

## Stack Patterns by Variant

**If preview stays read-only (recommended for this milestone):**
- Keep Shiki rendering pipeline
- Add `@shikijs/transformers` for readability/diff polish
- Use Query retry/cancellation to stabilize fetch UX

**If a future milestone introduces in-browser editing:**
- Re-evaluate Monaco in that future phase
- Isolate editor bundle with lazy loading
- Keep this milestone free of editor-platform complexity

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `shiki@^3.22.0` | `@shikijs/transformers@^3.22.0` | Same major/minor family avoids transformer/runtime drift. |
| `@tanstack/react-query@^5.90.21` | React 19 (`react@^19.2.0`) | Current project versions already aligned; use built-in retry/cancellation APIs. |
| `tailwindcss@^4.1.18` | Existing CSS variable token approach | Supports refinement via token updates; no migration required. |

## Sources

- TanStack Query docs (official): https://tanstack.com/query/latest/docs/framework/react/guides/query-retries - verified retry/backoff behavior (HIGH)
- TanStack Query docs (official): https://tanstack.com/query/latest/docs/framework/react/guides/query-functions - verified `QueryFunctionContext.signal`/cancellation path (HIGH)
- Shiki docs (official): https://shiki.style/guide/install - verified current v3 line and integration model (HIGH)
- Shiki transformers docs (official): https://shiki.style/packages/transformers - verified transformer capabilities for diff/indent/whitespace (HIGH)
- WCAG 2.2 Understanding SC 1.4.3 (official): https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html - contrast targets for light-mode readability (HIGH)
- npm registry (official package metadata via `npm view`, checked 2026-02-14): `shiki` 3.22.0, `@shikijs/transformers` 3.22.0, `@tanstack/react-query` 5.90.21 (HIGH)

---
*Stack research for: better-spring-initializr v1.0.1 UX refinements*
*Researched: 2026-02-14*
