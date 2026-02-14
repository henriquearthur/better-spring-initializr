---
phase: 02-project-configuration
plan: 03
type: execute
wave: 3
depends_on:
  - "02"
files_modified:
  - src/routes/__root.tsx
  - src/hooks/use-project-config-state.ts
autonomous: true
gap_closure: true
must_haves:
  truths:
    - "Workspace boots in dev without NUQS-404 and renders WorkspaceShell"
    - "Configuration sidebar remains interactive after adapter wiring"
    - "URL query params and localStorage hydration behavior still work after runtime fix"
  artifacts:
    - path: "src/routes/__root.tsx"
      provides: "Root app composition mounts nuqs TanStack Router adapter around route children"
      contains: "NuqsAdapter"
    - path: "src/hooks/use-project-config-state.ts"
      provides: "Query/localStorage project config state hook running under adapter-backed route tree"
      contains: "useQueryStates"
  key_links:
    - from: "src/routes/__root.tsx"
      to: "nuqs/adapters/tanstack-router"
      via: "NuqsAdapter provider wrapping children"
      pattern: "NuqsAdapter"
    - from: "src/hooks/use-project-config-state.ts"
      to: "src/routes/__root.tsx"
      via: "useQueryStates executes under adapter provider"
      pattern: "useQueryStates"
    - from: "src/hooks/use-project-config-state.ts"
      to: "localStorage"
      via: "URL-first hydration and persistence effects"
      pattern: "readProjectConfigFromStorage|writeProjectConfigToStorage"
---

<objective>
Close the Phase 2 runtime blocker by wiring the missing nuqs adapter so URL-backed project configuration can run in development.

Purpose: Restore executable Phase 2 behavior that is currently blocked by NUQS-404 and re-validate the URL/storage sync flow.
Output: Root adapter composition fix plus verified dev-runtime behavior for workspace rendering and config synchronization.
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
@.planning/phases/02-project-configuration/02-project-configuration-VERIFICATION.md
@.planning/phases/02-project-configuration/02-project-configuration-02-SUMMARY.md
@src/routes/__root.tsx
@src/hooks/use-project-config-state.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Mount nuqs TanStack Router adapter at root app composition</name>
  <files>src/routes/__root.tsx</files>
  <action>Import `NuqsAdapter` from `nuqs/adapters/tanstack-router` and wrap the current app children tree so every route component (including `WorkspaceShell` and hooks it uses) runs inside an active nuqs adapter context. Preserve existing `ThemeProvider` and `QueryClientProvider` behavior/order and avoid changing unrelated root document structure.</action>
  <verify>Run `npm run build` and confirm root route compiles with `NuqsAdapter` wiring and no import/type errors.</verify>
  <done>`src/routes/__root.tsx` provides nuqs adapter context to the route tree, addressing the missing provider called out in verification.</done>
</task>

<task type="auto">
  <name>Task 2: Confirm useProjectConfigState runs cleanly under adapter-backed runtime</name>
  <files>src/hooks/use-project-config-state.ts</files>
  <action>Verify `useProjectConfigState` continues to use `useQueryStates` as the single source of truth without adding fallback state branches. Keep URL-first plus localStorage fallback precedence (`URL -> storage -> defaults`) intact and adjust only if required to prevent regressions after adapter wiring.</action>
  <verify>Run `npm run dev`, load `/`, and confirm no `[nuqs] nuqs requires an adapter` error appears in terminal/browser while `WorkspaceShell` renders.</verify>
  <done>Workspace runtime no longer crashes on hook initialization and configuration sidebar can be interacted with in dev.</done>
</task>

<task type="auto">
  <name>Task 3: Re-run Phase 2 URL/localStorage interaction checks after fix</name>
  <files>src/hooks/use-project-config-state.ts, src/routes/__root.tsx</files>
  <action>Re-verify the previously blocked flows: (1) editing sidebar fields updates URL params, (2) reload with no query restores localStorage snapshot, and (3) explicit query params override stored values. Do not introduce new persistence semantics; this task only validates and fixes regressions caused by adapter integration if any appear.</action>
  <verify>With `npm run dev` running, test the three flows end-to-end and confirm expected behavior matches Plan 02 precedence rules.</verify>
  <done>Gap verification missing item for URL/localStorage interaction re-check is closed with working runtime behavior.</done>
</task>

</tasks>

<verification>
1. `npm run build` succeeds after root adapter wiring.
2. `npm run dev` boots without NUQS-404 and `/` renders `WorkspaceShell`.
3. URL update, localStorage restore, and URL-over-storage precedence checks all pass post-fix.
</verification>

<success_criteria>
- Verification truth "Workspace loads and users can interact with the configuration sidebar in dev runtime" is now observable.
- Root composition has explicit nuqs adapter wiring for TanStack Router.
- Phase 2 CONF-01..CONF-06 and LAYO-05 are no longer runtime-blocked by adapter initialization errors.
</success_criteria>

<output>
After completion, create `.planning/phases/02-project-configuration/02-project-configuration-03-SUMMARY.md`
</output>
