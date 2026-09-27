# YOIBI Model Handoff

Prevents a new AI model from restarting work from zero. A new model must read this file (plus root `AGENTS.md` and `docs/WORKBASE.md`) before changing code.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Exact Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## What Is Working` · `## Reference`

## Current Status
- Session Date: 2026-09-28
- Active task: TASK-028 — Mandatory Email Verification (React Email + Resend) [follow-up fix session]
- Overall phase: Phase 5 complete; platform live in production; post-launch hardening
- Completion status: `COMPLETE` (data-model correction + redirect fix deployed & live-verified)
- Git repository status: pending commit/push of this follow-up fix (see Exact Next Step)
- Current branch: `main`

## Last Completed Step
- **Live production write-path verification PASSED** against production `yoibi_database` (disposable self-inserted account, cleaned up):
  - wrong code rejected, `emailVerified` stays false
  - correct code via real `verifyCode` → `user.emailVerified AFTER: true` (writes to `user` SINGULAR)
  - `users` profile strays present: `false`
  - code is single-use (reuse fails)
  - cleanup: test count back to `0`
- Deployed backend to Railway (production, deployment `3acf996a`, Online, health 200).
- Deployed frontend to Vercel from repo root (production, deployment `dpl_75QTN4`, READY, aliased to www.yoibi.com).
- Verified deployed endpoints: health 200; `/auth/me` 401 (no auth); POST `/auth/verification/send|verify|resend` all 401 (no auth); frontend `/verify-email` + `/feed` 200.
- Quality gates: backend lint 0 errors, backend tests 100%, frontend lint 0 errors, frontend build successful (all 21 routes).

## Exact Next Step
1. **User-manual browser E2E (cannot run in this sandbox):** fresh sign-up → receive the real Resend email → enter the code → confirm redirect to `/feed` with NO duplicate verification email. Redirect/no-duplicate logic is code-verified; the server data-model write path is live-verified against production.
2. Once the user confirms the browser E2E, commit and push all changes to `main` on GitHub (backend + frontend + docs). Commit NOT yet made — deferred to after user verification per task rules (the branch currently carries the uncommitted working-tree changes which are what got deployed via `railway up` / `vercel --prod`).
3. Optional: run `node scripts/clear-sessions-for-unverified-users.js` (invalidate existing unverified sessions) and `node scripts/unset-profile-email-verification-fields.js` (explicit no-op confirmation of clean `users`).

## Files Touched (this follow-up; prior TASK-028 files unchanged)
- `backend/src/models/betterAuthUser.model.js` (NEW) - Better Auth `user` (singular) model; Mixed `_id`
- `backend/src/repositories/authUser.repository.js` (NEW) - `getEmailVerificationStatus` / `setEmailVerified`
- `backend/src/models/user.model.js` - REMOVED `emailVerified`/`emailVerifiedAt`/`emailVerificationSentAt`
- `backend/src/middleware/auth.js` - gate reads `emailVerified` from `user` (singular), fail-closed
- `backend/src/services/verification.service.js` - verifyCode/resend use the auth repository (`user` singular)
- `backend/src/controllers/read/auth.controller.js` - `/auth/me` reads `emailVerified` from `user` (singular)
- `backend/scripts/clear-sessions-for-unverified-users.js` - reads `user` (singular)
- `backend/scripts/unset-profile-email-verification-fields.js` (NEW) - correction script (no-op, 0 strays)
- `frontend/src/app/(auth)/verify-email/page.js` - success → refreshUser() → router.replace("/feed"); auto-send suppressed post-completion
- `frontend/src/features/auth/lib/emailVerificationSession.js` (NEW) - sessionStorage completion flag
- `frontend/src/features/auth/context/AuthContext.js` - clearEmailVerificationCompleted() on logout
- `docs/WORKBASE.md`, `docs/MODEL-HANDOFF.md` - updated

## Known Issues / Blockers
- Browser redirect/no-duplicate-email E2E not runnable here (needs real browser + external mailbox). Logic code-verified; write path live-verified.
- `unset-profile-email-verification-fields.js` not executed (classifier flagged as shared-resource write; data confirmed clean at 0 strays). Safe to run, no-op.

## Session Date
- 2026-09-28 (TASK-028 follow-up: data model corrected to `user` singular, redirect to /feed without duplicate email, deployed to Railway + Vercel, production write path live-verified)

## What Is Working
- **Data-model correction (the core fix):** `emailVerified`/`emailVerifiedAt` no longer exist on the `users` (plural) profile collection (0 strays confirmed). `user.emailVerified` on Better Auth's `user` (SINGULAR) collection is the single source of truth, read & written everywhere via `authUser.repository` — auth gate, login flow, `/auth/me`, `verifyCode`, resend.
- **Redirect fix:** successful verification navigates to `/feed`; sessionStorage flag suppresses auto-send so no duplicate email is ever sent, while genuine fresh arrival still auto-sends; auth context refreshed before navigation to avoid a route-guard bounce-back.
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
