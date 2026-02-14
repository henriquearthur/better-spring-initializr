---
phase: 04-live-preview
plan: 02
type: execute
wave: 2
depends_on:
  - "01"
files_modified:
  - package.json
  - src/lib/preview-diff.ts
  - src/lib/preview-diff.test.ts
  - src/components/workspace/file-content-viewer.tsx
  - src/components/workspace/preview-file-tree.tsx
  - src/components/workspace/workspace-shell.tsx
autonomous: true
must_haves:
  truths:
    - "User can click any file in the preview tree and read its content"
    - "Opened files display syntax highlighting appropriate to file type"
    - "When dependencies change, user can see exactly which lines changed in affected files"
  artifacts:
    - path: "src/components/workspace/file-content-viewer.tsx"
      provides: "Syntax-highlighted file viewer with empty/binary/error states"
      contains: "FileContentViewer"
    - path: "src/lib/preview-diff.ts"
      provides: "Line-level diff mapping between previous and current snapshots"
      contains: "computePreviewDiff"
    - path: "src/components/workspace/workspace-shell.tsx"
      provides: "Selection wiring and diff-aware viewer integration"
      contains: "FileContentViewer"
  key_links:
    - from: "src/components/workspace/workspace-shell.tsx"
      to: "src/components/workspace/file-content-viewer.tsx"
      via: "selected file content + language + diff props"
      pattern: "FileContentViewer"
    - from: "src/components/workspace/workspace-shell.tsx"
      to: "src/lib/preview-diff.ts"
      via: "compare previous/current snapshots after dependency toggles"
      pattern: "computePreviewDiff"
    - from: "src/components/workspace/preview-file-tree.tsx"
      to: "src/components/workspace/workspace-shell.tsx"
      via: "file selection callback"
      pattern: "onSelectFile"
---

<objective>
Complete the live preview experience by adding a syntax-highlighted file viewer and diff highlighting tied to dependency changes.

Purpose: Satisfy PREV-02 and PREV-04 while finishing LAYO-03 so users can inspect exact generated content and understand what changed.
Output: File content viewer component, diff computation utilities with tests, and workspace wiring that connects tree selection to highlighted file output.
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
@.planning/phases/04-live-preview/04-live-preview-01-SUMMARY.md
@src/components/workspace/workspace-shell.tsx
@src/components/workspace/preview-file-tree.tsx
@src/hooks/use-project-preview.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build syntax-highlighted file viewer for selected preview files</name>
  <files>package.json, src/components/workspace/file-content-viewer.tsx</files>
  <action>Add a dedicated viewer component that renders selected file content with syntax highlighting by extension (XML, Gradle/Kotlin DSL, YAML, Java, Markdown, properties, etc.). Use a stable highlighting library and theme that aligns with existing workspace tokens, and include explicit states for no selection, binary/unreadable files, and loading transitions. Keep rendering read-only and avoid adding editing capabilities in this phase.</action>
  <verify>Run `npm run build`; in `npm run dev`, click multiple file types and confirm syntax highlighting is applied and fallback states render correctly.</verify>
  <done>PREV-02 base behavior exists with reliable file-content rendering and language-appropriate highlighting.</done>
</task>

<task type="auto">
  <name>Task 2: Implement diff computation utilities for snapshot changes</name>
  <files>src/lib/preview-diff.ts, src/lib/preview-diff.test.ts</files>
  <action>Create pure utilities to compare previous and current preview snapshots and return per-file change metadata plus line-level additions/removals for text files. Mark added/removed/modified files and ignore binary line-level diffing. Add focused tests for unchanged files, added files, removed files, and modified multi-line text so diff output remains deterministic and easy to render in the viewer.</action>
  <verify>Run `npm test -- src/lib/preview-diff.test.ts` and confirm all diff scenarios pass.</verify>
  <done>Diff engine reliably explains what changed between preview refreshes and is covered by automated tests.</done>
</task>

<task type="auto">
  <name>Task 3: Integrate tree selection, syntax viewer, and dependency-toggle diff highlighting</name>
  <files>src/components/workspace/workspace-shell.tsx, src/components/workspace/preview-file-tree.tsx</files>
  <action>Wire tree row selection to `FileContentViewer`, preserving selected file across non-breaking refreshes when possible. Track previous and current snapshots, and when dependency selection changes trigger preview updates, compute diff metadata and surface change indicators in both tree rows and viewer line gutters/highlight backgrounds. Keep non-dependency config changes functional, but ensure PREV-04 explicitly works for dependency toggles and avoids noisy full-file re-render flashes.</action>
  <verify>Run `npm run dev`; toggle one dependency and verify changed files are marked, selecting a changed file shows highlighted added/removed lines, and normal file navigation still works; finish with `npm run build`.</verify>
  <done>PREV-02 and PREV-04 are satisfied end-to-end: users can inspect any file and immediately understand dependency-driven changes.</done>
</task>

</tasks>

<verification>
1. `npm test -- src/lib/preview-diff.test.ts` passes for all diff scenarios.
2. `npm run build` succeeds with viewer and workspace integration.
3. Selecting any tree file opens syntax-highlighted content in main preview viewer.
4. Toggling dependencies visibly marks changed files and highlights changed lines in the viewer.
</verification>

<success_criteria>
- PREV-02 satisfied: clicking tree files opens syntax-highlighted file contents.
- PREV-04 satisfied: dependency toggles surface clear, line-level diff feedback.
- LAYO-03 fully satisfied: main area now combines file tree, file viewer, and change visibility.
</success_criteria>

<output>
After completion, create `.planning/phases/04-live-preview/04-live-preview-02-SUMMARY.md`
</output>
