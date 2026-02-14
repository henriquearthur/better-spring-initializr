---
phase: 06-github-integration
plan: 02
type: execute
wave: 2
depends_on: [06-github-integration-01]
files_modified:
  - src/server/lib/github-repository-client.ts
  - src/server/lib/unpack-generated-project.ts
  - src/server/functions/push-project-to-github.ts
  - src/components/workspace/github-push-panel.tsx
  - src/components/workspace/workspace-shell.tsx
autonomous: true
must_haves:
  truths:
    - "Connected user can choose repository owner (personal account or accessible org) and repository name"
    - "User can push the currently generated project to a newly created GitHub repository"
    - "After push, user sees a direct link to the created repository"
  artifacts:
    - path: "src/server/functions/push-project-to-github.ts"
      provides: "Server-side orchestration for create-repo + initial commit from generated project payload"
      exports: ["pushProjectToGitHub"]
    - path: "src/server/lib/github-repository-client.ts"
      provides: "GitHub REST wrappers for repository creation and git database commit operations"
      contains: "createRepository"
    - path: "src/components/workspace/github-push-panel.tsx"
      provides: "UI form and submit flow for owner/repo selection and push status"
      contains: "GitHubPushPanel"
    - path: "src/server/lib/unpack-generated-project.ts"
      provides: "Decodes generated ZIP payload into commit-ready file entries"
      contains: "unpackGeneratedProjectZip"
  key_links:
    - from: "src/server/functions/push-project-to-github.ts"
      to: "src/server/functions/download-initializr-project.ts"
      via: "fetch generated project archive before push"
      pattern: "downloadInitializrProject"
    - from: "src/server/functions/push-project-to-github.ts"
      to: "src/server/lib/github-repository-client.ts"
      via: "create repo then write initial git tree/commit/ref"
      pattern: "createRepository|createCommit"
    - from: "src/components/workspace/github-push-panel.tsx"
      to: "src/server/functions/push-project-to-github.ts"
      via: "push submit action"
      pattern: "pushProjectToGitHub"
---

<objective>
Deliver the repository creation and push workflow so users can publish their generated Spring project to GitHub in one in-app flow.

Purpose: Complete OUTP-03 by turning authenticated GitHub sessions plus generated project output into a created repository with an initial commit.
Output: Push orchestration server function, GitHub repo/git client utilities, ZIP unpack helper, and workspace push UI.
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
@.planning/phases/06-github-integration/06-github-integration-01-PLAN.md
@.planning/phases/05-generation-sharing/05-generation-sharing-01-PLAN.md
@src/server/functions/github-oauth.ts
@src/components/workspace/workspace-shell.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build server-side GitHub repository creation and commit client</name>
  <files>src/server/lib/github-repository-client.ts</files>
  <action>Implement typed GitHub REST wrappers that use the OAuth access token from plan 01 to: (a) create repository for authenticated user or target org, and (b) write the initial commit using Git database APIs (create blobs, create tree, create commit, update `refs/heads/main`). Include owner/repo validation, duplicate-name handling, and permission-denied handling with normalized domain errors. Keep all GitHub API details encapsulated in this module so the server function and UI can stay transport-agnostic.</action>
  <verify>Run `npm test -- src/server/lib/github-repository-client.test.ts` with coverage for personal/org repo creation paths, 422 name conflict mapping, and commit pipeline success/failure.</verify>
  <done>Reusable GitHub repository client can create a repo and write initial commit via typed, sanitized outcomes.</done>
</task>

<task type="auto">
  <name>Task 2: Implement push orchestration server function from generated project</name>
  <files>src/server/lib/unpack-generated-project.ts, src/server/functions/push-project-to-github.ts</files>
  <action>Create `unpackGeneratedProjectZip` to decode base64 ZIP bytes from generation flow into normalized file entries (skip directories, preserve UTF-8 text/binary by base64 payload, reject oversized archives). In `pushProjectToGitHub`, validate active OAuth session, call `downloadInitializrProject` using current workspace config, unpack files, create the target repository, push initial commit through `github-repository-client`, and return `{ ok: true, repositoryUrl, fullName }`. On failure return discriminated sanitized errors (auth missing, invalid repo name, create failed, push failed) without leaking token or raw upstream payloads.</action>
  <verify>Run `npm test -- src/server/lib/unpack-generated-project.test.ts src/server/functions/push-project-to-github.test.ts` and `npm run build`; confirm successful response includes repository URL and error responses remain sanitized.</verify>
  <done>Single server function can transform generated project output into a created GitHub repository with an initial commit.</done>
</task>

<task type="auto">
  <name>Task 3: Add repository target form and push UX in workspace</name>
  <files>src/components/workspace/github-push-panel.tsx, src/components/workspace/workspace-shell.tsx</files>
  <action>Create `GitHubPushPanel` that appears only when OAuth session is connected and includes owner selector (user + orgs from session), repository name input, visibility toggle, and `Push to GitHub` action. Wire submit to `pushProjectToGitHub` with loading state, inline validation errors, and success state showing clickable repository URL plus optional "Open Repo" action. Integrate the panel into workspace near output actions while keeping existing configuration/preview sections intact. Do not expose or pass access token through component props/state.</action>
  <verify>Run `npm run dev` and validate end-to-end: connect GitHub -> choose owner/repo -> push -> success card displays created repo link; invalid repo name and duplicate repo cases show user-safe errors.</verify>
  <done>Users can complete in-app create-and-push flow and immediately navigate to created repository.</done>
</task>

</tasks>

<verification>
1. `npm test -- src/server/lib/github-repository-client.test.ts src/server/lib/unpack-generated-project.test.ts src/server/functions/push-project-to-github.test.ts` passes.
2. `npm run build` succeeds with push server function and workspace push panel integration.
3. Manual flow passes: authenticated user creates repo, push succeeds, and UI displays working GitHub repository URL.
</verification>

<success_criteria>
- OUTP-03 satisfied: user can push generated project to a new GitHub repository via OAuth-backed flow.
- Repository ownership selection, naming validation, and push feedback are fully in-app.
- Security posture maintained: token remains server-side and only sanitized status details are returned to client.
</success_criteria>

<output>
After completion, create `.planning/phases/06-github-integration/06-github-integration-02-SUMMARY.md`
</output>
