# Project Research Summary

**Project:** Better Spring Initializr
**Domain:** Developer Tool - Web-Based Project Generator/Configurator
**Researched:** 2026-02-14
**Confidence:** HIGH

## Executive Summary

Better Spring Initializr is a modern web-based project generator that improves upon start.spring.io with a workspace-style UI, live preview, and GitHub integration. Research shows this type of tool requires a client-first architecture with precise control over server/client boundaries, making TanStack Start the ideal framework choice over Next.js. The recommended approach is a BFF (Backend-for-Frontend) pattern using server functions to proxy the Spring Initializr API, combined with client-side derived state for instant preview updates without expensive server round-trips.

The key differentiator is the workspace UI with live file tree preview and real-time configuration diffs, which requires careful performance optimization (virtualization, debouncing, memoization) from day one. Users expect all the standard features from start.spring.io (dependency selection, version control, shareable links) plus modern UX improvements (visual dependency cards, dark mode, mobile responsive). The recommended stack centers on TanStack Start + React 19 + TypeScript + Tailwind + shadcn/ui, with specialized libraries for file trees (react-arborist), code editing (Monaco Editor), and state management (TanStack Query for server state, Zustand for client state, nuqs for URL state).

Critical risks include dependency version conflicts that must be validated client-side before generation, OAuth security vulnerabilities (missing CSRF state parameter protection), and performance collapse when previewing large projects without virtualization. The roadmap should prioritize building the core generator with proper validation and performance budgets in Phase 1, then add GitHub integration with secure token management in Phase 2, deferring advanced features like community presets and dependency graphs until product-market fit is proven.

## Key Findings

### Recommended Stack

TanStack Start (RC but stable API) emerges as the best framework for this use case, providing client-first philosophy with server capabilities through server functions. This enables explicit control over data loading and rendering without the "magic" of Next.js, which is critical for a tool requiring precise client/server boundaries. The ecosystem pairs perfectly with TanStack Query for server state and TanStack Virtual for performance-critical file tree rendering.

**Core technologies:**
- **TanStack Start 1.159.5**: Full-stack React framework with SSR and server functions — provides fine-grained control over client/server boundaries without Next.js magic, built on Vite for sub-50ms HMR
- **React 19 + TypeScript 5.5+**: UI library with type safety — essential for maintainability in complex configurator logic, seamless Zod integration for runtime validation
- **Tailwind CSS 4 + shadcn/ui**: Styling and components — industry standard in 2026, copy-paste pattern means you own the code, built on Radix UI for accessibility
- **TanStack Query 5.90.x**: Server state management — cache Spring Initializr API responses with built-in retry, staleTime, and invalidation; essential for dependency browser
- **Zod 3.x**: Runtime validation and type inference — validate config before generation, type-safe URL params for presets, works perfectly with TanStack Start server functions
- **nuqs**: Type-safe URL state management — sync config panel state with URL for shareable presets, better than manual useSearchParams
- **react-arborist 3.x**: VSCode-like file tree with virtualization — critical for live preview, handles large projects without performance collapse
- **Monaco Editor 4.7.0-rc.0**: Code editor in browser — show file diffs and preview generated code, React 19 compatible RC version
- **Zustand 4.x**: Client UI state — manage file tree selection, sidebar panels, diff view state without overkill of Redux
- **Octokit + JSZip + file-saver**: GitHub API SDK, ZIP generation, downloads — needed for GitHub integration and download features

**Critical version compatibility:**
- TanStack Start requires React 19
- Monaco Editor needs RC version (4.7.0-rc.0) for React 19 support; stable 4.6.x only supports React 18
- shadcn/ui CLI auto-configures for Tailwind v4 and React 19
- Biome 2.3.15 is 10-25x faster than ESLint+Prettier but lacks HTML/Markdown support

### Expected Features

Based on analysis of project generators (start.spring.io, TanStack Builder, shadcn create) and configurator UX patterns, users have clear expectations about what's table stakes versus what differentiates products.

**Must have (table stakes):**
- Basic Project Configuration — language, build tool, packaging, group/artifact (Spring Initializr API wrapper)
- Dependency Selection with Search/Filter — browse and select dependencies with descriptions, search large lists
- Framework Version Selection — Spring Boot 2.x vs 3.x with clear labeling
- Download ZIP — standard output format using Spring Initializr API
- Shareable Configuration Links — URL-based config sharing like start.spring.io
- Live Preview of Generated Structure — file tree preview before download (competitors don't have this)
- Mobile-Responsive UI — modern web apps must work on all devices
- Dependency Metadata Display — users need to understand what dependencies do

**Should have (competitive differentiation):**
- Workspace UI (vs form UI) — sidebar config panel + main preview area feels more professional than start.spring.io's form-based layout
- Visual Dependency Cards with Rich Metadata — cards with tags, stats, compatibility info more discoverable than plain lists
- Real-Time Configuration Diff — show what changed when toggling options; no competitor does this
- Live File Content Preview — show actual pom.xml/build.gradle contents, not just tree structure
- Theme Customization — dark/light mode with shadcn/ui theming (low effort, high perceived value)
- Local Storage State Persistence — remember user's last configuration across sessions
- Curated Presets — pre-configured templates for common use cases (REST API, microservice, batch processing)
- Push to GitHub Integration — convenience feature beyond standard download
- README Generator — auto-generate project README with setup instructions based on selected dependencies

**Defer (v2+):**
- Community Presets Marketplace — requires moderation, quality control, storage infrastructure
- Dependency Graph Visualization — high complexity, needs dependency tree data not in Spring Initializr API
- Multi-Project Templates — major scope expansion beyond single project generation
- Dependency Compatibility Warnings — requires compatibility matrix data not in API (high value but high effort)
- Migration Path Indicators — show breaking changes between Spring Boot versions (educational content effort)

**Anti-features (avoid):**
- Full IDE in browser — massive scope creep, competes with established tools
- User Accounts/Authentication — backend complexity when localStorage + shareable links cover 90% of use cases
- Real-Time Collaboration — WebSocket infrastructure overkill for async sharing via links
- Hosting/Deployment Integration — infrastructure complexity, vendor lock-in concerns

### Architecture Approach

The recommended architecture is a BFF (Backend-for-Frontend) pattern using TanStack Start's server functions as the intermediary layer between client and external services. URL parameters serve as the single source of truth for configuration state, enabling shareable presets without backend storage. Client-side derived state computes file tree previews from configuration using memoized heuristics, avoiding expensive server round-trips on every change. Only when users explicitly request generation does the system call the full Spring Initializr API through server functions.

**Major components:**
1. **Config Sidebar** — collects user selections (dependencies, versions, metadata), syncs to URL via nuqs for shareable presets; React component with form state bound to URL params
2. **Preview Panel** — displays computed file tree with syntax highlighting, shows diffs when config changes; virtual scrolling for large trees using react-arborist, consumes derived state
3. **Generate Actions** — triggers ZIP download or GitHub push based on current config; client components calling server functions for heavy lifting (ZIP proxy, GitHub API calls)
4. **BFF Server Functions** — metadata proxy (caches Spring Initializr API responses), preview generator (simulates structure without full ZIP), archive generator (proxies /starter.zip), GitHub pusher (OAuth + repository creation)
5. **State Layer** — URL state (single source of truth via nuqs + Zod), derived state (memoized file tree computation), session state (OAuth tokens in httpOnly cookies)

**Critical patterns:**
- **URL-as-State**: Store all configuration in URL query params (compressed with lz-string to avoid length limits), making it the single source of truth; enables shareable links, browser history integration, no backend storage
- **BFF via Server Functions**: Proxy all external APIs through TanStack Start server functions to hide API keys, add caching/transformation, simplify error handling; never call Spring Initializr directly from client (CORS issues, rate limiting per client IP)
- **Derived State for Preview**: Compute file tree preview client-side using heuristics without regenerating full project; only generate full ZIP when user explicitly downloads/pushes
- **Optimistic UI**: Update UI immediately on user actions, then validate/finalize with server function; shows loading states, handles rollback if server rejects

### Critical Pitfalls

Research identified 10 critical pitfalls; these are the top 5 that would break core functionality if not addressed from the start.

1. **Dependency Version Conflicts Not Validated Before Generation** — Users select incompatible dependencies (e.g., Spring Cloud with wrong Spring Boot version) resulting in projects that fail to compile. Prevention: implement client-side compatibility checking using Spring Initializr metadata API, display warnings before allowing download, show dependency tree with conflict indicators.

2. **Missing OAuth State Parameter CSRF Protection** — GitHub OAuth flow vulnerable to CSRF attacks if state parameter isn't cryptographically random, stored securely, validated on callback, and single-use. Prevention: use crypto.randomUUID(), store server-side with 5-10min TTL, delete after validation, never store in localStorage.

3. **File Tree Preview Performance Collapse with Large Projects** — Rendering entire file tree without virtualization causes browser freezes when projects have 50+ files. Prevention: use TanStack Virtual or react-arborist from day one, implement React.memo for tree nodes, debounce config changes 300ms, lazy-load file contents on expand.

4. **API Proxy Exposes Sensitive Headers and Credentials** — Blindly forwarding all request headers or returning raw upstream errors exposes internal infrastructure. Prevention: whitelist headers to forward (Accept, Accept-Language, User-Agent only), sanitize error responses, return generic messages to client while logging details server-side.

5. **OAuth Token Storage and Scope Creep** — Storing tokens in localStorage (XSS vulnerable) and requesting broad permissions (`repo` instead of `public_repo`). Prevention: use GitHub Apps for fine-grained permissions, store tokens server-side with encryption, use httpOnly secure cookies, implement 7-30 day expiration, show clear permission explanation before OAuth.

**Additional critical pitfalls:**
- CORS wildcard with credentials (browsers reject, or worse, reflecting Origin creates vulnerability)
- URL parameter state pollution (sensitive data in browser history, length limits cause bookmark failures)
- Spring Initializr API assumptions without validation (hardcoded dependency IDs break when API evolves)
- Diff viewer memory leaks (old diffs not garbage collected, recalculating on every keystroke)
- GitHub repository creation race conditions (repo created but files fail to push, retries create duplicates)

## Implications for Roadmap

Based on research, the roadmap should be structured into 3 primary phases with clear dependency ordering. The architecture research reveals that the BFF layer and config schema are foundational dependencies that must be completed before UI components can function. The pitfalls research shows that security and performance concerns must be addressed in Phase 1, not retrofitted later.

### Phase 1: Foundation & Core Generator UI
**Rationale:** Everything depends on the config schema, URL state management, and BFF proxy layer. Performance optimizations (virtualization, debouncing) must be built from day one, not added later when users complain about browser freezes. This phase delivers a working generator that's better than start.spring.io in UX without GitHub integration.

**Delivers:** Working project generator with workspace UI, live preview, and shareable presets — can download ZIP of configured Spring Boot project

**Addresses features:**
- Basic Project Configuration (language, build tool, packaging, metadata)
- Framework Version Selection with clear Spring Boot version labeling
- Visual Dependency Cards with search/filter (not plain list like start.spring.io)
- Live File Tree Preview with virtualization (react-arborist)
- Shareable Configuration Links via URL state (nuqs + Zod + compression)
- Download ZIP via Spring Initializr API proxy
- Theme Customization (dark/light mode with shadcn/ui)
- Local Storage State Persistence (remember last config)
- Mobile-Responsive Workspace Layout

**Uses stack:**
- TanStack Start project setup with TypeScript, Tailwind v4, shadcn/ui
- Zod schemas for config validation (foundation for everything)
- nuqs for type-safe URL state management
- TanStack Query + server functions for Spring Initializr API proxy with caching
- react-arborist for virtualized file tree (performance critical)
- Zustand for client UI state (sidebar panels, tree selection)

**Avoids pitfalls:**
- Pitfall 1: Implement dependency validation using metadata API before allowing download
- Pitfall 3: Build secure API proxy with header filtering, error sanitization from start
- Pitfall 4: Configure proper CORS with origin whitelist, no wildcard with credentials
- Pitfall 5: Use virtualized file tree (react-arborist or TanStack Virtual) to avoid browser freezes
- Pitfall 7: Design URL parameter schema with validation, length limits, compression
- Pitfall 8: Fetch Spring Initializr metadata on startup, cache with TTL, handle schema changes defensively

**Build order:**
1. TanStack Start setup + config schema (Zod) — no dependencies
2. Spring Initializr API client + metadata proxy server function — needs config schema
3. ConfigSidebar component — needs metadata from BFF
4. File tree computation (client-side heuristics) + PreviewPanel — needs config state
5. ZIP generation server function + download action — needs API client
6. URL state integration (nuqs) — enhances existing config state

### Phase 2: GitHub Integration & Enhanced Preview
**Rationale:** GitHub push is a high-value differentiator but requires OAuth security done correctly (state parameter, secure token storage). Can be built independently of Phase 1 core generator. Real-time diff and file content preview add polish but aren't blockers for launch — add after core is stable.

**Delivers:** Direct push to GitHub, live file content preview, real-time configuration diffs

**Addresses features:**
- Push to GitHub Integration with OAuth flow
- Live File Content Preview (show actual pom.xml/build.gradle contents, not just tree)
- Real-Time Configuration Diff (show what changed when toggling options)

**Uses stack:**
- Octokit for GitHub API integration (repository creation, file commits)
- Monaco Editor for code preview and diff display
- Shiki for syntax highlighting in dependency cards and README previews

**Implements architecture:**
- GitHub OAuth flow with state parameter CSRF protection
- Session-based token storage (httpOnly cookies, server-side encryption)
- GitHub pusher server function (create repo, commit files, handle errors)
- Diff computation with debouncing and Web Worker for large diffs

**Avoids pitfalls:**
- Pitfall 2: Implement OAuth state parameter with crypto.randomUUID(), server-side storage, validation, single-use
- Pitfall 6: Use minimal GitHub scopes (public_repo), store tokens server-side, implement expiration, show clear permission explanation
- Pitfall 9: Use react-diff-view for diffs, implement pagination, lazy-load contents, debounce 300-500ms, use Web Workers for calculation
- Pitfall 10: Check repository existence before creation, implement idempotent retry, show detailed progress, offer rollback on failure

**Build order:**
1. GitHub OAuth setup (state parameter generation, callback validation) — independent
2. Token storage infrastructure (session management, httpOnly cookies) — needs OAuth
3. GitHub pusher server function (repo creation, file commits) — needs token storage
4. Auth UI (login/logout, session display) — needs OAuth flow
5. Monaco Editor integration for file content preview — independent of GitHub
6. Diff computation and viewer — independent, can enhance preview from Phase 1

### Phase 3: Curated Presets & Polish
**Rationale:** Presets add significant value but require usage analytics to identify common patterns. This phase refines the core experience based on real user feedback. README generation and migration warnings provide educational value that differentiates from start.spring.io.

**Delivers:** Official curated presets, README generation, migration path indicators, keyboard shortcuts

**Addresses features:**
- Curated Presets (5-10 official templates: REST API, GraphQL, Batch, Microservice, etc.)
- README Generator (auto-generate based on selected dependencies)
- Migration Path Indicators (show warnings/tips for Spring Boot 2.x vs 3.x)
- Keyboard Navigation (hotkeys for common actions)
- Export to tar.gz (Spring Initializr API supports this already)

**Uses stack:**
- Preset storage system (JSON files or API endpoint)
- Template engine for README generation
- Validation rules for preset compatibility

**Avoids pitfalls:**
- Validation ensures presets don't contain incompatible dependencies (leverages Phase 1 validation)
- Presets versioned to handle Spring Boot evolution

### Phase Ordering Rationale

- **Why Phase 1 first:** Config schema, BFF proxy, and URL state are architectural foundations. Every other feature depends on these. Performance optimizations (virtualization, debouncing) are easier to build correctly from the start than to retrofit. Must prove the core generator is better than start.spring.io before adding GitHub integration.

- **Why Phase 2 second:** GitHub integration is the highest-value differentiator but is independent of core generator functionality. Can be built in parallel once Phase 1 is stable. OAuth security is complex and must be done right — can't rush this in Phase 1. File content preview and diffs enhance the core experience but aren't blockers for initial launch.

- **Why Phase 3 last:** Presets require understanding common usage patterns, which only emerge after launch. README generation and migration warnings are nice-to-have educational features that can wait until product-market fit is established. Keyboard shortcuts and tar.gz export are polish that enhance existing functionality.

- **Dependency insights from architecture research:** Steps 1-3 (setup, schema, URL state) have no dependencies and could be parallel. Steps 4-6 (BFF layer) depend on config schema. Steps 7-9 (UI components) depend on BFF metadata. Steps 10-11 (generation) depend on API client. Steps 12-14 (GitHub) depend on config schema but are independent of UI components, enabling Phase 2 parallel development.

- **Pitfall avoidance through ordering:** Building validation, performance optimization, and security controls into Phase 1 prevents technical debt. Deferring GitHub OAuth to Phase 2 allows time to implement security correctly. Waiting for presets until Phase 3 ensures they're based on real usage data, not assumptions.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1 (dependency validation):** Spring Initializr metadata API structure and compatibility rules are partially documented. May need API testing to understand version constraint representation. Medium research need.

- **Phase 2 (GitHub OAuth state parameter):** Security implementation details are well-documented in GitHub OAuth best practices. Low research need, but requires careful implementation review.

Phases with standard patterns (skip research-phase):

- **Phase 1 (TanStack Start setup, UI components):** Well-documented framework with official guides, shadcn/ui has standard patterns. TanStack ecosystem has comprehensive 2026 guides.

- **Phase 2 (Octokit integration, Monaco Editor):** Official GitHub SDK with TypeScript types, Monaco has extensive documentation. Standard integration patterns.

- **Phase 3 (presets, templates):** Standard JSON-based configuration pattern, no specialized research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries verified via official docs and multiple 2026 web sources. Version compatibility confirmed. TanStack Start is RC but API stable and in production use. |
| Features | HIGH | Based on official documentation of competitors (start.spring.io, TanStack Builder, shadcn create), UX best practices from SmashingMagazine, and 2026 web standards. Clear industry patterns. |
| Architecture | HIGH | TanStack Start patterns verified through official docs and 2026 guides. BFF pattern from Azure Architecture Center and established sources. URL state management from multiple authoritative sources. File tree and state management patterns from React community consensus. |
| Pitfalls | MEDIUM | Based on web search findings (OAuth vulnerabilities, API security), official GitHub OAuth documentation, and established security best practices. Some Spring Initializr-specific behaviors (dependency conflicts) may require validation through direct API testing. Performance pitfalls derived from React best practices. |

**Overall confidence:** HIGH

The stack, features, and architecture recommendations are based on official documentation, established patterns, and 2026 industry standards. The only medium-confidence area is pitfalls, where some Spring Boot-specific dependency conflict scenarios need validation through actual Spring Initializr API testing.

### Gaps to Address

While research is comprehensive, these areas need validation during implementation:

- **Spring Initializr metadata API contract:** Research shows `/metadata/client` endpoint exists and provides dependency information, but exact structure of version constraints and compatibility rules needs testing. Mitigation: fetch metadata in Phase 1 setup and parse defensively, building validation incrementally as contract is understood.

- **Dependency compatibility rules:** No public documentation of Spring Initializr's internal compatibility matrix. Unknown whether API provides machine-readable compatibility constraints or if client must maintain this knowledge. Mitigation: start with basic validation (known incompatibilities), expand based on user-reported issues.

- **Spring Initializr rate limits:** Public start.spring.io has no published SLA or rate limit documentation. Unknown whether aggressive caching (1-hour TTL) is sufficient or if shorter/longer is needed. Mitigation: implement circuit breaker and monitoring from Phase 1, adjust based on observed behavior.

- **GitHub Apps vs OAuth Apps trade-offs:** Research recommends GitHub Apps for fine-grained permissions, but implementation complexity vs OAuth Apps not fully explored. Mitigation: validate in Phase 2 planning whether GitHub Apps' added complexity (webhook handling, installation flow) is justified for this use case.

- **TanStack Start production readiness:** While research confirms API is stable and framework is in production use, RC status means edge case bugs may exist. Mitigation: participate in TanStack community, monitor issue tracker, have contingency plan to fork or contribute fixes if needed.

- **File tree heuristics accuracy:** Client-side preview uses heuristics to simulate project structure without full generation. Gap: how accurate do these need to be for user trust? 80%? 95%? Mitigation: start with basic structure, refine based on user feedback, clearly label as "preview" not "exact."

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [TanStack Start](https://tanstack.com/start/latest) — Core framework, server functions, code execution patterns
- [TanStack Query](https://tanstack.com/query/latest) — Server state management patterns
- [TanStack Virtual](https://tanstack.com/virtual/latest) — Virtualized rendering for performance
- [shadcn/ui](https://ui.shadcn.com/) — Component library, Tailwind v4 setup
- [Biome](https://biomejs.dev/) — Linter/formatter, v2.x features and limitations
- [Zod](https://zod.dev/) — Validation and type inference
- [Octokit GitHub](https://github.com/octokit) — GitHub API SDK
- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps) — OAuth best practices, state parameter
- [Spring Initializr GitHub](https://github.com/spring-io/initializr) — API structure, metadata system
- [nuqs Documentation](https://nuqs.dev) — URL state management library

**Architecture Patterns:**
- [Azure Architecture Center - BFF Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends) — Backend-for-Frontend pattern
- [Sam Newman - BFF](https://samnewman.io/patterns/architectural/bff/) — Pattern definition
- [Monaco Editor React](https://monaco-react.surenatoyan.com/) — React integration, version compatibility

### Secondary (MEDIUM confidence)

**2026 Web Sources:**
- [TanStack Start authentication solutions 2026](https://workos.com/blog/top-authentication-solutions-tanstack-start-2026) — Best practices, caching
- [TanStack ecosystem guide 2026](https://www.codewithseb.com/blog/tanstack-ecosystem-complete-guide-2026) — Stack patterns
- [Biome vs ESLint 2026](https://medium.com/@harryespant/biome-vs-eslint-the-ultimate-2025-showdown-for-javascript-developers-speed-features-and-3e5130be4a3c) — Performance comparisons
- [React Tree View libraries](https://reactscript.com/best-tree-view/) — react-arborist recommendation
- [UX best practices 2026](https://uxpilot.ai/blogs/ux-best-practices) — Modern UX principles
- [Configurator UX design](https://www.smashingmagazine.com/2018/02/designing-a-perfect-responsive-configurator/) — Best practices
- [URL as state management](https://www.jacobparis.com/content/url-as-state-management) — Pattern explanation

**Security and Pitfalls:**
- [OAuth vulnerabilities](https://www.descope.com/blog/post/5-oauth-misconfigurations) — Common mistakes
- [CSRF prevention in OAuth](https://auth0.com/blog/prevent-csrf-attacks-in-oauth-2-implementations/) — State parameter handling
- [OAuth state parameter best practices](https://oneuptime.com/blog/post/2026-01-24-oauth2-state-parameter/view) — Implementation guide
- [API security 2026](https://www.appsecure.security/blog/state-of-api-security-common-misconfigurations) — Common issues
- [CORS mistakes](https://corsfix.com/blog/common-cors-mistakes) — 7 common pitfalls
- [Spring dependency conflicts](https://medium.com/@himanshu675/the-hidden-dangers-of-spring-boot-dependency-conflicts-and-how-to-fix-them-fast-d837ff5c005d) — Version conflict issues

### Tertiary (LOW confidence, needs validation)

- [Common Spring Initializr mistakes](https://javanexus.com/blog/common-spring-initializr-mistakes) — User-reported issues, not official
- [Spring version compatibility](https://stevenpg.com/posts/spring-compat-cheatsheet/) — Community-maintained, may be outdated

---
*Research completed: 2026-02-14*
*Ready for roadmap: yes*
