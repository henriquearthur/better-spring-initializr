# Architecture Research

**Domain:** UX and reliability refinements for an existing TanStack Start + React workspace app
**Researched:** 2026-02-14
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ WorkspaceHeader                                                             │
│ ┌─────────────────────── Sidebar ──────────────────────┐  ┌──────────────┐ │
│ │ ConfigurationSidebar                                  │  │ Main Preview │ │
│ │ PresetBrowser                                         │  │ FileTree     │ │
│ │ DependencyBrowser                                     │  │ FileViewer   │ │
│ └───────────────────────────────────────────────────────┘  └──────────────┘ │
│                             OutputActionHub                                  │
│            (Download, Share, Publish; auth starts only on Publish)          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                STATE LAYER                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ WorkspaceShell-owned UI state + URL/localStorage config state               │
│ React Query preview state (debounced, placeholder previous snapshot)        │
│ GitHub OAuth session summary (lazy-loaded only in publish path)             │
├──────────────────────────────────────────────────────────────────────────────┤
│                         BFF LAYER (Server Functions)                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ get-initializr-metadata  get-project-preview  download-initializr-project   │
│ github-oauth (start/complete/get/disconnect)  push-project-to-github        │
├──────────────────────────────────────────────────────────────────────────────┤
│                              EXTERNAL SERVICES                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ Spring Initializr API                                 GitHub OAuth/API       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `WorkspaceShell` | Owns cross-panel state and composes workspace layout | Single orchestration component with hooks and local UI state |
| `OutputActionHub` (new) | Action-first output flow; choose Download/Share/Publish before auth prompts | Replaces split auth/push panels with a single action coordinator |
| `PublishFlowPanel` (new) | Handles owner/repo/visibility and initiates auth only when user commits to publish | Stateful step panel inside action hub |
| `GitHubOAuthCallbackRoute` (modified) | Completes OAuth callback independent of panel mount | Route-level completion + redirect/status handoff |
| `PreviewFileTree` (modified) | Reliable file selection and tree rendering | Keep virtual tree, remove fixed height assumptions |
| `FileContentViewer` (modified) | Stable formatting, indentation, and syntax render fallback | Dedicated code viewport + cached Shiki highlighter |

## Recommended Project Structure

```
src/
├── components/workspace/
│   ├── workspace-shell.tsx                   # [MOD] remove always-on auth/push cards
│   ├── workspace-output-actions.tsx          # [MOD] become OutputActionHub
│   ├── publish-flow-panel.tsx                # [NEW] publish-step UX + auth gate trigger
│   ├── github-auth-panel.tsx                 # [MOD/DEPRECATE] move logic into publish flow
│   ├── github-push-panel.tsx                 # [MOD/DEPRECATE] move logic into publish flow
│   ├── preview-file-tree.tsx                 # [MOD] height + selection reliability
│   ├── file-content-viewer.tsx               # [MOD] formatting/cursor/indentation reliability
│   └── preview-code-viewport.tsx             # [NEW] shared pre/code renderer for plain+tokenized
├── hooks/
│   ├── use-project-preview.ts                # [MOD] retry/cancel/fetch state tuning
│   └── use-github-publish-flow.ts            # [NEW] session + push orchestration hook
├── lib/
│   └── shiki-highlighter.ts                  # [NEW] singleton highlighter cache
├── routes/
│   └── api.github.oauth.callback.tsx         # [MOD] callback completion decoupled from auth panel
└── server/functions/
    ├── github-oauth.ts                       # [MOD] optional callback status payload normalization
    └── push-project-to-github.ts             # [MOD] no contract change; keep auth-required guard
```

### Structure Rationale

- **`components/workspace/`:** Keep visual changes local to workspace composition, avoid spilling milestone UX logic into server/BFF code.
- **`hooks/use-github-publish-flow.ts`:** Centralizes publish state machine so UI can simplify without duplicating OAuth/push state transitions.
- **`lib/shiki-highlighter.ts`:** Prevent repeated highlighter initialization; aligns with Shiki guidance for long-lived instances.
- **`routes/api.github.oauth.callback.tsx`:** Makes OAuth completion deterministic even when auth UI is no longer always mounted.

## Architectural Patterns

### Pattern 1: Action-First Publish Orchestration

**What:** User chooses output intent first; OAuth starts only when user selects Publish and confirms repository details.
**When to use:** Multi-action output surfaces where authentication should be contextual, not global.
**Trade-offs:** Cleaner UX and less visual noise; slightly more state orchestration in one component.

**Example:**
```typescript
type OutputIntent = 'download' | 'share' | 'publish'

function OutputActionHub() {
  const [intent, setIntent] = useState<OutputIntent>('download')
  const publish = useGitHubPublishFlow()

  if (intent !== 'publish') return <DownloadShareActions onPublish={() => setIntent('publish')} />

  return <PublishFlowPanel publish={publish} />
}
```

### Pattern 2: OAuth Callback as Route Boundary (Not Panel Side Effect)

**What:** OAuth code exchange runs in callback route path and redirects back to workspace with a compact status indicator.
**When to use:** OAuth completion must work regardless of whether a specific component is currently mounted.
**Trade-offs:** Adds one redirect hop; removes hidden coupling and callback fragility.

**Example:**
```typescript
// route /api/github/oauth/callback
// parse code/state/error -> call completeGitHubOAuth -> redirect('/?publishAuth=ok|error')
```

### Pattern 3: Two-Stage Preview Rendering Pipeline

**What:** Keep server snapshot retrieval and client code rendering separate; normalize text rendering before token styling.
**When to use:** File preview must stay reliable under rapid config edits and mixed file types.
**Trade-offs:** Slightly more component boundaries; clearer failure handling and better readability.

**Example:**
```typescript
const query = useProjectPreview(input) // network + archive decode path
const lines = toDisplayLines(selectedFile?.content ?? '') // whitespace-safe
const tokens = useShikiTokens(lines, inferredLang) // optional enhancement
```

## Data Flow

### Request Flow (Publish with Auth Gate)

```
[User clicks Publish]
    ↓
[OutputActionHub] → [useGitHubPublishFlow.ensureSession]
    ↓ (if disconnected)
[startGitHubOAuth] → redirect GitHub
    ↓
[/api/github/oauth/callback route handles completeGitHubOAuth]
    ↓
redirect back to workspace
    ↓
[PublishFlowPanel] → [pushProjectToGitHub]
    ↓
[GitHub repo created + initial commit]
```

### Request Flow (Preview Reliability)

```
[User edits config/dependencies]
    ↓
[useProjectPreview debounce]
    ↓
[get-project-preview server function]
    ↓
[initializr-preview-client fetches + unpacks archive]
    ↓
[WorkspaceShell selects file]
    ↓
[FileContentViewer -> normalize lines -> optional tokenization]
```

### State Management

```
WorkspaceShell state
    ├── Config + dependency state (existing)
    ├── Preview selection/diff state (existing)
    └── Output intent/publish state (new)
             ↓
      useGitHubPublishFlow
             ↓
      OAuth session summary + push mutation state
```

### Key Data Flows

1. **Publish gating flow:** publish intent triggers session check; OAuth starts only when needed; callback route finalizes and returns to publish context.
2. **Preview display flow:** server preview snapshot remains canonical; client viewer focuses on formatting reliability, not generation semantics.
3. **Information hierarchy flow:** workspace shell composes fewer top-level cards by merging auth/push into output action hub.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current monolith+BFF is sufficient; prioritize UX clarity and callback robustness. |
| 1k-100k users | Add stronger preview request cancellation/backoff and transient error telemetry before adding new services. |
| 100k+ users | Consider async preview job/cache layer only if snapshot generation latency is consistently high. |

### Scaling Priorities

1. **First bottleneck:** repeated preview fetches during fast edits causing stale visual states; solve with cancellation-aware query settings and stale-result guards.
2. **Second bottleneck:** OAuth callback fragility from UI coupling; solve by route-bound callback completion and explicit status handoff.

## Anti-Patterns

### Anti-Pattern 1: Always-Mounted Auth UI

**What people do:** Keep GitHub auth controls visible all the time in main preview area.
**Why it's wrong:** Adds cognitive load and leaks implementation details into primary workflow.
**Do this instead:** Surface auth only inside Publish path in `OutputActionHub`.

### Anti-Pattern 2: Callback Completion Hidden in Optional Component

**What people do:** Complete OAuth only inside `GitHubAuthPanel` mount effect.
**Why it's wrong:** Refactor to action-gated auth can silently break callback processing.
**Do this instead:** Handle callback in route module (`api.github.oauth.callback.tsx`) so completion is independent of panel visibility.

### Anti-Pattern 3: Re-Initializing Syntax Highlighter Per File Change

**What people do:** Call shorthand tokenizer repeatedly without a long-lived cache strategy.
**Why it's wrong:** Increases latency and failure probability during rapid file switches.
**Do this instead:** Keep singleton highlighter helper and degrade gracefully to plain text.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Spring Initializr | Existing server function proxy (`get-project-preview`, download function) | No contract changes required for v1.0.1 refinement goals. |
| GitHub OAuth/API | Existing start/complete/session/push functions | Trigger auth only from publish flow, but keep server-side auth guard in `push-project-to-github.ts`. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `WorkspaceShell` ↔ `OutputActionHub` | Props + callbacks | New boundary for action-first output intent and publish state. |
| `OutputActionHub` ↔ OAuth/push server functions | Hook-driven async actions | Avoid direct panel coupling; unify loading/error/success states. |
| Callback route ↔ workspace route | URL status handoff | Keeps OAuth completion deterministic after redirect. |
| `useProjectPreview` ↔ `FileContentViewer` | Query result + selected file model | Keep preview fetch and render reliability concerns separated. |

### New vs Modified Files (Explicit)

| File | New/Modified | Integration Purpose |
|------|--------------|---------------------|
| `src/components/workspace/workspace-shell.tsx` | Modified | Remove always-on auth/publish cards; mount new output hub only once. |
| `src/components/workspace/workspace-output-actions.tsx` | Modified | Become action-first hub (Download/Share/Publish) and primary publish entrypoint. |
| `src/components/workspace/publish-flow-panel.tsx` | New | Encapsulate publish-only form and auth gating UX. |
| `src/hooks/use-github-publish-flow.ts` | New | Reusable orchestration for session load, OAuth start, push mutation, callback status recovery. |
| `src/routes/api.github.oauth.callback.tsx` | Modified | Move OAuth completion here so callback does not depend on auth panel mount. |
| `src/components/workspace/file-content-viewer.tsx` | Modified | Preserve indentation/cursor behavior and fallback rendering stability. |
| `src/components/workspace/preview-code-viewport.tsx` | New | Shared code rendering primitive for highlighted/plain text states. |
| `src/lib/shiki-highlighter.ts` | New | Singleton highlighter cache for consistent preview tokenization behavior. |
| `src/hooks/use-project-preview.ts` | Modified | Tune retry/cancel/placeholder behavior to reduce stale snapshot artifacts. |

## Build Order Dependencies

1. **Decouple OAuth callback first**
   - Modify `src/routes/api.github.oauth.callback.tsx` to own callback completion and return status to workspace.
   - Dependency reason: action-gated publish can break auth if callback remains panel-coupled.

2. **Introduce publish orchestration hook**
   - Add `src/hooks/use-github-publish-flow.ts` and move session/push orchestration out of UI panels.
   - Dependency reason: needed before UI consolidation to avoid regressions.

3. **Refactor output area to action-first hub**
   - Modify `src/components/workspace/workspace-output-actions.tsx` and `src/components/workspace/workspace-shell.tsx`.
   - Add `src/components/workspace/publish-flow-panel.tsx`.

4. **Simplify/retire standalone GitHub panels**
   - Remove or internally delegate `src/components/workspace/github-auth-panel.tsx` and `src/components/workspace/github-push-panel.tsx`.
   - Rollout safety: keep old components for one iteration behind a temporary branch-level toggle if needed.

5. **Stabilize preview rendering internals**
   - Add `src/lib/shiki-highlighter.ts` and `src/components/workspace/preview-code-viewport.tsx`.
   - Update `src/components/workspace/file-content-viewer.tsx` and `src/components/workspace/preview-file-tree.tsx` for whitespace/height reliability.

6. **Tune preview query behavior**
   - Update `src/hooks/use-project-preview.ts` retry/cancellation/placeholder settings after UI refactor lands.
   - Dependency reason: do this last so tuning is based on final UI interaction patterns.

### Rollout Safety

- Keep server contracts backward compatible while UI migrates.
- Ship callback-route decoupling before removing old auth panel logic.
- Add focused tests for callback completion, unauthenticated publish, and preview whitespace formatting.

## Sources

- Internal architecture and current integration points from repository code:
  - `src/components/workspace/workspace-shell.tsx`
  - `src/components/workspace/workspace-output-actions.tsx`
  - `src/components/workspace/github-auth-panel.tsx`
  - `src/components/workspace/github-push-panel.tsx`
  - `src/components/workspace/file-content-viewer.tsx`
  - `src/hooks/use-project-preview.ts`
  - `src/routes/api.github.oauth.callback.tsx`
  - `src/server/functions/github-oauth.ts`
  - `src/server/functions/push-project-to-github.ts`
- TanStack Start Server Functions docs (official):
  - https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
- TanStack Query `useQuery` reference (official):
  - https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
- GitHub OAuth web flow documentation (official):
  - https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- Shiki installation/usage and highlighter lifecycle guidance (official):
  - https://shiki.style/guide/install

---
*Architecture research for: better-spring-initializr v1.0.1 UX Refinements*
*Researched: 2026-02-14*
