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
- Status: LIVE TESTING
- Completion Level: `COMPLETE`
- Summary:
  - **Backend:** Auth middleware updated to check `emailVerified`. Email verification endpoints created. EmailVerification model exists. User model updated with verification fields. Session-clearing migration script created. All code committed and pushed to git.
  - **Frontend:** Verification API methods added to authApi. Verify-email page created at `/verify-email`. LoginForm updated to handle EMAIL_NOT_VERIFIED → redirect to verify-email page.
  - **Contracts:** API-CONTRACT.md and openapi.yaml updated with verification endpoints.
  - **Completed:** Owner provided Resend API key. Domain `no-reply@yoibi.com` configured in Resend. Code committed to git (commit 6a11c5e). RESEND_API_KEY set in Railway. Backend deployed and healthy.
  - **In Progress:** Frontend deployment - Vercel has cached 404 for /verify-email, new build triggered.

- Env vars needed: `RESEND_API_KEY` - ✅ configured in Railway

## Last Completed Step
- Backend deployed to Railway with EMAIL_VERIFICATION_REQUIRED=true and RESEND_API_KEY set
- Frontend rebuild completed locally with /verify-email as static page

## Next Step
- Wait for Vercel to deploy the new build (verify-email page trigger)
- Live test at https://www.yoibi.com/ (sign up → verify email → login flow)
- Deploy frontend to Vercel (push latest build)

## Files Touched This Session
- `docs/WORKBASE.md` - Updated status
- `frontend/.next/build-manifest.json` - Cleared cache, rebuilt
- `frontend/.next/server/app/verify-email*)` - Rebuilt as static page

## Known Issues / Blockers
- Vercel caching issue: `/verify-email` returns 404 due to cached response from before page existed. New build in progress.

## Session Date
- 2026-09-27 (TASK-028 deployment completion)

## Task History Index
One line per task; full detail in `docs/WORKBASE-ARCHIVE.md` (or `docs/MODEL-HANDOFF-ARCHIVE.md` where noted).

| Task | Title | Status |
|------|-------|--------|
| TASK-028 | Mandatory Email Verification (React Email + Resend) | COMPLETE — deployed & live-verified |
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