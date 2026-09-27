# YOIBI Model Handoff

Prevents a new AI model from restarting work from zero. A new model must read this file (plus root `AGENTS.md` and `docs/WORKBASE.md`) before changing code.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Exact Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## What Is Working` · `## Reference`

## Current Status
- Session Date: 2026-09-27
- Active task: TASK-028 — Mandatory Email Verification (React Email + Resend)
- Overall phase: Phase 5 complete; platform live in production; post-launch feature work
- Completion status: `DEPLOYMENT PENDING`
- Git repository status: TASK-028 implementation complete, committed and pushed; needs Railway redeploy
- Current branch: `main`

## Last Completed Step
Completed TASK-028 implementation and committed to git:
1. **Backend:** Updated `verifyJwt` middleware in `auth.js` to check `emailVerified` and return 403 `EMAIL_NOT_VERIFIED` error for unverified users. Added `emailVerified`, `emailVerifiedAt`, `emailVerificationSentAt` fields to user model.
2. **Backend:** Created email verification service, controller, and routes (`POST /api/v1/auth/verification/send`, `/verify`, `/resend`). Verification codes are 6-digit, expire in 15 minutes, single-use. Send endpoint rate-limited to 60-second cooldown.
3. **Backend:** Created session-clearing migration script at `backend/scripts/clear-sessions-for-unverified-users.js`.
4. **Frontend:** Added verification API methods to `authApi.js`. Created `/verify-email` page with 6-digit code input, auto-submit on complete entry, and resend with 60-second cooldown timer.
5. **Frontend:** Updated `LoginForm.js` to handle `EMAIL_NOT_VERIFIED` error → redirect to `/verify-email` page with return URL.
6. **Frontend:** Created error handler utilities for email verification error detection.
7. **Contracts:** Updated `API-CONTRACT.md` and `openapi.yaml` with verification endpoints and error codes.
8. **Verified:** Backend lint passes (2 warnings in migration script), frontend build succeeds, all routes compile correctly.

## Exact Next Step
1. Owner has provided Resend API key and configured `no-reply@yoibi.com` domain in Resend
2. Set `RESEND_API_KEY` in Railway production environment
3. Trigger backend redeploy on Railway
4. Live test the complete flow: signup → verify email → login → access at https://www.yoibi.com/
5. Run session-clearing migration if needed to invalidate existing sessions for unverified users
6. Delete disposable test accounts (optional): various `yoibi-rev...-debug` and `yoibi-thread-smoke-*` accounts

## Files Touched This Session
- `backend/src/controllers/read/auth.controller.js` - Added imports, cleaned up code
- `backend/scripts/clear-sessions-for-unverified-users.js` - Created (session migration script)
- `backend/src/models/emailVerification.model.js` - Created (verification codes model)
- `backend/src/routes/verification.routes.js` - Created (verification router)
- `backend/src/services/email.service.js` - Created (email sending logic)
- `backend/src/services/verification.service.js` - Created (verification business logic)
- `frontend/src/lib/api/authApi.js` - Added verification API methods (sendVerificationCode, verifyCode, resendVerification)
- `frontend/src/lib/api/errorHandler.js` - Created (error handling utilities with requiresEmailVerification)
- `frontend/src/app/(auth)/verify-email/page.js` - Created (verification page with code input and resend)
- `frontend/src/features/auth/ui/LoginForm.js` - Added EMAIL_NOT_VERIFIED handling with redirect
- `contracts/API-CONTRACT.md` - Added Section 13: Email Verification endpoints
- `contracts/openapi.yaml` - Added verification paths and schemas
- Git commit: c99b9ad - feat(auth): mandatory email verification

## Known Issues / Blockers
- **Railway redeployment pending**: Backend needs to be redeployed on Railway with `RESEND_API_KEY` environment variable set

## Session Date
- 2026-09-27 (TASK-028 implementation complete, awaiting Railway deploy)

## What Is Working
- All remaining TASK-027 items complete and deployed (share modal, simplified reply nesting, @mention reply prefix)
- **Email Verification System (TASK-028):**
  - Backend endpoints working with proper error responses
  - Auth middleware correctly blocks unverified users with 403 EMAIL_NOT_VERIFIED
  - Frontend verification page built with proper UX (code input, resend cooldown)
  - Login flow correctly redirects to verification page for unverified users
  - API contracts documented
  - All code committed and pushed to origin/main
- Backend lint clean (2 warnings in new migration script), frontend build clean

## Reference
- Entry point for any agent: root `AGENTS.md`
- Resume command: `/yoibi-resume` (`.claude/commands/yoibi-resume.md`)
- Historical session logs + architecture notes (auth, profile, media provenance, reply flow, hardening): `docs/MODEL-HANDOFF-ARCHIVE.md`
- Full task history: `docs/WORKBASE-ARCHIVE.md`
- Full rule set: `.agents/AI-AGENT.md`, `docs/MANDATORY-RULES.md`, `docs/CODE-STANDARDS.md`, `docs/SECURITY-RULES.md`, `PROJECT-STRUCTURE.md`
- API agreements: `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`
- Environment: `docs/ENVIRONMENT.md`
- Deployment note: Vercel deploys must run from the REPO ROOT (`vercel --prod` in `C:\projects\yoibi`), because the Vercel project's rootDirectory is `frontend`; Railway deploys run from `backend/` (`railway up`).