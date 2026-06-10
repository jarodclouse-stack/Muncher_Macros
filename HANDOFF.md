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
- `[ ]` **Apple Sign In**:
  - `[ ]` Apple Developer: App ID + Service ID + Private Key (.p8)
  - `[ ]` Supabase: Configure Apple provider
  - `[ ]` Code: Add Apple sign-in button to `src/pages/LoginScreen.tsx`

---

## 🚀 Verification & Build Status

* **TypeScript**: `npx tsc --noEmit` — 0 errors (verified by Eve after data normalization).
* **Tests**: `npm run test` — 24 test cases pass (Adam).

---

## ⏳ Pending / Next Steps

1. **Apple Sign In** — In progress. Requires Apple Developer credentials from Jarod.
2. **Stripe** — Jarod needs to create Stripe account and add 3 env vars to Vercel: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`. Then register webhook URL.
3. **Supabase Auth Providers** — Enable Anonymous sign-ins + confirm Google OAuth callback URLs are correct.
4. **Revert free Pro** — Before public launch, revert `is_pro` default and remove `|| true` overrides (see TODOs in `DiaryContext.tsx` and `rate-limit.js`).
