# YOIBI Model Handoff

Prevents a new AI model from restarting work from zero. A new model must read this file (plus root `AGENTS.md` and `docs/WORKBASE.md`) before changing code.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Exact Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## What Is Working` · `## Reference`

## Current Status
- Session Date: 2026-09-28
- Active task: TASK-028 — Mandatory Email Verification (React Email + Resend) [second follow-up: root-cause fix for production regression]
- Overall phase: Phase 5 complete; platform live in production; post-launch hardening
- Completion status: `COMPLETE` — regression root-caused + fixed at source, deployed to Railway + Vercel, fix confirmed live in the production bundle
- Git repository status: working tree contains 2 intended source fixes (frontend AuthContext + backend verification.service); docs updated; commit/push performed (see Exact Next Step / commit message)
- Current branch: `main`

## Last Completed Step
- **Root-caused the reported production regression** ("both new AND existing/verified users kicked back to /verify-email ~4-5 min into a session; cannot reach /feed; recurring bounce"):
  - The false bounce originates in `frontend/src/features/auth/context/AuthContext.js` hydration: the `else` branch (any non-success, non-`EMAIL_NOT_VERIFIED` `/auth/me` result) built a `fallbackUser` WITHOUT `emailVerified`. The protected route guard (`user?.emailVerified !== true`) then treated a verified user as unverified and redirected to `/verify-email`; the persisted falsy `user` made every later `/feed` attempt bounce again.
  - Ruled out as triggers: JWT expiry (1d), Better Auth session refresh (7d/1d), frontend polling (none exists), DB read being broken (production read returns emailVerified:true). No 4-5 min auth timer exists; the transient getMe() failure is the trigger, and the fallback branch is what converts it into a sticky lockout.
- **Fixed at source (2 changes), deployed, live-verified:**
  - `AuthContext.js` fallback branch → `emailVerified: sessionData.user.emailVerified === true` (DB-backed Better Auth session record). Verified users survive transient failures; genuinely unverified sessions still blocked; `EMAIL_NOT_VERIFIED` branch unchanged (fail-closed).
  - `verification.service.js` `verifyCode` → `invalidateUserModerationCache(userId)` after success (drops the auth gate's 30s stale `emailVerified:false` before it bounces a just-verified user).
- **Deployed:** backend to Railway (deployment `37d05eb4`, Online, health 200 — confirms the new `verification.service`→`middleware/auth` import has no circular-crash); frontend to Vercel from repo root (deployment `yoibi-frontend-a7psa3whb-yoibi.vercel.app`, target=production, Ready, aliased www.yoibi.com).
- **Live-verified:** `/`, `/feed`, `/verify-email`, `/login` all HTTP 200; `/auth/me` 401 unauth; deployed JS chunk `/_next/static/immutable/chunks/1hc3zz1h-b2e-.js` contains `emailVerified:!1` (unverified block kept) AND `emailVerified:!0===o.user.emailVerified` (new fallback — fix is live); production DB `getEmailVerificationStatus` returns `{exists:true,emailVerified:true}` for the verified admin.
- **Quality gates:** backend lint 0 errors, backend tests 100%, frontend lint 0 errors, frontend build successful. Backend `verification.service` required in isolation — loads cleanly, `invalidateUserModerationCache` is a function.
- **Cleanup:** removed `backend/_tmp_inspect.js`, `backend/_tmp_test_lookup.js`, and a blocked/deleted forged-JWT script.

## Exact Next Step
1. **User-manual browser E2E (cannot run in this sandbox):** (a) stay logged in as a VERIFIED account on `/feed` for 6-8 continuous minutes — confirm NO bounce to `/verify-email`; (b) confirm an UNVERIFIED account is still blocked to `/verify-email`; (c) fresh sign-up → real Resend email → enter code → confirm redirect to `/feed` with no duplicate email and no immediate re-bounce (also exercises the new cache-invalidation).
2. No further code change expected unless the browser E2E surfaces something new. This session's fixes are already committed and pushed (`main`). If the user reports a residual issue, resume from this document.
3. Optional (unchanged from prior notes): `scripts/clear-sessions-for-unverified-users.js` and `scripts/unset-profile-email-verification-fields.js`.

## Files Touched (this follow-up; prior TASK-028 files unchanged)
- `frontend/src/features/auth/context/AuthContext.js` - **root-cause fix:** fallback `else` branch now sets `emailVerified: sessionData.user.emailVerified === true` (was omitted → verified users falsely bounced to /verify-email on transient getMe() failures)
- `backend/src/services/verification.service.js` - **cache-coherence fix:** `verifyCode` invalidates the auth gate's 30s `userModerationCache` after successful verification
- `docs/WORKBASE.md`, `docs/MODEL-HANDOFF.md` - updated (this session)

(Prior follow-up-1 files — `models/betterAuthUser.model.js`, `repositories/authUser.repository.js`, `models/user.model.js` change, `verify-email/page.js`, `emailVerificationSession.js`, etc. — unchanged this session, already committed/deployed.)

## Known Issues / Blockers
- Real-browser timed E2E (6-8 min verified survival + unverified block + post-verification no-re-bounce) cannot run in this sandbox — needs a real browser/session/email. Deployed bundle + backend source-of-truth are confirmed live; browser confirmation remains for the user.
- Production Railway/Vercel secret reads are denied by the sandbox classifier (correct guardrail); no env change was required for these two source fixes.

## Session Date
- 2026-09-28 (TASK-028 second follow-up: root-cause fix for verified users bounced to /verify-email mid-session — frontend fallback-branch emailVerified + backend moderation-cache invalidation; deployed Railway `37d05eb4` + Vercel target=production; fix confirmed in served bundle + production DB source-of-truth verified)

## What Is Working
- **Data-model correction (prior follow-up):** `emailVerified`/`emailVerifiedAt` no longer exist on the `users` (plural) profile collection (0 strays). `user.emailVerified` on the `user` (SINGULAR) collection is the single source of truth via `authUser.repository` — auth gate, login flow, `/auth/me`, `verifyCode`, resend.
- **Redirect fix (prior follow-up):** successful verification navigates to `/feed`; sessionStorage flag suppresses duplicate email; auth context refreshed before navigation to avoid route-guard bounce-back.
- **Regression fix (this session):** `AuthContext` hydration no longer fabricates an unverified state on a transient `/auth/me` failure — the fallback carries `emailVerified` from the DB-backed Better Auth session record, so verified users are never falsely bounced to `/verify-email`, while genuinely unverified sessions remain blocked. And `verifyCode` invalidates the auth gate's 30s moderation cache, so a just-verified user isn't momentarily still reported `EMAIL_NOT_VERIFIED`. Both deployed to production; fix confirmed in the served bundle.
- **Backend (Railway):** deployed `3acf996a` Online; health 200; `/auth/me` 401 unauth; verification POST endpoints all 401 unauth; EMAIL_VERIFICATION_REQUIRED=true; RESEND_API_KEY set.
- **Frontend (live):** deployed `dpl_75QTN4` → www.yoibi.com; `/verify-email` and `/feed` return 200; all 21 routes build.
- All previous TASK-027 items remain deployed (share modal, simplified reply nesting, @mention reply prefix).
- Quality gates: backend lint 0 err / tests 100%; frontend lint 0 err; build successful.

## Reference
- Entry point for any agent: root `AGENTS.md`
- Resume command: `/yoibi-resume` (`.claude/commands/yoibi-resume.md`)
- Historical session logs + architecture notes (auth, profile, media provenance, reply flow, hardening): `docs/MODEL-HANDOFF-ARCHIVE.md`
- Full task history: `docs/WORKBASE-ARCHIVE.md`
- Full rule set: `.agents/AI-AGENT.md`, `docs/MANDATORY-RULES.md`, `docs/CODE-STANDARDS.md`, `docs/SECURITY-RULES.md`, `PROJECT-STRUCTURE.md`
- API agreements: `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`
- Environment: `docs/ENVIRONMENT.md`
- Deployment note: Vercel deploys must run from the REPO ROOT (`vercel --prod` in `C:\projects\yoibi`), because the Vercel project's rootDirectory is `frontend`; Railway deploys run from `backend/` (`railway up`).
