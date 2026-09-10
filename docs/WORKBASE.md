# YOIBI Workbase

This file is a live task scratchpad. The active AI must update it before and during work.

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**

## Current Task
- Task ID: TASK-005
- Title: Phase 4 — Milestone 4: Videos Slice Integration
- Status: IN PROGRESS
- Goal: Implement the complete YOIBI video system with server-controlled Cloudinary upload intents, asset provenance verification, separated playback view tracking, responsive category-filtered discovery, and custom HTML5 playback.
- Scope:
  - Contract:
    - `contracts/API-CONTRACT.md`: Section 7 Videos synchronized.
    - `contracts/openapi.yaml`: `/videos` endpoints, request schemas, parameters, and responses synchronized.
  - Backend:
    - Integration: `backend/src/integrations/cloudinary/cloudinary.js` (Upload intent creation, SHA-1 signature generation, asset destruction, test mock mode).
    - Model: `backend/src/models/video.model.js` (Schema with `_id`, `authorId`, `title`, `description`, `category`, `videoUrl`, `thumbnailUrl`, `publicId`, `duration`, `viewsCount`, `likes`, `likesCount`, `bytes`, `width`, `height`, `format`, indexes on `createdAt`, `authorId`, `category`).
    - Repository: `backend/src/repositories/videos.repository.js` (CRUD queries, search, category filter, pagination, author enrichment, view increment, like toggle, disconnected DB fallback).
    - Validation: `backend/src/validators/videos.validator.js` (Zod schemas for `createVideo`, `listVideosQuery`, `videoIdParam`, `uploadSignature`).
    - Services: `create/videos.service.js`, `read/videos.service.js`, `update/videos.service.js`, `delete/videos.service.js`.
    - Controllers: `create/videos.controller.js`, `read/videos.controller.js`, `update/videos.controller.js`, `delete/videos.controller.js`.
    - Routes: `backend/src/routes/videos.routes.js` mounted in `backend/src/routes/index.js`.
    - Tests: `backend/tests/videos.test.js` integrated into `backend/tests/index.js`.
  - Frontend:
    - Client: `frontend/src/features/videos/api/videosApi.js` wrapping `apiClient` for `/api/v1/videos` and direct signed Cloudinary upload.
    - UI:
      - `UploadVideoModal.js` (React Hook Form + Zod, <=100MB file validation, live upload progress bar, category selector).
      - `VideoCard.js` (Thumbnail, duration badge, author metadata, views/likes counters, delete modal for author/admin).
      - `VideoPlayerModal.js` (Custom HTML5 `VideoPlayer` embedding, playback initiation view trigger, like toggle, share link).
      - `VideoList.js` (Responsive grid, loading skeletons, empty state, error retry, pagination).
      - `VideosView.js` (Live API integration, sticky category pills toolbar, upload modal trigger, video stream).
  - Verification Gates:
    - Backend test suite (`npm test`) -> 100% passing
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
- [x] Synchronize API contracts (`API-CONTRACT.md`, `openapi.yaml`)
- [ ] Backend: Cloudinary integration & upload intent store (`cloudinary.js`)
- [ ] Backend: Video model schema & indexes (`video.model.js`)
- [ ] Backend: Videos repository layer (`videos.repository.js`)
- [ ] Backend: Videos Zod validators (`videos.validator.js`)
- [ ] Backend: Videos CRUD services (create, read, update, delete)
- [ ] Backend: Videos CRUD controllers (create, read, update, delete)
- [ ] Backend: Videos routes & index mount (`videos.routes.js`, `index.js`)
- [ ] Backend: Automated in-process test suite (`videos.test.js`, `index.js`)
- [ ] Frontend: `videosApi.js` API client integration
- [ ] Frontend: `UploadVideoModal.js` (React Hook Form + Zod, 100MB limit, progress tracking)
- [ ] Frontend: `VideoCard.js` (Thumbnail, duration, author, views/likes, delete modal)
- [ ] Frontend: `VideoPlayerModal.js` (Playback initiation view trigger, custom VideoPlayer)
- [ ] Frontend: `VideoList.js` (Responsive grid, loading skeletons, empty/error/pagination)
- [ ] Frontend: `VideosView.js` (Connected to live API, category pills filter, upload button)
- [ ] Run backend tests (`npm test`) -> 100% passing
- [ ] Run backend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [ ] Run frontend ESLint (`npm run lint`) -> 0 errors, 0 warnings
- [ ] Run frontend production build (`npm run build`) -> Clean compile
- [ ] Update documentation (`README.md`, `WORKBASE.md`, `MODEL-HANDOFF.md`)
- [ ] Git checkpoint commit
