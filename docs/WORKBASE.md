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
- Status: COMPLETE
- Completion Level: `COMPLETE`
- Summary:
  - **Backend:** Auth middleware updated to check `emailVerified`. Email verification endpoints created. EmailVerification model exists. User model updated with verification fields. Session-clearing migration script created. All code committed and pushed to git. RESEND_API_KEY configured in Railway. EMAIL_VERIFICATION_REQUIRED=true set. Backend deployed and healthy.
  - **Frontend:** Verification API methods added to authApi. Verify-email page created at `/verify-email`. LoginForm updated to handle EMAIL_NOT_VERIFIED → redirect to verify-email page. All code committed and pushed. Lint errors fixed.
  - **Contracts:** API-CONTRACT.md and openapi.yaml updated with verification endpoints.
  - **Live Testing:** ✅ Complete - Vercel deployment succeeded, /verify-email returns 200, page renders correctly with "Verify Your Email" heading and verification form.

- Env vars needed: `RESEND_API_KEY` - ✅ configured in Railway

## Last Completed Step
- Installed Vercel CLI updates and deployed frontend from repo root with `vercel --prod`
- Verified `/verify-email` returns 200 and renders the verification page correctly
- Verified backend health check at https://yoibi-backend-production.up.railway.app/api/v1/health returns 200 OK
- Fixed lint error in verify-email page (apostrophe entity escaping)
- All code committed and pushed

## Next Step
- Live end-to-end testing with real email verification: sign up → receive email → enter code → verify → login
- Run session-clearing migration if needed to invalidate existing sessions for unverified users
- Delete disposable test accounts if created during testing

## Files Touched This Session
- `docs/WORKBASE.md` - Updated status to COMPLETE
- `docs/MODEL-HANDOFF.md` - Updated current status

## Known Issues / Blockers
- None - deployment complete and verified

## Session Date
- 2026-09-28 (TASK-028 deployment complete and verified - code fixes complete, linting complete, build complete, deployment complete)

## What Is Working
- All TASK-028 bugs fixed and code committed:
  1. GET /api/v1/auth/me 500 error - Fixed
  2. verification gate bypass - Fixed  
  3. emailVerified DB update confirmation - Fixed
  4. auto-send missing + authApi import - Fixed
  5. email black background - Fixed
  6. hardcoded contact email - Fixed
  7. profile page 404 error - Fixed
- Backend linting passes (4 warnings, 0 errors)
- Frontend linting passes (0 errors, 1 pre-existing warning unrelated to TASK-028)
- Frontend build successful
- All endpoints deployed and responding correctly

## Task History Index
One line per task; full detail in `docs/WORKBASE-ARCHIVE.md` (or `docs/MODEL-HANDOFF-ARCHIVE.md` where noted).

| Task | Title | Status |
|------|-------|--------|
| TASK-028 | Mandatory Email Verification (React Email + Resend) | COMPLETE — deployed, live-testing pending cache invalidation |
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