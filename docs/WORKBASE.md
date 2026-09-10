# YOIBI Workbase

This file is a live task scratchpad. The active AI must update it before and during work.

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Direct Messaging follows the server-authoritative rule: User A can direct message User B only if A follows B (`followsRepository.isFollowing(senderId, recipientId) === true`).**

## Current Task
- Task ID: TASK-009
- Title: Phase 4 — Milestone 8: Notifications & Activity Feed Integration
- Status: COMPLETED & VERIFIED (100% QUALITY GATES PASSED)
- Goal: Implement real-time notifications for social interactions (like tweet, retweet, reply, follow, like video), Better Auth verified String user IDs identity model, secondary side-effect failure semantics (primary actions succeed independently), state-transition duplicate prevention with undo cleanup, actor profile resolution at read time with graceful missing-user fallback, deleted-target resilience, standard page-based pagination, Socket.IO realtime `notification:new` delivery, and modern responsive frontend notifications UI.
- Scope Accomplished:
  - Contract:
    - `contracts/API-CONTRACT.md`: Section 13 added with comprehensive specifications for `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, and Socket.IO `notification:new` event on `user:<recipientId>` personal room.
    - `contracts/openapi.yaml`: Synchronized with all notification endpoints, parameters, and response schemas (`NotificationActor`, `NotificationItem`, `NotificationListResponse`, `NotificationUnreadCountResponse`, `NotificationReadResponse`, `NotificationReadAllResponse`).
  - Notifications Backend:
    - Model: `backend/src/models/notification.model.js` with Better Auth String IDs (`recipientId: String`, `actorId: String`), enum types (`like_tweet`, `retweet`, `reply`, `follow`, `like_video`), target types (`tweet`, `video`, `user`), compound unique index `{ actorId: 1, type: 1, targetId: 1 }` for deduplication, and query indexes.
    - Repository: `backend/src/repositories/notifications.repository.js` (create, findById, findPaginated, countUnread, markAsRead, markAllAsRead, deleteNotification for undo cleanup, and attachActors for dynamic public profile resolution).
    - Service: `backend/src/services/notifications.service.js` with guarded secondary side-effect creation/deletion, self-notification suppression (`actorId === recipientId`), and ownership-enforced mark-as-read methods.
    - Sockets: `backend/src/sockets/notifications.socket.js` attached to shared Socket.IO instance; emits `notification:new` to `user:<recipientId>`.
    - Triggers & Undo Cleanup: Integrated into Tweet likes/unlikes, Tweet retweets/undo retweets, Tweet replies, User follows/unfollows, and Video likes/unlikes.
    - Validators: `backend/src/validators/notifications.validator.js` (Zod schemas for query pagination/filtering and params).
    - Controllers: `backend/src/controllers/notifications.controller.js`.
    - Routes: `backend/src/routes/notifications.routes.js` mounted under `/api/v1` in `backend/src/routes/index.js`.
    - Automated Tests: `backend/tests/notifications.test.js` covering all 39 test scenarios across 9 categories (primary action independence, duplicate prevention, self-notification suppression, actor resolution, target handling, REST security & operations, Socket.IO delivery).
  - Frontend Notifications:
    - API Client: `frontend/src/lib/api/notifications.js` (`getNotifications`, `getUnreadCount`, `markNotificationRead`, `markAllNotificationsRead`).
    - Hook: `frontend/src/features/notifications/hooks/useNotifications.js` with unread count management, real-time Socket.IO `notification:new` listener, pagination, and optimistic mark-read updates.
    - UI Components: `frontend/src/features/notifications/ui/` (`NotificationBadge.js`, `NotificationItem.js`, `NotificationList.js`).
    - Protected Page: `frontend/src/app/(protected)/notifications/page.js`.
    - Protected Layout Integration: Desktop LeftNav, mobile header, and mobile bottom dock updated with notifications links and real-time unread count badges.
  - Quality Gates Passed:
    - `backend`: `npm test` -> 100% passing across Foundation, Tweets, Videos, Streams, Meet-Up, Messaging, and Notifications test suites.
    - `backend`: `npm run lint` -> 0 errors, 0 warnings.
    - `frontend`: `npm run lint` -> 0 errors, 0 warnings.
    - `frontend`: `npm run build` -> Clean compile, all routes static/dynamic optimized.

## Implementation Checklist
- [x] Synchronize API contracts (`API-CONTRACT.md`, `openapi.yaml`)
- [x] Backend: Notification model (`notification.model.js`) with Better Auth String IDs
- [x] Backend: Notifications repository (`notifications.repository.js`) with actor enrichment and undo deletion
- [x] Backend: Notifications service (`notifications.service.js`) with guarded side effects and self-notification check
- [x] Backend: Socket.IO notification handler (`notifications.socket.js`, `server.js`)
- [x] Backend: Triggers and undo cleanup integrated into Tweet likes, retweets, replies, User follows, and Video likes
- [x] Backend: Notifications validators, controllers, and routes (`notifications.validator.js`, `notifications.controller.js`, `notifications.routes.js`)
- [x] Backend: Notifications test suite (`notifications.test.js`, `index.js`) -> 100% passing
- [x] Frontend: Notifications API client (`notifications.js`)
- [x] Frontend: `useNotifications.js` hook with real-time Socket.IO listener
- [x] Frontend: Notifications UI components (`NotificationBadge`, `NotificationItem`, `NotificationList`)
- [x] Frontend: Notifications page (`notifications/page.js`) and ProtectedLayout nav/dock integration
- [x] Run backend tests (`npm test`) -> 100% passing
- [x] Run backend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [x] Run frontend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [x] Run frontend production build (`npm run build`) -> Clean compile
- [x] Update documentation (`README.md`, `WORKBASE.md`, `MODEL-HANDOFF.md`)

## Next Task
- Task ID: TASK-010
- Title: Phase 5 — Milestone 9: Admin Dashboard & Moderation Tools
- Status: PENDING
- Goal: Implement admin moderation dashboard, content and user reporting workflows, audit logs, and account moderation.

