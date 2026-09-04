---
description: Checkable client-side security rules — HTML injection, URL schemes, env prefixes, token storage, bundle secrets
globs: "**/*.{ts,tsx}"
paths: ["src/**/*.tsx", "src/**/*.ts"]
---

# Frontend Security

> **Scope:** All new code in `src/`. Everything here is checkable from the diff — a reviewer can point at a line and name the rule number. Server-side hardening (CSP headers, cookie flags, rate limits) is owned by the backend and out of scope for this file.

The client is a public, inspectable environment: anything shipped in the bundle is readable, and anything read from the network is attacker-shaped until proven otherwise.

## Hard Rules

1. **`dangerouslySetInnerHTML` passes through a sanitizer** and carries a comment naming where the HTML comes from.
2. **User-supplied URLs are scheme-validated** before landing in `href` or `src` — `http:` and `https:` only.
3. **`target="_blank"` carries `rel="noopener noreferrer"`.**
4. **Public env prefixes hold no secrets**, and server-only vars are never read from client code.
5. **Session tokens and PII stay out of `localStorage` / `sessionStorage`.** Where auth state lives (httpOnly cookies, an in-memory client with a refresh endpoint) is a project decision recorded in `docs/agents/project-conventions.md` — flag web-storage tokens, don't silently migrate them.
6. **No API keys or credentials in the client bundle.**
7. **URLs and query strings are built by the centralized builders**, never by concatenating user input.
8. **Every external response is Zod-parsed before use.**
9. **No `eval` / `new Function` on any value.**
10. **Client-side upload checks are UX, and the server re-checks** type and size.

## 1. Sanitized HTML

```tsx
// ❌ Raw user HTML — a stored <img onerror> in a bio runs as our origin
<div dangerouslySetInnerHTML={{ __html: profile.bio }} />

// ✅ Sanitized at the call site, source documented
import DOMPurify from 'isomorphic-dompurify'

// Source: profile.bio — user-authored rich text from the profile API
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(profile.bio) }} />
```

**Why:** injected HTML executes with full access to the session, so unsanitized markup turns any text field into a script the next visitor runs. Prefer plain `{profile.bio}` (React escapes it) or a markdown renderer that sanitizes; reach for the prop only when raw HTML is a real requirement.

## 2. Validated URL Schemes

```tsx
// ❌ href={'javascript:...'} executes on tap
<a href={company.website}>Visit site</a>

// ✅ Scheme allowlist, unusable values dropped
const safeHttpUrl = (value: string): string | undefined => {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:' ? value : undefined
  } catch {
    return undefined
  }
}

const href = safeHttpUrl(company.website)
{href ? <a href={href}>Visit site</a> : null}
```

**Why:** `javascript:` and `data:` URLs run code in our origin. React warns about `javascript:` hrefs in development but still renders them, and it says nothing about `data:` — so the check has to be ours. Same rule for `src`, `xlink:href`, and any URL handed to `router.push`.

## 3. Safe External Links

```tsx
// ❌ The opened page gets a window.opener handle back to this tab
<a href={externalUrl} target="_blank">Terms</a>

// ✅
<a href={externalUrl} target="_blank" rel="noopener noreferrer">Terms</a>
```

**Why:** with a live `window.opener` the target page can navigate this tab to a lookalike login screen. Modern browsers imply `noopener`, but the attribute keeps the guarantee independent of the user's browser.

## 4. Env Var Prefixes

| Framework | Shipped to the browser | Server-only |
|-----------|------------------------|-------------|
| Next.js | `NEXT_PUBLIC_*` | every other var |
| Vite | `VITE_*` | every other var |

```ts
// ❌ Prefixed name = inlined into the bundle = published secret
const stripeKey = env.NEXT_PUBLIC_STRIPE_SECRET_KEY

// ✅ Public prefix holds only public values (read through the project's `env` object, see centralized-links.md)
const stripePublishableKey = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

**Why:** the bundler inlines prefixed vars as string literals, so a secret placed there ships to every visitor and cannot be un-shipped without a rotation. Reading an unprefixed var from client code is the other half of the bug: it silently evaluates to `undefined` in the browser.

## 5. Token and PII Storage

```ts
// ❌ Any XSS on any page can read this
localStorage.setItem('access_token', token)
localStorage.setItem('user', JSON.stringify({ email, phone, nationalId }))

// ✅ Auth state where project-conventions.md says (e.g. httpOnly cookies); web storage holds preferences only
localStorage.setItem('ui.theme', theme)
```

**Why:** web storage is readable by every script on the origin and has no expiry, so one injected script exfiltrates a long-lived session and the user's personal data. If the project already stores tokens this way, flag it as a finding with the file and line — don't silently migrate auth storage inside an unrelated change.

## 6. No Secrets in the Bundle

```ts
// ❌ Hardcoded credential — grep the built bundle and it's right there
const client = axios.create({
  headers: { Authorization: 'Bearer sk_live_51H9xQ2eZvKYlo2C' },
})

// ✅ The browser sends the session cookie; secret-bearing calls happen server-side
const client = axios.create({ withCredentials: true })
```

**Why:** everything in the bundle is public, so a committed key is a leaked key the moment it deploys. Before a PR lands, a grep for `sk_live`, `sk_test`, `Bearer `, `api_key`, and `-----BEGIN` over `src/` should come back empty.

## 7. Built URLs, Not Concatenated Ones

```ts
// ❌ User input spliced into a path — traversal and injected query params
const url = `/api/orders?search=${query}&id=` + orderId

// ✅ Builders own escaping
import { buildUrl, links } from '@/shared/links'

const url = buildUrl(links.api.orders.list, { search: query, id: orderId })
```

**Why:** hand-built strings skip encoding, so a value containing `&`, `#`, or `../` changes the request instead of parameterizing it. See `centralized-links.md` for the route and endpoint builders.

## 8. Parsed Responses

```ts
// ❌ Trusting the wire shape — a missing field becomes a runtime crash or a bad render
const { data } = await client.get(endpoints.detail(id))
return data as Order

// ✅ Parse, then map
const response = await client.get(endpoints.detail(id)).catch((e) => handleApiError(e, ORDER_ERROR_MAP))
return toOrder(parseResponse(orderDtoSchema, response.data))
```

**Why:** a cast is a claim, not a check — untrusted data flows straight into rendering, storage, and URL building. See `api-boundary.md` for the DTO + mapper flow.

## 9. No Dynamic Code Evaluation

```ts
// ❌ Evaluating a server-supplied or user-supplied string
const formatter = new Function('value', config.formatterBody)

// ✅ A lookup table of code we shipped
const formatters = { currency: formatCurrency, date: formatDate } as const
const formatter = formatters[config.formatterKey] ?? formatCurrency
```

**Why:** `eval` and `new Function` turn any string that reaches them into executable code with full session access, and they force a CSP to allow `unsafe-eval`, weakening every other protection on the page.

## 10. Upload Checks

```ts
// ❌ Client-side check treated as the security boundary
if (file.type === 'application/pdf' && file.size < MAX_SIZE) {
  await uploadApi.send(file) // server accepts whatever arrives
}

// ✅ Same check, honest about its job
// UX only — fail fast before a slow mobile upload; the server re-validates type and size
if (!ACCEPTED_TYPES.includes(file.type)) {
  showError('Only PDF and images are allowed')
  return
}
```

**Why:** `file.type` comes from the client and the request can be replayed without the UI, so a client-only check stops honest mistakes and nothing else. Keep it for the fast feedback, and confirm the endpoint enforces the same limits.

## Related

- [API Boundary](api-boundary.md) — DTO schemas, `parseResponse`, mappers
- [Centralized Links & Endpoints](centralized-links.md) — route and query builders
- [Error Handling](error-handling.md) — surfacing failures without leaking internals
- [Form Patterns](form-patterns.md) — Zod validation of user input
