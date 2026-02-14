---
phase: 04-live-preview
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/server/lib/initializr-preview-client.ts
  - src/server/functions/get-project-preview.ts
  - src/hooks/use-project-preview.ts
  - src/lib/preview-tree.ts
  - src/components/workspace/preview-file-tree.tsx
  - src/components/workspace/workspace-shell.tsx
autonomous: true
must_haves:
  truths:
    - "User sees a generated-project file tree in the main preview area"
    - "File tree updates in real time when project config or dependency selections change"
    - "Tree rendering remains smooth for large generated projects because rows are virtualized"
  artifacts:
    - path: "src/server/functions/get-project-preview.ts"
      provides: "BFF preview endpoint that returns normalized generated project files"
      exports: ["getProjectPreview"]
    - path: "src/lib/preview-tree.ts"
      provides: "Deterministic path-to-tree transformation for preview nodes"
      contains: "buildPreviewTree"
    - path: "src/components/workspace/preview-file-tree.tsx"
      provides: "Virtualized preview file tree UI"
      contains: "Arborist"
    - path: "src/hooks/use-project-preview.ts"
      provides: "Reactive query hook keyed by current config and selected dependencies"
      contains: "useProjectPreview"
  key_links:
    - from: "src/hooks/use-project-preview.ts"
      to: "src/server/functions/get-project-preview.ts"
      via: "TanStack Start server function call"
      pattern: "getProjectPreview"
    - from: "src/components/workspace/preview-file-tree.tsx"
      to: "src/lib/preview-tree.ts"
      via: "tree node mapping"
      pattern: "buildPreviewTree"
    - from: "src/components/workspace/workspace-shell.tsx"
      to: "src/hooks/use-project-preview.ts"
      via: "query input from config and dependency state"
      pattern: "useProjectPreview"
---

<objective>
Deliver the live preview file tree foundation by generating a normalized project snapshot and rendering it with virtualization in the workspace main area.

Purpose: Satisfy PREV-01 and the performance portion of PREV-03/LAYO-03 so users can immediately inspect generated project structure as they configure options.
Output: Preview-generation server function, reactive preview hook, deterministic tree model, and react-arborist tree panel wired into workspace shell.
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
@.planning/phases/03-dependency-browser/03-dependency-browser-01-SUMMARY.md
@src/components/workspace/workspace-shell.tsx
@src/server/functions/get-initializr-metadata.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create BFF preview snapshot function for generated project files</name>
  <files>package.json, src/server/lib/initializr-preview-client.ts, src/server/functions/get-project-preview.ts</files>
  <action>Add server-side preview generation by calling Spring Initializr project generation endpoint with current config/dependencies, then unpacking the archive and returning a normalized snapshot (`files[]` with path, text content when decodable, binary flag, size, and content hash). Install only the minimum needed archive library (for example `jszip`) and keep all upstream failures sanitized with an `ok: false` payload, matching existing BFF error-contract patterns. Do not expose raw upstream error bodies or stack traces.</action>
  <verify>Run `npm run build` and confirm the new preview server function compiles; call the server function from a temporary local invocation and verify it returns a non-empty file list for a default config.</verify>
  <done>BFF can produce deterministic generated-project snapshots that downstream UI can consume without directly hitting Spring Initializr from the browser.</done>
</task>

<task type="auto">
  <name>Task 2: Implement file-tree model builder and virtualized tree component</name>
  <files>package.json, src/lib/preview-tree.ts, src/components/workspace/preview-file-tree.tsx</files>
  <action>Install `react-arborist` (per roadmap plan) and build `buildPreviewTree` helpers that transform flat file paths into stable hierarchical nodes with deterministic IDs and sorted folders/files. Implement a tree component using `Arborist` virtualization, with clear states for loading, empty tree, and preview errors. Avoid non-virtualized manual recursion for row rendering because PREV-01 requires smooth behavior with many files.</action>
  <verify>Run `npm run build`; in `npm run dev`, verify the tree component renders from sample snapshot data and scroll remains smooth for a synthetic large file list.</verify>
  <done>Main preview can render generated project structure through a virtualized tree with robust empty/loading/error handling.</done>
</task>

<task type="auto">
  <name>Task 3: Wire workspace main panel to live preview snapshot and tree selection state</name>
  <files>src/hooks/use-project-preview.ts, src/components/workspace/workspace-shell.tsx</files>
  <action>Create `useProjectPreview` query hook keyed on current project config plus selected dependency IDs so updates trigger snapshot refresh automatically. Replace main-area placeholder in `WorkspaceShell` with the real tree panel, maintain selected-file state, and debounce rapid input changes to prevent request storms while preserving near-real-time updates. Keep sidebar behavior intact and avoid implementing syntax highlighting/diff here (reserved for plan 02).</action>
  <verify>Run `npm run dev`, modify config fields and dependency toggles, and confirm tree refreshes automatically without full page reload; finish with `npm run build`.</verify>
  <done>PREV-01 and live-update tree behavior are visible in-app, with workspace now showing an interactive virtualized file tree instead of placeholder content.</done>
</task>

</tasks>

<verification>
1. `npm run build` passes after adding preview server/client layers and tree UI.
2. In `npm run dev`, workspace main panel shows a real generated-project file tree.
3. Editing config or dependency selections causes automatic tree refresh with no manual reload.
4. Large snapshots remain smooth to scroll due to react-arborist virtualization.
</verification>

<success_criteria>
- PREV-01 satisfied: generated project file tree is visible in the main preview area.
- PREV-03 (tree half) satisfied: tree updates in real time as inputs change.
- LAYO-03 foundation established with virtualized file-tree panel ready for file viewer/diff enhancements.
</success_criteria>

<output>
After completion, create `.planning/phases/04-live-preview/04-live-preview-01-SUMMARY.md`
</output>
