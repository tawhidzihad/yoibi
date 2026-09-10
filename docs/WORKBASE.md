# YOIBI Workbase

This file is a live task scratchpad. The active AI must update it before and during work.

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**

## Current Task
- Task ID: TASK-007
- Title: Phase 4 — Milestone 6: Meet-Up Rooms / Collaborative Multi-Peer LiveKit Integration
- Status: READY FOR IMPLEMENTATION (PLANNING & CONTRACTS FINALIZED)
- Goal: Implement collaborative multi-peer interactive rooms supporting audio, video, and screen sharing with server-authoritative capacity enforcement (2–50 participants) utilizing atomic short-lived join reservations (20s TTL) to prevent race conditions (`403 ROOM_FULL`), opaque zero-PII participant identity mapping (`participant_<uuid>`), minimized LiveKit metadata (`{ name, handle, avatarUrl }` without raw Mongo user ID), standardized error codes (`403 ROOM_ENDED`, `403 ROOM_FULL`, `403 ROOM_ACTIVE`, `404 NOT_FOUND`), single active primary screen share policy, non-admin interactive token issuance, distinct END vs DELETE semantics, and full quality verification.
- Scope:
  - Contract:
    - `contracts/API-CONTRACT.md`: Section 10 Meet-Up Rooms synchronized with server-side atomic capacity reservation checks (`403 ROOM_FULL`), minimized zero-PII metadata, standardized `403 ROOM_ENDED` codes, END vs DELETE lifecycle rules, single primary screen share rule, and token permissions.
    - `contracts/openapi.yaml`: `/meetup/rooms` endpoints (`GET /meetup/rooms`, `POST /meetup/rooms`, `GET /meetup/rooms/{roomId}`, `POST /meetup/rooms/{roomId}/join`, `POST /meetup/rooms/{roomId}/end`, `DELETE /meetup/rooms/{roomId}`), schemas, error responses (`403 ROOM_FULL`, `403 ROOM_ACTIVE`, `403 ROOM_ENDED`, `404 NOT_FOUND`), and parameters synchronized.
  - Backend:
    - Integration: `backend/src/integrations/livekit/livekit.js` (`generateMeetupParticipantToken` with opaque `participant_<uuid>`, minimized public presentation metadata `{ name, handle, avatarUrl }` omitting internal MongoDB `_id`, non-admin least-privilege grants `roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true, roomAdmin: false`, `getActiveParticipantCount`, and `terminateLiveKitRoom`).
    - Model: `backend/src/models/meetup.model.js` (Schema with `_id`, `ownerId: { type: String, required: true, index: true }` matching verified Better Auth user ID from `req.user.id`, `name`, `topic`, `roomName`, `maxParticipants` [2–50, default 12], `status` [`active` | `ended`], `startedAt`, `endedAt`, compound indexes). Collection name: `meetup_rooms`.
    - Repository: `backend/src/repositories/meetup.repository.js` (CRUD queries, status filters, owner enrichment via application user repository by Better Auth user ID, capacity queries, disconnected DB fallback).
    - Concurrency/Reservation: In-memory atomic join reservation manager with 20s TTL preventing race conditions during concurrent joins.
    - Validation: `backend/src/validators/meetup.validator.js` (Zod schemas for `createMeetupRoom`, `listMeetupRoomsQuery`, `meetupRoomIdParam`).
    - Services: `backend/src/services/meetup/` (create room with owner token, list rooms, get room by ID, join room with atomic reservation and `403 ROOM_FULL` rejection, `403 ROOM_ENDED` check, end room with SFU session termination, delete room with `403 ROOM_ACTIVE` guard).
    - Controllers: `backend/src/controllers/meetup/` (CRUD & lifecycle endpoints).
    - Routes: `backend/src/routes/meetup.routes.js` mounted at `/api/v1/meetup/rooms` in `backend/src/routes/index.js`.
    - Tests: `backend/tests/meetup.test.js` integrated into `backend/tests/index.js` covering concurrency, atomic reservations, capacity limits, zero-PII/minimized metadata, lifecycle transitions, and permissions.
  - Frontend:
    - Package integration: `@livekit/components-react`, `livekit-client`.
    - Feature path: `frontend/src/features/meet-up/`.
    - Client: `frontend/src/features/meet-up/api/meetupApi.js` wrapping `apiClient` for `/api/v1/meetup/rooms`.
    - UI:
      - `MeetupCard.js` (Active/ended badges, topic, owner metadata, live participant count / maxParticipants gauge).
      - `MeetupList.js` (Grid, skeleton loading states, empty/error retry states, pagination).
      - `CreateMeetupModal.js` (React Hook Form + Zod, name, optional topic, maxParticipants slider/input 2–50).
      - `MeetupControls.js` (LiveKit track toggles for mic, camera, screen share, Leave Room, End Room for owner).
      - `MeetupTrackView.js` (Dynamic multi-peer grid, dominant 1-active primary screen share viewport + participant video/audio grid).
      - `MeetupRoom.js` (LiveKitRoom wrapper, RoomAudioRenderer, StartAudio, disconnect/cleanup listeners).
      - `MeetupDetailView.js` (Live room coordinator, participant roster, screen share management).
      - `MeetupView.js` (Connected to live API, status tabs, create room modal trigger).
    - Routes:
      - `frontend/src/app/(protected)/meetup/page.js`
      - `frontend/src/app/(protected)/meetup/[id]/page.js`
  - Verification Gates:
    - Backend test suite (`npm test`) -> 100% passing across Foundation, Tweets, Videos, Streams, and Meet-Up suites.
    - Backend ESLint (`npm run lint`) -> 0 errors, 0 warnings.
    - Frontend ESLint (`npm run lint`) -> 0 errors, 0 warnings.
    - Frontend Next.js production build (`npm run build`) -> Clean build with dynamic `/meetup/[id]` route.
    - 4-space indentation and zero tabs across all modified files.

## Required References
- [x] AI-AGENT.md
- [x] PROJECT-STRUCTURE.md
- [x] CODE-STANDARDS.md
- [x] MANDATORY-RULES.md
- [x] Relevant skill files (.agents/skills/*)
- [x] API-CONTRACT.md and openapi.yaml
- [x] Legacy reference (legacy/original-yoibi/)

## Implementation Checklist
- [x] Synchronize API contracts (`API-CONTRACT.md`, `openapi.yaml`)
- [ ] Backend: Update LiveKit integration for meetup tokens & participant counting (`livekit.js`)
- [ ] Backend: Meet-Up model schema & compound indexes (`meetup.model.js`, collection: `meetup_rooms`)
- [ ] Backend: Meet-Up repository layer (`meetup.repository.js`)
- [ ] Backend: Meet-Up Zod validators (`meetup.validator.js`)
- [ ] Backend: Meet-Up services with server capacity validation, END vs DELETE guards
- [ ] Backend: Meet-Up controllers
- [ ] Backend: Meet-Up routes mounted at `/api/v1/meetup/rooms` (`meetup.routes.js`, `index.js`)
- [ ] Backend: Automated test suite for capacity, zero-PII, lifecycle, END vs DELETE, screen-sharing (`meetup.test.js`)
- [ ] Frontend: `meetupApi.js` API client integration
- [ ] Frontend: `MeetupCard.js` (Active/ended badges, topic, owner, participant count)
- [ ] Frontend: `MeetupList.js` (Grid, skeletons, empty/error states)
- [ ] Frontend: `CreateMeetupModal.js` (React Hook Form + Zod, name, optional topic, maxParticipants)
- [ ] Frontend: `MeetupControls.js` (LiveKit TrackToggle mic/cam/screen, Leave, End Room)
- [ ] Frontend: `MeetupTrackView.js` (Dynamic multi-peer grid, 1 primary screen share layout)
- [ ] Frontend: `MeetupRoom.js` (LiveKitRoom, RoomAudioRenderer, StartAudio, disconnect listener)
- [ ] Frontend: `MeetupDetailView.js` (Room coordinator & stage)
- [ ] Frontend: `MeetupView.js` (Live API integration, status tabs, create modal)
- [ ] Frontend: Route pages (`/meetup/page.js`, `/meetup/[id]/page.js`)
- [ ] Run backend tests (`npm test`) -> 100% passing
- [ ] Run backend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [ ] Run frontend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [ ] Run frontend production build (`npm run build`) -> Clean compile
- [ ] Update documentation (`README.md`, `WORKBASE.md`, `MODEL-HANDOFF.md`)

## Next Task
- Task ID: TASK-008
- Title: Phase 4 — Milestone 7: Messages & Socket.IO Direct Messaging Integration
- Status: PENDING
- Goal: Implement real-time 1-on-1 direct messaging, conversation threads, typing indicators, and message history.
