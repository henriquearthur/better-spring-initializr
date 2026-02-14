---
phase: 07-curated-presets
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/curated-presets.ts
  - src/lib/curated-presets.test.ts
  - src/components/workspace/preset-browser.tsx
  - src/hooks/use-dependency-browser.ts
  - src/components/workspace/workspace-shell.tsx
autonomous: true
must_haves:
  truths:
    - "User can browse a curated list of presets in the workspace sidebar"
    - "User can inspect what each preset includes before applying it"
    - "Applying a preset updates both configuration and dependencies, and the preview refreshes from the new state"
  artifacts:
    - path: "src/lib/curated-presets.ts"
      provides: "Typed curated preset catalog and apply helpers for config + dependency snapshots"
      exports: ["CURATED_PRESETS", "getCuratedPresetById", "applyCuratedPreset"]
    - path: "src/components/workspace/preset-browser.tsx"
      provides: "Preset browsing UI with include details and apply actions"
      contains: "PresetBrowser"
    - path: "src/components/workspace/workspace-shell.tsx"
      provides: "Workspace integration that applies selected preset to canonical state"
      contains: "PresetBrowser"
  key_links:
    - from: "src/components/workspace/preset-browser.tsx"
      to: "src/lib/curated-presets.ts"
      via: "catalog rendering and includes inspection"
      pattern: "CURATED_PRESETS|getCuratedPresetById"
    - from: "src/components/workspace/workspace-shell.tsx"
      to: "src/components/workspace/preset-browser.tsx"
      via: "apply callback wiring"
      pattern: "onApplyPreset|PresetBrowser"
    - from: "src/components/workspace/workspace-shell.tsx"
      to: "src/hooks/use-project-preview.ts"
      via: "existing preview query key reacts to updated config/dependencies"
      pattern: "useProjectPreview"
---

<objective>
Deliver curated preset browsing and apply behavior so users can jumpstart project setup with one click while still seeing exactly what each preset contains.

Purpose: Satisfy PRST-01, PRST-02, and PRST-03 with a deterministic preset catalog (no database), transparent includes preview, and full workspace state integration.
Output: Preset catalog domain module, preset browser UI, and workspace wiring that applies preset config + dependencies into existing URL/state/preview flows.
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
@src/components/workspace/workspace-shell.tsx
@src/hooks/use-project-config-state.ts
@src/hooks/use-dependency-browser.ts
@src/hooks/use-project-preview.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create curated preset catalog and deterministic apply helpers</name>
  <files>src/lib/curated-presets.ts, src/lib/curated-presets.test.ts</files>
  <action>Implement a typed `CuratedPreset` model and export a static `CURATED_PRESETS` list with at least three realistic templates (for example: REST API + Postgres, Reactive Microservice, Batch Worker). Each preset must define metadata/build overrides plus dependency IDs so it can be applied without ad-hoc logic in UI components. Add `getCuratedPresetById` and `applyCuratedPreset` helpers that merge preset values onto existing config, dedupe dependency IDs, and return a complete next workspace snapshot. Keep storage local and code-defined (no API/database) per project decision that presets are URL/state based in v1.</action>
  <verify>Run `npm test -- src/lib/curated-presets.test.ts` to validate helper behavior (lookup, merge, dedupe, and unknown preset handling), then run `npm run build`.</verify>
  <done>Preset definitions and pure apply logic exist in one reusable module with tests proving deterministic preset application.</done>
</task>

<task type="auto">
  <name>Task 2: Build preset browser UI with includes inspection before apply</name>
  <files>src/components/workspace/preset-browser.tsx</files>
  <action>Create a sidebar-friendly `PresetBrowser` component that renders curated presets as selectable cards/list items showing name, intent, and quick tags. When a preset is focused/expanded, show exactly what it includes: config/build overrides and dependency names/IDs, plus any compatibility note when a dependency is not present in current metadata. Add explicit `Apply preset` action per preset and keep this component presentational by receiving data and callbacks through props. Do not add community presets/import flow (deferred to future scope).</action>
  <verify>Run `npm run build`, then `npm run dev` and confirm users can browse all curated presets and inspect includes before triggering apply.</verify>
  <done>PRST-01 and PRST-03 UI behavior is visible: browsing works and each preset's contents are inspectable before application.</done>
</task>

<task type="auto">
  <name>Task 3: Wire preset apply into canonical workspace config/dependency state and live preview</name>
  <files>src/hooks/use-dependency-browser.ts, src/components/workspace/workspace-shell.tsx</files>
  <action>Integrate `PresetBrowser` into the sidebar and wire its apply action to existing canonical state pathways from prior phases (`useProjectConfigState` for config and dependency browser state for selected dependencies). Extend dependency browser state API if needed to support atomic preset replacement (for example `setSelectedDependencyIds`) so apply is a single consistent state transition. On apply, update config + dependencies together, preserve URL/local-storage/share consistency, and rely on existing `useProjectPreview` reactivity to refresh the preview automatically. Keep scope focused on curated presets only; do not add new output actions or GitHub integrations.</action>
  <verify>Run `npm run dev` and manually test: choose a preset -> click apply -> confirm sidebar controls update, dependency selections update, and preview refreshes without reload; finish with `npm run build`.</verify>
  <done>PRST-02 is satisfied end-to-end: applying a curated preset updates workspace configuration/dependencies and propagates to preview state.</done>
</task>

</tasks>

<verification>
1. `npm test -- src/lib/curated-presets.test.ts` passes for preset apply logic and edge cases.
2. `npm run build` succeeds with new preset catalog, UI component, and workspace integration.
3. In `npm run dev`, users can browse presets, inspect includes, apply one, and observe sidebar + dependency + preview updates in one flow.
</verification>

<success_criteria>
- PRST-01 satisfied: curated presets are browsable in workspace.
- PRST-03 satisfied: users can inspect each preset's included config and dependencies before applying.
- PRST-02 satisfied: applying a preset updates canonical configuration/dependency state and triggers live preview refresh.
</success_criteria>

<output>
After completion, create `.planning/phases/07-curated-presets/07-curated-presets-01-SUMMARY.md`
</output>
