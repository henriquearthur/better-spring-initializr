---
phase: 02-project-configuration
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/project-config.ts
  - src/components/workspace/configuration-sidebar.tsx
  - src/components/workspace/workspace-shell.tsx
autonomous: true
must_haves:
  truths:
    - "User can edit project metadata fields (group, artifact, name, description, package name) in the left sidebar"
    - "User can choose Java version, Spring Boot version, build tool, language, and packaging from available options"
    - "Sidebar sections are collapsible and logically grouped for metadata vs build settings"
  artifacts:
    - path: "src/components/workspace/configuration-sidebar.tsx"
      provides: "Collapsible sidebar UI with controlled inputs/selects for all Phase 2 configuration fields"
      min_lines: 120
    - path: "src/lib/project-config.ts"
      provides: "Project configuration types/defaults and metadata-to-select option helpers"
      contains: "ProjectConfig"
    - path: "src/components/workspace/workspace-shell.tsx"
      provides: "Workspace integration that renders the real configuration sidebar"
      contains: "ConfigurationSidebar"
  key_links:
    - from: "src/components/workspace/configuration-sidebar.tsx"
      to: "src/hooks/use-initializr-metadata.ts"
      via: "metadata hook consumption for Java/Boot option lists"
      pattern: "useInitializrMetadata"
    - from: "src/components/workspace/configuration-sidebar.tsx"
      to: "src/lib/project-config.ts"
      via: "shared config types and default option mapping"
      pattern: "ProjectConfig|DEFAULT_PROJECT_CONFIG"
    - from: "src/components/workspace/workspace-shell.tsx"
      to: "src/components/workspace/configuration-sidebar.tsx"
      via: "sidebar composition"
      pattern: "ConfigurationSidebar"
---

<objective>
Build the complete Phase 2 configuration sidebar UI so users can set Spring project metadata and build options directly in the workspace.

Purpose: Deliver CONF-01 through CONF-06 plus LAYO-02 by replacing placeholder sidebar content with real, metadata-driven controls.
Output: New collapsible configuration sidebar component, shared config model helpers, and workspace integration.
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
@.planning/phases/01-foundation-workspace-shell/01-foundation-workspace-shell-02-SUMMARY.md
@src/components/workspace/workspace-shell.tsx
@src/hooks/use-initializr-metadata.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Define project configuration model and metadata option mapping helpers</name>
  <files>src/lib/project-config.ts</files>
  <action>Create a shared `ProjectConfig` type with all Phase 2 fields (`group`, `artifact`, `name`, `description`, `packageName`, `javaVersion`, `springBootVersion`, `buildTool`, `language`, `packaging`) and `DEFAULT_PROJECT_CONFIG` values. Add pure helper functions that derive valid Java/Spring Boot select options and defaults from the metadata payload shape returned by `useInitializrMetadata`, with safe fallback defaults if metadata is unavailable. Keep this file framework-agnostic (no React imports) because it will also be used by URL/local-storage sync in plan 02.</action>
  <verify>Run `npm run build` and confirm type-check/build passes with no unresolved `ProjectConfig` imports or helper typing errors.</verify>
  <done>Reusable config model and metadata-derived option helpers exist and compile cleanly for sidebar/state layers.</done>
</task>

<task type="auto">
  <name>Task 2: Implement collapsible configuration sidebar with full Phase 2 controls</name>
  <files>src/components/workspace/configuration-sidebar.tsx</files>
  <action>Build a dedicated sidebar component with two collapsible sections: (1) Project Metadata and (2) Build Settings. Add controlled text inputs for metadata fields and select/radio controls for Java version, Spring Boot version, build tool (Maven/Gradle), language (Java/Kotlin), and packaging (JAR/WAR). Source Java/Boot options from metadata hook output (not hardcoded), and show loading/error-disabled states when metadata is unavailable. Preserve existing visual language (Tailwind tokens, rounded cards) and avoid introducing unrelated dependency-selection UI in this phase.</action>
  <verify>Run `npm run dev` and verify in browser that all required controls render in the left sidebar, section toggles collapse/expand, and Java/Boot options populate from API metadata once loaded.</verify>
  <done>Sidebar satisfies CONF-01..CONF-06 + LAYO-02 with complete, collapsible, metadata-driven configuration controls.</done>
</task>

<task type="auto">
  <name>Task 3: Integrate configuration sidebar into workspace shell</name>
  <files>src/components/workspace/workspace-shell.tsx</files>
  <action>Replace the current placeholder configuration panel cards with `ConfigurationSidebar` and wire temporary local state handlers so the sidebar is interactive end-to-end inside the workspace layout. Keep current metadata readiness card behavior intact where useful, but ensure sidebar is now the primary left-panel content. Do not add persistence yet; that is handled in plan 02.</action>
  <verify>Run `npm run build` then `npm run dev`; confirm workspace loads with the new sidebar in the left panel and controls can be changed without runtime errors.</verify>
  <done>Workspace left panel now hosts the real configuration sidebar and all Phase 2 form controls are usable in-app.</done>
</task>

</tasks>

<verification>
1. `npm run build` succeeds with new config model and sidebar integration.
2. In `npm run dev`, sidebar shows all required metadata/build fields and both sections collapse/expand.
3. Java and Spring Boot selects are populated from BFF metadata data rather than static hardcoded lists.
</verification>

<success_criteria>
- CONF-01, CONF-02, CONF-03, CONF-04, CONF-05, CONF-06 satisfied via interactive sidebar controls.
- LAYO-02 satisfied: left sidebar contains organized collapsible configuration sections.
- Workspace is ready for persistent URL/local storage state in the next plan.
</success_criteria>

<output>
After completion, create `.planning/phases/02-project-configuration/02-project-configuration-01-SUMMARY.md`
</output>
