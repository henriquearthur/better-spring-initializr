# Feature Research

**Domain:** Project Generator / Configurator Tools
**Researched:** 2026-02-14
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Basic Project Configuration | All generators offer this (language, build tool, packaging) | LOW | Spring Initializr API provides this; UI wraps it |
| Dependency Selection | Core purpose of generators | MEDIUM | Browse, search, select dependencies with descriptions |
| Download ZIP | Standard output format across all generators | LOW | Spring Initializr API provides this endpoint |
| Framework Version Selection | Users expect control over major versions | LOW | Spring Initializr API metadata includes available versions |
| Shareable Configuration Links | start.spring.io has "Share" button; users expect to share configs | LOW | Encode config in URL query params |
| Live Preview of Generated Structure | File tree generators show this; users want to see before download | MEDIUM | Parse Spring Initializr response or build client-side from metadata |
| Dependency Metadata Display | Users need to understand what dependencies do | LOW | Spring Initializr API provides descriptions; display with formatting |
| Search/Filter Dependencies | Large dependency lists require search (start.spring.io has this) | LOW | Client-side filtering of API metadata |
| Mobile-Responsive UI | Modern web apps must work on all devices | MEDIUM | Tailwind + shadcn/ui make this easier but requires testing |
| Keyboard Navigation | Power users expect keyboard shortcuts for efficiency | MEDIUM | Focus management, hotkeys for common actions |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Visual Dependency Cards with Rich Metadata | start.spring.io uses plain lists; cards with tags, stats, compatibility info are more discoverable | MEDIUM | Requires metadata enhancement beyond API (potentially npm stats, GitHub stars) |
| Real-Time Configuration Diff | Show what changed when toggling options; no competitor does this | MEDIUM | Track config state, compute diffs, display with syntax highlighting |
| Curated + Community Presets | Pre-configured templates for common use cases (REST API, microservice, etc.) | HIGH | Requires preset system, validation, potentially user-submitted presets |
| Push to GitHub Integration | Download is standard; push directly to new repo is convenience | HIGH | OAuth flow, GitHub API integration, error handling |
| Workspace UI (vs. Form UI) | start.spring.io is form-based; workspace with panels feels more professional | MEDIUM | Layout with sidebar config, main preview area, responsive design |
| Dependency Compatibility Warnings | Warn about version conflicts or incompatible combinations | HIGH | Requires compatibility matrix data (not in Spring Initializr API) |
| Migration Path Indicators | Show breaking changes between Spring Boot 2.x vs 3.x | MEDIUM | Educational content, inline warnings for version-specific issues |
| Live File Content Preview | Show actual file contents (pom.xml, build.gradle, application.properties) not just tree | MEDIUM | Parse/generate from Spring Initializr response or build client-side |
| Multi-Project Templates | Generate monorepo structures or related microservices | HIGH | Beyond single-project scope; requires orchestration |
| README Generator | Auto-generate project README with setup instructions | MEDIUM | Template-based generation from selected config |
| Dependency Graph Visualization | Visual map of dependency relationships | HIGH | Requires dependency tree data (not in Spring Initializr API) |
| Export to Multiple Formats | ZIP + tar.gz + direct GitHub push | LOW | Spring Initializr supports zip/tgz; GitHub push is separate feature |
| Theme Customization | Dark/light mode with shadcn/ui theming | LOW | shadcn/ui provides theme system; low effort, high perceived value |
| Local Storage State Persistence | Save workspace state across browser sessions | LOW | localStorage for config; improves UX for returning users |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full IDE in Browser | "Make it like VS Code" | Massive scope creep; competes with established tools; slow performance | Live preview of key files; download and open in real IDE |
| User Accounts / Authentication | "Save my projects" | Adds backend complexity, privacy concerns, maintenance overhead | Local storage + shareable links covers 90% of use cases |
| Real-Time Collaboration | "Like Figma for Spring projects" | WebSocket infrastructure, conflict resolution, expensive to build/maintain | Shareable links for async collaboration |
| Automatic Dependency Updates | "Keep my dependencies current" | Security/compatibility minefield; requires ongoing maintenance | Show available versions; link to migration guides |
| Custom Dependency Registry | "Add my company's internal dependencies" | Requires proxy/registry management; security concerns | Focus on public Spring ecosystem; enterprises use start.spring.io behind firewall |
| AI Code Generation Beyond Config | "Generate full features with AI" | Scope creep; quality/reliability issues; competes with Copilot | Focus on configuration excellence; let AI tools handle code |
| Hosting / Deployment Integration | "Deploy my project from here" | Infrastructure complexity; vendor lock-in; billing | Generate deployment configs (Dockerfile, k8s manifests) for download |
| Version Control in Browser | "Full git integration" | Reinventing git UIs; complex conflict resolution | Push to GitHub once; users manage git locally |
| Template Approval System | "Moderate community templates" | Moderation overhead; liability concerns; slow community growth | Community templates as "use at your own risk" with GitHub source links |

## Feature Dependencies

```
[Basic Project Configuration]
    └──requires──> [Spring Initializr API Integration]

[Dependency Selection]
    └──requires──> [Spring Initializr API Metadata]
    └──enhances──> [Visual Dependency Cards]
    └──enhances──> [Search/Filter Dependencies]

[Live Preview of Generated Structure]
    └──requires──> [Basic Project Configuration]
    └──enhances──> [Live File Content Preview]

[Shareable Configuration Links]
    └──requires──> [Basic Project Configuration]
    └──requires──> [URL State Management]

[Visual Dependency Cards]
    └──requires──> [Dependency Selection]
    └──enhances──> [Dependency Metadata Display]

[Real-Time Configuration Diff]
    └──requires──> [Live Preview of Generated Structure]
    └──requires──> [State Management]

[Curated + Community Presets]
    └──requires──> [Basic Project Configuration]
    └──requires──> [Preset Storage System]

[Push to GitHub Integration]
    └──requires──> [Download ZIP]
    └──requires──> [OAuth GitHub Authentication]
    └──requires──> [GitHub API Integration]

[Workspace UI]
    └──requires──> [Responsive Layout System]
    └──enhances──> [All Features]

[Dependency Compatibility Warnings]
    └──requires──> [Dependency Selection]
    └──requires──> [Compatibility Matrix Data]

[Local Storage State Persistence]
    └──enhances──> [All Configuration Features]
    └──conflicts──> [User Accounts] (choose one approach)
```

### Dependency Notes

- **Live Preview requires Basic Configuration:** Can't show structure without config selections
- **Real-Time Diff requires State Management:** Must track previous state to compute diffs
- **GitHub Push requires OAuth:** Can't push without authentication
- **Workspace UI enhances all features:** Better layout improves everything
- **Local Storage conflicts with User Accounts:** Two different state persistence strategies; local storage is simpler

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate "better than start.spring.io".

- [x] **Workspace UI Layout** — Core differentiator; sidebar config + main preview area
- [x] **Basic Project Configuration** — Language, build tool, packaging, group/artifact (Spring Initializr API wrapper)
- [x] **Framework Version Selection** — Spring Boot 2.x vs 3.x with clear labeling
- [x] **Visual Dependency Cards** — Browse dependencies as cards (not plain list); includes descriptions, tags
- [x] **Search/Filter Dependencies** — Quick search across dependency names/descriptions
- [x] **Live File Tree Preview** — Show generated project structure before download
- [x] **Download ZIP** — Standard output using Spring Initializr API
- [x] **Shareable Configuration Links** — URL-based config sharing (like start.spring.io but better UI)
- [x] **Theme Customization** — Dark/light mode toggle (shadcn/ui makes this easy)
- [x] **Local Storage State Persistence** — Remember user's last configuration
- [x] **Mobile-Responsive UI** — Works on tablets/phones (important for accessibility)

### Add After Validation (v1.x)

Features to add once core is working and users are engaged.

- [ ] **Real-Time Configuration Diff** — Trigger: Users request "what changed?" feedback; shows before/after when toggling options
- [ ] **Live File Content Preview** — Trigger: Users want to see actual pom.xml/build.gradle contents before download; add tabbed preview
- [ ] **Curated Presets (Official)** — Trigger: Common patterns emerge from usage analytics; create 5-10 official templates (REST API, GraphQL, Batch Processing, etc.)
- [ ] **Push to GitHub Integration** — Trigger: User feedback requests direct push; OAuth + GitHub API to create repo and push
- [ ] **Migration Path Indicators** — Trigger: Spring Boot 3.x adoption questions; show warnings/tips when selecting versions with breaking changes
- [ ] **README Generator** — Trigger: Users manually write same README repeatedly; auto-generate based on dependencies selected
- [ ] **Dependency Compatibility Warnings** — Trigger: Version conflict issues reported; implement warning system for known incompatibilities
- [ ] **Export to tar.gz** — Trigger: Linux/Mac users request it; Spring Initializr API supports this already
- [ ] **Keyboard Navigation** — Trigger: Power users request shortcuts; add hotkeys for common actions

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Community Presets Marketplace** — Why defer: Requires moderation, quality control, storage infrastructure
- [ ] **Dependency Graph Visualization** — Why defer: High complexity; needs dependency tree data not in API
- [ ] **Multi-Project Templates** — Why defer: Major scope expansion; requires new mental model
- [ ] **Custom Metadata Enhancement** — Why defer: Scraping npm/GitHub for stats requires infrastructure
- [ ] **AI-Powered Dependency Recommendations** — Why defer: Requires ML model or API integration; quality concerns

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Workspace UI Layout | HIGH | MEDIUM | P1 |
| Visual Dependency Cards | HIGH | MEDIUM | P1 |
| Live File Tree Preview | HIGH | MEDIUM | P1 |
| Search/Filter Dependencies | HIGH | LOW | P1 |
| Download ZIP | HIGH | LOW | P1 |
| Shareable Configuration Links | MEDIUM | LOW | P1 |
| Theme Customization | MEDIUM | LOW | P1 |
| Local Storage Persistence | MEDIUM | LOW | P1 |
| Mobile-Responsive UI | HIGH | MEDIUM | P1 |
| Basic Project Configuration | HIGH | LOW | P1 |
| Framework Version Selection | HIGH | LOW | P1 |
| Real-Time Configuration Diff | HIGH | MEDIUM | P2 |
| Live File Content Preview | HIGH | MEDIUM | P2 |
| Push to GitHub Integration | MEDIUM | HIGH | P2 |
| Curated Presets | MEDIUM | HIGH | P2 |
| Migration Path Indicators | MEDIUM | MEDIUM | P2 |
| README Generator | MEDIUM | MEDIUM | P2 |
| Dependency Compatibility Warnings | HIGH | HIGH | P2 |
| Keyboard Navigation | MEDIUM | MEDIUM | P2 |
| Export to tar.gz | LOW | LOW | P2 |
| Community Presets Marketplace | MEDIUM | HIGH | P3 |
| Dependency Graph Visualization | LOW | HIGH | P3 |
| Multi-Project Templates | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (MVP)
- P2: Should have, add when possible (post-validation)
- P3: Nice to have, future consideration (v2+)

## Competitor Feature Analysis

| Feature | start.spring.io | TanStack Builder | shadcn create | Our Approach |
|---------|-----------------|------------------|---------------|--------------|
| Project Configuration | Form-based, simple | Visual builder, modern | CLI with visual builder (2026) | Workspace UI with sidebar config panel |
| Dependency Selection | Searchable list with groups | Add-on selection (limited) | N/A (component library) | Visual cards with rich metadata |
| Live Preview | None | None | Theme preview before generation | File tree + content preview |
| Version Selection | Dropdown | Framework version choice | N/A | Prominent version selector with migration warnings |
| Shareable Links | "Share" button generates URL | Not applicable | N/A | URL state + copy button |
| Theming | Fixed light theme | Modern dark UI | Theme configurator | Dark/light toggle with shadcn/ui |
| GitHub Integration | None | None | None | Direct push to new repo |
| Presets | None | Built-in add-ons | N/A | Curated + community templates |
| Download Formats | ZIP, tar.gz | Project files | ZIP | ZIP (v1), tar.gz (v1.x), GitHub push (v1.x) |
| State Persistence | URL only | Unknown | Local config file | localStorage + URL |
| Mobile Support | Basic responsive | Unknown | CLI-first | Full responsive workspace |
| Diff Preview | None | None | None | Real-time config diffs |

## Sources

### Project Generators Analyzed
- [start.spring.io documentation](https://github.com/spring-io/start.spring.io/blob/main/USING.adoc) - Official Spring Initializr usage guide
- [Spring Initializr GitHub](https://github.com/spring-io/initializr) - Underlying API and metadata system
- [TanStack Builder](https://tanstack.com/builder) - Visual project configurator
- [shadcn/ui create](https://ui.shadcn.com/create) - 2026 visual project builder for component library
- [Vite scaffolding](https://vite.dev/guide/) - Template-based project initialization

### UX & Design Patterns
- [Designing a Perfect Configurator UX](https://www.smashingmagazine.com/2018/02/designing-a-perfect-responsive-configurator/) - SmashingMagazine best practices
- [10 UX Best Practices for 2026](https://uxpilot.ai/blogs/ux-best-practices) - Modern UX principles
- [Product Configurator Planning & UX](https://www.driveworks.co.uk/articles/how-to-build-a-product-configurator-planning-design-ux/) - DriveWorks guide

### Technical Implementation
- [OAuth Browser-Based Apps Best Practices](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app) - GitHub OAuth documentation
- [State Persistence with Local Storage](https://medium.com/@lcs2021021/the-art-of-persistent-local-storage-a-developers-guide-to-state-persistence-29ed77816ea6) - State management patterns
- [Advanced React State Management Using URL Parameters](https://blog.logrocket.com/advanced-react-state-management-using-url-parameters/) - URL state patterns
- [Spring Boot 2 to 3 Migration Guide](https://www.baeldung.com/spring-boot-3-migration) - Breaking changes reference

### Dependency Management
- [npm Dependency Visualization](https://npm.anvaka.com/) - Dependency tree visualization
- [NPMHub Browser Extension](https://github.com/npmhub/npmhub) - Dependency metadata display
- [pnpm Peer Dependency Resolution](https://pnpm.io/how-peers-are-resolved) - Conflict handling

### File Tree & Preview Tools
- [Filegen - File Structure Generator](https://filegen.vercel.app) - Interactive file tree creation
- [ReadmeCodeGen File Tree Generator](https://www.readmecodegen.com/file-tree) - Visual directory structure builder
- [diff2html](https://diff2html.xyz/) - Diff visualization library

### Market Research
- [Create React App Alternatives 2026](https://www.zignuts.com/blog/create-react-app-alternatives) - Generator landscape
- [Next.js vs React 2026 Comparison](https://designrevision.com/blog/nextjs-vs-react) - Modern framework patterns
- [12 Scaffolding Tools to Supercharge Development](https://www.resourcely.io/post/12-scaffolding-tools) - Tool ecosystem overview

---
*Feature research for: Better Spring Initializr*
*Researched: 2026-02-14*
*Confidence: HIGH - Based on official documentation, competitor analysis, and current 2026 web standards*
