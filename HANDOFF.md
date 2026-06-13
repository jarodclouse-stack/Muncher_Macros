# 📋 Project Status & Handoff Checklist

This file is shared between Adam (Antigravity) and Eve (Claude). Update it at the end of every session.

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
  - `[x]` `src/components/BarcodeScanner.tsx` — Gold "Daily Limit Reached" upgrade card shown when quota hit; fires `navigate-to-settings` event to open Settings modal.
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
- `[ ]` **Apple Sign In**:
  - `[ ]` Apple Developer: App ID + Service ID + Private Key (.p8)
  - `[ ]` Supabase: Configure Apple provider
  - `[ ]` Code: Add Apple sign-in button to `src/pages/LoginScreen.tsx`

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
