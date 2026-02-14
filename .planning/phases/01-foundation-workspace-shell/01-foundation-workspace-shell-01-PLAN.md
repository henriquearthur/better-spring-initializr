---
phase: 01-foundation-workspace-shell
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/routes/__root.tsx
  - src/routes/index.tsx
  - src/components/workspace/workspace-shell.tsx
  - src/components/workspace/workspace-header.tsx
  - src/components/theme/theme-provider.tsx
  - src/components/theme/theme-toggle.tsx
  - src/styles/app.css
autonomous: true
must_haves:
  truths:
    - "App opens directly to a workspace interface with no landing screen"
    - "Workspace has a persistent shell structure ready for sidebar + main preview"
    - "User can switch between light and dark themes from the workspace UI"
  artifacts:
    - path: "src/routes/index.tsx"
      provides: "Default route renders workspace shell immediately"
      contains: "WorkspaceShell"
    - path: "src/components/workspace/workspace-shell.tsx"
      provides: "Foundation workspace layout"
      min_lines: 30
    - path: "src/components/theme/theme-toggle.tsx"
      provides: "Interactive dark/light mode toggle control"
      contains: "setTheme"
  key_links:
    - from: "src/routes/index.tsx"
      to: "src/components/workspace/workspace-shell.tsx"
      via: "route component render"
      pattern: "WorkspaceShell"
    - from: "src/components/theme/theme-provider.tsx"
      to: "src/components/theme/theme-toggle.tsx"
      via: "theme context state"
      pattern: "useTheme"
---

<objective>
Create the initial TanStack Start workspace shell so the app opens straight into a polished tool interface.

Purpose: Establish the Phase 1 UI foundation and satisfy the no-landing-page + theme toggle requirements.
Output: Working app scaffold with direct workspace route, base shell layout, and dark/light mode controls.
</objective>

<execution_context>
@/Users/henriquearthur/.config/opencode/get-shit-done/workflows/execute-plan.md
@/Users/henriquearthur/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/STACK.md
@.planning/research/ARCHITECTURE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Bootstrap TanStack Start app with Tailwind v4 and shadcn/ui baseline</name>
  <files>package.json, src/routes/__root.tsx, src/styles/app.css</files>
  <action>Initialize the project using TanStack Start (React + TypeScript) and wire Tailwind v4 plus shadcn/ui-compatible styling primitives. Ensure global styles and root route wiring are in place for app-wide theming. Keep dependencies aligned with project decisions: TanStack Start + Tailwind + shadcn/ui (no alternative framework or CSS stack).</action>
  <verify>Run `npm install` then `npm run build` and confirm successful build with no missing Tailwind/TanStack setup errors.</verify>
  <done>Project compiles with TanStack Start and Tailwind styles applied through the root app shell.</done>
</task>

<task type="auto">
  <name>Task 2: Implement direct workspace route and base shell layout</name>
  <files>src/routes/index.tsx, src/components/workspace/workspace-shell.tsx, src/components/workspace/workspace-header.tsx</files>
  <action>Create the default `/` route to render `WorkspaceShell` immediately (no landing, splash, or marketing sections). Build a responsive workspace scaffold with header, left configuration panel placeholder, and main preview placeholder so later phases can extend it without restructuring.</action>
  <verify>Run `npm run dev`, open `/`, and confirm first paint is the workspace shell with visible header/sidebar/main sections and no intermediate landing view.</verify>
  <done>Root route always loads workspace shell directly and provides stable layout regions for upcoming configuration and preview features.</done>
</task>

<task type="auto">
  <name>Task 3: Add dark/light theme provider and toggle control</name>
  <files>src/components/theme/theme-provider.tsx, src/components/theme/theme-toggle.tsx, src/components/workspace/workspace-header.tsx</files>
  <action>Implement theme state management and add a visible toggle in the workspace header. Theme switching must update UI tokens/classes across the shell and persist preference locally so refresh keeps selected mode. Avoid introducing unrelated personalization features.</action>
  <verify>In dev mode, toggle theme twice and refresh the page; confirm selected mode persists and both light/dark styles render correctly.</verify>
  <done>User can switch between dark and light themes from workspace header and the selected mode persists across reload.</done>
</task>

</tasks>

<verification>
1. `npm run build` succeeds.
2. `npm run dev` opens directly to workspace on `/`.
3. Theme toggle switches light/dark and persists after refresh.
</verification>

<success_criteria>
- LAYO-01 satisfied: no landing page, workspace loads immediately.
- LAYO-04 satisfied: dark/light toggle is functional and persistent.
- Workspace shell is in place and ready for metadata-driven UI integration.
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-workspace-shell/01-foundation-workspace-shell-01-SUMMARY.md`
</output>
