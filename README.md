# Better Spring Initializr

<img src="public/icon.png" alt="Better Spring Initializr" width="280" />

A better way to bootstrap Spring Boot projects with live preview, curated presets, and a smoother final handoff.

## What Is It?

**Better Spring Initializr** is an enhanced Spring project generator focused on speed and clarity.  
It helps you configure your project, understand generated changes in real time, and finish with a project ready to download, share, or publish.

## Why Use It?

- Faster dependency discovery with search and grouped browsing
- Curated presets for common real-world scenarios
- Live generated-file preview before download
- Dependency impact diff to quickly see what changed
- One-click shareable setup links
- Guided GitHub publish flow (connect, configure, push)

## Who Is This For?

- Spring Boot developers who want a faster bootstrap workflow
- Teams that share project templates and dependency decisions
- People who want more confidence before generating the project

## Tech Stack

- React 19 + TypeScript
- TanStack Start / Router / Query
- Tailwind CSS 4
- Vitest + Testing Library
- Playwright

## How to Run This Project

```bash
npm install
npm run dev
```

Then open: `http://localhost:3000`

## Open Source

This project is open source and evolving.  
If you find an issue or have a feature idea, open an issue in this repository.

## Contributing to Presets

Curated presets are data-driven and live in:

- `src/presets`

How to contribute:

1. Add or edit a `*.json` file in `src/presets`.
2. Follow `src/presets/preset.schema.json`.
3. Keep ids unique and kebab-case.
4. Use `sortOrder` to control card order in the UI.
5. Open a pull request with your changes.
