# YOIBI Model Handoff

This file prevents a new AI model from restarting work from zero.

## Rule
At the end of every meaningful session/task, the active model must update this file. A new model must read it before changing code.

## Current Snapshot
- Last updated: 2026-09-11
- Active task: Phase 5 — TASK-012: Production Verification (Level 2) & Live Deployment Execution
- Overall phase: Phase 5 — TASK-011 Engineering Hardening COMPLETE (Level 1 Passed 100%); TASK-012 Level 2 in progress
- Completion status: `Live credentials present locally; deployment execution pending`
- Git repository status: Working tree contains recovered TASK-012 preparation work (auto-provisioning, race fix, test harness determinism, frontend Vercel link hygiene) — committed in this session
- Current branch: `main`

## Session Recovery Entry (2026-09-11)
An interrupted session left uncommitted production-preparation work. It was verified, completed, and hardened:
1. **Application User Auto-Provisioning (`backend/src/middleware/auth.js`):**
   - On first authenticated request with a verified JWT `sub` that has no application `users` record, the backend creates the record from verified claims only (`handle`, `name`, `avatarUrl`), with duplicate-handle collision fallback. Required for production because Better Auth's user table and the app `users` collection are separate.
   - Completed the interrupted implementation: live moderation entry now carries `handle` (server-authoritative), and `verifyJwtToken` (Socket.IO path) uses the same handle-derivation chain as `verifyJwt`.
2. **Meet-Up Reservation Race Fix (`backend/src/integrations/livekit/livekit.js`):**
   - `reserveSlot` previously awaited LiveKit `listParticipants` BETWEEN reading reservation count and writing the reservation. With LiveKit configured (real deployment), concurrent joins could over-book capacity (all concurrent joins read count 0). All async lookups now complete BEFORE a synchronous (atomic) check-and-reserve critical section. Shared `getConnectedParticipantCount` helper extracted.
3. **Redundant Index Cleanup (`user/follow/auditLog` models):** removed duplicate index declarations (`handle` unique auto-index; inline `index: true` on `followingId`, `status`).
4. **Deterministic Test Harness (`backend/tests/index.js`):** pre-sets `NODE_ENV='test'` and clears `MONGODB_URI`/Cloudinary/LiveKit credentials before module load (dotenv never overrides existing `process.env`). Without this, the presence of live credentials in `backend/.env` broke the suite (health 503; LiveKit network calls broke slot-TTL timing).
5. **Frontend Vercel prep:** `frontend/.vercel` project link exists; new `frontend/.gitignore` ignores `.vercel/` and `.env*`.
6. **Docs:** `docs/SECURITY-RULES.md` documents auto-provisioning; `docs/WORKBASE.md` has the TASK-012 recovery log.
  1. **Distributed Rate Limiting:**
     - Backend (`express-rate-limit`): `globalLimiter` (300 req/min/IP), `authLimiter` (15 req/15min on `/auth/me`), `writeLimiter` (60 req/min on mutations), `expensiveLimiter` (10 req/15min on media signatures, stream create/start/join, meetup create/join), `reportLimiter` (20 req/hr on `/reports`), and `adminLimiter` (60 req/min on `/admin/*`). All 429s adhere to `{ success: false, error: { code: 'RATE_LIMITED', message: '...' } }`. All limiters skip automatically when `NODE_ENV === 'test'`.
     - Frontend (Better Auth built-in): Database-backed `rateLimit` in `frontend/src/lib/auth.js` with custom rules for the active sensitive endpoints (`/sign-in/email`, `/sign-up/email`) only -- no verification/reset endpoints exist (email verification and password reset were removed). No reliance on stateless Edge Runtime memory; no Redis introduced for MVP.
  2. **Security Headers & Permissions Policy:**
     - `frontend/next.config.js`: Enforces `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, and `Permissions-Policy: camera=(self), microphone=(self), geolocation=(), interest-cohort=()`. Restrictive CSP intentionally deferred to avoid breaking WebRTC/Turbopack.
  3. **CORS & Realtime Hardening:**
     - Eliminated Socket.IO wildcard fallback (`env.CLIENT_URL || '*'`) in `backend/src/sockets/messaging.socket.js`. Strict origin validation whitelists `FRONTEND_URL`, `CORS_ORIGIN`, `CLIENT_URL`. Added `CLIENT_URL` configuration in `backend/src/config/env.js`.
  4. **Health & Readiness Behavior:**
     - `GET /api/v1/health` in `backend/src/controllers/read/health.controller.js` checks live MongoDB readiness via `mongoose.connection.readyState === 1`. Returns HTTP 200 `{ status: 'ok', database: 'connected' }` when ready; returns HTTP 503 `{ status: 'degraded', database: 'disconnected' }` when configured DB is unavailable.
  5. **Request Abuse Protections:**
     - `backend/src/validators/admin.validator.js`: Added `.max(100)` to search queries in `listUsers` and `listContent`.
     - `backend/src/validators/users.validator.js`: Added length constraints to profile update (`name`: 50 chars, `bio`: 280 chars, `avatarUrl`: 1000 chars).
  6. **JWT Claim Verification:**
     - Inspected Better Auth v1.7.4 JWT issuance. Verified claims: `iss` (Better Auth baseURL), `sub` (User ID), `exp` (1d), and `iat`. Documented in `backend/src/middleware/auth.js` and `docs/SECURITY-RULES.md` why audience validation is intentionally omitted (no default `aud` claim in Better Auth `jwt()` plugin).
  7. **Stream Access Policy Finalized:**
     - Public stream discovery (`GET /streams`).
     - Anonymous viewer join allowed via `POST /streams/:id/join` with `optionalAuth`, issuing viewer-only tokens (`canPublish: false`).
     - Broadcasting and stream creation restricted to authenticated users (`POST /streams`, `POST /streams/:id/start`).
     - Documented in `contracts/API-CONTRACT.md`, `docs/SECURITY-RULES.md`, and route comments.
  8. **Dependencies & Deployment Specification:**
     - Updated backend `zod` from `^4.6.1` to `^4.6.2` (patch). Added `express-rate-limit`. Verified 0 vulnerabilities in `npm audit`.
     - Created `backend/railway.json` using official Railway Config-as-Code schema `https://railway.com/railway.schema.json` with Nixpacks builder, `npm start`, and healthcheck probes.
  9. **Quality Gates Passed:**
     - Backend tests (`npm test`): 100% passing across all 8 test suites.
     - Backend ESLint (`npm run lint`): 0 errors, 0 warnings.
     - Backend audit (`npm audit`): 0 vulnerabilities.
     - Frontend ESLint (`npm run lint`): 0 errors, 0 warnings.
     - Frontend Next.js build (`npm run build`): Clean production compile across all 21 routes.

## What Is Working
- All 10 Milestones (Phase 1 through Phase 5 Milestone 10) are fully implemented and verified at Level 1 (Engineering Completion).
- Complete Twitter-like micro-posting, replies, likes, retweets, feeds.
- Cloudinary server-signed video uploads, metadata registration, playback views tracking.
- LiveKit live stream broadcasts (host publishing, anonymous viewing, lifecycle termination).
- LiveKit Meet-Up multi-peer collaborative rooms (reservation TTLs, slot capacity).
- Direct messaging with server-authoritative follow rule and Socket.IO realtime delivery.
- Real-time notifications with duplicate prevention, unread counts, and optimistic UI.
- Comprehensive Admin & Moderation suite (dashboard metrics, user block/unblock, canonical 5-phase/9-stage destructive ban orchestrator with pre-cleanup audit logging, content moderation, reports queue).
- Multi-tier rate limiting (Better Auth database-backed + Express rate limiter).
- Security response headers with LiveKit camera/mic permissions.
- Railway deployment config (`backend/railway.json`) and Next.js production configuration (`frontend/next.config.js`).

## What Is Not Working / Remaining Scope (Level 2: Production Verification)
- **Live Deployment Execution**: Live credentials are now present in the local `backend/.env` (MongoDB Atlas, Cloudinary, LiveKit, Better Auth URLs) and the frontend Vercel project is linked. Remaining:
  1. Vercel deployment of `frontend/` with production environment variables.
  2. Railway deployment of `backend/` with the same production variables (`backend/railway.json` ready).
  3. Verify MongoDB Atlas network access (allowlist) and live connection from Railway.
  4. Realtime Socket.IO communication between deployed Vercel and Railway services.
  5. Execution of canonical end-to-end smoke test checklist with disposable test accounts.

## Tests/Checks Run (this session, 2026-09-11)
- Backend test suite (`npm test`): Passed 100% (9/9 test suites) — with deterministic unconfigured-services harness; now includes `backend/tests/auth-jwt.test.js` (valid/invalid/expired/wrong-issuer/wrong-audience JWT + `/auth/me` end-to-end)
- Backend ESLint (`npm run lint`): 0 errors, 0 warnings
- Backend security audit (`npm audit`): 0 vulnerabilities
- Frontend ESLint (`npm run lint`): 0 errors, 0 warnings
- Frontend unit tests (`npm test`, vitest): 7/7 passing (centralized API client JWT behavior)
- Zero secrets committed to git (`.env` files are gitignored; only variable names inspected, never printed)

## Production Auth Verification Status (TASK-013, 2026-09-11)
- **JWT pipeline**: FIXED — frontend uses official Better Auth 1.7.4 `authClient.token()` centralized in `frontend/src/lib/api/client.js`; Socket.IO hooks reuse it. Deployed JWKS endpoint `https://yoibi-frontend.vercel.app/api/auth/jwks` verified live (EdDSA/Ed25519); deployed `GET /api/auth/token` verified to exist (401 without session). Backend strictly validates `iss`/`aud` (= `BETTER_AUTH_BASE_URL`) and `exp`.
- **Email confirmation step**: REMOVED (2026-09-11, auth simplification). The Resend delivery stack, the confirmation-email Better Auth block, and the `/verify-email` route were deleted. Email/password signup now creates an immediately usable account (no confirmation step); password reset was also removed and `RESEND_API_KEY`/`EMAIL_FROM` are no longer used. See `docs/ENVIRONMENT.md`.
- **Google OAuth → MongoDB sync**: FIXED as a consequence of the JWT fix; the backend auto-provisions the YOIBI `users` profile from verified JWT claims on the first authenticated request. Real disposable Google-account smoke test (OAuth → `/auth/me` → MongoDB profile → tweet/video) still requires redeploy + owner go-ahead.
- **Production env requirements**: Railway `BETTER_AUTH_BASE_URL`/`FRONTEND_URL`/`CORS_ORIGIN` = `https://yoibi-frontend.vercel.app`; Vercel `NEXT_PUBLIC_BETTER_AUTH_URL` = same origin; Google redirect URI `https://yoibi-frontend.vercel.app/api/auth/callback/google`.

## Exact Resume Instruction
> TASK-012 Level 2 Production Verification in progress. Both deployments are LIVE and healthy (frontend: https://yoibi-frontend.vercel.app, backend: https://yoibi-backend-production.up.railway.app with Atlas connected). Live-stack smoke checks and a local production boot check passed on 2026-09-11. Next exact steps: (1) redeploy the backend to Railway so the live build includes the user auto-provisioning completion and the Meet-Up reservation race fix (commit 8344ec3), (2) run the authenticated end-to-end smoke test with a disposable test account (owner go-ahead required — writes to production), (3) verify Socket.IO realtime in the browser.
