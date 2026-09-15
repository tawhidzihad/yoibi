# YOIBI Workbase

Live task scratchpad. The active AI must keep this current at all times. Full historical task detail lives in `docs/WORKBASE-ARCHIVE.md` — read it only when a task needs the history.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## Task History Index`

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**

## Current Status
- Task ID: TASK-026
- Title: Individual tweet page (/tweets/[id]), like/comment icon swap, reply skeleton, Facebook-style threaded comments (frontend + backend)
- Status: COMPLETE
- Completion Level: `Implemented, Verified & Deployed`
- Summary:
  1. **Dynamic tweet page** — new `/tweets/[tweetId]` route (`frontend/src/app/(protected)/tweets/[id]/page.js`, awaited `params` per the bundled Next.js docs; same convention as `/streams/[id]`) rendering a new `TweetDetailView` (`frontend/src/features/tweets/ui/TweetDetailView.js`): back-button header, tweet-shaped skeleton while loading, NOT_FOUND / error / retry states, and the canonical `TweetCard` with `defaultShowReplies` so the tweet hosts its full comment thread. Clicking a tweet's TEXT body in any list now navigates to its individual page — the click target is the content `<p>` only (`role="link"`, Enter-key support), so the image gallery (lightbox click, unchanged) and the action row are structurally excluded from navigation.
  2. **Icon swap** — on the TweetCard action row the like (heart) and comment (replies-toggle) positions are swapped; visual order is now **[comment] [retweet] [like] [share]** (retweet + share untouched). `TweetCard` is the single component rendering this row everywhere (feed, tweets page, profile, detail page).
  3. **Skeleton** — the plain-text "Loading replies..." state is gone; `TweetReplySection` now renders comment-shaped skeleton rows (avatar circle + author line + text lines, same `animate-pulse`/`bg-secondary` idiom as `TweetList`'s TweetSkeleton).
  4. **Threaded comments (frontend)** — `TweetReplySection` fully reworked: threaded render (top-level comments; nested replies indented under their top-level comment, connected by a vertical thread line — `ml-4 border-l-2 border-border/60 pl-3`); depth-2+ replies flattened into the same thread group (Facebook-style); per-comment like (heart + count, optimistic with rollback); per-comment "Reply" action opening an inline RHF composer scoped to that comment's thread; "Replying to @handle" context on flattened deep replies (via server-provided `parentAuthor`); top-level composer unchanged; comment deletion confirms via the existing Modal and silently refetches the authoritative thread (server cascades).
  5. **Threaded comments (backend)** — comments remain tweets. New schema fields `rootTweetId` (top-level tweet of the thread) and `rootCommentId` (top-level comment of the sub-thread) — the `replyToId` chain stores TRUE arbitrary-depth nesting; NO depth limit in the schema (the 2-level visual flattening is purely frontend presentation). Create service derives all roots SERVER-SIDE from the stored parent (a reply can never be attributed to a foreign thread) and increments both the parent comment's direct-reply count and the root tweet's total thread count. Read service builds the Facebook-style tree (`buildCommentThread`: top-level comments each with a flat chronological `replies` array + `parentAuthor`); legacy pre-threading replies are backfilled to `rootTweetId` on read (idempotent, verified live). Comment likes reuse the existing tweet like endpoints (a comment IS a tweet). Delete cascades: deleting a comment removes its whole nested subtree; deleting a top-level tweet removes its entire comment thread (no orphans) — counters kept consistent (`deletedCount` in the response).
  6. **Contracts** — `contracts/API-CONTRACT.md` + `contracts/openapi.yaml` updated: threaded replies GET shape, `POST /tweets/:id/replies` accepting a tweet OR comment `:id`, like endpoints documented for comments, cascade-delete semantics.
- Backend: tests 100% (`npm test` incl. 6 new thread tests), `npm run lint` clean, `npm audit` 0 vulnerabilities.
- Frontend: `npm run lint` clean (only the pre-existing unrelated CreateStreamComposer warning), `npm run build` clean (`/tweets/[id]` route registered).
- Deployed: backend → Railway (`railway up`, health 200 `database: connected`), frontend → Vercel (`vercel --prod` from repo root — the project's rootDirectory is `frontend`; `www.yoibi.com` serving the new build).
- Live verification on https://www.yoibi.com/ PASSED (details in Last Completed Step).

## Last Completed Step
- Full live E2E on production with a disposable account (`yoibi-thread-smoke-1789506915@example.com`, content cleaned up, account left for owner to delete): parent tweet → top-level comments A/B → nested reply (depth 2) → reply-to-reply (depth 3) → comment likes/unlike → threaded GET (top-level count 2; A's group holding both nested replies with correct `rootCommentId` + `parentAuthor`; liked/likesCount personalized) → tweet detail (`repliesCount` = 4 total) → cascade delete of comment A (`deletedCount: 3`, thread left with only B, tweet count 4→1) → legacy backfill on a pre-threading tweet (old reply now carries `rootTweetId`) → smoke tweet deleted (cascade 2). Chunk-level frontend verification on www.yoibi.com: `/tweets/[id]` page live (title "Tweet | Yoibi", HTTP 200), "Loading replies..." string ABSENT, `"/tweets/"` navigation + `parentAuthor` + "Post your reply" + "Like comment" markers PRESENT, and the action-row aria-label order in the served chunk is Toggle replies → Retweet → Like/Unlike → Share (the swap is live). Committed and pushed to `main`.

## Next Step
- No pending code work. Next session: run `/yoibi-resume`, then proceed to the owner's next task.
- Note for the owner: verification was API-level + compiled-chunk-level (no browser automation available this session); a quick visual browser pass is recommended — thread connector lines, inline reply composers, and the swapped icon order on a real screen. The disposable live-test account `yoibi-thread-smoke-1789506915@example.com` exists in production; delete at will.

## Files Touched This Session
- `backend/src/models/tweet.model.js` (rootTweetId + rootCommentId fields, indexed)
- `backend/src/repositories/tweets.repository.js` (findThreadComments w/ legacy backfill, findManyByIds, deleteManyByIds, decrementRepliesCount(tweetId, amount))
- `backend/src/services/create/tweets.service.js` (server-derived thread roots, dual counter increments)
- `backend/src/services/read/tweets.service.js` (formatComment, buildCommentThread, threaded getTweetById/getReplies)
- `backend/src/services/delete/tweets.service.js` (cascade subtree/thread deletion, counter consistency, deletedCount)
- `backend/tests/tweets.test.js` (findThreadComments/deleteManyByIds mocks, thread-root assertions, 6 new thread tests N1–N5)
- `contracts/API-CONTRACT.md`, `contracts/openapi.yaml` (threading contract)
- `frontend/src/features/tweets/ui/TweetCard.js` (text-body navigation, icon swap, defaultShowReplies prop)
- `frontend/src/features/tweets/ui/TweetReplySection.js` (full threaded rewrite + skeleton + comment likes + inline composers)
- `frontend/src/features/tweets/ui/TweetDetailView.js` (NEW — individual tweet page view)
- `frontend/src/app/(protected)/tweets/[id]/page.js` (NEW — dynamic route)
- `frontend/src/features/tweets/api/tweetsApi.js` (JSDoc updates for threaded semantics)
- `docs/WORKBASE.md` + `docs/MODEL-HANDOFF.md` (this session)

## Known Issues / Blockers
- 1 pre-existing React Compiler warning in `frontend/src/features/streams/ui/CreateStreamComposer.js` (unrelated to any active task; lint exits 0; intentionally not modified per the "do not modify unrelated files" rule).
- Live Google OAuth browser smoke test still pending (requires owner go-ahead — writes to production).
- Historical data note (from TASK-018): pre-fix replies may exist with `replyToId: null` in production; deliberately not migrated.
- Disposable live-test account `yoibi-thread-smoke-1789506915@example.com` left in production (all its content deleted); delete at will.
- Visual browser pass over the new thread UI recommended (see Next Step).

## Session Date
- 2026-09-16

## Task History Index
One line per task; full detail in `docs/WORKBASE-ARCHIVE.md` (or `docs/MODEL-HANDOFF-ARCHIVE.md` where noted).

| Task | Title | Status |
|------|-------|--------|
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
