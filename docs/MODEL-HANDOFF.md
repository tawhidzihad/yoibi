# YOIBI Model Handoff

Prevents a new AI model from restarting work from zero. A new model must read this file (plus root `AGENTS.md` and `docs/WORKBASE.md`) before changing code.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Exact Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## What Is Working` · `## Reference`

## Current Status
- Session Date: 2026-10-09
- Active task: TASK-031 — Seeded Recency-Weighted Discovery Tweets & Own-Post Pinning on /feed
- Overall phase: Production live; Seeded discovery mixing and own-post pinning deployed to Railway and Vercel, live production fully verified
- Completion status: `DONE` — Backend and frontend updated, contracts/docs synced, deployed to Railway & Vercel, live production fully verified.
- Git repository status: commits created, production deployed and verified, ready for final push.
- Current branch: `main`

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

## Exact Next Step
- None — TASK-031 is COMPLETE.

## Files Touched (this session)
- Full list documented in `docs/WORKBASE.md`.
- Summary: 2 files created, 11 files modified, backend & frontend deployed, production live-tested and verified clean.

## Known Issues / Blockers
- None — all deployment and verification steps completed successfully. Older tweets from blocked/banned authors remain in the base chronological feed (current platform behavior preserved per task specification; to be addressed in a future task).

## What Is Working
- ✅ Seeded recency-weighted discovery tweets interleaved after every 4 base tweets on `/feed`
- ✅ Deterministic PRNG (`mulberry32`) ensures stable pagination without shifts on same seed
- ✅ Mathematically disjoint base and discovery streams guarantee 0 duplicate tweets across pages
- ✅ Own-post pinning on page 1 pins viewer's top-level tweets from the last 10 minutes at index 0
- ✅ Discovery candidate pool strictly excludes replies, own tweets, blocked authors, and deleted authors
- ✅ Standard `/tweets` and profile Tweets tab remain 100% chronological and unaffected
- ✅ Malformed seed, cursor, and mode rejected with HTTP 400 `VALIDATION_ERROR`
- ✅ Client-side ID deduplication and seed tracking operational in `FeedView.js`
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
