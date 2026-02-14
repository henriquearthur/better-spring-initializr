---
phase: 01-foundation-workspace-shell
plan: 02
type: execute
wave: 2
depends_on:
  - 01-01
files_modified:
  - src/server/lib/initializr-client.ts
  - src/server/lib/metadata-cache.ts
  - src/server/functions/get-initializr-metadata.ts
  - src/hooks/use-initializr-metadata.ts
  - src/components/workspace/workspace-shell.tsx
autonomous: true
must_haves:
  truths:
    - "Workspace can load Spring Initializr metadata through BFF server functions"
    - "Repeated metadata requests are served from cache within TTL instead of always hitting upstream"
    - "If upstream API fails, users receive a safe actionable error instead of raw upstream details"
  artifacts:
    - path: "src/server/functions/get-initializr-metadata.ts"
      provides: "BFF metadata proxy server function"
      contains: "createServerFn"
    - path: "src/server/lib/metadata-cache.ts"
      provides: "TTL cache for metadata responses"
      contains: "expiresAt"
    - path: "src/hooks/use-initializr-metadata.ts"
      provides: "Client hook to consume proxied metadata"
      contains: "useQuery"
  key_links:
    - from: "src/hooks/use-initializr-metadata.ts"
      to: "src/server/functions/get-initializr-metadata.ts"
      via: "server function invocation"
      pattern: "getInitializrMetadata"
    - from: "src/server/functions/get-initializr-metadata.ts"
      to: "src/server/lib/metadata-cache.ts"
      via: "cache read/write"
      pattern: "getCachedMetadata|setCachedMetadata"
    - from: "src/server/functions/get-initializr-metadata.ts"
      to: "https://start.spring.io/metadata/client"
      via: "server-side fetch"
      pattern: "metadata/client"
---

<objective>
Implement the Phase 1 BFF metadata proxy with caching so workspace data is served reliably and efficiently.

Purpose: Satisfy infrastructure requirements for Spring Initializr metadata access while protecting the client from direct upstream coupling.
Output: Server-side metadata proxy function, cache layer, and client hook integrated into workspace shell.
</objective>

<execution_context>
@/Users/henriquearthur/.config/opencode/get-shit-done/workflows/execute-plan.md
@/Users/henriquearthur/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/research/ARCHITECTURE.md
@.planning/phases/01-foundation-workspace-shell/01-foundation-workspace-shell-01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build Spring Initializr server-side client and metadata cache utilities</name>
  <files>src/server/lib/initializr-client.ts, src/server/lib/metadata-cache.ts</files>
  <action>Create a focused API client for `https://start.spring.io/metadata/client` with response normalization for dependencies, Java versions, and Spring Boot versions. Add in-memory TTL caching utility dedicated to metadata responses (single key acceptable for Phase 1). Cache behavior must support hit/miss instrumentation fields for verification.</action>
  <verify>Run project tests or a targeted node test (if present) to confirm normalized shape output and cache hit/miss + TTL expiry behavior.</verify>
  <done>Reusable server utilities exist for upstream metadata retrieval and TTL-based caching with deterministic normalized output.</done>
</task>

<task type="auto">
  <name>Task 2: Implement TanStack Start BFF server function for metadata proxy</name>
  <files>src/server/functions/get-initializr-metadata.ts</files>
  <action>Create a server function that serves normalized metadata from cache when valid, otherwise fetches upstream and updates cache. Sanitize upstream errors into stable client-safe error payloads, and avoid forwarding arbitrary request headers. Use TanStack Start server functions per locked decision (do not replace with direct client fetches or standalone backend service).</action>
  <verify>Start dev server and invoke function path via app flow twice; confirm first call fetches upstream and second call is cache hit (via logs/debug fields), and failure path returns sanitized error.</verify>
  <done>INFR-01 met: metadata is served through server function BFF with controlled error handling and no direct client-to-upstream dependency.</done>
</task>

<task type="auto">
  <name>Task 3: Connect workspace to metadata hook and show loading/error-ready state</name>
  <files>src/hooks/use-initializr-metadata.ts, src/components/workspace/workspace-shell.tsx</files>
  <action>Add a client hook to call the metadata server function (prefer TanStack Query for caching awareness in client). Integrate into workspace shell with minimal status UI: loading, error, and success indicator (e.g., counts or selected default values) proving metadata is available for later phases.</action>
  <verify>Run `npm run dev`, load workspace, confirm metadata state transitions (loading -> success) and that refreshing or re-entering view uses cached server response within TTL window.</verify>
  <done>INFR-02 met: repeated metadata loads are cache-backed and workspace has live metadata readiness state for Phase 2 configuration UI.</done>
</task>

</tasks>

<verification>
1. Execute app in dev and load workspace twice; second metadata load is cache hit.
2. Validate metadata payload includes dependency, Java version, and Spring Boot version lists.
3. Simulate upstream failure and confirm client receives sanitized error response.
</verification>

<success_criteria>
- INFR-01 satisfied: BFF server function proxies Spring Initializr metadata.
- INFR-02 satisfied: metadata responses are cached to reduce upstream calls.
- Workspace consumes metadata source successfully, enabling Phase 2 form controls.
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-workspace-shell/01-foundation-workspace-shell-02-SUMMARY.md`
</output>
