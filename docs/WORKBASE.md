# YOIBI Workbase

This file is a live task scratchpad. The active AI must update it before and during work.

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Direct Messaging follows the server-authoritative rule: User A can direct message User B only if A follows B (`followsRepository.isFollowing(senderId, recipientId) === true`).**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**

## Current Task
- Task ID: TASK-011
- Title: Phase 5 — Milestone 10: Platform Hardening, End-to-End Verification & Deployment Readiness
- Status: COMPLETED — LEVEL 1: ENGINEERING HARDENING COMPLETE (100% QUALITY GATES PASSED)
- Completion Level: `Engineering Hardening Complete — Production Verification Pending`
- Goal: Platform hardening, security response headers, rate limiting (Better Auth + Express Rate Limit), Socket.IO CORS hardening, request abuse protection, database readiness checks, Railway configuration, and end-to-end deployment documentation.
- Scope Accomplished:
  - Rate Limiting:
    - `backend/src/middleware/rate-limiter.js`: Implemented `globalLimiter` (300/min), `authLimiter` (15/15min on `/auth/me`), `writeLimiter` (60/min on mutations), `expensiveLimiter` (10/15min on media/rooms/streams), `reportLimiter` (20/hr), and `adminLimiter` (60/min) with standard `{ success: false, error: { code: 'RATE_LIMITED' } }` envelope.
    - `frontend/src/lib/auth.js`: Configured Better Auth's built-in, database-backed `rateLimit` with sensitive endpoint rules.
  - Security Headers & Permissions-Policy:
    - `frontend/next.config.js`: Implemented `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, and `Permissions-Policy: camera=(self), microphone=(self), geolocation=(), interest-cohort=()`.
  - CORS & Realtime Hardening:
    - Fixed Socket.IO wildcard fallback in `backend/src/sockets/messaging.socket.js`. Added strict origin validation against `allowedOrigins` (`FRONTEND_URL`, `CORS_ORIGIN`, `CLIENT_URL`).
    - Added `CLIENT_URL` to `backend/src/config/env.js`.
  - Health & Readiness Probes:
    - `backend/src/controllers/read/health.controller.js`: Returns HTTP 200 `{ status: 'ok' }` when DB connected or in dev/test unconfigured mode; returns HTTP 503 `{ status: 'degraded' }` when configured DB is disconnected. Includes uptime and timestamp.
  - Request Abuse Protection:
    - `backend/src/validators/admin.validator.js`: Added `.max(100)` to search queries.
    - `backend/src/validators/users.validator.js`: Added `.max(50)` to name, `.max(280)` to bio, and `.max(1000)` to avatarUrl.
  - JWT Verification Strategy:
    - Inspected and documented claim verification (`iss`, `sub`, `exp`, `iat` verified; `aud` omitted by design in Better Auth v1.7.4 `jwt()` plugin) in `backend/src/middleware/auth.js` and `docs/SECURITY-RULES.md`.
  - Dependencies:
    - Updated backend `zod` from `^4.6.1` to `^4.6.2` (patch). Added `express-rate-limit`. Verified 0 vulnerabilities in `npm audit`.
  - Deployment Configuration:
    - `backend/railway.json`: Created Railway Config-as-Code deployment specification using schema `https://railway.com/railway.schema.json`, Nixpacks builder, `npm start`, and health check.
  - Documentation:
    - Updated `README.md`, `contracts/API-CONTRACT.md` (Stream Join Policy), `docs/SECURITY-RULES.md`, `docs/WORKBASE.md`, and `docs/MODEL-HANDOFF.md`.
  - Quality Gates Passed:
    - `backend`: `npm test` -> 100% passing across all 8 suites.
    - `backend`: `npm run lint` -> 0 errors, 0 warnings.
    - `backend`: `npm audit` -> 0 vulnerabilities.
    - `frontend`: `npm run lint` -> 0 errors, 0 warnings.
    - `frontend`: `npm run build` -> Clean production compile across all 21 routes.

## Implementation Checklist
- [x] Backend: `express-rate-limit` middleware with test bypass and standard envelope
- [x] Backend: Route matrix rate limiters applied across all routes
- [x] Frontend: Better Auth built-in `rateLimit` configuration
- [x] Backend: Request abuse validation limits (`search`, `name`, `bio`, `avatarUrl`)
- [x] Backend: Socket.IO wildcard CORS eliminated; strict origin validation
- [x] Frontend: `next.config.js` with security headers and `Permissions-Policy: camera=(self), microphone=(self)`
- [x] Backend: `/api/v1/health` readiness probe (200 OK / 503 Degraded)
- [x] Backend: JWT claim verification documented
- [x] Backend: `zod` patch update and audit verified
- [x] Backend: `railway.json` deployment specification
- [x] Contracts: Stream Access Policy finalized and documented in `contracts/API-CONTRACT.md`
- [x] Docs: `docs/SECURITY-RULES.md` updated with comprehensive hardening rules
- [x] Docs: Root `README.md` updated for developers and deployment
- [x] Quality Gates: All backend tests, lints, audits, and frontend build pass 100%
- [x] Working tree verified clean for release commit

## Next Task
- Task ID: TASK-012
- Title: Phase 5 — Production Verification (Level 2) & Live Deployment Execution
- Status: IN PROGRESS — live credentials now present in local `backend/.env`; frontend Vercel project linked (`frontend/.vercel`)
- Goal: Execute live deployment on Vercel and Railway with live MongoDB Atlas, Cloudinary, and LiveKit Cloud credentials, and execute the production smoke-test checklist.

### TASK-012 Session Recovery Log (2026-09-11)
Recovered uncommitted work from an interrupted session and hardened it:
- `backend/src/middleware/auth.js`: JWT-driven **auto-provisioning** of missing application `users` records from verified JWT claims (required for production: Better Auth users and app `users` collection are separate). Completed the interrupted implementation: `handle` is now propagated through the live moderation entry (server-authoritative), and `verifyJwtToken` (Socket.IO path) uses the same handle-derivation chain as `verifyJwt`.
- `backend/src/models/{user,follow,auditLog}.model.js`: Removed redundant duplicate index declarations (`handle` is `unique: true`; `followingId` and `status` have inline `index: true`) — eliminates Mongoose duplicate-index warnings.
- `frontend/.gitignore`: New — ignores `.vercel/` and `.env*` (Vercel CLI hygiene).
- `backend/src/integrations/livekit/livekit.js`: **Production race-condition fix** in `reserveSlot`: the async LiveKit `listParticipants` lookup ran BETWEEN the capacity read and the reservation write; when LiveKit is configured, concurrent joins could over-book. All async lookups now happen before a fully synchronous (atomic) check-and-reserve critical section. Extracted shared `getConnectedParticipantCount` helper (dedupes `getActiveParticipantCount`).
- `backend/tests/index.js`: Test harness made deterministic — pre-sets `NODE_ENV='test'` and clears `MONGODB_URI`/Cloudinary/LiveKit credentials BEFORE modules load (dotenv never overrides existing `process.env` values). Previously the suite passed only because `backend/.env` did not exist; with live credentials present, health returned 503 and LiveKit network calls broke slot-TTL timing.
- Docs: `docs/SECURITY-RULES.md` documents auto-provisioning.
- Quality gates re-verified: backend `npm test` 100% (8/8 suites), backend lint 0/0, `npm audit` 0 vulnerabilities, frontend lint 0/0.

### TASK-012 Production Smoke Test Results (2026-09-11)
**DISCOVERY: Both deployments are ALREADY LIVE** (not recorded in the previous handoff):
- Frontend: `https://yoibi-frontend.vercel.app` — live (Vercel project linked in `frontend/.vercel`)
- Backend: `https://yoibi-backend-production.up.railway.app` — live, `database: connected` (uptime 735s at check time)
- `frontend/.env` wires `NEXT_PUBLIC_API_BASE_URL` to the Railway backend URL; `backend/.env` wires Better Auth/JWKS/CORS to the Vercel frontend URL.

**Live-stack smoke checks (all passed, read-only):**
1. `GET /api/v1/health` → 200 `{ status: 'ok', database: 'connected' }`
2. `GET /api/v1/tweets` → 200 success, 3 items in live DB; `/videos` → 200 (0); `/streams` → 200 (0)
3. Unknown route → 404 envelope
4. CORS preflight (`OPTIONS /tweets`, Origin: live frontend) → 204 with correct `Access-Control-Allow-Origin`
5. `GET /api/v1/auth/me` without token → 401
6. Frontend security headers all present: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, `Permissions-Policy`

**Local production boot check (current working tree, real credentials):**
- `NODE_ENV=production node src/server.js` → connected to live MongoDB Atlas, health 200 `database: connected`, clean stderr, graceful shutdown.

**Remaining Level 2 steps:**
1. **Redeploy backend to Railway** — the live build predates today's fixes (auto-provisioning completion + reservation race fix are NOT live). Frontend redeploy optional (ships the new favicon).
2. Authenticated end-to-end smoke test with a disposable test account (sign-up → JWT → `/auth/me` → tweet create/like/reply → follow → DM → notifications) — writes to production; requires owner go-ahead.
3. Verify Socket.IO realtime between Vercel and Railway in the browser.

