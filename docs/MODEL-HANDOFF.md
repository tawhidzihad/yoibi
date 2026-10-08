# YOIBI Model Handoff

Prevents a new AI model from restarting work from zero. A new model must read this file (plus root `AGENTS.md` and `docs/WORKBASE.md`) before changing code.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Exact Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## What Is Working` · `## Reference`

## Current Status
- Session Date: 2026-10-09
- Active task: TASK-030 — Raise Tweet Limit to 380, Server-Enforced Limit, Auto-Grow Textarea, Clean Header
- Overall phase: Production live; Tweet limit raised to 380 enforced on backend, dynamic config delivery, clean header, auto-grow textarea
- Completion status: `DONE` — Backend and frontend updated, contracts/docs synced, deployed to Railway & Vercel, live production fully verified.
- Git repository status: commits created, production deployed and verified, ready to push.
- Current branch: `main`

## Last Completed Step
1. **Audit & Server as Single Source of Truth:**
   - Audited all 280 occurrences across repository. Preserved unrelated numbers (280 user bio limit, 280px drawer/table CSS widths).
   - Confirmed replies are tweets (`replyToId` in same collection) and inherit the server limit.
   - Defined `TWEET_MAX_LENGTH = 380` in `backend/src/config/constants.js`.
   - Exposed `GET /api/v1/tweets/config` returning `{ success: true, data: { maxLength: 380, maxMediaCount: 5 } }`.
   - Enforced 380 limit in `tweets.validator.js` (`createTweetSchema`, `createReplySchema`), `tweet.model.js` (Mongoose schema `maxlength: 380`), and `tweets.service.js` with HTTP 400 `VALIDATION_ERROR`.
   - Created grapheme cluster character counting using `Intl.Segmenter` with NFC normalization in `backend/src/utils/charCount.js` and `frontend/src/shared/utils/charCount.js`, accurately treating multi-byte characters and compound emojis as 1 character.

2. **Frontend UI & Shared Auto-Growing Component:**
   - Created reusable `AutoGrowTextarea` in `src/shared/ui/AutoGrowTextarea.js` (forwardRef, controlled/uncontrolled safe, RHF compatible, auto-grow on typing/Enter/paste, auto-shrink on delete, hidden native resize handle, hidden scrollbars).
   - Replaced standard textarea in `CreateTweetCard.js` with `AutoGrowTextarea`.
   - Removed `<h1>Tweets</h1>` heading and subtext cleanly in `TweetsView.js`.
   - Replaced hardcoded limits in `CreateTweetCard.js` and `TweetReplySection.js` with dynamic `useTweetConfig()` hook.

3. **Contracts, Quality Gates & Deployment:**
   - Updated `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`, `README.md`, `docs/SECURITY-RULES.md`.
   - Backend tests (14 test cases including 380 allowed, 381 rejected with 400, direct API bypass rejected with 400, config endpoint, grapheme counting) passed 100%.
   - Backend & frontend lint: 0 errors; backend audit: 0 vulnerabilities; frontend build: 19/19 pages compiled successfully.
   - Deployed Railway backend (`0954ac8c-52c2-4689-b951-75158ef37a68`) and Vercel frontend (`dpl_FLm8ynE7GNibrCqgJj2WG2RkUt2X`).

4. **Live Production Verification:**
   - Direct API bypass attempt: `POST /api/v1/tweets` with 381 characters returned HTTP 400 `VALIDATION_ERROR` (`Tweet cannot exceed 380 characters`).
   - Direct API 380 characters: created successfully with 201; cleaned up immediately.
   - Live browser smoke: `/tweets` header cleanly absent on desktop and mobile; composer counter shows dynamic `/380`; auto-grow expands smoothly on newlines and pasted text and shrinks on delete; 381 characters disables submit with red `-1` counter; test tweet posted, verified in feed, and deleted cleanly.
   - Database verified: 0 orphaned test tweets and 0 test accounts left in production.

## Exact Next Step
- None — TASK-030 is COMPLETE.

## Files Touched (this session)
- Full list documented in `docs/WORKBASE.md`.
- Summary: 5 files created, 16 files modified, backend & frontend deployed, production live-tested and verified clean.

## Known Issues / Blockers
- None — all deployment and verification steps completed successfully.

## What Is Working
- ✅ Tweet limit 380 enforced on server as single source of truth
- ✅ Dynamic `/tweets/config` endpoint supplying constraints to client
- ✅ Reusable `AutoGrowTextarea` with zero UI jumps, hidden scrollbars, and fluid resizing
- ✅ Clean `/tweets` page layout on desktop and mobile with header removed
- ✅ Over-limit tweets blocked client-side and rejected with HTTP 400 server-side
- ✅ All core features (Feed, Tweets, Replies, Likes, Retweets, Search, Profiles, Meet-Up, Legal) 100% operational


## Reference
- Entry point for any agent: root `AGENTS.md`
- Resume command: `/yoibi-resume` (`.claude/commands/yoibi-resume.md`)
- Historical session logs + architecture notes (auth, profile, media provenance, reply flow, hardening): `docs/MODEL-HANDOFF-ARCHIVE.md`
- Full task history: `docs/WORKBASE-ARCHIVE.md`
- Full rule set: `.agents/AI-AGENT.md`, `docs/MANDATORY-RULES.md`, `docs/CODE-STANDARDS.md`, `docs/SECURITY-RULES.md`, `PROJECT-STRUCTURE.md`
- API agreements: `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`
- Environment: `docs/ENVIRONMENT.md`
- Deployment note: Vercel deploys must run from the REPO ROOT (`vercel --prod` in `C:\projects\yoibi`), because the Vercel project's rootDirectory is `frontend`; Railway deploys run from `backend/` (`railway up`).
