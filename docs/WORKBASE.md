# YOIBI Workbase

This file is a live task scratchpad. The active AI must update it before and during work.

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> All user micro-posts, likes, retweets, and replies belong to the canonical Tweet domain. Feed is a presentation view of Tweets.

## Current Task
- Task ID: TASK-004
- Title: Phase 4 — Milestone 3: Tweet / Feed Slice Integration (Unified Social Content Domain)
- Status: COMPLETED & COMMITTED
- Checkpoint Commit: `ddd2e48` (`feat: integrate tweet and feed slice`)
- Scope:
  - Backend:
    - Model: `backend/src/models/tweet.model.js` (Schema with `_id`, `authorId`, `content`, `mediaUrls`, `likes`, `likesCount`, `retweets`, `retweetCount`, `repliesCount`, `replyToId`, `isRetweet`, `quoteTweet`, indexes on `createdAt`, `authorId`, `replyToId`).
    - Repository: `backend/src/repositories/tweets.repository.js` (CRUD queries, atomic likes & retweets, replies lookup, author hydration, disconnected DB safety).
    - Validation: `backend/src/validators/tweets.validator.js` (Zod schemas for 1-280 char content, query pagination, tweet params, replies).
    - Services: `create/tweets.service.js`, `read/tweets.service.js`, `update/tweets.service.js`, `delete/tweets.service.js`.
    - Controllers: `create/tweets.controller.js`, `read/tweets.controller.js`, `update/tweets.controller.js`, `delete/tweets.controller.js`.
    - Routes: `backend/src/routes/tweets.routes.js` mounted in `backend/src/routes/index.js`.
    - Tests: `backend/tests/tweets.test.js` integrated into `backend/tests/index.js`.
    - Safe cleanup: Removed duplicate Post model, repository, validators, routes, and services after migration.
  - Frontend:
    - Client: `frontend/src/features/tweets/api/tweetsApi.js` wrapping `apiClient` for `/api/v1/tweets`.
    - UI: `CreateTweetCard.js` (React Hook Form + Zod, 280-char live countdown counter, login redirect), `TweetCard.js` (optimistic like/retweet toggle & rollback, delete modal, replies toggle), `TweetReplySection.js` (threaded replies + reply form), `TweetList.js` (empty/loading/error/pagination states).
    - Views: `FeedView.js` and `TweetsView.js` both cleanly consuming `src/features/tweets` components.
    - Safe cleanup: Removed `src/features/posts` after all reusable logic and UI are safely consolidated in `src/features/tweets`.
  - Verification Gates:
    - Backend test suite (`npm test`) -> 100% passing (Foundation + Tweets suites)
    - Backend ESLint (`npm run lint`) -> 0 errors, 0 warnings
    - Frontend ESLint (`npm run lint`) -> 0 errors, 0 warnings
    - Frontend Next.js production build (`npm run build`) -> 14 static pages generated cleanly
    - 4-space indentation and zero tabs

## Required References
- [x] AI-AGENT.md
- [x] PROJECT-STRUCTURE.md
- [x] CODE-STANDARDS.md
- [x] MANDATORY-RULES.md
- [x] Relevant skill files (.agents/skills/*)
- [x] API-CONTRACT.md and openapi.yaml
- [x] Legacy reference (legacy/original-yoibi/)

## Implementation Checklist
- [x] Correct architecture: Define Tweet as single social content entity (`POST` = HTTP method only)
- [x] Update & synchronize API contracts (`API-CONTRACT.md`, `openapi.yaml`)
- [x] Update frontend and backend README documentation
- [x] Backend: Tweet model schema & indexes (`tweet.model.js`)
- [x] Backend: Tweets repository layer (`tweets.repository.js`)
- [x] Backend: Tweets & Replies Zod validators (`tweets.validator.js`)
- [x] Backend: Tweets CRUD services (create, read, update, delete)
- [x] Backend: Tweets CRUD controllers (create, read, update, delete)
- [x] Backend: Tweets routes & index mount (`tweets.routes.js`, `index.js`)
- [x] Backend: Automated in-process test suite (`tweets.test.js`, `index.js`)
- [x] Frontend: `tweetsApi.js` API client integration
- [x] Frontend: `CreateTweetCard.js` (React Hook Form + Zod, 280-char counter)
- [x] Frontend: `TweetCard.js` (Optimistic like/retweet, replies disclosure, delete modal)
- [x] Frontend: `TweetReplySection.js` (React Hook Form + Zod reply form)
- [x] Frontend: `TweetList.js`, `TweetsView.js`, and `FeedView.js` connected to backend API
- [x] Safe cleanup of duplicate Post files after verification
- [x] Run backend tests (`npm test`) -> 100% passing
- [x] Run backend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [x] Run frontend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [x] Run frontend production build (`npm run build`) -> Clean compile (14/14 static pages)
- [x] Git checkpoint commit (`ddd2e48`) & update MODEL-HANDOFF.md

## Verification Log
| Check | Result | Notes |
|---|---|---|
| Contract Synchronization | Passed | `API-CONTRACT.md` and `openapi.yaml` unified to Tweet domain |
| Readme Documentation | Passed | Updated frontend/README.md and backend/README.md with Tweet rule |
| Backend Test Suite | Passed | 100% passing (Foundation + Tweets suites) |
| Backend ESLint | Passed | 0 errors, 0 warnings |
| Frontend ESLint | Passed | 0 errors, 0 warnings |
| Frontend Production Build | Passed | 14/14 static pages generated cleanly |
| 4-Space Indentation & Tabs | Passed | Verified 4-space indentation and 0 tab characters across all files |
| Git Commit Checkpoint | Passed | Commit `ddd2e48` `feat: integrate tweet and feed slice` |

## Git Status
- Git Initialized: Yes (root `yoibi/`)
- Current Branch: `main`
- Latest Commit: `ddd2e48` (`feat: integrate tweet and feed slice`)
- Working Tree State: Clean (after docs checkpoint)

## Completion State
- Current Phase: Phase 4 — Milestone 3: Tweet / Feed Slice Integration (COMPLETED & COMMITTED)
- Exact Next Milestone: Phase 4 — Milestone 4: Videos Slice Integration (Shorts & Longform videos)
