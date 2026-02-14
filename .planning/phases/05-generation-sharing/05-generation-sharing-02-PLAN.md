---
phase: 05-generation-sharing
plan: 02
type: execute
wave: 2
depends_on: [05-generation-sharing-01]
files_modified:
  - src/lib/share-config.ts
  - src/hooks/use-shareable-config.ts
  - src/components/workspace/workspace-output-actions.tsx
  - src/components/workspace/workspace-shell.tsx
autonomous: true
must_haves:
  truths:
    - "User can download the configured project as a ZIP with one click"
    - "User can copy a shareable URL representing the current configuration"
    - "Opening the shared URL restores the same configuration state"
  artifacts:
    - path: "src/components/workspace/workspace-output-actions.tsx"
      provides: "UI actions for download and copy-share-link with loading/success/error feedback"
      contains: "WorkspaceOutputActions"
    - path: "src/lib/share-config.ts"
      provides: "Stable encode/decode codec for configuration snapshots in URL-safe format"
      exports: ["encodeShareConfig", "decodeShareConfig"]
    - path: "src/hooks/use-shareable-config.ts"
      provides: "Hook for reading/writing share token in URL and restoring config"
      contains: "useShareableConfig"
    - path: "src/components/workspace/workspace-shell.tsx"
      provides: "Integration point that wires output actions into real workspace state"
      contains: "WorkspaceOutputActions"
  key_links:
    - from: "src/components/workspace/workspace-output-actions.tsx"
      to: "src/server/functions/download-initializr-project.ts"
      via: "download action server function call"
      pattern: "downloadInitializrProject"
    - from: "src/components/workspace/workspace-output-actions.tsx"
      to: "src/lib/share-config.ts"
      via: "share token generation"
      pattern: "encodeShareConfig"
    - from: "src/hooks/use-shareable-config.ts"
      to: "src/components/workspace/workspace-shell.tsx"
      via: "initial state hydration from URL token"
      pattern: "decodeShareConfig"
---

<objective>
Deliver the user-facing generation and sharing experience by wiring download + share controls into workspace state and URL hydration.

Purpose: Complete OUTP-01 and OUTP-02 so users can both export their project and hand off exact configurations through links.
Output: Share codec, URL hydration hook, output action UI, and workspace integration for one-click download/share workflows.
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
@.planning/phases/05-generation-sharing/05-generation-sharing-01-PLAN.md
@src/components/workspace/workspace-shell.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement shareable configuration codec and URL hydration hook</name>
  <files>src/lib/share-config.ts, src/hooks/use-shareable-config.ts</files>
  <action>Create a compact, URL-safe serialization format for full workspace configuration snapshot (metadata/build settings + selected dependency ids), using base64url-encoded JSON with explicit schema versioning to support future migrations. Add decode validation with graceful fallback to defaults for malformed/unknown versions. Implement `useShareableConfig` to (a) read `share` token from current URL on initial load, (b) decode and provide restored config state, and (c) generate a canonical share URL for the current state without manual string concatenation bugs. Avoid adding backend persistence; Phase 5 sharing is URL-only by requirement and project constraint.</action>
  <verify>Run `npm test -- src/lib/share-config.test.ts` and confirm decoding handles valid token, malformed token, and unsupported version cases.</verify>
  <done>Share token encode/decode and URL hydration logic are deterministic, versioned, and resilient to invalid input.</done>
</task>

<task type="auto">
  <name>Task 2: Build output actions component for ZIP download and link copy</name>
  <files>src/components/workspace/workspace-output-actions.tsx</files>
  <action>Create a reusable workspace actions component with two primary controls: `Download ZIP` and `Copy Share Link`. Wire download to `downloadInitializrProject` server function from plan 01, decode returned base64 bytes, and trigger browser file save with server-provided filename. Wire share action to the share codec/hook output and copy to clipboard with visible success/failure feedback. Add loading/disabled states to prevent duplicate requests and keep styling aligned with existing workspace visual language.</action>
  <verify>Run `npm run build` and in `npm run dev` validate both actions: download triggers a `.zip` save dialog, and copy action places a URL containing `share=` in clipboard.</verify>
  <done>Users have one-click download and share-link copy actions with clear status feedback.</done>
</task>

<task type="auto">
  <name>Task 3: Integrate generation/sharing actions into workspace state flow</name>
  <files>src/components/workspace/workspace-shell.tsx</files>
  <action>Replace current placeholder output area in `WorkspaceShell` with `WorkspaceOutputActions` and wire it to the canonical workspace configuration state introduced in prior phases (metadata/build/dependency selections). Ensure initial state can be overridden from URL share token via `useShareableConfig`, and preserve existing metadata readiness/error indicators where still useful. Do not introduce unrelated GitHub push controls (Phase 6 scope) or preset libraries (Phase 7 scope).</action>
  <verify>Run `npm run build` and manual flow: configure values -> copy share link -> open link in new browser context -> confirm same config appears and ZIP download still works.</verify>
  <done>Workspace supports end-to-end generation and shareable restoration for current configuration in-app.</done>
</task>

</tasks>

<verification>
1. `npm test -- src/lib/share-config.test.ts` passes with valid and invalid share token cases.
2. `npm run build` succeeds with output-actions integration.
3. Manual end-to-end check passes: copy link, open in fresh tab/window, restored config matches, and download yields ZIP file.
</verification>

<success_criteria>
- OUTP-01 satisfied: user can download generated ZIP from workspace with one action.
- OUTP-02 satisfied: user can copy/open share URL that reproduces configuration state.
- Phase 5 completes without introducing backend database or out-of-scope collaboration features.
</success_criteria>

<output>
After completion, create `.planning/phases/05-generation-sharing/05-generation-sharing-02-SUMMARY.md`
</output>
