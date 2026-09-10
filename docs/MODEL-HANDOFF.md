# YOIBI Model Handoff

This file prevents a new AI model from restarting work from zero.

## Rule
At the end of every meaningful session/task, the active model must update this file. A new model must read it before changing code.

## Current Snapshot
- Last updated: 2026-09-11
- Active task: Phase 3 Backend Foundation (Completed & Verified)
- Overall phase: Phase 3 Backend Foundation (Completed & Verified) → Phase 4 Sliced Frontend/Backend Integration
- Git repository status: Initialized at `yoibi/` root, tracking frontend, backend, contracts, docs, skills, configs
- Current branch: `main`
- Baseline commit: `6d167d0` ("chore: initialize yoibi workspace")
- Working tree state: Clean
- Last completed step: Established complete CommonJS Express backend foundation (`backend/src/app.js`, `backend/src/server.js`), environment validator (`backend/src/config/env.js`), Mongoose MongoDB connection manager (`backend/src/config/db.js`), Better Auth JWKS verification middleware (`backend/src/middleware/auth.js`), authorization guards (`backend/src/middleware/authorize.js`), error handlers, and `/api/v1/health`. Successfully verified via `npm test` and `npm run lint`.
- Current step: Transitioning to Phase 4 (Sliced Frontend/Backend Integration)
- Next exact step: Phase 4 Milestone 1 — Integrate Frontend Authentication & Profile with Backend (`/api/v1/auth/me`, `/api/v1/users/profile`).

## What Is Working
- Git repository initialized at root `yoibi/` on branch `main` with baseline commit `6d167d0`
- Root `.gitignore` in place protecting all secrets, `.env*` files, `node_modules/`, `.next/`, and caches while tracking `.env.example`
- Complete human-readable API contract (`contracts/API-CONTRACT.md`)
- Complete machine-readable OpenAPI 3.0.3 specification (`contracts/openapi.yaml`)
- Backend CommonJS Express foundation (`express`, `helmet`, `cors`, `dotenv`, `mongoose`, `jose`)
- Health check endpoint `GET /api/v1/health` responding with 200 OK
- Centralized error handler returning standard `{ success: false, error: { code, message, fields } }` envelope
- JWT verification middleware verifying Bearer tokens via Better Auth JWKS and attaching verified `req.user`
- Authorization guards (`requireAuth`, `requireAdmin`, `requireOwnerOrAdmin`)
- Backend test suite (`npm test`) fully passing: env validation, db status, health endpoint, 404 handler, unauthorized access (401), invalid token (401), and admin guards (403)
- Backend ESLint passing with 0 errors and 0 warnings (`npm run lint`)
- Frontend stack running Next.js 16.3.4 (Turbopack), React 19, Tailwind CSS 4.3.3, Lucide React, Motion
- Frontend ESLint passing cleanly (`npm run lint`)
- Frontend production build passing with 14 static App Router pages prerendered (`npm run build`)
- App Router layout hierarchy active: 3-column desktop shell with mobile dock
- Minimal auth pages active: signup (minimal fields only, no favorite color/preferences/confetti), login, forgot-password, verify-email, reset-password
- Preserved legacy homepage baseline intact under strict freeze rule
- Feature slices implemented with feature-owned mock data: feed, tweets, videos (custom player), streams, meetup, messages
- Strict separation maintained: Post != Tweet, zero cross-feature private imports

## What Is Not Working
- Features are currently running on feature-owned mock data pending Phase 4 API client wiring

## Files Changed in Latest Session
- `backend/package.json`
- `backend/eslint.config.js`
- `backend/README.md`
- `backend/src/app.js`
- `backend/src/server.js`
- `backend/src/config/env.js`
- `backend/src/config/db.js`
- `backend/src/middleware/auth.js`
- `backend/src/middleware/authorize.js`
- `backend/src/middleware/errorHandler.js`
- `backend/src/middleware/cors.js`
- `backend/src/controllers/read/health.controller.js`
- `backend/src/controllers/read/auth.controller.js`
- `backend/src/routes/health.routes.js`
- `backend/src/routes/auth.routes.js`
- `backend/src/routes/index.js`
- `backend/tests/foundation.test.js`
- `docs/WORKBASE.md`
- `docs/MODEL-HANDOFF.md`

## API/Contract Changes
- None (Phase 3 implements exactly the endpoints defined in Phase 2: `/api/v1/health` and `/api/v1/auth/me`).

## Database Changes
- MongoDB connector initialized via Mongoose; status reporting active.

## Environment Variables Added/Needed
- Verified safe in `backend/.env.example`. When ready to connect to a live MongoDB instance, set `MONGODB_URI`. When ready to connect to live Better Auth instance, set `BETTER_AUTH_BASE_URL` and `BETTER_AUTH_JWKS_URL`.

## Tests/Checks Run
- Directory structure and file checks: All passed
- Node.js runtime check: Node v24.15.0, npm 11.15.0 passed
- Backend unit & in-process tests: `npm test` passed 100%
- Backend ESLint check: `npm run lint` passed with 0 errors, 0 warnings
- Frontend ESLint check: `npm run lint` passed with 0 errors, 0 warnings
- Frontend build check: Turbopack Next.js 16.3.4 production build passed with 14 static pages generated
- Version check on npm: `next@16.3.4` and `tailwindcss@4.3.3` verified
- Git status check: Checked repository state

## Known Issues
- None

## Important Decisions
- Target latest stable `next@16.3.4` and `tailwindcss@^4.3.3`.
- Strict feature-owned mock data: no monolithic mock file.
- The new signup page is minimal: only Name, Email, Password, Confirm Password, Age (>= 16), Phone (optional), Photo (optional), and Community rules checkbox. Preferences and favorite color are completely removed. Zero confetti or decorative success effects.
- Homepage is preserved matching legacy reference without early redesign (strict homepage freeze rule).
- Post != Tweet domain separation in both frontend (`features/posts/` vs `features/tweets/`) and backend (`/api/v1/posts` vs `/api/v1/tweets`).
- Generic shared UI (`src/shared/ui/`), custom video player (`src/shared/media/`), and feedback primitives (`src/shared/feedback/`).
- API contract first before backend implementation (Phase 2).
- Backend is CommonJS only with CRUD-separated layers and server-side Better Auth JWT verification.
- Admin panel supports user/content inspection, contact/report forms, and exactly 3 moderation actions: `ban` (cascade delete), `block` (account-blocked page + reason form), and `unblock`.
- Prerequisite rule: `docs/BAN-DELETION-PLAN.md` must be written and approved before ban deletion code.
- DM follow-rule: User A can DM User B only if A follows B.
- Realtime uses Socket.IO for DM and LiveKit for Streams/Rooms. Media uses Cloudinary with server-side SDK.

## Exact Resume Instruction
> Continue from the `Next exact step` above. Do not restart completed work. First inspect the current files and git diff, verify the current state, then implement only the remaining work.




