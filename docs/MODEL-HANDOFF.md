# YOIBI Model Handoff

This file prevents a new AI model from restarting work from zero.

## Rule
At the end of every meaningful session/task, the active model must update this file. A new model must read it before changing code.

## Current Snapshot
- Last updated: 2026-09-11
- Active task: Phase 4 — Milestone 6: Meet-Up Rooms / Collaborative Multi-Peer LiveKit Integration
- Overall phase: Phase 4 — Milestone 6 ARCHITECTURE & CONTRACTS FINALIZED (Ready for Implementation)
- Git repository status: Initialized at `yoibi/` root
- Current branch: `main`
- Last completed step: Finalized and synchronized Meet-Up architecture specifications, `contracts/API-CONTRACT.md` (Section 10), and `contracts/openapi.yaml` (`/meetup/rooms` paths) incorporating all architectural requirements and refinements:
  1. Unified owner identity architecture: `ownerId: String` strictly derived from verified Better Auth `req.user.id`, matching `Tweet.authorId`, `Video.authorId`, and `Stream.authorId`. Client-supplied owner IDs are never trusted, and profile data is resolved from the application user repository.
  2. Atomic join reservation mechanism (20s TTL) preventing race conditions during concurrent joins, enforcing `maxParticipants` (2–50) with `403 ROOM_FULL` rejection.
  3. Minimized LiveKit participant metadata (`{ name, handle, avatarUrl }` omitting internal MongoDB `_id`) as a display snapshot and strictly opaque non-PII identity (`participant_<uuid>`).
  4. Standardized error semantics across API & OpenAPI (`403 ROOM_ENDED`, `403 ROOM_FULL`, `403 ROOM_ACTIVE`, `404 NOT_FOUND`, `401 UNAUTHORIZED`, `403 FORBIDDEN`).
  5. Abandoned room lifecycle & cleanup policy (room remains active while peers participate; empty-room auto-expiry documented).
  6. Single active primary screen share concurrency policy.
  7. Distinct END vs DELETE semantics: END (`POST /api/v1/meetup/rooms/:id/end`) terminates LiveKit SFU session and marks `ended` while preserving history; DELETE (`DELETE /api/v1/meetup/rooms/:id`) permanently deletes MongoDB record ONLY when `ended`, rejecting active deletion with `403 ROOM_ACTIVE`.
  8. Optional `topic` field without scope creep.
  9. Consistent naming (`features/meet-up/`, `/api/v1/meetup/rooms`, `Meet-Up`, collection `meetup_rooms`).
  10. Authenticated users only guest policy.
  11. Interactive non-admin LiveKit token permissions (`roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true, roomAdmin: false`).
  12. Express-level owner authorization for END and DELETE.
  13. Normal participant permissions (join active, publish mic/cam/screen, subscribe, leave).
  14. Strict domain separation (Tweet != Video != Stream != Meet-Up).
  15. Expanded comprehensive testing plan covering owner derivation from auth, concurrency races, atomic reservations, minimized metadata, lifecycle, auth, and quality gates.
- Exact next milestone: Implement Phase 4 — Milestone 6 (Meet-Up Rooms) backend & frontend code and pass all verification gates.

## What Is Working
- Better Auth server & client integration in Next.js (`frontend/src/lib/auth.js`, `frontend/src/lib/auth-client.js`, `/api/auth/[...all]`).
- JWT acquisition and transport via `authClient.getJwtToken()` and `Authorization: Bearer <token>` header in `apiClient`.
- Centralized API client (`frontend/src/lib/api/client.js`) handling 401, 403, 404, 500, and network failures.
- Session hydration (`AuthContext.js`) distinguishing `loading`, `authenticated`, and `unauthenticated` states.
- Protected layout (`frontend/src/app/(protected)/layout.js`) guarding pages and redirecting unauthenticated users safely to `/login?redirect=<encoded-path>`.
- Auth UI forms (`LoginForm`, `SignupForm`, `VerifyEmailView`, `ForgotPasswordForm`, `ResetPasswordForm`) connected to Better Auth flows.
- Source of truth for `/api/v1/auth/me`: Better Auth JWT (identity: id, email, role, isEmailVerified, isBlocked) merged with live MongoDB `User` collection (profile: name, handle, avatarUrl, bio).
- Profile endpoints (`GET /api/v1/users/:handle`, `PATCH /api/v1/users/me`) and frontend `WallView` + `EditProfileModal`.
- **Tweet & Feed Backend & Frontend (Unified Domain):**
  - Mongoose schema `Tweet`, repository layer, Zod validators, CRUD services/controllers, routes, in-process tests.
  - `CreateTweetCard`, `TweetCard`, `TweetReplySection`, `TweetList`, `FeedView`, `TweetsView`.
- **Videos Backend & Frontend (Shorts & Longform):**
  - Cloudinary upload intent integration with SHA-1 signatures, Video Mongoose schema, repository, Zod validators, CRUD services/controllers, routes, in-process tests.
  - `videosApi.js`, `UploadVideoModal`, `VideoCard`, `VideoPlayerModal`, `VideoList`, `VideosView`.
- **Streams Backend & Frontend (LiveKit Realtime Broadcasts):**
  - LiveKit server SDK integration (`backend/src/integrations/livekit/livekit.js`), Stream Mongoose schema (`backend/src/models/stream.model.js`), repository, Zod validators, CRUD services/controllers, routes (`/api/v1/streams`), and in-process tests (`backend/tests/streams.test.js`).
  - Frontend Streams feature (`frontend/src/features/streams/`): `streamsApi.js`, `StreamCard.js`, `StreamList.js`, `CreateStreamModal.js`, `HostControls.js`, `ViewerControls.js`, `StreamTrackView.js`, `StreamRoom.js`, `StreamDetailView.js`, `StreamsView.js`, `/streams/page.js`, `/streams/[id]/page.js`.
- Backend test suite (`npm test`) passing 100% across all 4 test suites (Foundation + Tweets + Videos + Streams).
- Backend ESLint (`npm run lint`) passing with 0 errors, 0 warnings.
- Frontend ESLint (`npm run lint`) passing with 0 errors, 0 warnings.
- Frontend Next.js production build (`npm run build`) passing with dynamic `/streams/[id]` route.

## What Is Not Working / Remaining Scope
- Meet-Up implementation (backend routes/model/service/repo + frontend UI/components) is planned and ready to build next.
- Messages (Socket.IO direct messaging) is next for Phase 4 Milestone 7.

## Tests/Checks Run
- Backend tests (`npm test`): Passed 100%
- Backend ESLint (`npm run lint`): 0 errors, 0 warnings
- Frontend ESLint (`npm run lint`): 0 errors, 0 warnings
- Frontend build (`npm run build`): Compiled cleanly
- Indentation check: 4-space indentation across all modified files
- Tab check: Zero tab characters across `frontend/src` and `backend/src`

## Exact Resume Instruction
> Proceed to implement Phase 4 — Milestone 6 (Meet-Up Rooms / Collaborative Multi-Peer LiveKit Integration) following the approved architecture and test gates.
