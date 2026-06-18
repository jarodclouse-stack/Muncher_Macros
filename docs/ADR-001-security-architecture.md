# ADR-001: Application-Wide Security Architecture

**Status:** Accepted — partial implementation, gaps documented below  
**Date:** 2026-06-18  
**Deciders:** Jarod (product), Eve (Claude), Adam (Antigravity)

---

## Context

Macro Muncher is a React/Vite SPA backed by Supabase (Postgres + Auth) and Vercel serverless functions. It handles personal health data (weight, food logs, body stats, fitness tracker OAuth tokens) and will eventually process payments via Stripe. Before public launch, the full security posture needs to be reviewed, gaps documented, and a clear plan established.

---

## Decision

Adopt a **layered defence** model across five zones: network edge, API gateway, database, client, and secrets. Each zone has its own controls. No single zone is trusted to carry the whole burden.

```
Browser (React SPA)
    │  HTTPS only — Supabase anon key only
    ▼
Vercel Edge (api/*.js router)
    │  CORS allowlist · requireAuth / allowGuest · rate limiting
    ▼
Serverless handlers (api/_lib/**)
    │  Input validation · service-role only where needed
    ▼
Supabase (Postgres + Auth)
    │  RLS on every table · anon key has no service-role privileges
    ▼
Third-party APIs (Fitbit, Google Fit, Stripe, OpenAI)
       Webhook signature verification · OAuth state nonce
```

---

## Current State Audit

### ✅ Done — Controls already in place

| Control | Where | Notes |
|---------|-------|-------|
| Supabase JWT verification | `api/_lib/auth.js` → `requireAuth` | Validates Bearer token on every AI and billing endpoint |
| Guest-permissive auth | `api/_lib/auth.js` → `allowGuest` | Search open to guests, AI scan locked behind auth |
| RLS on all tables | Supabase migrations | `user_profiles`, `user_goals`, `diary_entries`, `custom_foods`, `staging_tray`, `user_integrations` — owner-only policies |
| Stripe webhook signature | `api/_lib/stripe/stripe-webhook.js` | `constructEvent` rejects unsigned events |
| `requireAuth` on Stripe endpoints | `create-checkout-session.js`, `create-portal-session.js` | Prevents anonymous billing actions |
| `requireAuth` on all AI scan endpoints | `ai-label`, `ai-describe`, `ai-lookup`, `ai-barcode`, `ai-ingredients`, `ai-verify-meal` | Quota system only works because auth is enforced |
| Rate limiting on AI quota | `api/_lib/rate-limit.js` | Free users capped at 10 AI scans/day |
| Anonymous sign-in via Supabase | `DiaryContext.tsx` | Guest sessions are real Supabase sessions, not mock users |
| HTTPS enforced by Vercel | Platform | All traffic TLS 1.2+ |
| No service-role key in client bundle | Env var naming convention | `SUPABASE_SERVICE_ROLE_KEY` is not `VITE_`-prefixed |

---

### 🔴 Critical Gaps — Fix before launch

#### GAP-1: Pro status override active in 3 places
**Risk:** Every user has full Pro access. Rate limiting is bypassed. Revenue model is broken.

```
DiaryContext.tsx:128   setIsPro(!!p.is_pro || true);   // TODO REVERT
DiaryContext.tsx:142   setIsPro(true);                  // TODO REVERT
api/_lib/rate-limit.js:103  if (data?.is_pro || true)  // TODO REVERT
+ DB: is_pro DEFAULT true (migration: temp_all_users_pro_revert_before_launch)
```

**Fix:** Remove `|| true` overrides and revert DB default — see SPRINT-1.md P0 #1. Do this as the final commit before public deploy, after Stripe is confirmed working.

---

#### GAP-2: CORS allows any origin
**Risk:** Any website can make credentialed requests to the API from a visitor's browser, potentially triggering authenticated actions on their behalf.

**Current code** (`api/_lib/cors.js`):
```js
// The origins array is defined but never checked:
const origin = req.headers.origin || '*';
res.setHeader('Access-Control-Allow-Origin', origin); // mirrors any origin back
```

**Fix:**
```js
export function setCors(req, res) {
  const ALLOWED = [
    'https://munchermacros.digital',
    'https://www.munchermacros.digital',
    'http://localhost:5173',
    'http://localhost:4173',
  ];
  const origin = req.headers.origin || '';
  if (ALLOWED.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
```

The `origins` array is already defined in the file — just wire it into the check instead of the pass-through.

---

#### GAP-3: OAuth CSRF state is the user's ID (predictable)
**Risk:** The `state` parameter in Fitbit and Google Fit OAuth flows is set to `user.id`. A malicious site that knows a user's Supabase UUID could craft a redirect that links their own Fitbit account to that victim's profile.

**Current:**
```js
const state = user.id; // predictable
```

**Fix:** Generate a random nonce, store it in a short-lived Supabase row or signed JWT, and verify on callback:
```js
import { randomBytes } from 'crypto';
const nonce = randomBytes(16).toString('hex');
// Store: INSERT INTO oauth_nonces (user_id, nonce, expires_at) ...
// On callback: SELECT user_id FROM oauth_nonces WHERE nonce = $state AND expires_at > NOW()
```

Alternatively, sign the state as a JWT: `jwt.sign({ userId, nonce }, OAUTH_SECRET, { expiresIn: '10m' })` and verify on callback.

---

### 🟠 Medium Gaps — Fix before significant user growth

#### GAP-4: No input validation on request bodies
**Risk:** Malformed or oversized payloads can cause unexpected behavior or exhaust serverless function memory.

**Affected endpoints:** All POST handlers that read `req.body` directly.

**Fix:** Add lightweight validation. Example for `tracker-disconnect.js`:
```js
const { provider } = req.body;
if (!provider || typeof provider !== 'string' || !['fitbit', 'google_fit'].includes(provider)) {
  return res.status(400).json({ error: 'Invalid provider' });
}
```
For more complex bodies (food log entries, goals), add a schema validator like `zod` or `joi`.

---

#### GAP-5: No request size limit on AI endpoints
**Risk:** An attacker can send a very large base64 image to `ai-label` repeatedly, exhausting Vercel function memory or OpenAI token budget.

**Fix:** Add body size check at the top of image-accepting handlers:
```js
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const bodySize = Buffer.byteLength(JSON.stringify(req.body));
if (bodySize > MAX_IMAGE_BYTES) {
  return res.status(413).json({ error: 'Payload too large' });
}
```

---

#### GAP-6: Anonymous users can trigger unlimited OFF (OpenFoodFacts) proxy calls
**Risk:** Guests can hammer `api/search?action=off` with no quota, causing Vercel function invocation costs and potential OFF rate-limit blocks that affect all users.

**Fix:** Add a lightweight IP-based rate limit for guest search, or require a minimum query length (already partially in place — verify `!q` guard is present on all paths).

---

### 🟡 Low / Informational

| Item | Notes |
|------|-------|
| `VITE_SUPABASE_ANON_KEY` is public by design | Supabase anon key is safe to expose; RLS is the real guard. Confirm service role key is never in a `VITE_` var. |
| Supabase `user_data` blob still exists | No longer written to after data normalization, but still readable. Drop in a future migration once stable. |
| OAuth tokens stored in plaintext in `user_integrations` | Acceptable for Fitbit/Google tokens (they can be revoked). For higher sensitivity, consider Supabase Vault in future. |
| No audit log | Consider logging auth failures and quota hits to a `security_events` table for abuse detection post-launch. |

---

## Options Considered

### Option A: Fix CORS, OAuth state, and Pro revert (recommended)
| Dimension | Assessment |
|-----------|------------|
| Effort | Low — all three are 10–30 line changes |
| Risk reduction | High — closes the two exploitable gaps before launch |
| Breaking changes | None |
| Timeline | Sprint 1 |

### Option B: Add WAF / Vercel Firewall rules
| Dimension | Assessment |
|-----------|------------|
| Effort | Medium — Vercel Pro plan config |
| Risk reduction | Medium — blocks volumetric attacks but doesn't fix auth gaps |
| Breaking changes | None |
| Timeline | Sprint 2 or later |

### Option C: Full security audit by external party
| Dimension | Assessment |
|-----------|------------|
| Effort | High — cost + time |
| Risk reduction | High — finds unknown unknowns |
| Breaking changes | Potentially |
| Timeline | Pre-Series A / large user base |

**Decision:** Option A now. Option B when Vercel Pro is warranted by traffic. Option C before any enterprise or healthcare positioning.

---

## Action Items by Priority

### 🔴 Before launch
- [ ] **GAP-1** — Revert Pro overrides (3 places + DB migration) — Eve, Sprint 1 P0 #1
- [ ] **GAP-2** — Fix CORS allowlist in `api/_lib/cors.js` — Eve, ~10 lines
- [ ] **GAP-3** — Replace OAuth state=userId with signed nonce — Eve, `fitbit-auth.js` + `google-fit-auth.js` + their callbacks

### 🟠 Before significant user growth (Sprint 2)
- [ ] **GAP-4** — Add input validation to all POST handlers — Adam + Eve
- [ ] **GAP-5** — Add payload size check to AI image endpoints — Eve
- [ ] **GAP-6** — Rate-limit guest search calls — Adam

### 🟡 Future
- [ ] Drop `user_data` blob after confirming data normalization is stable — Jarod (SQL Editor)
- [ ] Add `security_events` audit table for auth failures + quota hits
- [ ] Evaluate Supabase Vault for OAuth token encryption

---

## Consequences

**What becomes easier:**
- Launch with confidence that no user can impersonate another via OAuth CSRF
- CORS lockdown prevents third-party sites from abusing authenticated endpoints
- Pro revert makes the subscription model actually work

**What becomes harder:**
- CORS change may require adding new allowed origins when adding staging/preview deployments — add `ALLOWED_ORIGINS` env var to Vercel for each preview URL

**What to revisit:**
- OAuth nonce storage needs a cleanup job (expired nonces accumulate) — add `DELETE FROM oauth_nonces WHERE expires_at < NOW()` as a periodic Edge Function or cron
- Input validation will need to expand as new endpoints are added — consider a shared middleware pattern
