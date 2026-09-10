# YOIBI Workbase

This file is a live task scratchpad. The active AI must update it before and during work.

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**

## Current Task
- Task ID: TASK-006
- Title: Phase 4 — Milestone 5: Streams / LiveKit Integration
- Status: COMPLETED ✓
- Goal: Implement the YOIBI live broadcast system with LiveKit token issuance, server-authoritative stream lifecycle (ready -> live -> ended), opaque non-PII room naming (`stream_<uuid>`), host/viewer least-privilege token grants, official LiveKit React components, and LiveKit room session termination upon broadcast conclusion.
- Scope:
  - Contract:
    - `contracts/API-CONTRACT.md`: Section 9 Streams synchronized with opaque room naming, join lifecycle rules, least-privilege grants, and session termination semantics.
    - `contracts/openapi.yaml`: `/streams` endpoints (`GET /streams`, `POST /streams`, `GET /streams/{id}`, `POST /streams/{id}/start`, `POST /streams/{id}/join`, `POST /streams/{id}/end`, `DELETE /streams/{id}`), schemas, and parameters synchronized.
  - Backend:
    - Integration: `backend/src/integrations/livekit/livekit.js` (Opaque host/viewer token generation with `crypto.randomUUID()`, LiveKit room deletion via `RoomServiceClient.deleteRoom`, mock-safe fallback).
    - Model: `backend/src/models/stream.model.js` (Schema with `_id`, `authorId`, `title`, `description`, `category`, `thumbnailUrl`, `roomName`, `status`, `viewerCount`, `startedAt`, `endedAt`, compound indexes).
    - Repository: `backend/src/repositories/streams.repository.js` (CRUD queries, status filters, category filters, author enrichment, disconnected DB fallback).
    - Validation: `backend/src/validators/streams.validator.js` (Zod schemas for `createStream`, `listStreamsQuery`, `streamIdParam`).
    - Services: `create/streams.service.js`, `read/streams.service.js`, `update/streams.service.js`, `delete/streams.service.js`.
    - Controllers: `create/streams.controller.js`, `read/streams.controller.js`, `update/streams.controller.js`, `delete/streams.controller.js`.
    - Routes: `backend/src/routes/streams.routes.js` mounted in `backend/src/routes/index.js`.
    - Tests: `backend/tests/streams.test.js` integrated into `backend/tests/index.js`.
  - Frontend:
    - Packages: `@livekit/components-react`, `livekit-client`.
    - Client: `frontend/src/features/streams/api/streamsApi.js` wrapping `apiClient` for `/api/v1/streams`.
    - UI:
      - `StreamCard.js` (Live/preparing/ended badges, thumbnail/placeholder, author metadata, viewer counter).
      - `StreamList.js` (Responsive grid, loading skeletons, empty state, error retry, pagination).
      - `CreateStreamModal.js` (React Hook Form + Zod, category selector, preparation instructions).
      - `HostControls.js` (LiveKit `TrackToggle` for mic/camera/screen, Go Live trigger, End Stream confirmation).
      - `ViewerControls.js` (Fullscreen toggle, live indicator, viewer count, leave action).
      - `StreamTrackView.js` (LiveKit `useTracks`, `VideoTrack`, screen share with camera PiP, audio-only waveform mode).
      - `StreamRoom.js` (LiveKitRoom wrapper, `RoomAudioRenderer`, `StartAudio`, disconnect handler).
      - `StreamDetailView.js` (Single stream studio & viewer playback coordinator).
      - `StreamsView.js` (Live API integration, status tabs, category pills toolbar, create modal trigger).
    - Routes:
      - `frontend/src/app/(protected)/streams/page.js`
      - `frontend/src/app/(protected)/streams/[id]/page.js`
  - Verification Gates:
    - Backend test suite (`npm test`) -> 100% passing across Foundation, Tweets, Videos, Streams suites ✓
    - Backend ESLint (`npm run lint`) -> 0 errors, 0 warnings ✓
    - Frontend ESLint (`npm run lint`) -> 0 errors, 0 warnings ✓
    - Frontend Next.js production build (`npm run build`) -> Clean build with dynamic `/streams/[id]` route ✓
    - 4-space indentation and zero tabs ✓

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
- [x] Backend: Install `livekit-server-sdk`
- [x] Backend: LiveKit integration (`livekit.js`, `env.js`)
- [x] Backend: Stream model schema & compound indexes (`stream.model.js`)
- [x] Backend: Streams repository layer (`streams.repository.js`)
- [x] Backend: Streams Zod validators (`streams.validator.js`)
- [x] Backend: Streams CRUD services (create, read, update, delete)
- [x] Backend: Streams CRUD controllers (create, read, update, delete)
- [x] Backend: Streams routes & index mount (`streams.routes.js`, `index.js`)
- [x] Backend: Automated in-process test suite (`streams.test.js`, `index.js`)
- [x] Frontend: Install `@livekit/components-react` & `livekit-client`
- [x] Frontend: `streamsApi.js` API client integration
- [x] Frontend: `StreamCard.js` (Live/preparing/ended badges, author, viewers)
- [x] Frontend: `StreamList.js` (Grid, skeletons, empty/error states)
- [x] Frontend: `CreateStreamModal.js` (React Hook Form + Zod, category selector)
- [x] Frontend: `HostControls.js` (LiveKit TrackToggle mic/cam/screen, Go Live, End Stream)
- [x] Frontend: `ViewerControls.js` (Fullscreen, viewers, leave)
- [x] Frontend: `StreamTrackView.js` (Video, screen share + PiP, audio-only waveform)
- [x] Frontend: `StreamRoom.js` (LiveKitRoom, RoomAudioRenderer, StartAudio, disconnect listener)
- [x] Frontend: `StreamDetailView.js` (Lifecycle coordinator, studio & viewer view)
- [x] Frontend: `StreamsView.js` (Connected to live API, category chips, status tabs)
- [x] Frontend: Route pages (`/streams/page.js`, `/streams/[id]/page.js`)
- [x] Run backend tests (`npm test`) -> 100% passing
- [x] Run backend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [x] Run frontend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [x] Run frontend production build (`npm run build`) -> Clean compile
- [x] Update documentation (`README.md`, `WORKBASE.md`, `MODEL-HANDOFF.md`)

## Next Task
- Task ID: TASK-007
- Title: Phase 4 — Milestone 6: Meet-Up Rooms / Collaborative Multi-Peer LiveKit Integration
- Status: PENDING
- Goal: Implement collaborative multi-peer rooms for interactive audio, video, and screen sharing meetups.
