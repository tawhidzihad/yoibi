# YOIBI Workbase

Live task scratchpad. The active AI must keep this current at all times. Full historical task detail lives in `docs/WORKBASE-ARCHIVE.md` — read it only when a task needs the history.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## Task History Index`

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**

## Current Status
- Task ID: TASK-030
- Title: Raise Tweet limit to 380, server-enforced limit, auto-grow textarea, clean /tweets header
- Status: **COMPLETE** — Tweet limit raised to 380 with backend single source of truth, dynamic config endpoint, grapheme cluster character counting, header removed from /tweets, reusable AutoGrowTextarea created and integrated, deployed to Railway & Vercel, live-verified.
- Completion Level: `COMPLETE`
- Summary:
  - Raised Tweet length limit from 280 to 380 characters across the platform. Single source of truth on the backend (`TWEET_MAX_LENGTH = 380` in `backend/src/config/constants.js`), exposed via public endpoint `GET /api/v1/tweets/config` returning `{ success: true, data: { maxLength: 380, maxMediaCount: 5 } }`. Over-limit requests rejected with HTTP 400 `VALIDATION_ERROR`.
  - Consistent character counting using `Intl.Segmenter` with grapheme cluster granularity and NFC normalization on both server (`backend/src/utils/charCount.js`) and client (`frontend/src/shared/utils/charCount.js`), treating complex multi-byte sequences and compound emojis (e.g., 👍🏽, 😀) accurately as 1 character.
  - Cleaned up `/tweets` header: completely removed `<h1>Tweets</h1>` and subtext ("Concise thoughts · 280-character limit · Real-time conversations"). Maintained balanced page spacing on desktop and mobile.
  - Created reusable `AutoGrowTextarea` component in `src/shared/ui/AutoGrowTextarea.js` (forwardRef, controlled/uncontrolled safe, RHF compatible, auto-grow on typing/Enter/paste, auto-shrink on delete, hidden native resize handle, hidden scrollbars) and integrated into `CreateTweetCard` (used on `/tweets`).
  - Integrated dynamic `useTweetConfig()` hook in `CreateTweetCard.js` and `TweetReplySection.js`, eliminating hardcoded tweet length limits in UI code.
  - Contracts & Docs synced: `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`, `README.md`, `docs/SECURITY-RULES.md`.
  - Full local test suites passed: backend `npm test` 100%, backend `npm run lint` 0 errors, backend `npm audit` 0 vulnerabilities, frontend `npm run lint` 0 errors, frontend `npm run build` 19/19 pages prerendered/compiled cleanly, vitest suites passed.
  - Production deployments: Railway backend deployment `0954ac8c-52c2-4689-b951-75158ef37a68` Online; Vercel frontend deployment `dpl_FLm8ynE7GNibrCqgJj2WG2RkUt2X` Ready aliased to `https://www.yoibi.com`.
  - Live production verification: verified header cleanly gone on desktop & mobile; 380 character limit correctly served by `/tweets/config`; UI over-limit (381 chars) disables submit with red counter `-1`; direct API bypass attempt rejected with HTTP 400 `VALIDATION_ERROR`; 380-char tweet creation succeeded and was cleanly deleted; auto-growing and shrinking verified; feeds, replies, profiles, and meetups intact.

## Last Completed Step
1. **Audit & Single Source of Truth:**
   - Audited all 280 occurrences across repository. Preserved unrelated numbers (280 bio limit, 280px widths). Replies share tweet constant.
   - Defined `TWEET_MAX_LENGTH = 380` in `backend/src/config/constants.js`.
   - Exposed `GET /api/v1/tweets/config` returning `{ success: true, data: { maxLength: 380, maxMediaCount: 5 } }`.
   - Integrated `countGraphemes` using `Intl.Segmenter` in `backend/src/utils/charCount.js` and `frontend/src/shared/utils/charCount.js`.
   - Backend validation in `tweets.validator.js`, `tweet.model.js`, and `tweets.service.js` updated to enforce 380 max characters with HTTP 400 `VALIDATION_ERROR`.

2. **Frontend UI & Shared Component:**
   - Cleanly removed `<h1>Tweets</h1>` and subtext header block in `TweetsView.js`.
   - Built `AutoGrowTextarea.js` in `src/shared/ui/` with auto-resizing, hidden scrollbars, hidden resize handle, and controlled/uncontrolled/RHF safety.
   - Integrated `AutoGrowTextarea` into `CreateTweetCard.js`.
   - Added `useTweetConfig.js` hook fetching server config dynamically; updated `CreateTweetCard.js` and `TweetReplySection.js` to eliminate hardcoded limits.

3. **Contracts & Documentation:**
   - Synchronized `contracts/API-CONTRACT.md` and `contracts/openapi.yaml` with `/tweets/config` endpoint and 380 character limit.
   - Updated `README.md` and `docs/SECURITY-RULES.md`.

4. **Testing, Deployment & Live Verification:**
   - Local quality gates passed: `npm test` 100%, backend lint 0 errors, backend audit 0 vulnerabilities, frontend lint 0 errors, frontend build 19/19 pages successful.
   - Deployed Railway backend (`0954ac8c-52c2-4689-b951-75158ef37a68`) and Vercel frontend (`dpl_FLm8ynE7GNibrCqgJj2WG2RkUt2X`).
   - Live API tested: direct API bypass attempt with 381 characters returned HTTP 400 `VALIDATION_ERROR`; 380-character tweet creation succeeded (201) and was immediately deleted.
   - Live browser tested: `/tweets` header removed cleanly on desktop (1280x800) and mobile (390x844); textarea auto-grew on typing, Enter, and paste, and shrank on delete; 381 characters disabled submit with red counter; test tweet posted, verified, and deleted.
   - Verified zero orphaned test tweets or test accounts in production database.

## Next Step
- **None** — TASK-030 is COMPLETE.

## Files Touched This Session
- **Backend Created:** `backend/src/config/constants.js`, `backend/src/utils/charCount.js`.
- **Backend Modified:** `backend/src/validators/tweets.validator.js`, `backend/src/models/tweet.model.js`, `backend/src/services/create/tweets.service.js`, `backend/src/controllers/read/tweets.controller.js`, `backend/src/routes/tweets.routes.js`, `backend/src/middleware/validate.js`, `backend/tests/tweets.test.js`, `backend/package-lock.json`.
- **Frontend Created:** `frontend/src/shared/ui/AutoGrowTextarea.js`, `frontend/src/shared/utils/charCount.js`, `frontend/src/features/tweets/hooks/useTweetConfig.js`.
- **Frontend Modified:** `frontend/src/lib/api/tweetsApi.js`, `frontend/src/features/tweets/ui/CreateTweetCard.js`, `frontend/src/features/tweets/ui/TweetReplySection.js`, `frontend/src/features/tweets/ui/TweetsView.js`, `frontend/tests/tweets-media.test.js`.
- **Contracts & Docs:** `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`, `README.md`, `docs/SECURITY-RULES.md`, `docs/WORKBASE.md`, `docs/MODEL-HANDOFF.md`.

## Known Issues / Blockers
- None — all deployment and verification steps completed successfully.

## Session Date
- 2026-10-09 (TASK-030: Raise Tweet Limit to 380, Server-Enforced Limit, Auto-Grow Textarea, Clean Header)

## What Is Working
- ✅ Tweet limit increased to 380 characters, enforced on server as single source of truth.
- ✅ `GET /api/v1/tweets/config` serves `{ maxLength: 380, maxMediaCount: 5 }` dynamically to frontend.
- ✅ Character counting using NFC normalized grapheme clusters via `Intl.Segmenter` on client and server.
- ✅ Clean /tweets layout without header or subtext, perfectly responsive on desktop and mobile.
- ✅ Reusable `AutoGrowTextarea` smoothly grows and shrinks with typing, newlines, pasting, and deletion.
- ✅ Over-limit tweets (381+ chars) disabled in UI and rejected with HTTP 400 `VALIDATION_ERROR` on server.
- ✅ Core social features (Feed, Tweets, Replies, Likes, Retweets, Search, Profiles, Meet-Up) 100% operational.

## Task History Index
One line per task; full detail in `docs/WORKBASE-ARCHIVE.md`.

| Task | Title | Status |
|------|-------|--------|
| TASK-030 | Raise Tweet limit to 380, server-enforced limit, auto-grow textarea, clean /tweets header | COMPLETE — server constant 380, dynamic config endpoint, grapheme counting, header removed, AutoGrowTextarea, deployed Rail + Vercel prod, live-verified |
| TASK-029 | Complete Removal of Streams Feature | COMPLETE — all streams code/tests deleted, database collection dropped, contracts/docs synced, deployed Rail + Vercel prod, live-verified |
| TASK-028 | Mandatory Email Verification (React Email + Resend) | COMPLETE — deployed; follow-up 1: emailVerified moved to `user` singular, redirect to /feed w/o duplicate email; follow-up 2 (this session): root-cause fix for verified users bounced to /verify-email mid-session (frontend fallback-branch emailVerified + backend moderation-cache invalidation), deployed Rail `37d05eb4` + Vercel prod |
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
