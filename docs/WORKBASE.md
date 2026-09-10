# YOIBI Workbase

This file is a live task scratchpad. The active AI must update it before and during work.

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Direct Messaging follows the server-authoritative rule: User A can direct message User B only if A follows B (`followsRepository.isFollowing(senderId, recipientId) === true`).**

## Current Task
- Task ID: TASK-008
- Title: Phase 4 — Milestone 7: Messages & Socket.IO Direct Messaging Integration
- Status: COMPLETED & VERIFIED (100% QUALITY GATES PASSED)
- Goal: Implement real-time 1-on-1 direct messaging, conversation threads, typing indicators, read receipts, follow-gated permission enforcement (`A follows B -> A can message B`), message idempotency with `{ senderId, clientMessageId }`, standard page-based pagination, Socket.IO gateway with token auth and personal/conversation rooms, reconnect recovery via REST history reconciliation, and complete frontend UI replacement.
- Scope Accomplished:
  - Contract:
    - `contracts/API-CONTRACT.md`: Section 8 updated with complete endpoint specs (`GET /messages/conversations`, `GET /messages/conversations/:id`, `POST /messages`, `PATCH /messages/conversations/:id/read`), follow endpoints (`POST/DELETE /users/:id/follow`), and Socket.IO events (`conversation:join`, `conversation:leave`, `message:send`, `typing:start`, `typing:stop`, `conversation:read`, `message:ack`, `message:new`, `message:error`, `typing:update`, `conversation:read_update`).
    - `contracts/openapi.yaml`: Synchronized with `/messages` and `/messages/conversations` paths, request bodies, query params, and schemas (`MessageResponse`, `ConversationListResponse`, `ConversationHistoryResponse`, `MarkReadResponse`).
  - Follow Prerequisite:
    - Model: `backend/src/models/follow.model.js` (compound unique index `{ followerId: 1, followingId: 1 }`).
    - User Model: `backend/src/models/user.model.js` (denormalized `followersCount`, `followingCount`).
    - Repository: `backend/src/repositories/follows.repository.js` (idempotent create, delete, isFollowing, count helpers).
    - Services: `backend/src/services/create/follows.service.js`, `backend/src/services/delete/follows.service.js` (self-follow rejection, non-negative counter increments/decrements).
    - Controllers: `backend/src/controllers/create/follows.controller.js`, `backend/src/controllers/delete/follows.controller.js`.
    - Routes: `POST /api/v1/users/:id/follow`, `DELETE /api/v1/users/:id/follow` in `backend/src/routes/users.routes.js`.
  - Messaging Backend:
    - Models: `backend/src/models/conversation.model.js` (canonical participant ordering), `backend/src/models/message.model.js` (idempotency compound unique index `{ senderId: 1, clientMessageId: 1 }`, query indexes).
    - Repository: `backend/src/repositories/messages.repository.js` (findOrCreateConversation, listConversationsForUser, getMessagesByConversationId, findMessageByIdempotency, markConversationMessagesAsRead).
    - Service: `backend/src/services/messages.service.js` (follow validation check on every send, idempotency handling returning 200 on retry without duplicate DB record, self-messaging rejection, standard page-based pagination envelopes).
    - Validators: `backend/src/validators/messages.validator.js` (Zod schemas for body, query, params).
    - Controllers: `backend/src/controllers/messages.controller.js`.
    - Routes: `backend/src/routes/messages.routes.js` mounted at `/api/v1` in `backend/src/routes/index.js`.
  - Socket.IO Gateway:
    - Gateway: `backend/src/sockets/messaging.socket.js` attached to single HTTP server in `backend/src/server.js`.
    - Transports: `["polling", "websocket"]`.
    - Auth Middleware: token verification via `jose`/Better Auth JWKS; rejects unauthenticated / blocked accounts.
    - Rooms: personal `user:<userId>`, conversation `conv:<conversationId>`.
    - Events: `message:send` -> persist to DB -> `message:ack` to sender + `message:new` to recipient and multi-tabs; `typing:start`/`stop` -> `typing:update`; `conversation:read` -> `conversation:read_update`.
  - Frontend Messaging:
    - API client: `frontend/src/lib/api/messages.js`, `frontend/src/lib/api/follows.js`.
    - Hook: `frontend/src/features/messaging/hooks/useMessagingSocket.js` (connection, room handling, auto-reconnect, and history recovery).
    - Components: `frontend/src/features/messaging/ui/` (`MessagingView.js`, `ConversationList.js`, `ConversationCard.js`, `MessageThread.js`, `MessageBubble.js`, `MessageComposer.js` with RHF+Zod and debounced typing, `TypingIndicator.js`, `MessageStatus.js`).
    - Page: `frontend/src/app/(protected)/messages/page.js`.
  - Quality Gates Passed:
    - `backend`: `npm test` -> 100% passing across Foundation, Tweets, Videos, Streams, Meet-Up, and Messaging test suites.
    - `backend`: `npm run lint` -> 0 errors, 0 warnings.
    - `frontend`: `npm run lint` -> 0 errors, 0 warnings.
    - `frontend`: `npm run build` -> Clean compile, all routes static/dynamic optimized.

## Implementation Checklist
- [x] Synchronize API contracts (`API-CONTRACT.md`, `openapi.yaml`)
- [x] Backend: Follow model, repository, services, controllers, routes (`follow.model.js`, `follows.repository.js`, `follows.service.js`)
- [x] Backend: User model counter synchronization (`followersCount`, `followingCount`)
- [x] Backend: Conversation & Message models (`conversation.model.js`, `message.model.js`)
- [x] Backend: Messages repository & service with follow check and idempotency (`messages.repository.js`, `messages.service.js`)
- [x] Backend: Messages validators, controllers, routes (`messages.validator.js`, `messages.controller.js`, `messages.routes.js`)
- [x] Backend: Socket.IO gateway with JWT auth, rooms, persistence before broadcast (`messaging.socket.js`, `server.js`)
- [x] Backend: Messaging automated test suite (`messaging.test.js`, `index.js`)
- [x] Frontend: Messages API client (`messages.js`, `follows.js`)
- [x] Frontend: `useMessagingSocket.js` hook with reconnect recovery
- [x] Frontend: Messaging UI components (`MessagingView`, `ConversationList`, `ConversationCard`, `MessageThread`, `MessageBubble`, `MessageComposer`, `TypingIndicator`, `MessageStatus`)
- [x] Run backend tests (`npm test`) -> 100% passing
- [x] Run backend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [x] Run frontend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [x] Run frontend production build (`npm run build`) -> Clean compile
- [x] Update documentation (`README.md`, `WORKBASE.md`, `MODEL-HANDOFF.md`)

## Next Task
- Task ID: TASK-009
- Title: Phase 4 — Milestone 8: Notifications & Activity Feed Integration
- Status: PENDING
- Goal: Implement realtime notifications for social interactions (likes, replies, follows, mentions, and message alerts).
