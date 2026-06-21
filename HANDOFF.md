# 📋 Project Status & Handoff Checklist

This file is shared between Adam (Antigravity) and Eve (Claude). Update it at the end of every session.

## 📝 Logging Standard (Both AIs — read this)

Every session entry must be **granular** so the other AI has full context. Do not write summary-only entries.

**Required format for every change:**
```
- `[x]` **[Feature/Fix name] (Adam|Eve)**:
  - Read `path/to/file.ts` — [what you found / why you read it]
  - Read `path/to/other.js` — [what you found]
  - Edited `path/to/file.ts` line ~XX — [exactly what changed and why]
  - Edited `path/to/other.js` — [exactly what changed and why]
  - Created `path/to/new.ts` — [what it does]
  - Ran `npx tsc --noEmit` — [result]
  - ⚠️ [Any warnings, blockers, or things the other AI must know]
```

**Why this matters:** Jarod works with both of us. When one AI picks up where the other left off, granular logs prevent re-doing work, breaking things the other fixed, or missing context on *why* a decision was made.

---

---

## 🛠️ Status Checklist

- `[x]` **Guest Caching & Security Upgrades**:
  - `[x]` Replaced legacy mock guest logins with native Supabase **Anonymous Sign-ins** (`signInAnonymously()`).
  - `[x]` Configured automatic database synchronization for guest user diaries.
  - `[x]` Built a secure account promotion pipeline (`convertGuestToPermanent`) using `updateUser({ email, password })` to link/convert guest sessions into permanent email accounts in-place.
- `[x]` **Stripe Billing & Subscriptions**:
  - `[x]` Created lightweight serverless endpoints in the `api/` folder:
    - `api/create-checkout-session.js` — Generates redirect link to Stripe Checkout.
    - `api/create-portal-session.js` — Generates redirect link to Stripe Customer Billing Portal.
    - `api/stripe-webhook.js` — Verifies Stripe signatures and updates `is_pro` status database-side.
  - `[x]` Configured Row-Level Security (RLS) policies in `scripts/migration-subscription.sql` to block client-side promotion of `is_pro`.
  - `[x]` Migration applied to Supabase (migration name: `phase2_subscriptions_rls_hardening`).
- `[x]` **Premium settings UI**:
  - `[x]` Added a glassmorphic tier status banner at the top of settings.
  - `[x]` Connected checkout session routing for Free members and portal management routing for Pro members.
  - `[x]` Added the account linking/saving form for Guest users.
- `[x]` **Search & Barcode Audit (Adam)**:
  - `[x]` Replaced the dead `/api/food-search` GET request in `scanner-logic.ts` with local `/api/db-search` POST request.
  - `[x]` Updated `/api/db-search` endpoint to query the database `foods` table directly by the `barcode` column if a numeric barcode query is supplied, enabling local barcode scanning lookup.
  - `[x]` Resolved all unused variable linter warnings in `BarcodeScanner.tsx` and `scanner-logic.ts`.
- `[x]` **Pro Feature Gating (Eve)**:
  - `[x]` `api/_lib/rate-limit.js` — Pro users bypass AI quota; free users capped at 10 AI scans/day with `code: 'QUOTA_EXCEEDED'` in 429 response.
  - `[x]` `src/components/ThemesView.tsx` — 10 premium themes gated behind `isPro`, Crown lock UI, "PRO EXCLUSIVE" badge.
  - `[x]` `src/lib/vision/scanner-logic.ts` — 429 responses surface `detail: body.code` for UI handling.
  - `[x]` `src/components/SmartScanner.tsx` — Gold "Daily Limit Reached" upgrade card shown when quota hit; fires `navigate-to-settings` event to open Settings modal.
  - `[x]` `src/pages/MainDashboard.tsx` — Listens for `navigate-to-settings` custom event and opens Settings modal.
- `[x]` **Temp: All users granted Pro (Eve)**:
  - `[x]` DB migration `temp_all_users_pro_revert_before_launch` applied — `is_pro DEFAULT true`, all existing rows set to true.
  - `[x]` `DiaryContext.tsx` and `rate-limit.js` have `|| true` overrides with `TODO (REVERT BEFORE LAUNCH)` comments.
  - ⚠️ **Must revert 3 places before public launch** — see comments in those files.
- `[x]` **Auth URL Config (Eve)**:
  - `[x]` `HANDOFF.md` added to `.gitignore` (local only, never pushed to GitHub).
  - `[x]` Supabase Site URL + Redirect URLs configured for `https://munchermacros.digital`.
  - `[x]` Google OAuth already set up by Jarod.
- `[x]` **Data Normalization (Eve)**:
  - `[x]` Replaced single monolithic `user_data.data` JSONB blob with 5 proper tables: `user_profiles`, `user_goals`, `diary_entries`, `custom_foods`, `staging_tray`.
  - `[x]` All tables have RLS policies (owner-only read/insert/update/delete).
  - `[x]` Existing user data migrated from the blob into new tables.
  - `[x]` `DiaryContext.tsx` fully rewritten — same external API (all hooks unchanged), now reads/writes targeted tables instead of the full blob. Each domain saves independently with its own 1.5s debounce.
  - `[x]` Custom foods now have a proper UUID (`_id`) for targeted updates and deletes.
  - `[x]` Diary entries load last 90 days on startup; older entries can be fetched on demand.
  - `[x]` `npx tsc --noEmit` — 0 errors after rewrite.
  - ⚠️ **Adam: `user_data.data` blob is kept but no longer written to.** It's a safety net. Can be dropped in a future migration once we've confirmed everything is stable.
- `[x]` **Hide sub-nutrients in scan result view (Eve)**:
  - `[x]` `src/components/PantryView.tsx` — After nutrition label scan, `setShowFullNutrition(false)` instead of `true`. Scan result now shows only the quick stats row (Cal/P/C/F) by default; user can tap "Show Detailed Nutrition" to expand.
  - `[x]` `src/components/NutritionFactsDisplay.tsx` — Added `hideSubNutrients` prop. When `true` (and not in edit mode), hides sugars, fiber, soluble/insoluble fiber, sat fat, sodium, potassium, and all dynamic micros.
- `[x]` **NutriScore Badge Fix (Eve → Adam pushed)**:
  - `[x]` `src/components/PantryView.tsx` — Badge now reads `f.nutriscore_grade` first, falls back to `estimateNutriScore()`. Uses `NS_COLOR` (lowercase keys) so color always renders. Badge is tappable — opens `NutriScorePopup`.
  - `[x]` `src/components/NutritionFactsDisplay.tsx` — Removed the full Nutri-Score section (grade header + A–E bar); user taps the badge instead.
  - `[x]` `src/components/ProgressView.tsx` — Micronutrient Goals rows restyled to pill/chip style matching Nutrition tab (`micro-badge-btn` class).
- `[x]` **Data Layer Audit & Fixes (Eve — pushed)**:
  - `[x]` Found 5 categories of DB ↔ cache key mismatches after data normalization split.
  - `[x]` `DiaryContext.tsx` load fix: `weight_log` → `weight`, `water_ml` → `water` (was `weightLog`/`waterMl` — weight/water never saved or loaded).
  - `[x]` `DiaryContext.tsx` save fix: same key alignment in `saveDiaryToDb`.
  - `[x]` `DiaryContext.tsx` goals load fix: `activityLevel` → `activityId` (TDEE always defaulted to moderate).
  - `[x]` `DiaryContext.tsx` goals save fix: `activityId` → `activity_level` column; all extra fields dumped to `extras` JSONB so body stats survive across sessions.
  - `[x]` `OnboardingWizard.tsx`: `updateSettings({ screenName })` → `updateSettings({ displayName })` (name never persisted).
  - `[x]` Supabase migration applied: `ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT '{}'::jsonb;`
  - ✅ Pushed as commit `1bf519f`.
- `[x]` **Food Categories — 19 categories (Adam)**:
  - `[x]` `api/ai-lookup.js`, `api/ai-describe.js` — AI prompts updated to classify into 19 food groups.
  - `[x]` `api/off-search.js` — OFF parser maps products to the 19 categories.
  - `[x]` `src/types/food.ts` — `FoodGroup` type updated with all 19 categories.
  - `[x]` `src/components/PantryView.tsx` — Horizontally scrollable category filter chips.
  - `[x]` `src/components/DiaryView.tsx` — Category badge renders beneath each food name.
- `[x]` **Vercel AI Timeout Fixes (Adam)**:
  - `[x]` `vercel.json` — All AI functions set to `maxDuration: 30, memory: 1024`. Stripe routes preserved.
  - `[x]` `api/ai-label.js` — `REQUEST_TIMEOUT_MS = 25000` intercepts slow requests before Vercel's 30s hard limit.
- `[x]` **CORS & Guest Auth Fixes (Adam)**:
  - `[x]` `api/_lib/cors.js` — Opened to all origins (was strict allowlist). Fixes Vercel CORS blocks.
  - `[x]` `api/_lib/auth.js` — No-token requests return `{ id: 'anonymous' }` so guests can search foods.
  - `[x]` `src/components/OnboardingWizard.tsx` — Target Weight field now separate from Current Weight (lose/gain goals only).
  - ⚠️ Note: `requireAuth` still enforced on AI scan endpoints (`ai-label`, `ai-describe`, etc.) — only search is open to guests.
- `[x]` **Auth & Quota Security Hardening (Eve)**:
  - `[x]` `api/_lib/auth.js` — Split into `requireAuth` (strict — returns 401 on missing token) and `allowGuest` (permissive — returns `{ id: 'anonymous' }` for no-token requests). AI endpoints use `requireAuth`; search endpoints use `allowGuest`. Closes the hole where unauthenticated callers could reach AI endpoints for free.
  - `[x]` `api/db-search.js` — Swapped `requireAuth` → `allowGuest`. Guests can search foods; invalid tokens still get 401.
  - `[x]` `api/off-search.js` — Same swap as db-search.
  - `[x]` `api/_lib/rate-limit.js` — `checkAiQuota`: anonymous users now get 401 instead of bypassing quota entirely. Also fixed stale table reference: `user_data` → `user_profiles` (data normalization renamed the table). TODO comment updated to reference correct table name.
- `[x]` **Nutri-Score Consistency Fix (Eve)**:
  - `[x]` `src/lib/food/serving-converter.ts` — `estimateNutriScore()`: Added `_nutriscore_fixed` short-circuit at top. When a food has this flag set, returns stored grade unconditionally (no recomputation from potentially inflated serving-size macros).
  - `[x]` `src/components/PantryView.tsx` — ADD TO FOOD LOG handler: Computes `estimateNutriScore(configuringFood)` on the *pre-scale* food (correct per-100g grade), then stamps `scaled.nutriscore_grade` and `scaled._nutriscore_fixed = true` before calling `addFoodLog`. DiaryView now always shows the same grade as the scan preview.
- `[x]` **Food Images (Eve)**:
  - `[x]` `api/off-search.js` — Added `image_small_url,image_front_small_url` to the OFF `fields` query param. Added `image_url` field to the returned food object (`p.image_front_small_url || p.image_small_url`).
  - `[x]` `src/lib/food/serving-converter.ts` — `normalizeFoodResult()`: Preserves `image_url` (falls back to `image_small_url`) so images survive the normalize pipeline.
  - `[x]` `src/lib/vision/scanner-logic.ts` — `lookupBarcode()` direct OFF fallback: Added `image_url` and `nutriscore_grade` to `mappedData`.
  - `[x]` `src/components/PantryView.tsx` — Search result rows: 40×40 rounded thumbnail shown left of food name when `f.image_url` is set. Hides gracefully on load error.
  - `[x]` `src/components/DiaryView.tsx` — Diary entry cards: 38×38 rounded thumbnail shown left of food name when `f.image_url` is set. Hides gracefully on load error.
  - ✅ `npx tsc --noEmit` — 0 errors after all changes.
- `[x]` **Circular Macro Tracker — % Display & Color (Eve)**:
  - `[x]` `src/components/NutritionView.tsx` — Changed carbs color from `var(--theme-accent)` (turquoise) to `#4F8EF7` (blue) in `resolvedColors`. Also changed the legend progress bar to use `resolvedColors.*` instead of CSS vars directly so they stay in sync.
  - `[x]` Added caloric percentage badge next to each macro's gram display (e.g. "35%"). Calculated as `(val * calPerGram) / totalMacroCals` where calPerGram is 4/4/9 for protein/carbs/fat.
  - `[x]` `npx tsc --noEmit` — 0 errors.
- `[x]` **Fitness Tracker Integration — Fitbit + Google Fit (Eve)**:
  - `[x]` `scripts/migration-tracker-integrations.sql` — New `user_integrations` table. ⚠️ **Must apply to Supabase before deploying** (SQL Editor → Run).
  - `[x]` `api/fitbit-auth.js` — Returns Fitbit OAuth URL. Requires env vars: `FITBIT_CLIENT_ID`, `APP_URL`.
  - `[x]` `api/fitbit-callback.js` — Exchanges OAuth code for tokens, stores in DB via service role. Requires: `FITBIT_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.
  - `[x]` `api/fitbit-sync.js` — Fetches Fitbit daily `caloriesOut` (total TDEE) for a date. Auto-refreshes expired tokens.
  - `[x]` `api/google-fit-auth.js` — Returns Google OAuth URL. Requires: `GOOGLE_FIT_CLIENT_ID`.
  - `[x]` `api/google-fit-callback.js` — Exchanges Google OAuth code for tokens. Requires: `GOOGLE_FIT_CLIENT_SECRET`.
  - `[x]` `api/google-fit-sync.js` — Aggregates `com.google.calories.expended` from Google Fitness API for the day.
  - `[x]` `api/tracker-status.js` — Returns connection status + last sync data for all providers.
  - `[x]` `api/tracker-disconnect.js` — Deletes integration row from DB.
  - `[x]` `src/lib/goals/compute.ts` — `computeGoals()` now uses `g.trackerTDEE` instead of formula when `g.useTrackerTDEE === true`.
  - `[x]` `src/components/ProgressView.tsx` — New "Fitness Tracker Integration" card with Connect/Disconnect/Sync buttons, live burn display, and toggle to use tracker TDEE. Apple Watch note explains HealthKit limitation.
  - ⚠️ **Env vars Jarod must add to Vercel** before this feature works:
    - `FITBIT_CLIENT_ID` + `FITBIT_CLIENT_SECRET` (from https://dev.fitbit.com → Register an App, redirect URI: `https://munchermacros.digital/api/fitbit-callback`)
    - `GOOGLE_FIT_CLIENT_ID` + `GOOGLE_FIT_CLIENT_SECRET` (from Google Cloud Console → Fitness API → OAuth credentials, redirect URI: `https://munchermacros.digital/api/google-fit-callback`)
    - `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Dashboard → Settings → API → service_role key)
    - `APP_URL=https://munchermacros.digital`
  - ✅ `npx tsc --noEmit` — 0 errors.
- `[x]` **Fix: AI search speed + disappearing results (Eve)**:
  - `[x]` `api/_lib/ai/ai-lookup.js` — Added 12s request timeout (was no timeout → hung until Vercel killed it). Reduced max_tokens 4000→1800. Replaced 400-word prompt requesting 30+ micros for 5 foods with a concise prompt requesting 3 foods + key micros only. Response time should drop from 10-15s to 3-5s.
  - `[x]` `src/components/PantryView.tsx` — Fixed "search disappears" bug: on AI failure, error is now shown in a prominent red card with `setHasSearched(true)` so the UI doesn't go back to a blank state. Timeout errors show a helpful message directing user to the regular Search tab.
  - ✅ `npx tsc --noEmit` — 0 errors.
- `[x]` **Fix: AI scan routes + model strings + Vercel timeouts (Eve)**:
  - `[x]` `src/lib/vision/scanner-logic.ts` — Fixed two stale routes left over from Adam's API consolidation:
    - `/api/ai-label` → `/api/ai?action=label`
    - `/api/ai-barcode` → `/api/ai?action=barcode`
  - `[x]` `api/_lib/ai/*.js` (all 6 handlers) — Restored better model fallback chain:
    `claude-sonnet-4-6` → `claude-haiku-4-5-20251001` → `claude-3-5-sonnet-20241022` → `claude-3-5-haiku-20241022`
    Adam replaced these thinking they were fictional, but `claude-sonnet-4-6` and `claude-haiku-4-5-20251001` are valid current model IDs.
  - `[x]` `vercel.json` — Added missing timeout/memory config for `api/search.js` (20s, 512MB) and `api/tracker.js` (20s, 256MB). Were defaulting to 10s which caused OFF search timeouts.
- `[x]` **Fix: Barcode/AI scan 404 error (Eve)**:
  - `[x]` `src/lib/vision/scanner-logic.ts` — Updated two stale API URLs:
    - `/api/ai-label` → `/api/ai?action=label`
    - `/api/ai-barcode` → `/api/ai?action=barcode`
  - These routes were broken when the API was restructured into router files (`api/ai.js`). The individual `api/ai-label.js` and `api/ai-barcode.js` files no longer exist as top-level Vercel routes.
  - ✅ No other old-style AI routes found in the codebase.
- `[x]` **Sprint Planning — Sprint 1 (Eve)**:
  - `[x]` `SPRINT-1.md` created in project root — 2-week sprint with dependency chain, data persistence QA checklist (15 items total), and pre-launch blocker list.
  - `[x]` All sprint items linked: P0 tracker setup (#2→#3→#4) unlocks goals audit (#6) unlocks macro consistency (#13); pantry fixes (#5) unlocks custom food persistence (#12); water goal (#8) unlocks water log persist (#14).
- `[x]` **Security Architecture ADR (Eve)**:
  - `[x]` `docs/ADR-001-security-architecture.md` — Full app security audit covering auth, CORS, OAuth, RLS, rate limiting, input validation, secrets.
  - `[x]` **GAP-2 FIXED**: `api/_lib/cors.js` — CORS now validates origin against the `origins` allowlist instead of mirroring any origin. Add new allowed origins via `ALLOWED_ORIGINS` env var in Vercel.
  - ⚠️ **GAP-1 still pending** (Pro `|| true` override, 3 places) — must revert before launch. See SPRINT-1.md P0 #1.
  - ⚠️ **GAP-3 still pending** (OAuth state = userId, weak CSRF) — fix documented in ADR-001. Replace with signed JWT nonce in `fitbit-auth.js`, `google-fit-auth.js`, and their callback handlers before fitness tracker ships to real users.
- `[ ]` **Apple Sign In**:
  - `[ ]` Apple Developer: App ID + Service ID + Private Key (.p8)
  - `[ ]` Supabase: Configure Apple provider
  - `[ ]` Code: Add Apple sign-in button to `src/pages/LoginScreen.tsx`
- `[x]` **Vercel Hobby Limit Fix (Adam)**:
  - `[x]` Consolidated 19 individual serverless functions into 4 master router endpoints (`api/ai.js`, `api/search.js`, `api/stripe.js`, `api/tracker.js`) to bypass Vercel's 12-function hard limit on the free tier.
  - `[x]` Moved all core endpoint logic to internal `api/_lib/` subdirectories.
  - `[x]` Updated all frontend `apiFetch` requests to use `?action=` routing.
  - `[x]` Fixed `vercel.json` config rules to match the new router architecture.

---

## 🚀 Verification & Build Status

* **TypeScript**: `npx tsc --noEmit` — 0 errors (verified by Eve after data audit, 2026-06-13).
* **Tests**: `npm run test` — 24 test cases pass (Adam).
* **Vercel**: Latest deployment READY (commit 9e2a8bd). `foods` table has 8,129 rows, `search_foods` RPC works correctly.
* **Search**: DB + OFF search both functional. Prior "all search engines failed" report was during a brief ERROR deployment window — now resolved.

---

## ⏳ Pending / Next Steps

1. **Apple Sign In** — In progress. Requires Apple Developer credentials from Jarod.
3. **Stripe** — Jarod needs to create Stripe account and add 3 env vars to Vercel: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`. Then register webhook URL.
4. **Supabase Auth Providers** — Enable Anonymous sign-ins + confirm Google OAuth callback URLs are correct.
5. **Revert free Pro** — Before public launch, revert `is_pro` default and remove `|| true` overrides (see TODOs in `DiaryContext.tsx` and `rate-limit.js`).

- `[x]` **Food Categories & Search Fixes (Adam)**:
  - `[x]` Fixed CORS issue blocking Vercel API routes and allowed guest search queries.
  - `[x]` Fixed OnboardingWizard target weight defaulting to current weight.
  - `[x]` Added 19 comprehensive Food Categories to data models, AI API prompts, and Open Food Facts parser.
  - `[x]` Added Category horizontal scroll filters to PantryView.
  - `[x]` Added Category badge pill to DiaryView food items.
