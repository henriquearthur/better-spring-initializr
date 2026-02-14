# Pitfalls Research

**Domain:** Spring Boot Project Generator with Live Preview and GitHub Integration
**Researched:** 2026-02-14
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Dependency Version Conflicts Not Validated Before Generation

**What goes wrong:**
Users select incompatible dependencies that cause Spring Boot version conflicts, resulting in projects that fail to compile or run after generation. Spring Boot pulls in hundreds of transitive dependencies, and as users add more libraries, version conflicts become almost inevitable. Spring Cloud dependencies are particularly problematic, requiring specific Spring Boot versions (e.g., Spring Cloud with Spring Boot 3.5.x may require downgrade to 3.4.x).

**Why it happens:**
- Spring Initializr API returns whatever dependencies the user selects without client-side validation
- Developers assume the generator validates compatibility but it only checks if dependencies exist
- The BOM (Bill of Materials) managed by Spring Boot may conflict with user-selected library versions
- Transitive dependency trees aren't visualized before generation

**How to avoid:**
- Implement client-side dependency compatibility checking before allowing download
- Query Spring Initializr metadata API (`/metadata/client`) to understand version constraints
- Display warnings when selecting dependencies known to conflict with chosen Spring Boot version
- Show dependency tree preview with conflict indicators in the UI
- Include a "compatibility check" step in the generation flow

**Warning signs:**
- Users report "NoSuchMethodError" or "ClassNotFoundException" after generating projects
- High bounce rate on dependency selection page (users frustrated and leaving)
- GitHub issues mentioning specific dependency combinations that don't work
- Support requests about "project won't compile"

**Phase to address:**
Phase 1 (Core Generator UI) - Build validation into dependency selector component with real-time compatibility feedback

---

### Pitfall 2: Missing OAuth State Parameter CSRF Protection

**What goes wrong:**
GitHub OAuth integration is vulnerable to CSRF attacks where attackers can trick users into authorizing malicious applications or inject authorization codes. Without proper state parameter validation, attackers can initiate an OAuth flow, intercept the authorization code, and gain unauthorized access to user repositories.

**Why it happens:**
- Developers skip the state parameter thinking it's optional (it's recommended but not technically required)
- State validation logic is implemented incorrectly (comparing with wrong stored value)
- State isn't single-use, allowing replay attacks
- State expires too slowly (>10 minutes), widening attack window
- State is predictable (not cryptographically random)

**How to avoid:**
- Generate cryptographically secure random state value (use Web Crypto API: `crypto.randomUUID()`)
- Store state server-side with short TTL (5-10 minutes maximum)
- Validate on callback with timing-safe comparison
- Delete state immediately after successful validation (single-use)
- Include state in session/cookie with SameSite=Lax or Strict
- Never store state in localStorage (vulnerable to XSS)

**Warning signs:**
- Security audit flags missing state parameter
- OAuth callback doesn't verify state matches what was sent
- State stored in predictable format or client-side only
- No expiration logic for state values
- Multiple requests can use same state value

**Phase to address:**
Phase 2 (GitHub Integration) - Implement state parameter validation as part of OAuth flow before any token exchange

---

### Pitfall 3: API Proxy Exposes Sensitive Headers and Credentials

**What goes wrong:**
The BFF (Backend for Frontend) server function proxying Spring Initializr API accidentally forwards sensitive headers, logs API responses containing potential secrets, or exposes internal error details to the frontend. Attackers can exploit verbose error messages to understand backend infrastructure or extract configuration details.

**Why it happens:**
- Copying all request headers blindly when proxying to upstream API
- Not sanitizing error responses before sending to frontend
- Logging full request/response bodies containing sensitive data
- Exposing stack traces in production
- Returning raw upstream API errors without filtering

**How to avoid:**
- Whitelist headers to forward (only forward: Accept, Accept-Language, User-Agent)
- Never forward: Authorization, Cookie, X-Forwarded-*, Host, Origin
- Strip sensitive headers from upstream responses before returning to client
- Implement error response sanitization layer
- Return generic error messages to client ("Service unavailable") while logging details server-side
- Use structured logging with sensitivity markers
- Set up Content Security Policy (CSP) headers

**Warning signs:**
- Browser DevTools shows unexpected headers in API responses
- Error messages reveal file paths, database connection strings, or internal IPs
- Logs contain full request bodies with potentially sensitive user data
- Upstream API rate limit headers exposed to frontend
- Stack traces visible in production frontend

**Phase to address:**
Phase 1 (Core Generator UI) - Build secure proxy layer with header filtering before exposing any API endpoints

---

### Pitfall 4: CORS Wildcard with Credentials

**What goes wrong:**
Setting `Access-Control-Allow-Origin: *` while also enabling credentials causes browsers to reject requests. Even worse, fixing this by dynamically reflecting the Origin header (`Access-Control-Allow-Origin: ${request.origin}`) creates a critical security vulnerability where any malicious site can make authenticated requests to your API.

**Why it happens:**
- Developers see CORS errors during development and use `*` as quick fix
- Misunderstanding that wildcards are forbidden when credentials are involved
- Copying CORS middleware configuration from outdated tutorials
- Not understanding difference between development and production CORS needs
- Using `Access-Control-Allow-Origin: *` AND `Access-Control-Allow-Credentials: true` (browsers reject this)

**How to avoid:**
- For development: Use Vite/TanStack Start dev server proxy instead of CORS
- For production: Whitelist specific origins in environment configuration
- Never dynamically reflect Origin header without validation
- Use explicit origin list: `const allowedOrigins = ['https://yourdomain.com']`
- Validate origin before setting CORS headers
- Document why wildcard is acceptable (if truly public API with no credentials)
- Set credentials: 'include' only when absolutely necessary

**Warning signs:**
- Console errors: "Access-Control-Allow-Origin cannot be * when credentials flag is true"
- CORS headers present with both wildcard AND credentials
- CORS middleware reflects any Origin without validation
- Production uses same CORS config as development
- OPTIONS preflight requests failing

**Phase to address:**
Phase 1 (Core Generator UI) - Configure proper CORS policy in server functions from the start; Phase 3 (when adding authentication if needed)

---

### Pitfall 5: File Tree Preview Performance Collapse with Large Projects

**What goes wrong:**
Live file tree preview becomes unusably slow when users select many dependencies that generate 50+ files. Without virtualization, rendering thousands of DOM nodes for file trees causes browser freezes, janky scrolling, and delayed diff updates. Performance degrades exponentially as file count increases.

**Why it happens:**
- Rendering every tree node in the DOM regardless of visibility
- Not using virtual scrolling/windowing for large lists
- Recalculating entire tree diff on every dependency change
- Lack of memoization for tree node components
- Loading and parsing entire zip file contents synchronously
- Not lazy-loading file contents until user expands nodes

**How to avoid:**
- Use TanStack Virtual for file tree rendering (60 FPS even with 1000+ nodes)
- Implement virtualized tree component (only render visible nodes + buffer)
- Use React.memo for tree node components
- Debounce dependency changes (wait 300ms before recalculating preview)
- Parse zip incrementally using streams
- Lazy load file contents on expand, not upfront
- Show skeleton loading states during tree calculation
- Consider pagination or "load more" for very large trees
- Profile with React DevTools Profiler to identify re-render issues

**Warning signs:**
- Browser DevTools Performance tab shows long tasks (>50ms)
- FPS drops below 30 during scrolling
- Users report "browser freezing" when selecting many dependencies
- Memory usage spikes when opening file tree
- Diff updates take >1 second to reflect changes
- Large projects (Spring Boot + Spring Cloud + multiple starters) cause timeouts

**Phase to address:**
Phase 1 (Core Generator UI) - Build file tree with virtualization from day one, not as later optimization

---

### Pitfall 6: OAuth Token Storage and Scope Creep

**What goes wrong:**
Storing GitHub OAuth tokens insecurely (localStorage, long-lived tokens) and requesting overly broad permissions. Users grant excessive repository access because the app requests `repo` scope when it only needs specific permissions. Leaked tokens provide unlimited access until manually revoked.

**Why it happens:**
- Storing tokens in localStorage (vulnerable to XSS attacks)
- Using classic PATs instead of fine-grained tokens
- Requesting broad scopes (`repo`) instead of minimal permissions (`public_repo` for public only)
- Tokens don't expire (valid until revoked)
- No refresh token rotation strategy
- Users don't understand what permissions they're granting

**How to avoid:**
- Use GitHub Apps instead of OAuth Apps (fine-grained permissions, short-lived tokens)
- If using OAuth: request minimal scopes needed (`public_repo` for public repos only)
- Store tokens server-side with encryption at rest
- Never store tokens in localStorage or sessionStorage
- Use httpOnly, secure, SameSite cookies for token storage
- Implement token expiration (90 days max, ideally 7-30 days)
- Show clear permission explanation before OAuth redirect
- Add "disconnect GitHub" feature to revoke tokens
- Log token usage for audit trail

**Warning signs:**
- Requesting `repo` scope when app only pushes to user-created repos
- Tokens stored in browser localStorage
- No token expiration logic
- Users can't revoke access from your UI
- Token exposed in frontend JavaScript bundle
- Same token used for all operations (no token rotation)

**Phase to address:**
Phase 2 (GitHub Integration) - Design token management strategy before implementing OAuth flow

---

### Pitfall 7: URL Parameter State Pollution and Security

**What goes wrong:**
Using URL parameters for configuration state causes security and UX issues: sensitive data appears in browser history/logs, URLs become unreadable bookmarks, parameter conflicts break deep linking, and users accidentally share URLs containing internal configuration or debugging flags.

**Why it happens:**
- Encoding entire project configuration in URL without sanitization
- Not validating URL parameters before applying to UI
- Including internal state flags in shareable URLs
- Using unclear parameter names (`?foo=true&bar=2&x=dark`)
- Not implementing URL length limits (browsers cap at ~2000 chars)
- Logging URLs server-side without redaction
- Storing sensitive preferences in URL instead of user settings

**How to avoid:**
- Use semantic parameter names (`?dependencies=web,jpa&javaVersion=21`)
- Validate and sanitize all URL parameters before use
- Implement URL length warning (warn at 1500 chars, block at 2000)
- Never put sensitive data in URLs (tokens, emails, internal IDs)
- Hash or compress large configurations
- Provide "Copy Shareable Link" that generates clean URL
- Strip debug parameters before creating shareable links
- Document URL parameter schema in API docs
- Use Base64/URL-safe encoding for complex objects
- Implement URL parameter versioning for backwards compatibility

**Warning signs:**
- URLs exceed 500 characters regularly
- User reports "bookmark doesn't work"
- Browser history contains partial or corrupted state
- Analytics shows URLs with unexpected parameters
- Parameters conflict (multiple sources of truth)
- URLs contain obvious internal flags or debug info
- Copy-paste URLs break due to encoding issues

**Phase to address:**
Phase 1 (Core Generator UI) - Design URL parameter schema with validation before implementing preset sharing

---

### Pitfall 8: Spring Initializr API Assumptions Without Validation

**What goes wrong:**
Assuming Spring Initializr API behavior without testing: API may change response format, add/remove dependencies, change metadata structure, or impose undocumented rate limits. The public start.spring.io has no SLA, so availability isn't guaranteed. Apps break when API evolves.

**Why it happens:**
- Not fetching metadata to understand current API schema
- Hardcoding dependency IDs that might change
- Assuming API response shape without version checking
- No fallback when API is unavailable
- Not caching metadata to reduce API calls
- Skipping error handling for upstream failures
- No monitoring of API response times or errors

**How to avoid:**
- Always fetch `/metadata/client` on app startup to get current schema
- Cache metadata with TTL (1 hour) to reduce API load
- Implement circuit breaker for API calls (fail fast after 3 consecutive errors)
- Version your API contract expectations, handle unknown fields gracefully
- Add retry logic with exponential backoff (max 3 retries)
- Monitor API response times and error rates
- Have fallback UI when API unavailable ("API temporarily unavailable")
- Parse API responses defensively (check for expected fields before accessing)
- Log API schema changes for debugging
- Set reasonable timeouts (5-10 seconds for metadata, 30 seconds for generation)

**Warning signs:**
- Hardcoded dependency arrays in frontend code
- No error handling around API calls
- Assuming specific response structure without validation
- Not checking API response status codes
- No caching of expensive metadata calls
- Users report intermittent failures without explanation
- Breaking when Spring adds new Boot versions

**Phase to address:**
Phase 1 (Core Generator UI) - Build resilient API client with metadata fetching and defensive parsing from the start

---

### Pitfall 9: Diff Viewer Memory Leaks and Performance Issues

**What goes wrong:**
Real-time diff viewing causes memory leaks when old diff calculations aren't garbage collected, components re-render unnecessarily on every keystroke, and large file diffs (2.2MB+ with 375+ files) take 20+ seconds to render. Browser tabs crash with large Spring Cloud projects.

**Why it happens:**
- Not cleaning up event listeners or subscriptions in diff components
- Recalculating diffs on every dependency change without debouncing
- Loading entire zip file into memory for diff calculation
- Using inefficient diff algorithms (character-by-line instead of line-by-line)
- No pagination or lazy loading of diffs
- Keeping all historical diffs in memory
- Not using React.memo or useMemo for diff components

**How to avoid:**
- Use proven diff libraries (react-diff-view handles 2.2MB files)
- Implement diff pagination (show 10 files at a time)
- Lazy load file contents only when diff is expanded
- Use Web Workers for diff calculation to avoid blocking main thread
- Debounce dependency changes (300-500ms) before recalculating
- Clean up old diffs when new configuration loads
- Use virtual scrolling for file lists
- Show "calculating diff..." loading state for operations >100ms
- Profile memory usage with Chrome DevTools Memory tab
- Limit diff context lines (show ±3 lines by default, expand on demand)

**Warning signs:**
- Memory usage grows over time without users closing the app
- Browser tab crashes when selecting many dependencies
- Diff rendering takes >2 seconds
- UI freezes during diff calculation
- Chrome DevTools Performance shows long tasks during diff updates
- Users report "tab became unresponsive"
- React DevTools Profiler shows excessive re-renders

**Phase to address:**
Phase 1 (Core Generator UI) - Build diff viewer with performance budgets (sub-second for 90% of diffs)

---

### Pitfall 10: GitHub Repository Creation Race Conditions

**What goes wrong:**
Creating repository and pushing files aren't atomic, causing partial failures: repository created but files fail to push, or files pushed to wrong repository. Users end up with empty repositories or corrupted state. Retry attempts create duplicate repositories.

**Why it happens:**
- No transaction-like handling for multi-step GitHub operations
- Not checking if repository exists before creation
- Retrying repository creation without idempotency
- Not handling GitHub API rate limits during push
- Pushing large file sets without chunking
- No rollback on partial failure
- Race condition between repository creation and initial commit

**How to avoid:**
- Check if repository exists before creation attempt (`GET /repos/{owner}/{repo}`)
- Use idempotent repository creation (if exists, verify user owns it)
- Implement retry with idempotency tokens
- Create repository → wait for 200 response → push files
- Handle GitHub API rate limits with exponential backoff
- Show detailed progress: "Creating repository..." → "Pushing files..." → "Complete"
- On push failure, offer "retry push" without recreating repo
- Add "delete repository" option if push fails
- Use GitHub GraphQL API for atomic multi-step operations where possible
- Log each step for debugging partial failures

**Warning signs:**
- Users report empty repositories created but no files
- Duplicate repositories with -1, -2 suffixes
- Files pushed to wrong user's repository
- "Repository exists" errors on retry
- Push failures with no clear error message
- No way to retry failed push without starting over
- Support tickets about "half-created" repositories

**Phase to address:**
Phase 2 (GitHub Integration) - Design push workflow with explicit state machine and error recovery

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip dependency validation client-side | Faster initial development | Users generate broken projects, support burden increases | Never - validation is core to generator value |
| Use localStorage for OAuth tokens | Simple implementation, works immediately | XSS vulnerability, no token rotation, security audit failure | Never - use httpOnly cookies |
| Copy entire Spring Initializr UI instead of wrapping API | Full control, no API integration complexity | Maintenance burden tracking upstream changes, missing new features | Only if forking intentionally for custom instance |
| Wildcard CORS (`*`) in production | No CORS configuration needed | Security vulnerability if credentials added later | Acceptable only for truly public, read-only APIs with no auth |
| No rate limiting on API proxy | One less thing to implement | Upstream API bans your IP, DDoS vulnerability | Never - add from day one |
| Hardcode Spring Boot versions instead of fetching from API | Works today, no API dependency | Breaks when new Boot versions release, manual updates required | Never - always fetch from metadata API |
| Skip OAuth state parameter | Simpler OAuth flow | CSRF vulnerability, security audit failure | Never - state is critical security control |
| Render entire file tree without virtualization | Works for small projects | Unusable for large projects, browser crashes | Only if limiting to <100 files total |
| Store entire project config in URL | Easy sharing and bookmarking | URL length limits, browser history pollution | Acceptable for small configs (<500 chars), otherwise use short links |
| No error handling for GitHub API calls | Happy path works | Users stuck with cryptic errors, no recovery | Never - GitHub API can fail in many ways |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Spring Initializr API | Assuming metadata never changes | Fetch `/metadata/client` on startup, cache with TTL, handle unknown fields gracefully |
| Spring Initializr API | Hardcoding dependency IDs | Use metadata to get current dependency list, validate selections against metadata |
| Spring Initializr API | No rate limiting consideration | Implement client-side rate limiting (e.g., 10 req/min), cache aggressively, add backoff |
| GitHub OAuth | Using OAuth Apps instead of GitHub Apps | Prefer GitHub Apps for fine-grained permissions and short-lived tokens |
| GitHub OAuth | Storing tokens client-side | Store server-side with encryption, use httpOnly cookies for session |
| GitHub API (Repository Creation) | No existence check before creation | Check if repo exists, handle 422 "already exists" error gracefully |
| GitHub API (Push) | Pushing all files in one request | Use Git data API to create tree, commit, then update reference in separate steps |
| GitHub API (Rate Limits) | Not checking rate limit headers | Check `X-RateLimit-Remaining` header, show warning at 10 remaining, block at 0 |
| TanStack Start Server Functions | Exposing internal errors to client | Catch errors in server functions, return sanitized error messages, log details server-side |
| TanStack Start Server Functions | Not validating input parameters | Validate all function inputs with schema (Zod), reject invalid calls early |
| ZIP File Extraction | Loading entire zip into memory | Use streaming zip libraries, extract files on-demand for preview |
| ZIP File Extraction | No virus scanning for user-generated content | If allowing custom uploads (future), validate and scan before processing |
| CORS Preflight | Not handling OPTIONS requests | Ensure server responds to OPTIONS with correct CORS headers before actual request |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No caching of Spring Initializr metadata | Every page load hits API | Cache metadata for 1 hour, use stale-while-revalidate pattern | 100+ users/hour (API rate limits kick in) |
| Parsing entire zip file for preview | Slow initial load time | Parse zip incrementally, lazy load file contents on expand | Projects with >100 files or files >1MB |
| Re-rendering entire file tree on change | Janky UI, high CPU usage | Use virtual scrolling (TanStack Virtual), memoize tree nodes | File trees with >50 nodes |
| Calculating diffs synchronously | Browser freezes during calculation | Move diff calculation to Web Worker, show loading state | Diffs with >20 files changed or files >500 lines |
| No debouncing on dependency selection | API called on every click | Debounce 300ms before fetching new project preview | Users rapidly clicking dependencies |
| Storing all diffs in memory | Memory usage grows over time | Limit to last 5 diffs, garbage collect older ones | Users making >20 configuration changes in session |
| Not compressing long URLs | URL length errors, broken bookmarks | Use short link service for URLs >500 chars | Configurations with >10 dependencies |
| Sequential GitHub API calls | Slow repository creation | Batch compatible calls, use GraphQL for multi-resource queries | Creating repo + pushing >10 files |
| No pagination in file tree | All files loaded at once | Paginate or virtual scroll file lists | Projects generating >200 files |
| Full page re-render on state change | Lag when changing configuration | Use React state management, memoization, component splitting | Any state change affecting >5 components |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging OAuth tokens | Token leakage via log aggregation/monitoring | Redact tokens from logs, use structured logging with sensitivity markers |
| Reflecting Origin header without validation | Any site can bypass CORS | Whitelist allowed origins, never reflect without checking against approved list |
| Storing GitHub tokens in frontend state | XSS allows token theft | Store tokens server-side only, use httpOnly session cookies |
| No OAuth state parameter | CSRF attacks, authorization code injection | Always use cryptographically random state, validate on callback, single-use |
| Broad GitHub OAuth scopes | Excessive permission creep | Request minimal scopes needed (public_repo vs repo), explain to users |
| Exposing Spring Initializr API errors | Information disclosure about backend | Sanitize errors, return generic messages, log details server-side |
| No rate limiting on proxy | DDoS vulnerability, upstream API ban | Implement rate limiting (e.g., 100 req/hour per IP), use Redis for distributed limiting |
| Trusting URL parameters | Injection attacks, XSS via crafted URLs | Validate and sanitize all URL params, use allowlist for values where possible |
| No HTTPS enforcement | Man-in-the-middle attacks, token interception | Force HTTPS redirect, set HSTS headers, use secure cookies |
| Storing project configs with secrets | Users accidentally share API keys | Warn users not to include secrets, add secret detection for common patterns |
| No input validation on dependency selection | Injection via crafted dependency IDs | Validate dependency IDs against metadata, reject unknown/malformed values |
| Long-lived tokens without rotation | Compromised tokens valid indefinitely | Implement token expiration (7-30 days), add refresh token rotation |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No validation feedback before download | Users download broken projects, frustration | Show real-time validation warnings, block download if conflicts detected |
| Generic error messages | Users can't self-serve, support burden | Actionable errors: "Spring Boot 3.5 incompatible with Spring Cloud 2023.0.0 - use Boot 3.4.x" |
| No way to recover from failed GitHub push | Empty repo created, users give up | Show "Retry Push" button, allow deleting failed repo, offer manual download |
| Long URL sharing breaks | Users can't share configurations | Auto-shorten URLs >500 chars, show "Copy Short Link" button |
| File preview loads slowly without feedback | Users think app is broken | Show skeleton loaders, "Generating preview..." message, progress indicator |
| No explanation of OAuth permissions | Users distrust the app, abandon flow | Clear explanation: "We need access to create repositories - we never read existing repos" |
| Dependency conflicts discovered after download | Wasted time, broken builds | Validate on selection, show warnings before allowing download |
| Can't edit configuration after GitHub push | Users restart from scratch for small changes | Allow cloning existing repo config, editing and re-pushing |
| No diff explanation for beginners | Users confused by what changed | Add "What's This?" tooltip explaining diff viewer, highlight key changes |
| Deep links break on URL encoding | Shared links don't work | Test URL encoding/decoding, validate reconstructed state matches original |
| No "undo" for dependency selection | Users afraid to experiment | Add undo/redo or "Reset to Defaults" button |
| GitHub auth required upfront | Friction for users wanting to preview first | Allow full preview workflow, require auth only for push-to-repo |
| AI-generated suggestions without validation | Users trust AI output blindly, broken configs | Always validate AI suggestions, show confidence level, allow editing |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **GitHub OAuth Integration:** Often missing state parameter CSRF protection — verify state generation, storage, validation, and single-use enforcement
- [ ] **API Proxy:** Often missing header sanitization — verify sensitive headers stripped, error responses sanitized, no stack traces exposed
- [ ] **Dependency Selection:** Often missing validation — verify compatibility checks, version conflict detection, warnings for known incompatibilities
- [ ] **File Tree Preview:** Often missing virtualization — verify smooth scrolling with 100+ files, no memory leaks, performance profiling done
- [ ] **Diff Viewer:** Often missing debouncing — verify changes debounced 300ms+, Web Worker for large diffs, loading states shown
- [ ] **URL State Management:** Often missing validation — verify parameter sanitization, length limits, encoding/decoding tested
- [ ] **GitHub Repository Creation:** Often missing idempotency — verify existence check before creation, retry without duplicates, rollback on failure
- [ ] **OAuth Token Storage:** Often missing secure storage — verify tokens never in localStorage, httpOnly cookies used, encryption at rest
- [ ] **CORS Configuration:** Often missing origin validation — verify whitelist checked, no wildcard with credentials, preflight handled
- [ ] **Error Handling:** Often missing actionable messages — verify user-facing errors explain what happened and what to do, not just "Error 500"
- [ ] **Rate Limiting:** Often missing backoff strategy — verify exponential backoff implemented, rate limit headers checked, user informed when limited
- [ ] **Metadata Caching:** Often missing TTL — verify Spring Initializr metadata cached 1 hour, stale-while-revalidate pattern used

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Dependency conflicts in generated project | LOW | Provide troubleshooting guide, add validation to prevent recurrence, offer regenerate-with-fixes button |
| OAuth tokens leaked | MEDIUM | Revoke compromised tokens immediately, force re-auth for affected users, rotate client secret, audit access logs |
| Repository created but push failed | LOW | Add "Retry Push" button using existing repo, provide manual download option, allow deleting failed repo |
| API proxy exposed sensitive data | HIGH | Rotate any exposed credentials, patch header filtering, audit logs for exploitation, notify affected users |
| CORS misconfiguration blocking legitimate traffic | LOW | Fix CORS config, deploy hotfix, clear CDN cache if applicable, verify with multiple origins |
| File tree preview causing browser crashes | MEDIUM | Add virtualization library, implement lazy loading, profile and optimize rendering, add performance budgets to CI |
| URL parameters causing XSS | HIGH | Sanitize all URL params immediately, deploy emergency patch, audit for exploitation attempts, inform users if data compromised |
| Spring Initializr API schema change breaking app | MEDIUM | Implement defensive parsing, add schema version detection, deploy compatibility layer, monitor for unknown fields |
| Memory leak in diff viewer | MEDIUM | Add cleanup logic for old diffs, implement memory limit guards, redeploy with fix, monitor memory usage |
| Rate limited by GitHub API | LOW | Implement exponential backoff, show user-friendly message, cache aggressively to reduce calls, consider GitHub App with higher limits |
| Long URLs breaking bookmarks | LOW | Add URL shortener integration, compress parameters with Base64, provide "Copy Short Link" feature |
| Missing OAuth state causing CSRF vulnerability | HIGH | Add state parameter immediately, force new OAuth flows to use state, audit for suspicious authorization activity |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Dependency version conflicts | Phase 1 (Core Generator UI) | Test with known incompatible combos (Spring Boot 3.5 + old Spring Cloud), verify warnings shown |
| Missing OAuth state parameter | Phase 2 (GitHub Integration) | Security audit confirms state present, random, validated, single-use |
| API proxy exposes sensitive headers | Phase 1 (Core Generator UI) | Automated header inspection test, verify no Authorization/Cookie headers forwarded |
| CORS wildcard with credentials | Phase 1 (Core Generator UI) | CORS header test suite, verify origin whitelist enforced |
| File tree performance collapse | Phase 1 (Core Generator UI) | Performance test with 200-file project, verify <16ms frame times (60 FPS) |
| OAuth token storage insecurity | Phase 2 (GitHub Integration) | Security audit verifies httpOnly cookies, no localStorage use, encryption at rest |
| URL parameter pollution | Phase 1 (Core Generator UI) | Test URL >2000 chars, verify handling/warning, sanitization test suite |
| Spring Initializr API assumptions | Phase 1 (Core Generator UI) | Test with mock API returning unknown fields, verify graceful handling |
| Diff viewer memory leaks | Phase 1 (Core Generator UI) | Memory profiling test, verify <10MB growth over 50 config changes |
| GitHub push race conditions | Phase 2 (GitHub Integration) | Integration test with forced failures, verify idempotent retry, no duplicates |
| No rate limiting on proxy | Phase 1 (Core Generator UI) | Load test with 1000 req/min, verify rate limiting kicks in |
| Hardcoded dependency IDs | Phase 1 (Core Generator UI) | Test with mocked metadata containing new dependency, verify app adapts |

---

## Sources

### Spring Initializr and Dependency Management
- [Common Mistakes When Using Spring Initializr](https://javanexus.com/blog/common-spring-initializr-mistakes)
- [Spring Initializr GitHub Repository](https://github.com/spring-io/initializr)
- [The Hidden Dangers of Spring Boot Dependency Conflicts](https://medium.com/@himanshu675/the-hidden-dangers-of-spring-boot-dependency-conflicts-and-how-to-fix-them-fast-d837ff5c005d)
- [Spring Version Compatibility Cheatsheet](https://stevenpg.com/posts/spring-compat-cheatsheet/)
- [Dependency Resolution Methods](https://nesbitt.io/2026/02/06/dependency-resolution-methods.html)

### API Security and Proxying
- [Cyber Insights 2026: API Security](https://www.securityweek.com/cyber-insights-2026-api-security/)
- [Professional API Security Best Practices in 2026](https://www.trustedaccounts.org/blog/post/professional-api-security-best-practices)
- [The State of API Security in 2026](https://www.appsecure.security/blog/state-of-api-security-common-misconfigurations)
- [Understanding Core API Gateway Features](https://api7.ai/learning-center/api-gateway-guide/core-api-gateway-features)

### OAuth and GitHub Integration
- [Best practices for creating an OAuth app - GitHub Docs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app)
- [OAuth Vulnerabilities and Misconfigurations](https://www.descope.com/blog/post/5-oauth-misconfigurations)
- [GitHub OAuth Exploited Again](https://vorlon.io/saas-security-blog/new-oauth-phishing-attack-github-security)
- [Prevent CSRF Attacks in OAuth 2.0 Implementations](https://auth0.com/blog/prevent-csrf-attacks-in-oauth-2-implementations/)
- [How to Handle OAuth2 State Parameter](https://oneuptime.com/blog/post/2026-01-24-oauth2-state-parameter/view)
- [Managing your personal access tokens - GitHub Docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

### CORS Configuration
- [7 Common Mistakes Developers Make with CORS](https://corsfix.com/blog/common-cors-mistakes)
- [7 Tips for Managing CORS in Your Backend Applications](https://medium.com/@arunangshudas/7-tips-for-managing-cors-in-your-backend-applications-a4341385110c)

### Performance and Virtual Scrolling
- [7 Best React Tree View Components For React App (2026)](https://reactscript.com/best-tree-view/)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [Rendering large lists with React Virtualized](https://blog.logrocket.com/rendering-large-lists-react-virtualized/)
- [How To Render Large Datasets In React without Killing Performance](https://www.syncfusion.com/blogs/post/render-large-datasets-in-react)

### URL State Management
- [Your URL Is Your State](https://alfy.blog/2025/10/31/your-url-is-your-state.html)
- [Mastering Deep Linking](https://www.branch.io/resources/blog/deep-linking-from-url-and-uri-schemes-to-universal-links-app-links-and-beyond/)

### UX and AI Tools
- [13 UX Design Mistakes You Should Avoid in 2026](https://www.wearetenet.com/blog/ux-design-mistakes)
- [TanStack in 2026: From Query to Full-Stack](https://www.codewithseb.com/blog/tanstack-ecosystem-complete-guide-2026)

### TanStack Start
- [Server Functions | TanStack Start React Docs](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
- [TanStack Start](https://tanstack.com/start/latest)

---
*Pitfalls research for: Better Spring Initializr*
*Researched: 2026-02-14*
*Confidence: MEDIUM - Based on web search findings, official documentation, and established security best practices. Some Spring Initializr-specific behaviors may require additional validation through direct API testing.*
