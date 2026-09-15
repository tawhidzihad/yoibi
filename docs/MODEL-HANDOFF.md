# YOIBI Model Handoff

Prevents a new AI model from restarting work from zero. A new model must read this file (plus root `AGENTS.md` and `docs/WORKBASE.md`) before changing code.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Exact Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## What Is Working` · `## Reference`

## Current Status
- Session Date: 2026-09-16
- Active task: TASK-026 — Individual tweet page (`/tweets/[tweetId]`), like/comment icon swap, reply skeleton, Facebook-style threaded comments (frontend + backend)
- Overall phase: Phase 5 complete; platform live in production; post-launch feature work
- Completion status: `Implemented, Verified & Deployed`
- Git repository status: TASK-026 committed and pushed to `main`
- Current branch: `main`

## Last Completed Step
- TASK-026 completed end-to-end. **Backend:** tweet model gained `rootTweetId`/`rootCommentId` (indexed) while `replyToId` keeps the true arbitrary-depth parent chain — no depth limit in the schema; the 2-level visual flattening is a frontend presentation rule only. Create service derives all thread roots server-side from the stored parent (foreign-thread attribution impossible) and increments both the parent comment's direct-reply count and the root tweet's total; read service (`buildCommentThread`) returns top-level comments each with a flat chronological `replies` array (all descendants) + `parentAuthor`, with idempotent legacy backfill of pre-threading replies on read; comment likes reuse the existing tweet like endpoints; delete cascades (comment → its subtree; top-level tweet → its whole comment thread) with consistent counters and `deletedCount` in the response. **Frontend:** `/tweets/[id]` dynamic page (new `TweetDetailView`, awaited `params`, reuses `TweetCard` with `defaultShowReplies`); tweet text body navigates to the individual page (image gallery + action row structurally excluded); action-row order swapped to [comment][retweet][like][share]; "Loading replies..." replaced with comment-shaped skeletons; `TweetReplySection` fully reworked for threads (connector-line nesting, depth-2+ flattening, per-comment likes with optimistic rollback, inline RHF reply composers scoped per thread, "Replying to @handle" context, cascade-aware delete with silent refetch). Contracts (`API-CONTRACT.md`, `openapi.yaml`) updated. Quality gates: backend `npm test` 100% (6 new thread tests), lint clean, audit 0 vulnerabilities; frontend lint clean (pre-existing warning only), build clean. Deployed backend → Railway (`railway up`) and frontend → Vercel (`vercel --prod` from the REPO ROOT — the Vercel project's rootDirectory is `frontend`, so deploying from `frontend/` fails with a path error). Live verification on https://www.yoibi.com/ passed: full API E2E with a disposable account (threaded shape, depth-3 flattening, comment like/unlike, counters, cascade delete, legacy backfill — all PASS), `/tweets/[id]` serving live (HTTP 200, "Tweet | Yoibi"), served chunk confirmed "Loading replies..." absent + threading markers present + swapped aria-label order. Smoke content deleted; committed and pushed to `main`.

## Exact Next Step
- No pending work. Next session: run `/yoibi-resume`, then take the owner's next direction. Optional owner follow-ups: (1) visual browser pass over the thread UI (connector lines, inline composers, swapped icons — verification this session was API-level + compiled-chunk-level, no browser automation available); (2) delete the disposable live-test account `yoibi-thread-smoke-1789506915@example.com` (its content is already deleted).

## Files Touched This Session
- `backend/src/models/tweet.model.js` (rootTweetId, rootCommentId + indexes)
- `backend/src/repositories/tweets.repository.js` (findThreadComments + backfill, findManyByIds, deleteManyByIds, decrementRepliesCount amount param)
- `backend/src/services/create/tweets.service.js` (server-derived thread roots, dual counter increments)
- `backend/src/services/read/tweets.service.js` (formatComment, buildCommentThread, threaded getTweetById/getReplies)
- `backend/src/services/delete/tweets.service.js` (cascade deletion, counter consistency, deletedCount)
- `backend/tests/tweets.test.js` (updated mocks, 6 new thread tests N1–N5)
- `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`
- `frontend/src/features/tweets/ui/TweetCard.js` (body navigation, icon swap, defaultShowReplies)
- `frontend/src/features/tweets/ui/TweetReplySection.js` (threaded rewrite + skeleton + comment likes + inline composers)
- `frontend/src/features/tweets/ui/TweetDetailView.js` (NEW)
- `frontend/src/app/(protected)/tweets/[id]/page.js` (NEW)
- `frontend/src/features/tweets/api/tweetsApi.js` (JSDoc for threaded semantics)
- `docs/WORKBASE.md`, `docs/MODEL-HANDOFF.md` (this file)

## Known Issues / Blockers
- 1 pre-existing React Compiler warning in `frontend/src/features/streams/ui/CreateStreamComposer.js` (unrelated; lint exits 0; intentionally not modified per the "do not modify unrelated files" rule).
- Live Google OAuth browser smoke test pending (owner go-ahead required — writes to production).
- Pre-TASK-018 replies may exist in production with `replyToId: null`; deliberately not migrated (indistinguishable from standalone tweets).
- Disposable live-test account `yoibi-thread-smoke-1789506915@example.com` exists in production (content deleted); delete at will.
- Visual browser pass over the new thread UI recommended (API + compiled-chunk verification passed).

## Session Date
- 2026-09-16

## What Is Working
- All 10 Milestones (Phase 1 through Phase 5 Milestone 10) fully implemented and verified; platform live in production (Vercel `https://www.yoibi.com` + Railway `https://yoibi-backend-production.up.railway.app`, health 200 `database: connected`).
- Twitter-like micro-posting, likes, retweets, feeds; tweet media via secure server-signed Cloudinary intents.
- **Threaded comments (TASK-026):** individual tweet pages at `/tweets/[tweetId]` (body-text click navigates; image clicks still open the lightbox; action row untouched by navigation); swapped [comment][retweet][like][share] action row everywhere; skeleton loading for reply threads; Facebook-style nested replies with connector thread lines and depth-2+ flattening; per-comment likes; inline per-thread reply composers; "Replying to @handle" context; cascade deletes (comment subtree / tweet whole thread) with consistent counters; legacy pre-threading replies backfilled on read; arbitrary-depth nesting preserved in storage for future deeper visual threading without migration.
- Cloudinary server-signed video uploads (provenance-verified, single-use intents), metadata registration, playback views tracking.
- LiveKit live stream broadcasts (host publishing, anonymous viewing, lifecycle termination) and Meet-Up multi-peer rooms (reservation TTLs, atomic slot capacity).
- Complete User Profile System: dynamic `/profile/[username]`, editing (name/handle/bio/country/avatar/banner), real content tabs with server-side counts.
- Comprehensive Admin & Moderation suite (dashboard metrics, block/unblock, canonical 5-phase/9-stage ban orchestrator, content moderation, reports queue).
- Auth: Better Auth 1.7.4 (email + Google OAuth, no email verification), JWT + JWKS verified by the backend, canonical `users` profile auto-provisioning, database-backed rate limiting.
- Security: multi-tier rate limiting, security response headers, strict CORS origin validation, LiveKit camera/mic permissions policy.
- Auth-aware home page nav (TASK-022), responsive mobile drawer navigation, inline upload composers.
- People search (TASK-024): authenticated `GET /users/search`, desktop right-panel inline search, left-sidebar Profile Nav + kebab account switcher, mobile drawer profile-preview.
- Mobile search UX (TASK-025): visible search bar in the mobile top bar, top-anchored scrollable results dropdown, logo-only mobile header, no native clear button, site-wide hidden scrollbars (scrolling fully functional).

## Reference
- Entry point for any agent: root `AGENTS.md`
- Resume command: `/yoibi-resume` (`.claude/commands/yoibi-resume.md`)
- Historical session logs + architecture notes (auth, profile, media provenance, reply flow, hardening): `docs/MODEL-HANDOFF-ARCHIVE.md`
- Full task history: `docs/WORKBASE-ARCHIVE.md`
- Full rule set: `.agents/AI-AGENT.md`, `docs/MANDATORY-RULES.md`, `docs/CODE-STANDARDS.md`, `docs/SECURITY-RULES.md`, `PROJECT-STRUCTURE.md`
- API agreements: `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`
- Environment: `docs/ENVIRONMENT.md`
- Deployment note: Vercel deploys must run from the REPO ROOT (`vercel --prod` in `C:\projects\yoibi`), because the Vercel project's rootDirectory is `frontend`; Railway deploys run from `backend/` (`railway up`).
