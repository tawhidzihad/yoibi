# YOIBI Workbase

Live task scratchpad. The active AI must keep this current at all times. Full historical task detail lives in `docs/WORKBASE-ARCHIVE.md` — read it only when a task needs the history.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## Task History Index`

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**

## Current Status
- Task ID: TASK-028
- Title: Mandatory Email Verification (React Email + Resend)
- Status: DEPLOYMENT PENDING
- Completion Level: `COMPLETE`
- Summary:
  - **Backend:** Auth middleware updated to check `emailVerified`. Email verification endpoints created. EmailVerification model exists. User model updated with verification fields. Session-clearing migration script created. All code committed and pushed to git.
  - **Frontend:** Verification API methods added to authApi. Verify-email page created at `/verify-email`. LoginForm updated to handle EMAIL_NOT_VERIFIED → redirect to verify-email page.
  - **Contracts:** API-CONTRACT.md and openapi.yaml updated with verification endpoints.
  - **Completed:** Owner provided Resend API key. Domain `no-reply@yoibi.com` configured in Resend. Code committed to git (commit c99b9ad).
  - **Remaining:** Set RESEND_API_KEY in Railway, trigger Railway redeploy, live test.

- Env vars needed: `RESEND_API_KEY` - provided by owner, needs to be set in Railway

## Last Completed Step
Implemented and committed complete email verification system:
- Backend: Created emailVerification model, email service, verification service, and routes
- Backend: Updated `verifyJwt` middleware to return 403 `EMAIL_NOT_VERIFIED` for unverified users
- Backend: Updated user model with `emailVerified`, `emailVerifiedAt`, `emailVerificationSentAt` fields
- Backend: Created session-clearing migration script
- Backend: Created React Email template for verification emails
- Frontend: Created `/verify-email` page with 6-digit code input and resend cooldown
- Frontend: Updated LoginForm to redirect to verify-email on EMAIL_NOT_VERIFIED error
- Frontend: Added verification API methods to authApi.js
- Frontend: Created errorHandler.js with `requiresEmailVerification()` utility
- Contracts: Updated API-CONTRACT.md and openapi.yaml with verification endpoints
- All code committed and pushed to origin/main (commit c99b9ad)

## Next Step
- Set `RESEND_API_KEY` in Railway production environment
- Deploy backend to Railway (e.g., `railway up` from backend/ directory or via Railway dashboard)
- Live test at https://www.yoibi.com/ (verification flow, login flow, signup flow)
- Run session-clearing migration script if needed for existing unverified users

## Files Touched This Session
- `backend/src/controllers/read/auth.controller.js` - Added imports, cleaned up code
- `backend/scripts/clear-sessions-for-unverified-users.js` - Created (session migration script)
- `backend/src/models/emailVerification.model.js` - Created
- `backend/src/routes/verification.routes.js` - Created
- `backend/src/services/email.service.js` - Created
- `backend/src/services/verification.service.js` - Created
- `backend/src/emails/verification-email.template.js` - Created (React Email template)
- `frontend/src/lib/api/authApi.js` - Added verification API methods
- `frontend/src/lib/api/errorHandler.js` - Created
- `frontend/src/app/(auth)/verify-email/page.js` - Created
- `frontend/src/features/auth/ui/LoginForm.js` - Added EMAIL_NOT_VERIFIED handling
- `contracts/API-CONTRACT.md` - Added verification section
- `contracts/openapi.yaml` - Added verification paths and schemas

## Known Issues / Blockers
- Railway redeployment pending - backend needs to be redeployed with RESEND_API_KEY environment variable

## Session Date
- 2026-09-27 (TASK-028 deployment pending)

## Task History Index
One line per task; full detail in `docs/WORKBASE-ARCHIVE.md` (or `docs/MODEL-HANDOFF-ARCHIVE.md` where noted).

| Task | Title | Status |
|------|-------|--------|
| TASK-028 | Mandatory Email Verification (React Email + Resend) | COMPLETE — committed to git, awaiting Railway deploy |
| TASK-027 | Comment UI revision: simple nesting + "See N Replies" toggle, comment-author profile nav, share-link fix, share modal, @username reply prefix (FE only) | COMPLETE — deployed & live-verified (real-browser E2E 35/35) |
| TASK-026 | Individual tweet page, like/comment icon swap, reply skeleton, Facebook-style threaded comments (FE+BE) | COMPLETE — deployed & live-verified |
| TASK-025 | Mobile search UX fixes (top-bar search bar, top-anchored dropdown, clear-button removal, hidden scrollbars) | COMPLETE — deployed & live-verified |
| TASK-024 | People Search + nav redesign (search endpoint, right panel, Profile nav, account switcher, mobile search modal + drawer preview) | COMPLETE — deployed & live-verified |
| TASK-023 | Persistent Context + Resume System (AGENTS.md, doc restructure, /yoibi-resume) | COMPLETE (history in WORKBASE-ARCHIVE.md) |
| TASK-022 | Stale Frontend URL Cleanup + Auth-Aware Home Page Nav Button | COMPLETE — deployed & live-verified |
| TASK-021 | Mobile Edit Profile Spacing & Past Meet-Up Room Card Hierarchy | COMPLETE — deployed & live-verified |
| TASK-020 | Meet Up Page UI/UX, Room Card & Responsiveness | COMPLETE — implemented & verified |
| TASK-019 | Videos Upload Form Collapse + Repository Cleanup | COMPLETE — deployed (Vercel + Railway) |
| TASK-018 | Fix Tweet Reply/Comment Flow (reply belongs to parent tweet) | COMPLETE — verified locally (detail in MODEL-HANDOFF-ARCHIVE) |
| TASK-017 | Tweet Media Upload Redesign — Direct Device Upload, Secure Cloudinary | COMPLETE — real Cloudinary E2E verified |
| TASK-016 | Video Upload Provenance Fix + Inline Composer & Category Redesign | COMPLETE (detail in MODEL-HANDOFF-ARCHIVE) |
| TASK-014 | Complete User Profile System — /profile/[username], editing, avatar & banner | COMPLETE — deployed (detail in MODEL-HANDOFF-ARCHIVE) |
| TASK-013 | Production Authentication Fix (JWT pipeline, auth simplification) | COMPLETE — superseded parts documented |
| TASK-012 | Phase 5 Level 2 — Production Verification & Live Deployment | COMPLETE — deployed & live-smoked |
| TASK-011 | Phase 5 Milestone 10 — Platform Hardening & Deployment Readiness | COMPLETE — 100% quality gates |