# YOIBI Workbase

This file is a live task scratchpad. The active AI must update it before and during work.

## Current Task
- Task ID: TASK-003
- Title: Phase 4 — Milestone 2: Feed & Posts Slice Integration
- Goal: Fully integrate Post domain and Feed feature slice across Express backend and Next.js frontend according to API contract (Post != Tweet).
- Scope: Backend models (`post.model.js`), repositories (`posts.repository.js`), services (create/read/update/delete for posts and comments), controllers, Zod validators (`posts.validator.js`), routes (`posts.routes.js`), backend test suite (`posts.test.js`), frontend API client (`postsApi.js`), frontend post components (`CreatePostCard.js`, `PostCard.js`, `CommentSection.js`, `PostList.js`), and `FeedView.js` connected to real data.

## Required References
- [x] AI-AGENT.md
- [x] PROJECT-STRUCTURE.md
- [x] CODE-STANDARDS.md
- [x] MANDATORY-RULES.md
- [x] Relevant skill files (.agents/skills/*)
- [x] API-CONTRACT.md and openapi.yaml
- [x] Legacy reference (legacy/original-yoibi/)

## Planned Changes
- Backend:
  - `backend/src/models/post.model.js`: Post Mongoose schema with string `_id`, `authorId`, `content`, `media`, `likes`, `likesCount`, `commentsCount`, `sharesCount`, embedded `comments` subdocuments, indexes on `createdAt` and `authorId`.
  - `backend/src/repositories/posts.repository.js`: Encapsulated database queries for post CRUD, pagination, likes toggle, and comment CRUD.
  - `backend/src/validators/posts.validator.js`: Zod schemas for `createPost`, `listPostsQuery`, `postIdParam`, `createComment`, `commentParams`.
  - `backend/src/services/create/posts.service.js`: Post creation logic associating verified `req.user.id`.
  - `backend/src/services/read/posts.service.js`: Post feed pagination, filter (`all` | `following`), single post details, author hydration, and `liked` flag calculation.
  - `backend/src/services/update/posts.service.js`: Like and unlike post operations.
  - `backend/src/services/delete/posts.service.js`: Post deletion checking author ownership (`req.user.id === post.authorId`) or admin role.
  - `backend/src/services/create/comments.service.js`: Comment creation logic on posts.
  - `backend/src/services/read/comments.service.js`: Comment retrieval for posts.
  - `backend/src/services/delete/comments.service.js`: Comment deletion checking comment author, post author, or admin role.
  - `backend/src/controllers/create/posts.controller.js`
  - `backend/src/controllers/read/posts.controller.js`
  - `backend/src/controllers/update/posts.controller.js`
  - `backend/src/controllers/delete/posts.controller.js`
  - `backend/src/controllers/create/comments.controller.js`
  - `backend/src/controllers/read/comments.controller.js`
  - `backend/src/controllers/delete/comments.controller.js`
  - `backend/src/routes/posts.routes.js`: Route definitions binding endpoints to controllers and validators with `optionalAuth` / `verifyJwt`.
  - `backend/src/routes/index.js`: Mount posts routes.
  - `backend/tests/posts.test.js`: In-process HTTP verification suite for post CRUD, validation, permissions, comments, likes.
- Frontend:
  - `frontend/src/features/posts/api/postsApi.js`: Centralized posts API helper using `apiClient`.
  - `frontend/src/features/posts/ui/CreatePostCard.js`: React Hook Form + Zod composer with character limit, validation, loading state, unauthenticated redirect.
  - `frontend/src/features/posts/ui/PostCard.js`: Post display with optimistic like toggle + rollback, comments disclosure, delete modal, share button.
  - `frontend/src/features/posts/ui/CommentSection.js`: Threaded comments list + React Hook Form comment submission form.
  - `frontend/src/features/posts/ui/PostList.js`: Feed stream with loading skeleton, error retry, empty state, pagination.
  - `frontend/src/features/feed/ui/FeedView.js`: Replaced mock feed with real `postsApi` integration.

## Implementation Checklist
- [x] Backend: Post model schema & indexes (`backend/src/models/post.model.js`)
- [x] Backend: Posts repository layer (`backend/src/repositories/posts.repository.js`)
- [x] Backend: Posts & Comments Zod validators (`backend/src/validators/posts.validator.js`)
- [x] Backend: Posts & Comments CRUD services (create, read, update, delete)
- [x] Backend: Posts & Comments controllers (create, read, update, delete)
- [x] Backend: Posts routes & index mount (`backend/src/routes/posts.routes.js`, `index.js`)
- [x] Backend: Automated in-process test suite (`backend/tests/posts.test.js`, `index.js`)
- [x] Frontend: `postsApi.js` API client integration
- [x] Frontend: `CreatePostCard.js` (React Hook Form + Zod, character count, media attachment)
- [x] Frontend: `PostCard.js` (Optimistic like toggle & rollback, comments disclosure, share, delete modal)
- [x] Frontend: `CommentSection.js` (React Hook Form + Zod, delete comment, live count sync)
- [x] Frontend: `PostList.js` & `FeedView.js` connected to backend API
- [x] Run backend tests (`npm test`) -> 100% passing
- [x] Run backend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [x] Run frontend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [x] Run frontend production build (`npm run build`) -> 14 static pages compiled cleanly
- [x] Git commit & update MODEL-HANDOFF.md

## Verification Log
| Check | Result | Notes |
|---|---|---|
| Backend Test Suite | Passed | `npm test` runs foundation & posts test suites with 100% success |
| Backend ESLint | Passed | `npm run lint` passed with 0 errors, 0 warnings |
| Frontend ESLint | Passed | `npm run lint` passed with 0 errors, 0 warnings |
| Frontend Production Build | Passed | `npm run build` compiled cleanly with 14 static routes prerendered |
| 4-Space Indentation & Tabs | Passed | Verified 4-space indentation and 0 tab characters across codebase |
| Git Status | Clean | Working tree clean after milestone commit |

## Git Status
- Git Initialized: Yes (root `yoibi/`)
- Current Branch: `main`
- Latest Commit: `feat: integrate feed and posts`
- Working Tree State: Clean

## Completion State
- Current Phase: Phase 4 — Milestone 2: Feed & Posts Slice Integration COMPLETE
- Completed: Full backend Post + Comment domain (models, repository, services, controllers, Zod validation, routes, and automated test suite), frontend `postsApi` client, React Hook Form post/comment creators, PostCard with optimistic likes and delete confirmation, CommentSection with threaded replies, PostList with empty/loading/error/pagination states, and FeedView integration.
- Next Milestone: Phase 4 — Milestone 3
