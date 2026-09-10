# YOIBI Model Handoff

This file prevents a new AI model from restarting work from zero.

## Rule
At the end of every meaningful session/task, the active model must update this file. A new model must read it before changing code.

## Current Snapshot
- Last updated: 2026-09-11
- Active task: Phase 4 — Milestone 8: Notifications & Activity Feed Integration
- Overall phase: Phase 4 — Milestone 8 FULLY IMPLEMENTED & VERIFIED (Quality Gates 100% Passed)
- Git repository status: Initialized at `yoibi/` root
- Current branch: `main`
- Last completed milestone: **Phase 4 — Milestone 8: Notifications & Activity Feed Integration**
  1. **Notification Identity Model**:
     - `Notification` model (`backend/src/models/notification.model.js`) with Better Auth String IDs (`recipientId: String`, `actorId: String`).
     - Consistent with `Tweet.authorId`, `Video.authorId`, `Stream.authorId`, `MeetUp.ownerId`, and `Message.senderId`.
     - Unique compound index `{ actorId: 1, type: 1, targetId: 1 }` for database-level deduplication.
  2. **Supported Notification Types & Trigger Integration**:
     - Supported types: `like_tweet`, `retweet`, `reply`, `follow`, `like_video` (`new_message` excluded as messaging provides dedicated realtime events and unread state).
     - Triggers integrated as guarded secondary side effects into primary business logic (`tweets.service.js`, `follows.service.js`, `videos.service.js`).
     - Secondary side-effect failure semantics: primary operations succeed independently even if notification persistence or Socket.IO delivery fails.
  3. **Duplicate Prevention & Undo Cleanup**:
     - Notifications created only on genuine state transitions (`inactive -> active`).
     - Undo operations (unlike tweet, undo retweet, unfollow, unlike video) safely delete active notifications (`deleteNotification`).
     - Self-notification suppression: `actorId === recipientId` creates zero notifications.
  4. **Actor & Target Resolution**:
     - Stored `actorId` is dynamically resolved to current public profile info (`id`, `name`, `handle`, `avatarUrl`) at read/emission time.
     - Deleted/missing actor accounts safely fall back to `name: "Unknown user"`, `handle: null`, `avatarUrl: null` without breaking the list.
     - Target existence is resilient: notifications remain persisted even if referenced tweet/video/user is deleted; frontend handles missing targets gracefully.
     - Deterministic route mapping:
       - `like_tweet`, `retweet`, `reply` -> `/tweets/:targetId`
       - `like_video` -> `/videos/:targetId`
       - `follow` -> `/wall/:actor.handle`
  5. **REST API & Pagination**:
     - Endpoints: `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `PATCH /api/v1/notifications/:id/read`, `PATCH /api/v1/notifications/read-all`.
     - Standard page-based pagination (`page`, `limit`, `totalItems`, `totalPages`, `hasNextPage`) and optional `read=true/false` filter.
     - Strict ownership checks (`recipientId === req.user.id`).
  6. **Socket.IO Realtime Gateway**:
     - Reuses existing Socket.IO server and `user:<recipientId>` personal room.
     - Dispatches `notification:new` events safely without failing primary requests.
  7. **Frontend Notifications UI**:
     - Feature folder: `frontend/src/features/notifications/` with `useNotifications` hook, `NotificationBadge`, `NotificationItem`, `NotificationList`.
     - Page route `/notifications` in `frontend/src/app/(protected)/notifications/page.js`.
     - Navigation & dock integration with live unread badge counters.
  8. **Quality Gates Passed**:
     - Backend tests (`npm test`): 100% passing across Foundation, Tweets, Videos, Streams, Meet-Up, Messaging, and Notifications test suites.
     - Backend ESLint (`npm run lint`): 0 errors, 0 warnings.
     - Frontend ESLint (`npm run lint`): 0 errors, 0 warnings.
     - Frontend Next.js production build (`npm run build`): Clean compilation with dynamic routes.
- Exact next milestone: **Phase 5 — Milestone 9: Admin Dashboard & Moderation Tools**.

## What Is Working
- Better Auth server & client integration in Next.js (`frontend/src/lib/auth.js`, `frontend/src/lib/auth-client.js`, `/api/auth/[...all]`).
- JWT acquisition and transport via `authClient.getJwtToken()` and `Authorization: Bearer <token>` header in `apiClient`.
- Centralized API client (`frontend/src/lib/api/client.js`) handling 401, 403, 404, 500, and network failures.
- Profile endpoints (`GET /api/v1/users/:handle`, `PATCH /api/v1/users/me`), Follow endpoints (`POST/DELETE /api/v1/users/:id/follow`), and frontend `WallView`.
- **Tweet & Feed Domain:** Mongoose `Tweet` model, repository, services, controllers, routes, tests, and frontend components.
- **Videos Domain:** Cloudinary upload intent integration, `Video` model, repository, services, controllers, routes, and frontend video player/feed.
- **Streams Domain:** LiveKit SFU broadcast integration, `Stream` model, lifecycle state machine, and frontend live broadcast viewer/host suite.
- **Meet-Up Domain:** LiveKit collaborative multi-peer rooms, atomic capacity reservations, and dynamic grid layouts.
- **Messages & Direct Messaging Domain:** Follow-gated permissions, canonical conversation grouping, message idempotency (`clientMessageId`), page-based pagination, Socket.IO gateway with token auth, personal/conversation rooms, typing indicators, and read receipts.
- **Notifications & Activity Feed Domain:** Real-time social alerts, Better Auth String ID identity, duplicate prevention & undo cleanup, actor resolution, resilience to deleted content, unread counters, and responsive UI feed.
- All backend and frontend linting and production builds pass cleanly with 0 errors.

## What Is Not Working / Remaining Scope
- Phase 5 Milestone 9 (Admin Dashboard & Moderation Tools) is next.

## Tests/Checks Run
- Backend tests (`npm test`): Passed 100% across all 7 test suites
- Backend ESLint (`npm run lint`): 0 errors, 0 warnings
- Frontend ESLint (`npm run lint`): 0 errors, 0 warnings
- Frontend build (`npm run build`): Compiled cleanly
- Indentation check: 4-space indentation across all modified files
- Tab check: Zero tab characters across `frontend/src` and `backend/src`

## Exact Resume Instruction
> Proceed to plan and implement Phase 5 — Milestone 9: Admin Dashboard & Moderation Tools.
