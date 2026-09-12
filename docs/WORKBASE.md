# YOIBI Workbase

This file is a live task scratchpad. The active AI must update it before and during work.

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**

## Current Task
- Task ID: TASK-014
- Title: Complete User Profile System — Dynamic `/profile/[username]`, Profile Editing, Avatar & Banner, Real Content Tabs
- Status: IMPLEMENTED — ALL QUALITY GATES PASSED
- Completion Level: `Implemented, Verified & Deployed` (profile route/API/contracts/tests live on Railway + Vercel; per-user interactive smoke still pending owner credentials)
- Summary of this task:
  - **Sidebar cleanup**: removed the legacy "My Wall" item from the left sidebar and the mobile dock (`frontend/src/app/(protected)/layout.js`). No empty slot — items reflow naturally. The sidebar keeps the single "Sign Out".
  - **Right-side user card**: "View My Wall" → "View My Profile", which navigates to `/profile/{currentUserHandle}`. The duplicate Sign Out button was removed from the right card (one logout action only — left sidebar "Sign Out" (desktop) / mobile header).
  - **Dynamic profile route**: `frontend/src/app/(protected)/profile/[username]/page.js` → `ProfileView` fetches the profile from the backend (`GET /api/v1/users/:handle`) by the handle in the URL. No static page, no hardcoded username, no `?username=` query.
  - **Own / other-user profiles**: `isOwner` is derived from the verified JWT identity (`req.user.id` === `profile.id`) — never from the URL or body. Own profile shows "Edit Profile"; other profiles show an authenticated Follow/Following button (real `follows` API). The backend remains the authoritative profile source (AuthContext is only used for identity comparison).
  - **Design**: modern, minimal, mobile-first profile header — banner (3-step responsive height), circular avatar overlapping the banner naturally, name, `@handle`, bio, country (mapped from ISO code to display name), "Joined Month Year" (no timestamps/IDs), real stats (Posts/Followers/Following), Tweets/Videos/Streams tabs with real backend counts and paginated server-side-filtered content.
  - **Banner/avatar**: `bannerUrl` added to the canonical `users` schema/model (no MongoDB binary storage); both images use the existing Cloudinary architecture via a new server-issued signed upload endpoint `POST /api/v1/users/me/upload-signature` (`yoibi/profiles/{userId}/avatars|banners` folders). `CLOUDINARY_API_SECRET` never leaves the server. Missing avatar → initials fallback; missing banner → intentional YOIBI gradient state.
  - **Edit Profile modal** (`frontend/src/features/profile/ui/EditProfileModal.js`): avatar + banner pickers (5 MB image validation, live XHR progress, signed upload), Name, Username/Handle, Bio, Country; React Hook Form + Zod with field errors, disabled submit while saving, success + server-error feedback (incl. `422 HANDLE_TAKEN`), Cancel/Save, accessible `Modal` (Escape, focus trap). Server-controlled fields are structurally absent.
  - **Username/handle editing**: server-normalized (lowercase, `@`-stripped, URL-safe `[a-z0-9]`, 3–24), unique DB index → duplicate returns `422 HANDLE_TAKEN`. After a successful handle change the client `router.replace("/profile/{newHandle}")` — never left on a stale URL.
  - **Profile API**: `GET /api/v1/users/:handle` now returns the real dynamic counts `tweetsCount`/`videosCount`/`streamsCount` (server-computed by canonical `authorId` ownership, `postsCount` = legacy `tweetsCount` alias), plus `bannerUrl`, `country`, and `isOwner`. Public allowlist never exposes email/age/phone/role/block state. `PATCH /api/v1/users/me` gained `handle` + `bannerUrl`; authorization is `req.user.id` only; the stale-handle `$or` update bug (which could target the WRONG user after a handle change) was removed — updates now match `_id` exclusively.
  - **Content tabs**: Tweets (`authorHandle` server-side filter), Videos (`authorId`), Streams (`status=all` new lifecycle filter) — all paginated server-side; polished empty states ("No tweets/videos/streams yet") and skeletons on load.
  - **Author profile links**: TweetCard (`/wall/{handle}` dead-link fix → `/profile/{handle}`), VideoCard author row, StreamCard broadcaster identity, and follow events now navigate to `/profile/{handle}`.
  - **Bug fixes**: videos/streams repository author enrichment used `User.findOne({ id: ... })` (field is `_id`) → authors always fell back to "Yoibi Member"/"Broadcaster"; fixed to `{ _id }`. `validate` middleware now attaches validated/transformed data to `req.validatedBody/Query/Params` (handle normalization now actually applies).
  - Contracts synced (`contracts/API-CONTRACT.md`, `contracts/openapi.yaml`): public profile contract w/ counts + banner, `PATCH /users/me` (handle + bannerUrl), `POST /users/me/upload-signature`, new `UserPublicProfile` + `ProfileImageUploadSignature` schemas.
  - Tests: `backend/tests/users-profile.test.js` (schema banner, handle normalization/rules, strict allowlist, projection allow/deny, counts-by-authorId determinism, upload signature folders/no-secret) — registered in the suite; `frontend/tests/profile.test.js` (12 tests: side/dock cleanup, right-card contract, author links, dynamic route, real-data API usage, edit modal constraints).
  - Quality gates: backend `npm test` 100% + `npm run lint` clean + `npm audit` 0 vulnerabilities; frontend `vitest` 55/55 + `npm run lint` clean + `npm run build` success (`/profile/[username]` is a dynamic route).
- Deployment: DONE — backend redeployed to Railway (`https://yoibi-backend-production.up.railway.app`, `/api/v1/health` → 200 `database: connected`), frontend redeployed to Vercel (`https://yoibi-frontend.vercel.app`, `/signup` and `/login` → 200; `/verify-email`, `/forgot-password`, `/reset-password` → 404). Production Email-user smoke PASSED on the live stack: signup → immediate JWT → `/auth/me` 200 (`role=user`, handle `@smoketestuser`, no `isEmailVerified`, empty `avatarUrl`) → Tweet 201 → Video upload-signature 200 → `PATCH /users/me` role/ID spoof rejected 422 → re-login reuses the same profile (no duplicate). Disposable smoke account left in place for audit: `yoibi-smoke-20260912@example.com`. Remaining: live Google OAuth browser smoke (needs a real Google test account + owner go-ahead — writes to production).

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
    - Fixed Socket.IO wildcard fallback in `backend/src/sockets/(removed)`. Added strict origin validation against `allowedOrigins` (`FRONTEND_URL`, `CORS_ORIGIN`, `CLIENT_URL`).
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
2. Authenticated end-to-end smoke test with a disposable test account (sign-up → JWT → `/auth/me` → tweet create/like/reply → follow → follow) — writes to production; requires owner go-ahead.
3. Verify Socket.IO realtime between Vercel and Railway in the browser.

### TASK-013 Production Authentication Fix (2026-09-11)
Connected investigation of three production auth symptoms (all traced to verified root causes in the installed Better Auth **1.7.4**):

1. **JWT missing/malformed (root cause, fixed):** The frontend called `authClient.getJwtToken()` in 3 places (`lib/api/client.js`, `(removed)::getJwtToken()`; Socket.IO hooks reuse it. Malformed `Bearer undefined/null` headers are structurally impossible now.
2. **Verification email never sent (root cause, fixed):** `frontend/src/lib/auth.js` required verification with **no verification-email block configured** — Better Auth logged "Verification email isn't enabled" and sent nothing. Implemented the official verification-email config plus password-reset hook, delivered via **Resend** through `frontend/src/lib/email.js` (plain `fetch`, zero new runtime dependencies). Provider domain verification is an external prerequisite → status: **Email delivery integration implemented — provider verification pending**.
3. **Google users missing in YOIBI MongoDB (same root cause as #1):** The Mongo `users` profile is created server-side on the first verified-JWT request (`/auth/me` auto-provisioning). With JWT acquisition broken, Google users never reached the backend. Flow restored: Google OAuth → Better Auth user → `authClient.token()` JWT → `/auth/me` → server-side upsert keyed by the verified Better Auth user ID.

Also: backend JWT verification now strictly validates `aud` (Better Auth 1.7.4 sets default `aud` = baseURL — verified in installed `dist/plugins/jwt/sign.mjs`; the previous docs claiming "no default aud" were wrong); `verifyJwtToken` (Socket.IO path) normalizes jose errors to the same `{ code, status }` 401 contract; new `backend/tests/auth-jwt.test.js` (valid/invalid/expired/wrong-issuer/wrong-audience/`/auth/me` end-to-end, 9/9 passing); new frontend vitest suite for the centralized API client (7/7 passing: header attach, no-malformed-header, 401 mapping).

**Remaining external steps:** confirm Railway env (`BETTER_AUTH_BASE_URL`, `FRONTEND_URL`, `CORS_ORIGIN` = `https://yoibi-frontend.vercel.app`); redeploy both services; run real disposable-account smoke tests (email + Google) per the production verification checklist.

**Superseded (2026-09-11, auth simplification):** email verification and password reset were removed entirely (Resend stack and its env vars, the verification-email Better Auth config, and the three removed auth routes). Email/password signup creates an immediately usable account. No email provider variables are required.

### TASK-014 Responsive Feed & Mobile Navigation Redesign (2026-09-12)
- Replaced the bottom dock mobile navigation with a left-side drawer component.
- The drawer includes sliding animations, a dimming backdrop, Escape key closing, and disables body scroll while open.
- The mobile header now displays the current user's avatar and a hamburger menu icon. Both triggers open the drawer.
- The Feed page was cleaned up by removing the inline Tweet composer and filtering tabs (All Posts / Following). Actual Tweet creation remains fully functional on the dedicated /tweets route.
- Ensured icon consistency across the mobile drawer and desktop sidebar.
- Desktop profile card now displays "My Profile" instead of "View My Profile", matching the mobile navigation label.
