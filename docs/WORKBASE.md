# YOIBI Workbase

Live task scratchpad. The active AI must keep this current at all times. Full historical task detail lives in `docs/WORKBASE-ARCHIVE.md` — read it only when a task needs the history.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## Task History Index`

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**

## Current Status
- Task ID: TASK-031
- Title: Seeded recency-weighted discovery tweets and own-post pinning on /feed
- Status: **COMPLETE** — Feed discovery implemented with deterministic PRNG (mulberry32), recency weighting, disjoint candidate/base query streams, own-post pinning on page 1, strict opt-in via `mode=feed`, zero cross-page duplicates, deployed to Railway & Vercel, live-verified.
- Completion Level: `COMPLETE`
- Summary:
  - Added seeded recency-weighted discovery mixing and own-post pinning exclusively to `/feed` while preserving 100% chronological behavior for standard `/tweets` and profile tabs.
  - Tunable constants centralized in `backend/src/config/constants.js`:
    - `FEED_DISCOVERY_EVERY = 4` (after every 4 base tweets, 1 discovery tweet is inserted)
    - `FEED_DISCOVERY_WINDOW_DAYS = 14` (candidates from the last 14 days)
    - `FEED_DISCOVERY_POOL_SIZE = 100` (max candidates fetched per bounded, indexed query)
    - `FEED_OWN_PIN_MINUTES = 10` (viewer's own tweets from the last 10 minutes pinned on page 1)
  - Pure deterministic PRNG utility in `backend/src/utils/prng.js`: `mulberry32` with recency weighting `1 / (1 + ageHours / 24)` and hourly reference time window, ensuring identical output for same seed + same page across requests.
  - Mathematically disjoint streams: discovery sequence for the session seed is strictly excluded from the base chronological stream query (`_id: { $nin: [...] }`), guaranteeing zero duplicate tweets between base and discovery across all pages.
  - Candidate exclusions: replies (`replyToId: null`), viewer's own tweets (`authorId: { $ne: currentUserId }`), blocked authors (`isBlocked: true`), deleted/banned authors (purged from `User` collection), and pinned tweets are strictly excluded from discovery candidates.
  - Own-post pinning: on page 1 of an opted-in `/feed` request, the viewer's own top-level tweets created within `FEED_OWN_PIN_MINUTES` (10 minutes) are placed at the very top (newest first) and excluded from the rest of the stream so they never repeat.
  - Client-side deduplication & seed tracking: `FeedView.js` tracks `feedSeedRef`, passes it on pagination, resets on fresh load/retry, and deduplicates items by ID (`items.filter(t => !existingIds.has(t.id))`).
  - Strict input validation: `seed`, `cursor`, `mode` validated with Zod, returning HTTP 400 `VALIDATION_ERROR` for malformed values.
  - Contracts synchronized: `contracts/API-CONTRACT.md` and `contracts/openapi.yaml` updated with `mode`, `seed`, `cursor`, `filter`, `authorHandle`, and `feedSeed`.
  - Quality gates: 100% backend test suites passed (including 15 assertions in `feed-discovery.test.js`), 0 backend lint errors, 0 backend audit vulnerabilities, 0 frontend lint errors, 19/19 frontend pages compiled in `next build`.
  - Production deployments: Railway backend deployment `a75ee8da-62ae-4738-8de0-f0703ad0d57c` Online; Vercel frontend deployment `dpl_8jKdKPPbpLomFrU8juhuVocCzHSc` Ready and aliased to `https://www.yoibi.com`.
  - Live production verification:
    - Direct API: malformed seed/cursor/mode returned HTTP 400 `VALIDATION_ERROR`.
    - Standard `/tweets`: status 200, strictly chronological, no `feedSeed`.
    - Feed `mode=feed`: status 200, `feedSeed` integer returned.
    - Multiple seeds tested: Page 1 + Page 2 consecutive pages showed exactly 0 duplicate items across pages for all seeds. Different seeds showed different mixes.
    - Response time verified healthy (834 ms vs 419 ms).
    - Browser smoke test verified login redirect, clean console (0 errors), zero UI breaks.
    - Note on base stream: As instructed, older tweets from blocked/banned authors are not excluded from the base stream in this task (current behavior preserved), and will be addressed in a separate dedicated moderation task.

## Last Completed Step
1. **Tunable Constants & PRNG Foundation:**
   - Centralized all tunable numbers in `backend/src/config/constants.js`: `FEED_DISCOVERY_EVERY = 4`, `FEED_DISCOVERY_WINDOW_DAYS = 14`, `FEED_DISCOVERY_POOL_SIZE = 100`, `FEED_OWN_PIN_MINUTES = 10`.
   - Created deterministic PRNG utility in `backend/src/utils/prng.js` with `mulberry32` and recency-weighted random selection without replacement.

2. **Repository & Service Layer:**
   - Extended `tweets.repository.js` with `findDiscoveryCandidates`, `findPinnedTweets`, and `excludeTweetIds` in `findPaginated` and `count`.
   - Updated `tweets.service.js` with `mode=feed` branch: generated `feedSeed`, extracted pinned own tweets for page 1, fetched and filtered candidate pool (excluding replies, own tweets, blocked authors, deleted authors, pinned tweets), generated disjoint discovery sequence for session seed, queried base stream excluding discovery and pinned tweets, sliced per-page discovery picks, and interleaved after every 4 base tweets.
   - Non-feed requests (`mode` omitted) remain 100% chronological with zero alteration.

3. **Validation, Routing & Frontend:**
   - Added `mode`, `seed`, `cursor` to `listTweetsQuerySchema` in `tweets.validator.js`, returning HTTP 400 `VALIDATION_ERROR` for malformed values via route validation `{ statusCode: 400 }`.
   - Updated `tweetsApi.getTweets` to pass `mode` and `seed`.
   - Updated `FeedView.js` to pass `mode: "feed"`, manage `feedSeedRef`, reset on reload, and perform client-side ID deduplication when appending pages.

4. **Testing, Deployment & Live Production Verification:**
   - Added automated test suite in `backend/tests/feed-discovery.test.js` integrated into `tweets.test.js`.
   - Passed all local quality gates: backend tests 100%, backend lint 0 errors, backend audit 0 vulnerabilities, frontend lint 0 errors, frontend build 19/19 pages successful.
   - Deployed Railway backend (`a75ee8da-62ae-4738-8de0-f0703ad0d57c`) and Vercel frontend (`dpl_8jKdKPPbpLomFrU8juhuVocCzHSc`).
   - Live tested on production: verified 400 on malformed seed/cursor/mode; verified standard `/tweets` has no `feedSeed`; verified `mode=feed` returns `feedSeed`; verified multiple seeds have exactly 0 cross-page duplicates; verified mix changes between seeds; verified 0 console errors and clean layout.

## Next Step
- **None** — TASK-031 is COMPLETE.

## Files Touched This Session
- **Backend Created:** `backend/src/utils/prng.js`, `backend/tests/feed-discovery.test.js`.
- **Backend Modified:** `backend/src/config/constants.js`, `backend/src/repositories/tweets.repository.js`, `backend/src/validators/tweets.validator.js`, `backend/src/routes/tweets.routes.js`, `backend/src/controllers/read/tweets.controller.js`, `backend/src/services/read/tweets.service.js`, `backend/tests/tweets.test.js`.
- **Frontend Modified:** `frontend/src/features/tweets/api/tweetsApi.js`, `frontend/src/features/feed/ui/FeedView.js`.
- **Contracts & Docs:** `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`, `docs/WORKBASE.md`, `docs/MODEL-HANDOFF.md`.

## Known Issues / Blockers
- None — all deployment and verification steps completed successfully. Older tweets from blocked/banned authors remain in the base chronological feed (current platform behavior preserved per task specification; to be addressed in a future task).

## Session Date
- 2026-10-09 (TASK-031: Seeded Recency-Weighted Discovery Tweets & Own-Post Pinning on /feed)

## What Is Working
- ✅ Seeded recency-weighted discovery tweets interleaved after every 4 base tweets on `/feed`.
- ✅ Deterministic PRNG (`mulberry32`) ensures stable pagination without shifts on same seed.
- ✅ Mathematically disjoint base and discovery streams guarantee 0 duplicate tweets across pages.
- ✅ Own-post pinning on page 1 pins viewer's top-level tweets from the last 10 minutes at index 0.
- ✅ Discovery candidate pool strictly excludes replies, own tweets, blocked authors, and deleted authors.
- ✅ Standard `/tweets` and profile Tweets tab remain 100% chronological and unaffected.
- ✅ Malformed seed, cursor, and mode rejected with HTTP 400 `VALIDATION_ERROR`.
- ✅ Client-side ID deduplication and seed tracking operational in `FeedView.js`.

## Task History Index
One line per task; full detail in `docs/WORKBASE-ARCHIVE.md`.

| Task | Title | Status |
|------|-------|--------|
| TASK-031 | Seeded recency-weighted discovery tweets and own-post pinning on /feed | COMPLETE — constants centralized, prng utility, disjoint streams, own-post pinning, mode opt-in, 0 duplicates across pages, deployed Rail + Vercel prod, live-verified |
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
