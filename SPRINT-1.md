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

| # | Item | Owner | Status | Depends on | Notes |
|---|------|-------|--------|-----------|-------|
| 1 | **Revert free-Pro** — Remove `\|\| true` overrides in `DiaryContext.tsx` (×2) and `api/_lib/rate-limit.js`, then run `ALTER TABLE user_profiles ALTER COLUMN is_pro SET DEFAULT false;` | Eve | ⬜ Pending | Stripe live (P2-B) | **Cannot launch with this in place.** Do last before prod deploy. |
| 2 | **Apply tracker migration** — Run `scripts/migration-tracker-integrations.sql` in Supabase SQL Editor | Jarod | ⬜ Pending | — | Unlocks #3, #4, #6 |
| 3 | **Add Vercel env vars for fitness tracker** | Jarod | ⬜ Pending | #2 | `FITBIT_CLIENT_ID`, `FITBIT_CLIENT_SECRET`, `GOOGLE_FIT_CLIENT_ID`, `GOOGLE_FIT_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL` |
| 4 | **Register OAuth redirect URIs** | Jarod | ⬜ Pending | #3 | Fitbit + Google Cloud consoles |

---

### 🟠 P1 — High value, should ship

| # | Item | Owner | Status | Depends on | Notes |
|---|------|-------|--------|-----------|-------|
| 5 | **Pantry fixes** — Identify and fix what's broken | Adam or Eve | ⬜ Pending | — | Unlocks #12 |
| 6 | **Goals → Diary linkage audit** — Verify tracker TDEE flows into diary remaining calories; macro goals consistent across all views | Eve | ⬜ Pending | #2, #3, #4 | Unlocks #13 |
| 7 | **Search end-to-end QA** — Text search, barcode, OFF fallback, category filter, recent searches | Adam | ⬜ Pending | — | |
| 8 | **Water goal visible in diary** — Confirm Goals tab water goal surfaces in diary | Eve | ⬜ Pending | — | Unlocks #14 |

---

### 🟢 P1 — Data Persistence QA

Verify that everything a user enters actually saves, survives a reload, and displays correctly everywhere it should.

| # | What to verify | How to test | Owner | Status | Depends on |
|---|---------------|-------------|-------|--------|-----------|
| 9 | **Body stats persist** — Height, weight, age, sex, activity level survive reload and re-login | Enter values → reload → log out → log back in → confirm same | Eve | ⬜ Pending | — |
| 10 | **Weight log persists + shows in Progress** — Logged weight appears in Progress chart and history after reload | Log weight → reload → check ProgressView | Eve | ⬜ Pending | — |
| 11 | **Food log persists across sessions** — Diary foods still there after reload and re-login with correct macros | Add 3 foods → reload → confirm all 3 present | Adam | ⬜ Pending | — |
| 12 | **Custom pantry foods persist** — Manually created foods appear in pantry and are searchable after reload | Create custom food → reload → search → add to diary | Adam | ⬜ Pending | #5 |
| 13 | **Macro/calorie goals consistent across views** — Goals tab targets match diary countdown and Nutrition doughnut | Set goals → check diary remaining → check Nutrition doughnut | Eve | ⬜ Pending | #6 |
| 14 | **Water log persists** — Water logged today survives reload | Log water → reload → confirm oz/ml | Adam | ⬜ Pending | #8 |
| 15 | **Guest → permanent account keeps data** — Guest diary survives account creation | Use as guest → add foods → sign up → confirm diary intact | Eve | ⬜ Pending | — |

---

### 🟡 P2 — Stretch (blocked on external dependencies)

| # | Item | Owner | Blocked by |
|---|------|-------|-----------|
| 9 | **Apple Sign In** | Eve (once unblocked) | Jarod needs: Apple Developer App ID, Service ID, Private Key (.p8). Then configure Supabase Apple provider. |
| 10 | **Stripe billing live** | Eve (once unblocked) | Jarod needs: Stripe account created, then add `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` to Vercel + register webhook URL. |

---

## 🔗 Dependency Chain

```
[Jarod] Apply tracker migration (#2)
        └──▶ Add Vercel env vars (#3)
                └──▶ Register OAuth redirect URIs (#4)
                        └──▶ Goals → Diary linkage audit (#6)
                                └──▶ Macro/calorie goals consistency (#13)

[Any time] Pantry fixes (#5)
        └──▶ Custom pantry foods persist (#12)

[Any time] Search QA (#7)

[Any time] Water goal in diary (#8)
        └──▶ Water log persists (#14)

[Any time] Body stats persist (#9)
[Any time] Weight log persists (#10)
[Any time] Food log persists (#11)
[Any time] Guest → permanent account (#15)

[After Stripe is live] Revert free-Pro (#1)
[After Apple creds from Jarod] Apple Sign In (#P2-A)
[After Jarod creates Stripe account] Stripe billing (#P2-B)
```

**Start here:** Items #5, #7, #8, #9, #10, #11 have no blockers — Adam and Eve can work these in parallel while Jarod sets up the tracker env vars.

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
- [ ] All P1 data persistence checks pass (items 9–15 above)
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
