---
phase: 02-project-configuration
plan: 02
type: execute
wave: 2
depends_on:
  - "01"
files_modified:
  - package.json
  - src/lib/project-config.ts
  - src/hooks/use-project-config-state.ts
  - src/components/workspace/configuration-sidebar.tsx
  - src/components/workspace/workspace-shell.tsx
autonomous: true
must_haves:
  truths:
    - "User configuration state is encoded in URL query params so it can be shared/restored"
    - "Reloading or reopening the app restores the last used configuration from local storage when URL params are absent"
    - "Sidebar controls and URL/local storage remain in sync without losing selected values"
  artifacts:
    - path: "src/hooks/use-project-config-state.ts"
      provides: "Single source of truth hook for URL + localStorage synchronized config state"
      contains: "useQueryStates"
    - path: "src/lib/project-config.ts"
      provides: "Config parsers/serializers and storage key constants shared by sidebar state"
      contains: "PROJECT_CONFIG_STORAGE_KEY"
    - path: "src/components/workspace/workspace-shell.tsx"
      provides: "Workspace wiring that consumes synchronized project config state"
      contains: "useProjectConfigState"
  key_links:
    - from: "src/hooks/use-project-config-state.ts"
      to: "nuqs"
      via: "query state parser + updater"
      pattern: "useQueryStates|parseAs"
    - from: "src/hooks/use-project-config-state.ts"
      to: "localStorage"
      via: "persist + hydrate last-used configuration"
      pattern: "localStorage"
    - from: "src/components/workspace/configuration-sidebar.tsx"
      to: "src/hooks/use-project-config-state.ts"
      via: "controlled props and onChange callbacks"
      pattern: "onConfigChange|config"
---

<objective>
Add durable configuration state so project settings are URL-shareable and persisted across sessions.

Purpose: Deliver LAYO-05 and align with project decision to use URL encoding for shareable presets by making URL state the canonical configuration source.
Output: nuqs-powered config state hook, localStorage persistence fallback, and sidebar/workspace wiring to that state.
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
@.planning/research/STACK.md
@.planning/research/ARCHITECTURE.md
@.planning/phases/02-project-configuration/02-project-configuration-01-SUMMARY.md
@src/lib/project-config.ts
@src/components/workspace/configuration-sidebar.tsx
@src/components/workspace/workspace-shell.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add nuqs dependency and implement URL-first project config state hook</name>
  <files>package.json, src/hooks/use-project-config-state.ts, src/lib/project-config.ts</files>
  <action>Install and use `nuqs` (per roadmap plan and stack decision) to manage query-param state for all project configuration fields. Create `useProjectConfigState` that exposes `{ config, setField, setConfig, resetConfig }`, with typed parsers/defaults for text and enum fields. Keep URL as source of truth; normalize invalid incoming values through shared validators in `project-config.ts` so malformed links fall back safely instead of breaking the UI.</action>
  <verify>Run `npm install` then `npm run build`; in `npm run dev`, change several fields and confirm URL query params update immediately and survive hard refresh.</verify>
  <done>Configuration fields are fully represented in URL state through a typed nuqs hook with safe parsing/fallback behavior.</done>
</task>

<task type="auto">
  <name>Task 2: Implement localStorage persistence fallback with explicit precedence rules</name>
  <files>src/hooks/use-project-config-state.ts, src/lib/project-config.ts</files>
  <action>Add localStorage persistence for the last effective config under a stable key (e.g., `better-spring-initializr:config:v1`). Precedence must be: URL params override stored values; stored values seed defaults when URL is empty; hard defaults apply when both are absent/invalid. Persist updates on meaningful config changes and guard browser-only APIs for SSR safety.</action>
  <verify>In browser dev session: set config values, reload, then open app with and without query params. Confirm (a) no-query restores stored config, and (b) query-param values take precedence over storage and are applied correctly.</verify>
  <done>LAYO-05 behavior works: user's last configuration restores across sessions while preserving URL-shareability semantics.</done>
</task>

<task type="auto">
  <name>Task 3: Rewire workspace/sidebar to consume synchronized config state end-to-end</name>
  <files>src/components/workspace/configuration-sidebar.tsx, src/components/workspace/workspace-shell.tsx</files>
  <action>Replace temporary local component state from plan 01 with the `useProjectConfigState` hook. Pass config values and change handlers as controlled props to sidebar controls so every edit updates URL + storage through one path. Add a compact sidebar action (e.g., reset) backed by `resetConfig` to verify full round-trip behavior and prevent stale transient state branches.</action>
  <verify>Run `npm run dev`; edit fields, refresh, open new tab with copied URL, and use reset action. Confirm sidebar, URL, and persisted state remain consistent in all flows.</verify>
  <done>Workspace uses a single synchronized configuration state pathway with no duplicate local-state source of truth.</done>
</task>

</tasks>

<verification>
1. `npm run build` succeeds after adding nuqs hook and persistence logic.
2. Editing sidebar fields updates URL params in real time.
3. Reload without query params restores last localStorage config.
4. Opening URL with explicit query params overrides stored values and restores shared config accurately.
</verification>

<success_criteria>
- LAYO-05 satisfied: last configuration persists across browser sessions.
- URL-as-state behavior is implemented for Phase 5 sharing path compatibility.
- Sidebar state management is unified and stable for downstream dependency/preview phases.
</success_criteria>

<output>
After completion, create `.planning/phases/02-project-configuration/02-project-configuration-02-SUMMARY.md`
</output>
