---
phase: 05-generation-sharing
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/initializr-generate-params.ts
  - src/server/lib/initializr-generate-client.ts
  - src/server/functions/download-initializr-project.ts
  - src/server/functions/download-initializr-project.test.ts
autonomous: true
must_haves:
  truths:
    - "User can trigger project generation from the current workspace configuration"
    - "Generated ZIP payload is fetched through the app BFF (not direct browser call to upstream)"
    - "Generation failures surface a safe, retryable error instead of a broken download"
  artifacts:
    - path: "src/lib/initializr-generate-params.ts"
      provides: "Deterministic mapping from workspace config + selected dependencies to Initializr query params"
      contains: "buildInitializrGenerateParams"
    - path: "src/server/lib/initializr-generate-client.ts"
      provides: "Server-side ZIP fetch utility with upstream response normalization"
      contains: "fetchInitializrZip"
    - path: "src/server/functions/download-initializr-project.ts"
      provides: "TanStack Start server function that returns ZIP bytes and metadata to client"
      exports: ["downloadInitializrProject"]
  key_links:
    - from: "src/server/functions/download-initializr-project.ts"
      to: "src/lib/initializr-generate-params.ts"
      via: "request query construction"
      pattern: "buildInitializrGenerateParams"
    - from: "src/server/functions/download-initializr-project.ts"
      to: "src/server/lib/initializr-generate-client.ts"
      via: "zip proxy invocation"
      pattern: "fetchInitializrZip"
---

<objective>
Build the backend generation path for Phase 5 so workspace state can be turned into a real Spring Initializr ZIP payload via the existing BFF architecture.

Purpose: Deliver the core of OUTP-01 while preserving the established proxy/sanitized-error pattern from Phase 1.
Output: Query-param builder, server-side ZIP client, and a tested download server function contract ready for UI wiring.
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
@.planning/phases/01-foundation-workspace-shell/01-foundation-workspace-shell-02-SUMMARY.md
@src/server/lib/initializr-client.ts
@src/server/functions/get-initializr-metadata.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create deterministic Initializr generation param builder</name>
  <files>src/lib/initializr-generate-params.ts</files>
  <action>Create a framework-agnostic utility that accepts the canonical workspace generation inputs (project metadata, build tool, language, packaging, Java version, Spring Boot version, selected dependency ids) and returns URLSearchParams-ready key/value pairs matching Spring Initializr expectations. Normalize optional fields, preserve stable parameter ordering for testability, and keep dependency ids encoded as comma-separated `dependencies` value. Do not perform network calls in this utility; it must be pure so Phase 5 share/deep-link logic can reuse the same mapping.</action>
  <verify>Run `npm test -- src/lib/initializr-generate-params.test.ts` after adding coverage for required-field mapping, optional-field omission, and dependency serialization.</verify>
  <done>Generation params are reproducibly built from workspace state and validated by unit tests.</done>
</task>

<task type="auto">
  <name>Task 2: Implement server-side Spring Initializr ZIP client</name>
  <files>src/server/lib/initializr-generate-client.ts</files>
  <action>Add a dedicated server utility to fetch `https://start.spring.io/starter.zip` with generated query params and return `{ bytes, contentType, suggestedFilename }`. Parse `content-disposition` to extract filename when available, defaulting to `demo.zip` when missing. Mirror existing error strategy from metadata client: convert network/non-OK/invalid payload conditions into typed domain errors suitable for sanitized server-function responses. Keep this utility dependency-free and testable via injected `fetch` implementation.</action>
  <verify>Run `npm test -- src/server/lib/initializr-generate-client.test.ts` with cases for successful ZIP response, non-200 response, and connection failure.</verify>
  <done>ZIP client safely proxies upstream archive generation with typed success/error outcomes.</done>
</task>

<task type="auto">
  <name>Task 3: Add download server function contract for client consumption</name>
  <files>src/server/functions/download-initializr-project.ts, src/server/functions/download-initializr-project.test.ts</files>
  <action>Create a TanStack Start `createServerFn` handler that receives generation inputs, builds params via Task 1 utility, fetches ZIP via Task 2 client, and returns a discriminated response (`ok: true/false`) with base64-encoded archive bytes plus MIME type/filename metadata. Sanitize all failures into a single user-safe error code and retryable message, following the pattern already used by `get-initializr-metadata`. Avoid leaking upstream status/body text to the client.</action>
  <verify>Run `npm test -- src/server/functions/download-initializr-project.test.ts` and `npm run build`; confirm success path returns encoded payload metadata and failure path returns sanitized error shape.</verify>
  <done>Client-facing download function is available with a stable typed contract and passing tests.</done>
</task>

</tasks>

<verification>
1. `npm test -- src/lib/initializr-generate-params.test.ts src/server/lib/initializr-generate-client.test.ts src/server/functions/download-initializr-project.test.ts` passes.
2. `npm run build` succeeds with the new generation/download server function exported.
3. Server-function response shape is discriminated (`ok: true/false`) and contains no raw upstream error leakage.
</verification>

<success_criteria>
- OUTP-01 backend path exists: workspace config can be transformed and proxied to Initializr ZIP generation.
- Download flow is safe and reliable via BFF-only integration with sanitized retryable failures.
- Phase 5 UI plan can consume a stable, tested download contract without redefining generation semantics.
</success_criteria>

<output>
After completion, create `.planning/phases/05-generation-sharing/05-generation-sharing-01-SUMMARY.md`
</output>
