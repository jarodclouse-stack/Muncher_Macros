# 🏃 Macro Muncher — Sprint 1

**Dates:** June 17 – July 1, 2026 (2 weeks)  
**Team:** Jarod + Adam (Antigravity) + Eve (Claude)  
**Sprint Goal:** Get Macro Muncher production-ready — security locked down, search solid, pantry working, and all goals wired end-to-end.

---

## 🎯 Capacity

| Who | Role | Notes |
|-----|------|-------|
| Jarod | Product + deploy decisions | Provides credentials, env vars, Supabase SQL access |
| Adam | Feature dev + bug fixes | Antigravity AI sessions |
| Eve | Feature dev + bug fixes | Claude Cowork sessions |

---

## 🗂️ Sprint Backlog

### 🔴 P0 — Must ship (pre-launch blockers)

| # | Item | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1 | **Revert free-Pro** — Remove `\|\| true` overrides in `DiaryContext.tsx` (×2) and `api/_lib/rate-limit.js`, then run `ALTER TABLE user_profiles ALTER COLUMN is_pro SET DEFAULT false;` | Eve | ⬜ Pending | **Cannot launch with this in place.** 3 files, low risk. Do last before prod deploy. |
| 2 | **Apply tracker integration migration** — Run `scripts/migration-tracker-integrations.sql` in Supabase SQL Editor | Jarod | ⬜ Pending | Required before Fitbit/Google Fit will work |
| 3 | **Add Vercel env vars for fitness tracker** | Jarod | ⬜ Pending | `FITBIT_CLIENT_ID`, `FITBIT_CLIENT_SECRET`, `GOOGLE_FIT_CLIENT_ID`, `GOOGLE_FIT_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL=https://munchermacros.digital` |
| 4 | **Register OAuth redirect URIs** | Jarod | ⬜ Pending | Fitbit: `https://munchermacros.digital/api/fitbit-callback` · Google Cloud: `https://munchermacros.digital/api/google-fit-callback` |

---

### 🟠 P1 — High value, should ship

| # | Item | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 5 | **Pantry fixes** — Identify and fix whatever is broken/missing in the pantry feature | Adam or Eve | ⬜ Pending | User-reported; exact bugs TBD — start with a live test session and file specific issues |
| 6 | **Goals → Diary linkage audit** — Verify tracker TDEE flows into diary remaining calories end-to-end; macro goals display correctly in diary + nutrition views | Eve | ⬜ Pending | `computeGoals()` already handles `useTrackerTDEE` — needs smoke test once tracker migration is applied |
| 7 | **Search end-to-end QA** — Manual test: text search, barcode scan, OFF fallback, category filter, recent searches. File any regressions. | Adam | ⬜ Pending | Race condition fixed; recent searches added. QA pass to confirm nothing new crept in. |
| 8 | **Water goal visible in diary** — Confirm water goal from Goals tab surfaces in diary daily progress | Eve | ⬜ Pending | `waterGoal` is already read in DiaryView — verify it renders and persists correctly |

---

### 🟡 P2 — Stretch (blocked on external dependencies)

| # | Item | Owner | Blocked by |
|---|------|-------|-----------|
| 9 | **Apple Sign In** | Eve (once unblocked) | Jarod needs: Apple Developer App ID, Service ID, Private Key (.p8). Then configure Supabase Apple provider. |
| 10 | **Stripe billing live** | Eve (once unblocked) | Jarod needs: Stripe account created, then add `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` to Vercel + register webhook URL. |

---

## 🔐 Security — Detailed Revert Checklist

These 3 changes must be made **atomically, as the final commit before a public launch**:

```
# 1. DiaryContext.tsx — line 128
BEFORE: setIsPro(!!p.is_pro || true);
AFTER:  setIsPro(!!p.is_pro);

# 2. DiaryContext.tsx — line 142
BEFORE: setIsPro(true); // TODO: remove before launch
AFTER:  <delete this fallback entirely>

# 3. api/_lib/rate-limit.js — line 103
BEFORE: if (data?.is_pro || true) return true;
AFTER:  if (data?.is_pro) return true;

# 4. Supabase SQL Editor:
ALTER TABLE user_profiles ALTER COLUMN is_pro SET DEFAULT false;
```

---

## 🔗 Goals Linkage — What's Already Wired

| Connection | Status |
|-----------|--------|
| Goals tab → `computeGoals()` → targetCal | ✅ Done |
| Tracker TDEE → `computeGoals()` override | ✅ Done |
| Diary remaining calories ← targetCal | ✅ Done |
| Macro goals → NutritionView doughnut | ✅ Done |
| Water goal → DiaryView progress | ⚠️ Needs QA |
| Weight goal → ProgressView | ✅ Done |

**The goals tab IS the right place for the fitness tracker.** It's set up correctly: tracker sync updates `goals.trackerTDEE`, `computeGoals()` uses it, and `DiaryView` reads `computeGoals()` for the remaining calories display.

---

## 🚨 Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Pro revert shipped too early | Free users can't access Pro features → bad UX | Gate behind a Stripe live/test flag; only revert when Stripe is confirmed working |
| Tracker env vars missing on Vercel | OAuth connect silently fails (500 errors) | Add all 6 vars before testing tracker feature; verify with `/api/tracker-status` |
| Pantry bugs unknown in scope | Could blow up the sprint | Timebox discovery to 30 min; fix top 3 issues only; file the rest |
| Apple Sign In credentials never provided | Blocks auth completeness | Set a deadline — if no creds by sprint day 7, defer to Sprint 2 |

---

## ✅ Definition of Done

- [ ] Code reviewed and TypeScript clean (`npx tsc --noEmit` — 0 errors)
- [ ] Smoke tested on production URL (`munchermacros.digital`)
- [ ] HANDOFF.md updated with what shipped and what's still pending
- [ ] No `TODO (REVERT BEFORE LAUNCH)` comments remain (for P0 #1)

---

## 📅 Key Dates

| Date | Event |
|------|-------|
| June 17 | Sprint starts — Jarod applies migration + adds env vars |
| June 20 | Mid-sprint check — pantry bugs filed, tracker tested |
| June 24 | P1 items complete, P2 unblocked or deferred |
| July 1 | Sprint end — Pro revert + final deploy if Stripe is ready |

---

## 🗒️ Notes for Adam (Antigravity)

- Pantry discovery: open the app, go to Pantry, and attempt: add custom food, scan barcode, filter by category, delete a food. Note every failure.
- Search QA: test empty query, single word, multi-word, barcode (numeric), and check recent searches appear.
- If you fix a pantry bug, run `npx tsc --noEmit` and update HANDOFF.md.
