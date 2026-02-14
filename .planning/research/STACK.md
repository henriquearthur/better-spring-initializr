# Stack Research

**Domain:** Developer Tool Web Application (Project Generator/Configurator)
**Researched:** 2026-02-14
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **TanStack Start** | 1.159.5 (RC) | Full-stack React framework with SSR, server functions | Client-first philosophy with server capabilities. Built on Vite + TanStack Router. Fine-grained control over data loading and rendering. No magic, explicit patterns. Currently RC but API stable and feature-complete. Better fit than Next.js for tools requiring precise control over client/server boundaries. |
| **React** | 19.x | UI library | Industry standard with massive ecosystem. Excellent TypeScript support. Works seamlessly with TanStack ecosystem. Required for TanStack Start. |
| **TypeScript** | 5.5+ | Type system | Essential for maintainability. Zod integration for runtime validation. TanStack Start has first-class TS support. Reduces bugs in complex configurator logic. |
| **Vite** | 6.x | Build tool | 20-30x faster than traditional bundlers. Powers TanStack Start. Sub-50ms HMR. esbuild for TS transpilation. Industry standard for modern React apps in 2026. |
| **Tailwind CSS** | 4.x | Utility-first CSS framework | De facto standard for modern React apps. AI-friendly class generation. Scales without CSS bloat. Excellent with shadcn/ui. Works beautifully with component-based architecture. |
| **shadcn/ui** | latest | Component library (copy-paste pattern) | Not a dependency, you own the code. Built on Radix UI primitives for accessibility. Tailwind-native styling. Supports Tailwind v4 and React 19. Highly customizable. Perfect for polished developer tools. Industry default in 2026. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@tanstack/react-query** | 5.90.x | Server state management | Cache Spring Initializr API responses. Handle API fetching with built-in retry, staleTime, and cache invalidation. Essential for dependency browser and preset loading. Use for ALL server data. |
| **Zod** | 3.x | Runtime validation + type inference | Validate user config before generating project. Type-safe URL params for presets. Validate Spring Initializr API responses. Works perfectly with TanStack Start server functions. |
| **nuqs** | latest | URL state management | Sync config panel state with URL for shareable presets. Better than manual useSearchParams + state sync. Type-safe with Zod schemas. Essential for URL-encoded presets feature. |
| **Octokit** | latest | GitHub API integration | Official GitHub SDK for TypeScript. Push generated project to GitHub. Create repositories, commit files. Full type safety. Only needed for GitHub integration feature. |
| **JSZip** | 3.x | ZIP file generation | Generate downloadable project archives. Client-side ZIP creation from file tree. Use with FileSaver.js for browser downloads. |
| **file-saver** | 2.x | Client-side file downloads | Trigger browser downloads for generated ZIPs. Works with JSZip blobs. Standard solution for file downloads. |
| **react-arborist** | 3.x | File tree visualization | VSCode-like file tree component. Virtualization for large projects. Expand/collapse, selection. Best-in-class for file explorers. Critical for live preview feature. |
| **@monaco-editor/react** | 4.7.x | Code editor component | Show file diffs, preview generated code. VS Code editor in browser. Syntax highlighting, TypeScript support. Use v4.7.0-rc.0 for React 19 compatibility. |
| **Shiki** (via react-shiki) | latest | Syntax highlighting | Modern, performant syntax highlighter using TextMate grammars. No client-side JS for highlighting. Replaces legacy react-syntax-highlighter. Use for dependency cards, README previews. |
| **Lucide React** | 0.564.x | Icon library | 1671+ icons, tree-shakable. Consistent design system. Used by shadcn/ui. Fully typed React components. Standard choice for Tailwind apps. |
| **clsx** + **tailwind-merge** | latest | Conditional class management | Combine into `cn()` utility. Handle dynamic Tailwind classes without conflicts. Essential pattern with shadcn/ui. |
| **Zustand** | 4.x | Client state management | Manage complex UI state (file tree selection, sidebar panels, diff view state). Simple, predictable, scales well. Use only for client-side state; TanStack Query handles server state. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Biome** | Linting + Formatting | 10-25x faster than ESLint + Prettier. One config file instead of four. Supports TypeScript, React, CSS, GraphQL. Version 2.3.15 stable. Replaces ESLint + Prettier stack. Some limitations: no HTML/Markdown support yet. |
| **Vite TypeScript** | Type checking during dev | Vite transpiles but doesn't type-check. Configure with `tsc --noEmit` in parallel. Set `skipLibCheck: true` to avoid dependency issues. |
| **@types/node** | Node.js types | Required for Vite path resolution in config. Standard dev dependency. |

## Installation

```bash
# Create project with TanStack Start
npm create @tanstack/start@latest

# Core dependencies (if not included in starter)
npm install @tanstack/react-query zod nuqs

# UI & Styling (shadcn/ui requires manual setup, see Installation section below)
npm install tailwindcss @tailwindcss/vite
npm install lucide-react clsx tailwind-merge

# Feature-specific
npm install octokit jszip file-saver
npm install react-arborist @monaco-editor/react@next react-shiki

# State management
npm install zustand

# Dev dependencies
npm install -D @biomejs/biome @types/node
```

### shadcn/ui Installation

```bash
# Initialize shadcn/ui with Vite
npx shadcn@latest init

# Add components as needed
npx shadcn@latest add button
npx shadcn@latest add select
npx shadcn@latest add card
# etc...
```

Note: shadcn/ui copies components into your `src/components/ui` directory. You own and customize the code.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **TanStack Start** | Next.js 16 | Use Next.js if you need mature ecosystem, extensive plugins, or serverless-first deployment. TanStack Start is better for explicit control, less magic, client-first architecture. |
| **TanStack Query** | SWR, Apollo Client | Use SWR for simpler use cases. Apollo only if using GraphQL. TanStack Query is the industry standard for REST APIs with superior DevTools and ecosystem. |
| **Biome** | ESLint + Prettier | Use ESLint + Prettier if you need HTML/Markdown linting, or have extensive existing ESLint plugin dependencies. Biome is faster and simpler but has limited language support. |
| **nuqs** | Manual URL state | Use manual approach if you only have 1-2 URL params. nuqs essential when managing complex URL state with type safety. |
| **react-arborist** | react-folder-tree, MUI Tree View | Use react-folder-tree for simple trees without virtualization. MUI Tree View if already using MUI. react-arborist is best for large file trees (VSCode-like). |
| **@monaco-editor/react** | CodeMirror 6 | Use CodeMirror if you need smaller bundle size or don't need VS Code features. Monaco is heavier but provides superior DX for code diffs and TypeScript support. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **react-syntax-highlighter** | Legacy, not actively maintained. Poor performance for larger code blocks. | **Shiki** (via react-shiki) — modern, WebAssembly-powered, renders ahead of time, no client-side JS overhead. |
| **React Router 6** | TanStack Start bundles TanStack Router, which is more type-safe and feature-rich. Duplicating routing libraries adds bloat. | **TanStack Router** (included with TanStack Start) |
| **Redux / Redux Toolkit** | Overkill for this app. Server state should use TanStack Query. Client state is simple enough for Zustand. | **TanStack Query** (server state) + **Zustand** (client state) |
| **Create React App** | Deprecated, slow builds, no longer recommended by React team. | **Vite** (via TanStack Start) |
| **Plain Tailwind without merge** | Causes class conflicts when composing components dynamically. | **tailwind-merge + clsx** wrapped in `cn()` utility |

## Stack Patterns by Variant

**If using presets heavily:**
- Use Zod schemas for preset validation
- Implement nuqs with Zod integration for type-safe URL params
- Consider adding preset versioning to handle schema evolution

**If adding authentication later:**
- TanStack Start works with all major auth providers (Clerk, Auth.js, WorkOS)
- Use server functions for session validation
- Implement proper cookie configurations (HttpOnly, SameSite)

**If deploying to Cloudflare Workers:**
- TanStack Start has first-class Cloudflare support
- Octokit works in Workers environment
- Be mindful of Worker size limits with Monaco Editor (consider lazy loading)

**If adding database for v2+:**
- Drizzle ORM pairs well with TanStack Start
- TanStack Query handles cache invalidation
- Consider SQLite (Cloudflare D1) or PostgreSQL (Neon, Supabase)

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| TanStack Start 1.x (RC) | React 19.x | Requires React 19. RC status means API stable but may have edge case bugs. |
| @monaco-editor/react 4.7.0-rc.0 | React 19.x | Use RC version for React 19 compatibility. Stable v4.6.x only supports React 18. |
| shadcn/ui latest | Tailwind v4, React 19 | CLI auto-configures for Tailwind v4. Requires manual setup with Vite. |
| Biome 2.3.15 | TypeScript 5.x, React 19 | Stable version. Does NOT support HTML, Markdown, Vue, Astro (yet). |
| TanStack Query 5.90.x | React 18/19 | No React Query v6 planned. Svelte has v6 with runes, but React stays on v5. |
| Zod 3.x | TypeScript 5.5+ | Requires TS 5.5+ for optimal type inference. |

## Confidence Assessment

| Category | Level | Reason |
|----------|-------|--------|
| **Core Framework (TanStack Start)** | MEDIUM-HIGH | RC status (not 1.0) but API stable, actively maintained, used in production. WebSearch + official docs verified current status. No Context7 data available. |
| **UI Layer (shadcn/ui + Tailwind)** | HIGH | Industry standard in 2026. Official docs verified Tailwind v4 and React 19 support. Widespread adoption confirmed via multiple sources. |
| **Supporting Libraries** | HIGH | All libraries verified via official docs or WebSearch from multiple credible sources. Version numbers confirmed via npm search and GitHub releases. |
| **Tooling (Biome)** | MEDIUM | Stable v2.3.15 but some limitations (no HTML/Markdown). WebSearch from multiple sources confirms performance claims and trade-offs. |
| **Architecture Patterns** | HIGH | Standard TanStack ecosystem patterns. Multiple 2026 guides confirm best practices. Community consensus on state management (TanStack Query + Zustand). |

### Verification Sources

**Context7:** Not used (libraries not available in Context7 index)

**Official Documentation:**
- [TanStack Start](https://tanstack.com/start/latest) — RC status, React 19 support
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite) — Setup with Tailwind v4
- [Biome](https://biomejs.dev/) — v2.x stable, language support

**WebSearch (2026):**
- [TanStack Start best practices 2026](https://workos.com/blog/top-authentication-solutions-tanstack-start-2026) — Authentication, caching strategy
- [React Stack 2026](https://www.codewithseb.com/blog/tanstack-ecosystem-complete-guide-2026) — TanStack ecosystem guide
- [Biome vs ESLint 2026](https://medium.com/@harryespant/biome-vs-eslint-the-ultimate-2025-showdown-for-javascript-developers-speed-features-and-3e5130be4a3c) — Performance comparisons
- [React file tree libraries](https://reactscript.com/best-tree-view/) — react-arborist recommendation
- [Monaco Editor React integration](https://monaco-react.surenatoyan.com/) — React 19 RC version
- [Shiki vs react-syntax-highlighter](https://npm-compare.com/highlight.js,prismjs,react-syntax-highlighter,shiki) — Maintenance status comparison

## Sources

### Official Documentation
- [TanStack Start](https://tanstack.com/start/latest) — Core framework documentation
- [TanStack Query](https://tanstack.com/query/latest) — Server state management
- [shadcn/ui](https://ui.shadcn.com/) — Component library documentation
- [Biome](https://biomejs.dev/) — Linter/formatter documentation
- [Zod](https://zod.dev/) — Validation library documentation
- [Lucide Icons](https://lucide.dev/) — Icon library documentation
- [Octokit GitHub](https://github.com/octokit) — GitHub API SDK

### Web Search Sources (2026)
- [TanStack Start best practices](https://workos.com/blog/top-authentication-solutions-tanstack-start-2026) — MEDIUM confidence
- [shadcn/ui Tailwind v4 support](https://ui.shadcn.com/docs/tailwind-v4) — HIGH confidence (official)
- [React Stack Patterns 2026](https://www.codewithseb.com/blog/tanstack-ecosystem-complete-guide-2026) — MEDIUM confidence
- [Biome vs ESLint comparison](https://medium.com/@harryespant/biome-vs-eslint-the-ultimate-2025-showdown-for-javascript-developers-speed-features-and-3e5130be4a3c) — MEDIUM confidence
- [React Tree View libraries](https://reactscript.com/best-tree-view/) — MEDIUM confidence
- [Monaco Editor React](https://monaco-react.surenatoyan.com/) — HIGH confidence (official package docs)
- [Shiki syntax highlighting](https://shiki.matsu.io/) — HIGH confidence (official)
- [URL state management with nuqs](https://nuqs.dev) — HIGH confidence (official)

---
*Stack research for: Better Spring Initializr*
*Researched: 2026-02-14*
