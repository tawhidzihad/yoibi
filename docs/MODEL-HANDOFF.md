# YOIBI Model Handoff

This file prevents a new AI model from restarting work from zero.

## Rule
At the end of every meaningful session/task, the active model must update this file. A new model must read it before changing code.

## Current Snapshot
- Last updated: 2026-09-11
- Active task: Phase 4 — Milestone 7: Messages & Socket.IO Direct Messaging Integration
- Overall phase: Phase 4 — Milestone 7 FULLY IMPLEMENTED & VERIFIED (Quality Gates 100% Passed)
- Git repository status: Initialized at `yoibi/` root
- Current branch: `main`
- Last completed milestone: **Phase 4 — Milestone 7: Messages & Socket.IO Direct Messaging Integration**
  1. **Follow Prerequisite System**:
     - `Follow` model (`backend/src/models/follow.model.js`) with unique compound index `{ followerId: 1, followingId: 1 }`.
     - `User` model updated with denormalized counters `followersCount` and `followingCount`.
     - `FollowsRepository` (`backend/src/repositories/follows.repository.js`) with idempotent creation, deletion, `isFollowing` checks, and count queries.
     - Services & Controllers: `followUser` (self-follow rejection, idempotent counter increments), `unfollowUser` (non-negative decrements).
     - Endpoints: `POST /api/v1/users/:id/follow` and `DELETE /api/v1/users/:id/follow`.
  2. **Direct Messaging Permission (Server-Authoritative Follow Rule)**:
     - Canonical rule: `A follows B -> A may message B`.
     - Backend enforces this relationship check on EVERY message send (both REST and Socket.IO).
     - Unfollowing preserves conversation history while blocking new messages (`403 DM_FOLLOW_REQUIRED`). Messaging resumes once A follows B again.
  3. **One-to-One Canonical Conversations & Message Persistence**:
     - `Conversation` model with canonical sorted participant IDs (`[min(A,B), max(A,B)]`) preventing duplicate conversation records.
     - `Message` model (`backend/src/models/message.model.js`) with unique compound index `{ senderId: 1, clientMessageId: 1 }` for idempotency.
     - Never stores unbounded message history inside Conversation document; separate `messages` collection.
  4. **Message Idempotency**:
     - Every message requires `clientMessageId` (RFC4122 UUID).
     - Retry with identical `{ senderId, clientMessageId }` returns previously persisted message without duplicate DB insert.
  5. **Standard Page-Based Pagination**:
     - Standardized on `page`, `limit`, `totalItems`, `totalPages`, `hasNextPage` across all list/history endpoints.
  6. **Socket.IO Realtime Gateway**:
     - Attached directly to existing HTTP listener in `backend/src/server.js` with `transports: ["polling", "websocket"]`.
     - Token authentication via `verifyJwtToken` / `jose` Better Auth JWKS. Rejects unauthenticated or blocked accounts (`isBlocked === true`).
     - Rooms: personal `user:<userId>` and conversation `conv:<conversationId>`.
     - Ephemeral typing indicators (`typing:start`, `typing:stop`, `typing:update`) with membership validation.
     - Realtime read state updates (`conversation:read`, `conversation:read_update`).
     - Reconnect recovery: client fetches REST history on reconnect and deduplicates via `clientMessageId` / `id`.
  7. **Frontend Direct Messaging UI**:
     - Full replacement in `frontend/src/features/messaging/`: `MessagingView`, `ConversationList`, `ConversationCard`, `MessageThread`, `MessageBubble`, `MessageComposer` (React Hook Form + Zod, debounced typing), `TypingIndicator`, `MessageStatus`, and `useMessagingSocket`.
     - Page route `/messages` in `frontend/src/app/(protected)/messages/page.js`.
  8. **Quality Gates Passed**:
     - Backend tests (`npm test`): 100% passing across Foundation, Tweets, Videos, Streams, Meet-Up, and Messaging test suites.
     - Backend ESLint (`npm run lint`): 0 errors, 0 warnings.
     - Frontend ESLint (`npm run lint`): 0 errors, 0 warnings.
     - Frontend Next.js production build (`npm run build`): Clean compilation with dynamic routes.
- Exact next milestone: **Phase 4 — Milestone 8: Notifications & Activity Feed Integration**.

## What Is Working
- Better Auth server & client integration in Next.js (`frontend/src/lib/auth.js`, `frontend/src/lib/auth-client.js`, `/api/auth/[...all]`).
- JWT acquisition and transport via `authClient.getJwtToken()` and `Authorization: Bearer <token>` header in `apiClient`.
- Centralized API client (`frontend/src/lib/api/client.js`) handling 401, 403, 404, 500, and network failures.
- Profile endpoints (`GET /api/v1/users/:handle`, `PATCH /api/v1/users/me`), Follow endpoints (`POST/DELETE /api/v1/users/:id/follow`), and frontend `WallView`.
- **Tweet & Feed Domain:** Mongoose `Tweet` model, repository, services, controllers, routes, tests, and frontend components.
- **Videos Domain:** Cloudinary upload intent integration, `Video` model, repository, services, controllers, routes, and frontend video player/feed.
- **Streams Domain:** LiveKit SFU broadcast integration, `Stream` model, lifecycle state machine, and frontend live broadcast viewer/host suite.
- **Meet-Up Domain:** LiveKit collaborative multi-peer rooms, atomic capacity reservations, and dynamic grid layouts.
- **Messages & Direct Messaging Domain:**
  - Follow-gated permissions, canonical conversation grouping, message idempotency (`clientMessageId`), page-based pagination.
  - Socket.IO gateway with token auth, personal rooms, conversation rooms, typing indicators, read receipts, and reconnect recovery.
  - Complete modern responsive frontend UI (`frontend/src/features/messaging/`).
- All backend and frontend linting and production builds pass cleanly with 0 errors.

## What Is Not Working / Remaining Scope
- Phase 4 Milestone 8 (Notifications) is next.

## Tests/Checks Run
- Backend tests (`npm test`): Passed 100% across all 6 test suites
- Backend ESLint (`npm run lint`): 0 errors, 0 warnings
- Frontend ESLint (`npm run lint`): 0 errors, 0 warnings
- Frontend build (`npm run build`): Compiled cleanly
- Indentation check: 4-space indentation across all modified files
- Tab check: Zero tab characters across `frontend/src` and `backend/src`

## Exact Resume Instruction
> Proceed to plan and implement Phase 4 — Milestone 8 (Notifications & Activity Feed Integration).
