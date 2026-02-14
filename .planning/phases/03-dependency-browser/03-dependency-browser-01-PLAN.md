---
phase: 03-dependency-browser
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/hooks/use-dependency-browser.ts
  - src/hooks/use-dependency-browser.test.ts
  - src/components/workspace/dependency-browser.tsx
  - src/components/workspace/workspace-shell.tsx
autonomous: true
must_haves:
  truths:
    - "User can browse dependencies grouped by category with readable cards"
    - "User can search dependencies by name or description and results update immediately"
    - "User can toggle dependency selection with clear selected-state feedback"
    - "User can see selected dependency count and clear all selections in one action"
  artifacts:
    - path: "src/hooks/use-dependency-browser.ts"
      provides: "Grouping, searching, and selection state for dependency browser"
      contains: "toggleDependency"
    - path: "src/components/workspace/dependency-browser.tsx"
      provides: "Categorized dependency card UI with search"
      contains: "Search dependencies"
    - path: "src/components/workspace/workspace-shell.tsx"
      provides: "Sidebar integration and selected count/clear-all controls"
      contains: "Dependency Browser"
  key_links:
    - from: "src/components/workspace/workspace-shell.tsx"
      to: "src/components/workspace/dependency-browser.tsx"
      via: "component composition in sidebar"
      pattern: "DependencyBrowser"
    - from: "src/components/workspace/dependency-browser.tsx"
      to: "src/hooks/use-dependency-browser.ts"
      via: "hook usage for grouped + filtered dependency data"
      pattern: "useDependencyBrowser"
    - from: "src/components/workspace/workspace-shell.tsx"
      to: "src/hooks/use-initializr-metadata.ts"
      via: "metadata hook result passed into dependency browser"
      pattern: "useInitializrMetadata"
---

<objective>
Deliver the Phase 3 dependency browser so users can find and manage Spring dependencies from the workspace sidebar.

Purpose: Convert metadata into a fast, visual dependency selection workflow that supports discovery and quick iteration.
Output: Searchable category-based dependency cards with toggle selection, selected count, and clear-all behavior wired into the workspace.
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
@src/hooks/use-initializr-metadata.ts
@src/components/workspace/workspace-shell.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement dependency browser state model for grouping, search, and selection</name>
  <files>src/hooks/use-dependency-browser.ts, src/hooks/use-dependency-browser.test.ts</files>
  <action>Create a dedicated hook that accepts normalized metadata dependencies and returns: grouped categories, search term state, filtered dependency groups, selected dependency IDs, selected count, toggle handler, and clear-all handler. Filtering must match both dependency name and description case-insensitively, while preserving group headings with only matching cards. Keep all logic local and deterministic (no additional API calls or new libraries) because Phase 1 already provides normalized metadata through existing BFF flow.</action>
  <verify>Run `npm test -- src/hooks/use-dependency-browser.test.ts` and confirm grouping, search matching, toggle, and clear-all cases pass.</verify>
  <done>Reusable browser state logic exists with passing tests that prove DEPS-01, DEPS-02, DEPS-04, and DEPS-05 behavior foundations.</done>
</task>

<task type="auto">
  <name>Task 2: Build categorized dependency card browser component</name>
  <files>src/components/workspace/dependency-browser.tsx</files>
  <action>Create a presentational component that renders a search input plus category sections of dependency cards from the hook output. Each card must display dependency name, description (fallback text when absent), and category tag, and include selected/unselected visual treatment for clear feedback. Include empty states for "no metadata yet" and "no search matches". Follow established workspace styling tokens and Tailwind utility conventions; do not introduce a new visual system or animation-heavy interactions in this phase.</action>
  <verify>Run `npm run build` to confirm the component compiles and type-checks with existing workspace/theme setup.</verify>
  <done>DEPS-01, DEPS-02, and DEPS-03 are implemented in UI form with clear grouped cards and robust empty-state handling.</done>
</task>

<task type="auto">
  <name>Task 3: Integrate dependency browser into workspace sidebar with count and clear-all</name>
  <files>src/components/workspace/workspace-shell.tsx</files>
  <action>Replace the dependencies placeholder content in sidebar with the new dependency browser wired to metadata from `useInitializrMetadata`. Show selected dependency count in the section header and expose a clear-all action that resets all selected cards. Maintain existing metadata loading/error signaling and prevent interaction when metadata is unavailable. Keep integration scoped to sidebar state only (no URL persistence yet; that belongs to Phase 2/5 persistence flows).</action>
  <verify>Run `npm run dev`, open `/`, verify categories render from metadata, search filters instantly, card toggles update selected styles/count, and clear-all resets to zero; finish with `npm run build`.</verify>
  <done>DEPS-04 and DEPS-05 are fully visible in workspace UX with interactive toggles, accurate selected counts, and one-click clear-all behavior.</done>
</task>

</tasks>

<verification>
1. Load workspace and confirm dependency groups render under the sidebar browser with card name/description/category tag.
2. Type a keyword in search and confirm filtered results update immediately from name/description matches.
3. Toggle multiple dependencies and verify selected styling plus selected count updates in real time.
4. Trigger clear-all and confirm every selected dependency is removed and count returns to zero.
5. Execute test/build checks to verify state logic and integration remain stable.
</verification>

<success_criteria>
- DEPS-01 satisfied: categorized dependency browsing is available in sidebar UI.
- DEPS-02 satisfied: dependency search works against name and description with immediate filtering.
- DEPS-03 satisfied: dependency cards show name, description, and category context.
- DEPS-04 satisfied: dependency toggles provide clear selected/unselected feedback.
- DEPS-05 satisfied: selected dependency count and clear-all controls are available and accurate.
</success_criteria>

<output>
After completion, create `.planning/phases/03-dependency-browser/03-dependency-browser-01-SUMMARY.md`
</output>
