# Repository Guidelines

## Project Structure & Module Organization
Core app code lives in `src/`:
- `src/routes/`: file-based TanStack routes (including API route handlers like `api.github.oauth.callback.tsx`).
- `src/app/`: app-level composition and route-facing orchestration.
- `src/features/*`: feature slices organized by `components`, `hooks`, and `model`.
- `src/shared/`: shared UI and client utilities (`shared/ui`, `shared/lib`).
- `src/server/features/*`: backend slices organized by `functions`, `domain`, and `infra`.
- `src/server/shared/`: backend shared utilities (`config`, `validation`, `result`, `observability`).
- `src/styles/`: global styles.

Tests are mostly colocated as `*.test.ts` / `*.test.tsx`. End-to-end tests live in `playwright/*.e2e.ts`. Static assets are in `public/`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start local dev server on `http://localhost:3000`.
- `npm run build`: production build with Vite.
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint rules (hooks/import order/boundaries).
- `npm run test`: run Vitest unit/integration tests.
- `npm run test:e2e`: run Playwright flows (auto-starts `npm run dev`).

## Coding Style & Naming Conventions
Use TypeScript with strict compiler settings (`tsconfig.json`). Follow existing style in `src/`: 2-space indentation, single quotes, no semicolons, and trailing commas where applicable.

Naming conventions:
- Components/types: `PascalCase`
- Variables/functions: `camelCase`
- Route/component files: kebab-case or route-dot notation (for example `workspace-shell.tsx`, `api.github.oauth.callback.tsx`)

Do not hand-edit generated router artifacts such as `src/routeTree.gen.ts`.

## Testing Guidelines
Write unit tests with Vitest and Testing Library; keep tests near the source module when possible. Name files `*.test.ts` or `*.test.tsx`. Keep browser/user-flow scenarios in Playwright and name them `*.e2e.ts`.

Before opening a PR, run:
- `npm run lint`
- `npm run test`
- `npm run test:e2e` (for UI or flow changes)

## Commit & Pull Request Guidelines
Commit messages follow Conventional Commits, typically with scopes (for example `feat(github): ...`, `fix(phase-07): ...`, `docs: ...`).

Open PRs from feature branches off latest `main` (for example `feat/github-publish-panel`). Keep commits atomic, describe intent and impact in the PR body, link related issues/plans, and include screenshots for UI changes. Request review only after CI passes, and enable source branch deletion on merge.

## Security & Configuration Tips
GitHub OAuth features rely on server env vars:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_OAUTH_CALLBACK_URL`
- `GITHUB_SESSION_SECRET` (minimum 32 characters)

Never commit secrets; use local env files or your secret manager.
