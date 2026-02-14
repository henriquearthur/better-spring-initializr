# Architecture Research

**Domain:** Modern Project Generator Tool with Live Preview
**Researched:** 2026-02-14
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Config   │  │ Preview  │  │ Generate │  │  Auth    │    │
│  │ Sidebar  │  │ Panel    │  │ Actions  │  │  Flow    │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
├───────┴─────────────┴─────────────┴─────────────┴───────────┤
│                    STATE LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │         URL State (shareable presets)                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Derived State (computed file tree)           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Session State (OAuth tokens)                 │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    BFF LAYER (Server Functions)              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Metadata │  │ Preview  │  │  Archive │  │  GitHub  │    │
│  │  Proxy   │  │ Generator│  │ Generator│  │  Pusher  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
├───────┴─────────────┴─────────────┴─────────────┴───────────┤
│                   EXTERNAL SERVICES                          │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │  Spring Initializr API   │  │      GitHub API          │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Config Sidebar** | Collects user selections (deps, versions, metadata), syncs to URL | React component with form state bound to URL params |
| **Preview Panel** | Displays computed file tree with syntax highlighting, shows diffs when config changes | React component consuming derived state, virtual scrolling for large trees |
| **Generate Actions** | Triggers ZIP download or GitHub push based on current config | Client components calling server functions for heavy lifting |
| **Auth Flow** | GitHub OAuth for push feature, manages tokens securely | OAuth flow with server-side token storage, client-side session |
| **URL State** | Single source of truth for configuration, enables shareable presets | URL params as serialized config (URL-encoded JSON or base64) |
| **Derived State** | Computes file tree from config without re-fetching | In-memory computation, memoized/cached |
| **Metadata Proxy** | Fetches Spring Initializr metadata (deps, versions) and caches | Server function proxying to Spring Initializr API |
| **Preview Generator** | Generates file tree structure from config without creating ZIP | Server function that simulates project generation |
| **Archive Generator** | Proxies ZIP generation to Spring Initializr or creates locally | Server function calling Spring Initializr /starter.zip endpoint |
| **GitHub Pusher** | Creates repo, commits generated files, pushes to user's GitHub | Server function using GitHub API with user's OAuth token |

## Recommended Project Structure

```
src/
├── app/                    # TanStack Start app directory
│   ├── routes/            # File-based routing
│   │   ├── index.tsx      # Main generator page
│   │   ├── auth/          # OAuth callback routes
│   │   └── api/           # Server routes (if needed beyond server functions)
│   ├── router.tsx         # Router configuration
│   └── ssr.tsx            # SSR entry point
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── ConfigSidebar/    # Configuration form
│   ├── PreviewPanel/     # File tree preview
│   ├── GenerateActions/  # Download/Push buttons
│   └── AuthButton/       # GitHub OAuth flow
├── server/               # Server-side code (BFF)
│   ├── functions/        # Server functions (TanStack Start)
│   │   ├── metadata.ts   # Proxy Spring Initializr metadata
│   │   ├── preview.ts    # Generate file tree preview
│   │   ├── generate.ts   # Generate and return ZIP
│   │   └── github.ts     # Push to GitHub
│   ├── lib/              # Server-only utilities
│   │   ├── api-client.ts # Spring Initializr API client
│   │   ├── github-client.ts # GitHub API client
│   │   └── auth.ts       # OAuth session management
│   └── middleware/       # Request/response middleware
├── lib/                  # Shared utilities (isomorphic)
│   ├── config-schema.ts  # Config validation (Zod)
│   ├── url-state.ts      # URL param serialization
│   └── file-tree.ts      # File tree data structures
├── hooks/                # React hooks
│   ├── useConfig.ts      # URL-synced config state
│   ├── useMetadata.ts    # Spring metadata from server
│   └── usePreview.ts     # Derived file tree state
├── types/                # TypeScript types
│   ├── config.ts         # Configuration types
│   ├── metadata.ts       # Spring Initializr metadata
│   └── github.ts         # GitHub API types
└── styles/               # Global styles (Tailwind)
```

### Structure Rationale

- **app/:** TanStack Start convention for routing and SSR configuration. All routes live here.
- **server/:** Explicit separation of server-only code. TanStack Start's compiler ensures this never ships to client.
- **server/functions/:** Server functions are the BFF layer - type-safe RPC from client to server.
- **lib/:** Shared code that can run in both environments (validation, data structures, utilities).
- **hooks/:** Client-side hooks that manage state, call server functions, and compute derived state.
- **components/:** Standard React component organization with shadcn/ui convention.

## Architectural Patterns

### Pattern 1: URL-as-State for Shareable Presets

**What:** Store all configuration (selected deps, versions, metadata) in URL query parameters, making it the single source of truth.

**When to use:** When users need to share, bookmark, or restore exact configurations.

**Trade-offs:**
- ✅ **Pros:** Shareable links, browser history integration, no backend storage needed, works offline
- ⚠️ **Cons:** URL length limits (~2000 chars), not suitable for sensitive data, visible in browser history

**Example:**
```typescript
// lib/url-state.ts
import { useSearch, useNavigate } from '@tanstack/react-router';
import { compress, decompress } from 'lz-string';

export function useConfigState() {
  const search = useSearch();
  const navigate = useNavigate();

  // Deserialize config from URL
  const config = useMemo(() => {
    if (!search.preset) return defaultConfig;
    try {
      const json = decompress(search.preset);
      return configSchema.parse(JSON.parse(json));
    } catch {
      return defaultConfig;
    }
  }, [search.preset]);

  // Update URL when config changes
  const setConfig = useCallback((newConfig: Config) => {
    const json = JSON.stringify(newConfig);
    const compressed = compress(json);
    navigate({ search: { preset: compressed } });
  }, [navigate]);

  return [config, setConfig] as const;
}
```

### Pattern 2: BFF Layer via Server Functions

**What:** Use TanStack Start's server functions to create a Backend-for-Frontend layer that proxies external APIs, handles secrets, and performs server-side logic.

**When to use:** When you need to hide API keys, perform server-only operations, or add caching/transformation layers.

**Trade-offs:**
- ✅ **Pros:** Type-safe RPC, no API keys in client, can cache/transform responses, simplified error handling
- ⚠️ **Cons:** Adds latency vs direct API calls, requires server deployment (not fully static)

**Example:**
```typescript
// server/functions/metadata.ts
import { createServerFn } from '@tanstack/start';
import { initializrClient } from '../lib/api-client';

export const getMetadata = createServerFn('GET', async () => {
  // This runs only on server, API key never exposed to client
  const metadata = await initializrClient.getMetadata();

  // Transform/cache as needed
  return {
    dependencies: metadata.dependencies.values,
    javaVersions: metadata.javaVersion.values,
    springBootVersions: metadata.bootVersion.values,
  };
});

// client usage (components/ConfigSidebar/index.tsx)
import { getMetadata } from '@/server/functions/metadata';

export function ConfigSidebar() {
  const metadata = await getMetadata();
  // Type-safe, no manual fetch
}
```

### Pattern 3: Derived State for Live Preview

**What:** Compute file tree preview from configuration state without re-fetching or regenerating the entire project.

**When to use:** For responsive UI that updates as user changes config, avoiding expensive operations on every change.

**Trade-offs:**
- ✅ **Pros:** Instant feedback, no server round-trips for simple changes, works offline
- ⚠️ **Cons:** Client-side computation can be complex, may drift from actual generation logic

**Example:**
```typescript
// hooks/usePreview.ts
import { useMemo } from 'react';
import { computeFileTree } from '@/lib/file-tree';

export function usePreview(config: Config) {
  // Memoized computation - only recalculates when config changes
  const fileTree = useMemo(() => {
    return computeFileTree(config);
  }, [config]);

  // Compute diff against previous state
  const diff = useMemo(() => {
    if (!prevConfig) return null;
    return computeDiff(
      computeFileTree(prevConfig),
      fileTree
    );
  }, [prevConfig, fileTree]);

  return { fileTree, diff };
}

// lib/file-tree.ts - isomorphic logic
export function computeFileTree(config: Config): FileNode[] {
  // Simulate file structure based on config
  // This can be simple heuristics, doesn't need to be 100% accurate
  const baseStructure = getBaseStructure(config.language);

  if (config.dependencies.includes('spring-web')) {
    baseStructure.push(createControllerFile());
  }

  return baseStructure;
}
```

### Pattern 4: Optimistic UI with Server Validation

**What:** Update UI immediately based on user actions, then validate/finalize with server function.

**When to use:** For better perceived performance while maintaining server-side correctness.

**Trade-offs:**
- ✅ **Pros:** Feels instant, better UX, reduces perceived latency
- ⚠️ **Cons:** Must handle rollback if server rejects, can confuse users if validation fails

**Example:**
```typescript
// components/GenerateActions/index.tsx
import { generateZip } from '@/server/functions/generate';

export function GenerateActions({ config }: Props) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');

  const handleGenerate = async () => {
    // Optimistic update
    setStatus('generating');

    try {
      const zipBlob = await generateZip({ config });
      setStatus('success');

      // Trigger download
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.name}.zip`;
      a.click();
    } catch (error) {
      // Rollback on error
      setStatus('error');
      toast.error('Failed to generate project');
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={status === 'generating'}>
      {status === 'generating' ? 'Generating...' : 'Download ZIP'}
    </Button>
  );
}
```

## Data Flow

### Request Flow

```
[User Edits Config]
    ↓
[ConfigSidebar] → [useConfigState hook] → [URL update]
    ↓
[URL change detected]
    ↓
[usePreview hook] → [computeFileTree] → [Derived State]
    ↓
[PreviewPanel] renders updated file tree
```

### Generation Flow

```
[User clicks "Generate"]
    ↓
[Client Component] → [generateZip server function]
    ↓
[Server Function] → [Spring Initializr API] → [ZIP bytes]
    ↓
[Response] → [Client] → [Blob download]
```

### GitHub Push Flow

```
[User clicks "Push to GitHub"]
    ↓
[OAuth check] → (if not authed) → [GitHub OAuth flow]
    ↓
[Client Component] → [pushToGithub server function]
    ↓
[Server Function] → [GitHub API: create repo]
    ↓
[Server Function] → [GitHub API: push files]
    ↓
[Response] → [Client] → [Show success + repo URL]
```

### State Management

```
┌──────────────────────────────────────────┐
│            URL Parameters                │
│  (preset=compressed-config-string)       │
└──────────────┬───────────────────────────┘
               ↓ (deserialize)
         [useConfigState]
               ↓
         [Config Object]
               ↓ (derive)
         [computeFileTree]
               ↓
         [File Tree State]
               ↓ (subscribe)
┌──────────────┴───────────────────────────┐
│           React Components               │
│  ConfigSidebar → PreviewPanel            │
└──────────────────────────────────────────┘
```

### Key Data Flows

1. **Config → Preview:** User changes config in sidebar → URL updates → usePreview recomputes file tree → PreviewPanel re-renders. All client-side, instant feedback.

2. **Config → Generation:** User clicks generate → server function receives config → proxies to Spring Initializr API → returns ZIP → client downloads. Server-side, ensures correctness.

3. **OAuth → GitHub Push:** User initiates push → check session → if needed, redirect to GitHub OAuth → callback stores token → server function uses token to create repo and push files.

4. **Metadata Loading:** On mount → call getMetadata server function → caches response → populates dropdown options in sidebar.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1k users** | Single server deployment, no caching needed. TanStack Start on Vercel/Netlify serverless sufficient. Spring Initializr API can handle load. |
| **1k-100k users** | Add CDN for static assets, cache Spring Initializr metadata (1hr TTL), rate-limit generation endpoints, add analytics. Consider edge functions for lower latency. |
| **100k+ users** | Implement request queueing for generation, add rate limiting per IP/user, cache common presets, consider self-hosting Spring Initializr for reliability. Monitor API quotas. |

### Scaling Priorities

1. **First bottleneck:** Spring Initializr API rate limits or downtime.
   - **Fix:** Cache metadata aggressively (serve stale if API down), implement retry logic with exponential backoff, add health check endpoint.

2. **Second bottleneck:** ZIP generation on serverless functions (cold starts, timeout limits).
   - **Fix:** Use streaming responses for large projects, implement background job queue for GitHub pushes, add progress indicators for long operations.

3. **Third bottleneck:** OAuth token storage and session management.
   - **Fix:** Use secure session storage (encrypted cookies or Redis), implement token refresh logic, add session expiry handling.

## Anti-Patterns

### Anti-Pattern 1: Calling Spring Initializr API from Client

**What people do:** Call Spring Initializr API directly from browser to avoid building a backend.

**Why it's wrong:**
- CORS issues (Spring Initializr may not allow all origins)
- Can't cache responses effectively (each user hits API)
- Can't transform/simplify responses
- Exposes internal API structure to clients
- Rate limiting is per client IP, not per app

**Do this instead:** Always proxy through server functions. Cache metadata responses, transform to your needs, handle errors gracefully.

```typescript
// ❌ DON'T: Direct API call from client
fetch('https://start.spring.io/metadata')
  .then(r => r.json())

// ✅ DO: Server function with caching
export const getMetadata = createServerFn('GET', async () => {
  const cached = await cache.get('metadata');
  if (cached) return cached;

  const metadata = await initializrClient.getMetadata();
  await cache.set('metadata', metadata, { ttl: 3600 });
  return metadata;
});
```

### Anti-Pattern 2: Generating Full Project for Preview

**What people do:** Call the full ZIP generation endpoint every time config changes to show accurate preview.

**Why it's wrong:**
- Extremely slow (generates entire project structure)
- Wastes Spring Initializr API quota
- Poor UX (users wait for preview to update)
- Doesn't work offline
- Server costs for heavy operations

**Do this instead:** Compute file tree preview client-side using heuristics. Only generate full project when user explicitly requests download/push.

```typescript
// ❌ DON'T: Generate full project for preview
useEffect(() => {
  generateZip(config).then(zip => extractFileTree(zip));
}, [config]);

// ✅ DO: Compute preview with heuristics
const preview = useMemo(() => computeFileTree(config), [config]);
```

### Anti-Pattern 3: Storing GitHub Tokens in Client State

**What people do:** Store OAuth access tokens in React state or localStorage for convenience.

**Why it's wrong:**
- Security risk (XSS can steal tokens)
- Tokens visible in browser DevTools
- No way to revoke on server
- Difficult to implement refresh logic
- Violates OAuth best practices

**Do this instead:** Store tokens server-side in encrypted session storage. Client only gets session ID in httpOnly cookie.

```typescript
// ❌ DON'T: Client-side token storage
const [githubToken, setGithubToken] = useState(localStorage.getItem('gh_token'));

// ✅ DO: Server-side session with secure cookie
export const pushToGithub = createServerFn('POST', async (config, { request }) => {
  const session = await getSession(request);
  if (!session.githubToken) {
    throw new Error('Not authenticated');
  }

  const github = new GitHubClient(session.githubToken);
  // Use token securely on server
});
```

### Anti-Pattern 4: Putting Entire File Contents in Preview State

**What people do:** Generate and store full file contents for every file in the preview, even if not visible.

**Why it's wrong:**
- Memory intensive (hundreds of files × KB each)
- Slow rendering (React re-renders large trees)
- Wasted computation (user may only view 5-10 files)
- Doesn't scale to large projects

**Do this instead:** Use virtual scrolling, lazy-load file contents on demand, only store file tree structure in state.

```typescript
// ❌ DON'T: Eager full content generation
const preview = files.map(f => ({
  path: f.path,
  content: generateFullContent(f) // Heavy operation for all files
}));

// ✅ DO: Lazy content loading
const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

function FileTreeNode({ file }) {
  const content = expandedFiles.has(file.path)
    ? generateContent(file)
    : null;

  return <TreeNode file={file} content={content} />;
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Spring Initializr API** | Proxy via server functions | Cache metadata (1hr), retry with backoff, handle API downtime gracefully |
| **GitHub API** | OAuth + server-side calls | Store tokens in session, implement refresh logic, respect rate limits (5000/hr) |
| **GitHub OAuth** | Standard OAuth 2.0 flow | Use state parameter for CSRF, validate in callback, store tokens securely |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Client ↔ Server Functions** | Type-safe RPC (TanStack Start) | Automatic serialization, end-to-end type safety, no manual fetch |
| **URL State ↔ React State** | URL params as source of truth | Deserialize on mount, serialize on change, compress for length |
| **Preview ↔ Config** | Derived state (memoized) | Recompute only when config changes, use structural sharing |
| **Auth Flow ↔ Server Functions** | Session cookies | httpOnly, secure, SameSite=Lax, automatic in requests |

## Build Order Dependencies

### Phase 1: Foundation
1. **Setup TanStack Start project** with TypeScript, Tailwind, shadcn/ui
2. **Define config schema** (Zod) - needed by everything else
3. **Implement URL state management** - foundation for shareable presets

### Phase 2: BFF Layer
4. **Create Spring Initializr API client** - server-side library
5. **Implement metadata proxy** - server function to fetch available options
6. **Add caching layer** - improve performance and reduce API calls

### Phase 3: UI Layer
7. **Build ConfigSidebar** - depends on metadata from BFF
8. **Implement file tree computation** - client-side preview logic
9. **Build PreviewPanel** - depends on file tree computation

### Phase 4: Generation
10. **Implement ZIP generation** - server function proxying Spring Initializr
11. **Add download functionality** - client-side blob handling

### Phase 5: GitHub Integration
12. **Setup GitHub OAuth** - required for push feature
13. **Implement GitHub push** - server function using GitHub API
14. **Add auth UI** - login/logout buttons, session display

### Dependencies
- Steps 1-3 have no dependencies (can be parallel)
- Steps 4-6 depend on Step 2 (config schema)
- Steps 7-9 depend on Steps 4-6 (metadata from BFF)
- Step 10 depends on Steps 4-6 (API client)
- Step 11 depends on Step 10 (ZIP generation)
- Steps 12-14 depend on Step 2 (config schema) but independent of Steps 7-11

## Sources

**TanStack Start Architecture:**
- [TanStack Start Overview](https://tanstack.com/start/latest/docs/framework/react/overview)
- [Server Functions | TanStack Start React Docs](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
- [Code Execution Patterns | TanStack Start React Docs](https://tanstack.com/start/latest/docs/framework/react/guide/code-execution-patterns)

**BFF Pattern:**
- [Backends for Frontends Pattern - Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends)
- [Sam Newman - Backends For Frontends](https://samnewman.io/patterns/architectural/bff/)
- [Building a Secure & Scalable BFF (Backend-for-Frontend) Architecture with Next.js API Routes](https://vishal-vishal-gupta48.medium.com/building-a-secure-scalable-bff-backend-for-frontend-architecture-with-next-js-api-routes-cbc8c101bff0)
- [Backends for Frontends. The BFF Pattern](https://medium.com/squer-solutions/micro-frontend-architecture-patterns-backends-for-frontends-d2918927c01d)

**URL State Management:**
- [Your URL Is Your State](https://alfy.blog/2025/10/31/your-url-is-your-state.html)
- [The URL is the ultimate global state management tool](https://www.jacobparis.com/content/url-as-state-management)
- [Type-Safe URL State Management in React With nuqs](https://gitnation.com/contents/type-safe-url-state-management-in-react-with-nuqs)
- [state-in-url - store state in URL like in JSON, type-safe](https://state-in-url.dev/)

**File Tree & State Management:**
- [7 Top React State Management Libraries in 2026](https://trio.dev/7-top-react-state-management-libraries/)
- [7 Best React Tree View Components For React App (2026 Update)](https://reactscript.com/best-tree-view/)
- [File Tree | React Components & Templates](https://magicui.design/docs/components/file-tree)

**Spring Initializr & Project Generators:**
- [GitHub - spring-io/initializr: A quickstart generator for Spring projects](https://github.com/spring-io/initializr)
- [The Spring Initializr alternative for starting complex Spring Boot apps | Bootify.io](https://bootify.io/spring-initializr-alternative.html)
- [How to customize the Spring Initializr](https://medium.com/digitalfrontiers/how-to-customize-the-spring-initializr-2439ecabb069)

**GitHub OAuth:**
- [Authorizing OAuth apps - GitHub Docs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [Best practices for creating an OAuth app - GitHub Docs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app)
- [GitHub App vs. GitHub OAuth: When to Use Which?](https://nango.dev/blog/github-app-vs-github-oauth)

**Monorepo + BFF:**
- [Monorepo Architecture: The Ultimate Guide for 2025](https://feature-sliced.design/blog/frontend-monorepo-explained)
- [Best practices for managing frontend and backend in a single monorepo](https://graphite.com/guides/monorepo-frontend-backend-best-practices)

---
*Architecture research for: Better Spring Initializr - Modern Project Generator Tool*
*Researched: 2026-02-14*
