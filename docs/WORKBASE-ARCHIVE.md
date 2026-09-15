# YOIBI Workbase — Archive

Full historical task detail. The active state lives in `docs/WORKBASE.md`; this file is reference-only — read it only when a task specifically needs the history.

---

## TASK-022 — Stale Frontend URL Cleanup + Auth-Aware Home Page Nav Button (2026-09-15)
- Status: COMPLETE — ALL QUALITY GATES PASSED (frontend tests 93/93, frontend lint 0 errors, frontend build clean, Vercel production deployed, live browser verification passed for BOTH logged-out and logged-in states)
- Completion Level: `Implemented, Verified & Deployed`
- Summary of this task:
  1. **Task 1 — Stale frontend URL cleanup**: The retired Vercel project URL was hardcoded ONLY in documentation — no application code, env example, `next.config.js`, metadata/OG tag, sitemap, or robots file contained it. Replaced it with the production domain `https://www.yoibi.com` in `frontend/README.md` (Google redirect URI) and root docs `docs/ENVIRONMENT.md`, `docs/WORKBASE.md`, `docs/MODEL-HANDOFF.md`. Per owner decision, `backend/README.md` and all backend-side env vars were deliberately left untouched (the backend link stays as-is).
  2. **Task 2 — Auth-aware home nav**: The root home page header always rendered "Sign in" + "Join Yoibi". Extracted the nav into a new client component `frontend/src/features/auth/ui/HomeHeaderNav.js` that consumes the EXISTING `useAuth()` (`AuthContext`) hook — the same session mechanism already used by `(protected)/layout.js`; no new auth mechanism was introduced. Three states: authenticated → a single on-brand "Go to Feed" button → `/feed`; loading → a neutral pulsing placeholder with `sr-only` "Checking session…" (neither button set renders, so no wrong-button flash); unauthenticated → the original "Sign in" (`/login`) + "Join Yoibi" (`/signup`) exactly as before.
  3. `frontend/src/app/(public)/page.js` stays a Server Component and simply delegates the header nav to `<HomeHeaderNav />` — the home page continues to prerender as static (`○ /`).
- Files changed: `frontend/src/app/(public)/page.js`, `frontend/src/features/auth/ui/HomeHeaderNav.js` (new), `frontend/tests/home-nav.test.js` (new), `frontend/README.md`, `docs/ENVIRONMENT.md`, `docs/WORKBASE.md`, `docs/MODEL-HANDOFF.md`.
- Files NOT changed (verified): `backend/README.md`, all `backend/` source and env files, `frontend/next.config.js`, `frontend/src/app/layout.js`, root `vercel.json`, `.env.example` files (no stale URL present).
- Verification: frontend `npm test` 93/93 (88 existing + 5 new nav contract tests), `npm run lint` 0 errors (1 pre-existing React Compiler warning in the unrelated `CreateStreamComposer.js`, deliberately not modified), `npm run build` clean (17 static + 3 dynamic routes). Live browser verification against the deployed bundle at `https://www.yoibi.com`: logged-out renders "Sign in / Join Yoibi" (desktop 1280x800 + mobile 390x844), logged-in renders only "Go to Feed" → `/feed`, and no stale Vercel URL appears anywhere in the served HTML.
- Note: The logged-in live check was performed by mocking the Better Auth session/`auth/me` responses browser-side only (no production accounts created, no production data written).

## TASK-021 — Mobile Edit Profile Spacing & Past Meet-Up Room Card Information Hierarchy (2026-09-13)
- Status: COMPLETE — ALL QUALITY GATES PASSED (backend tests 100%, frontend tests 75/75, frontend lint 0/0, frontend build clean, Vercel production deployed, live browser verification passed)
- Completion Level: `Implemented, Verified & Deployed`
- Summary:
  - **Mobile Edit Profile Header Spacing**: Added responsive padding `pt-4 sm:pt-6 lg:pt-0` to `EditProfilePage.js` container, establishing a comfortable, intentional vertical gap below the mobile sticky header bar without impacting desktop layout.
  - **Past Room Title / Topic Information Hierarchy**: Restructured `MeetupCard.js` so that the room title is visually dominant, with the dynamic topic placed directly beneath it as secondary context chip. Status badge (`Active` / `Ended`) and capacity (`{count}/{max}` / `{max} max`) are cleanly separated into the top header row.
  - **State-Aware Card Features**: Ended rooms omit the active capacity progress bar to eliminate visual clutter. All host avatar/name/handle identity and action buttons remain dynamic and responsive across 320px–1440px viewports.

## TASK-020 — Meet Up Page UI/UX, Room Card & Responsiveness Improvement (2026-09-12)
- Status: COMPLETE — ALL QUALITY GATES PASSED (backend tests 100%, frontend tests 75/75, frontend lint 0/0, frontend build clean, verified)
- Completion Level: `Implemented & Verified`
- Summary:
  - **Headline & Subtitle**: Page headline updated from `"Meet-Up Rooms"` to `"Meet Up"`. Subtitle updated to long sentence to concise `"Connect and meet live"`. Page metadata updated to `"Meet Up | YOIBI"`.
  - **Dynamic Host & Room Creator Resolution**: Fixed MongoDB user lookup in `backend/src/repositories/meetup.repository.js` (`enrichOwner` and `enrichOwners`) to query `User` by `_id` (`User.findOne({ _id: meetup.ownerId })` / `User.find({ _id: { $in: ownerIds } })`) instead of nonexistent `id` field. Real user avatars, display names, and `@handles` are now accurately populated and rendered for all rooms.
  - **Unified Room Card Design System (`MeetupCard.js`)**: Both Active and Past rooms now use the exact same unified card component and design hierarchy. Displays room status chips (Active pulsing dot / Ended badge), topic tags, dynamic host identity linking to `/profile/{handle}`, creator shield badge, participant count with live capacity progress bar, and action buttons.
  - **Button No-Wrap Guarantee**: Enforced `whitespace-nowrap` on `Button.js` base styles and all Meet Up buttons ("Start Meet-Up", "Join Room", "Room Full", "Room Ended", tab filters, modal buttons).
  - **Responsive UI/UX**: Optimized grid layout across mobile (320px, 375px, 390px, 430px), tablet, and desktop viewports without horizontal overflow.
  - **Console Debug Logging Cleanup**: Suppressed verbose LiveKit WebRTC internal debug logs using `setLogLevel("warn")` in `MeetupRoom.js` while preserving critical warnings and error handlers.

## TASK-019 — Videos Upload Form Collapse + Repository Cleanup (2026-09-13)
- Status: COMPLETE — ALL QUALITY GATES PASSED (backend tests 100%, frontend lint 0/0, frontend build clean, Vercel deployed, Railway deployed)
- Completion Level: `Implemented, Verified & Deployed`
- Summary:
  - **Phase 1 — Upload form inline collapse**: `VideosView.js` now manages `isUploadOpen` state and wraps `UploadVideoComposer` in a CSS Grid row-height animated shell (`.upload-composer-shell`). Collapsed: `grid-template-rows: 0fr`; expanded: `1fr`. The "Upload Video" button toggles state with `aria-expanded`; collapsed shell uses `aria-hidden` + `inert` to block keyboard access; reduced motion is handled via `@media (prefers-reduced-motion: reduce)` in `globals.css`. Successful upload auto-collapses; failed upload keeps form open.
  - **Phase 2 — Repository cleanup**: Deleted `frontend/src/features/videos/api/mock-videos.js` (zero imports, dead code); deleted root `.vercel/` (stale project link from incorrect root Vercel deploy; correct link is `frontend/.vercel/`); deleted `vercel-deploy-root.log` (deployment artifact); deleted `backend/scripts/` (empty directory). Updated `frontend/.gitignore` to ignore Next.js auto-generated `AGENTS.md`/`CLAUDE.md`. All other items verified and kept.

## TASK-018 — Fix Tweet Reply/Comment Flow — Reply Belongs To Parent Tweet, Correct Reply Counts (2026-09-13)
- Status: IMPLEMENTED — ALL QUALITY GATES PASSED (backend tests 100% incl. new reply regression suite, backend lint clean, frontend tests 75/75, frontend lint clean, frontend build clean)
- Completion Level: `Implemented & Verified` (local); production deployment in progress
- Details: see `docs/MODEL-HANDOFF-ARCHIVE.md` → "Tweet Reply/Comment Flow Architecture (TASK-018)".

## TASK-017 — Tweet Media Upload Redesign & Fix — Direct Device Upload, Secure Cloudinary Pipeline (2026-09-13)
- Status: IMPLEMENTED — ALL QUALITY GATES PASSED (backend 100%, frontend 75/75, lint 0/0, build clean; real Cloudinary E2E verified for all 5 image formats)
- Completion Level: `Implemented & Verified` (production deployment verification pending)
- Summary:
  - **Task 1 — /videos text update**: replaced "8 categories · No algorithm · Real community content" with "Discover content across categories" in `frontend/src/features/videos/ui/VideosView.js`.
  - **Task 2 — Root cause (tweet image)**: the Tweet composer required users to paste an image URL — a free-form URL with no server authorization, arbitrary asset identity, and no provenance verification.
  - **Backend changes**: new `POST /api/v1/tweets/media-signature` (server-issued Cloudinary upload intent, folder `yoibi/tweets/{userId}` + exact publicId, API secret never exposed); `createTweet` now verifies and single-use consumes every media item via `verifyAndConsumeIntent` (existence, expiry, ownership, exact publicId match, URL correspondence); validated `media: [{uploadIntentId, publicId, url, ...}]` contract; max 5 items; all-or-nothing rejection on any invalid attachment.
  - **Data architecture**: `Tweet.mediaUrls` is now an array of structured `mediaAttachmentSchema` ({url, type, publicId, width?, height?, bytes?, format?}); legacy string items and existing image-less tweets remain compatible.
  - **Cloudinary flow (secure, mirrors provenance fix)**: signature signs `public_id` + `timestamp` only (folder stays embedded in publicId); browser never sends a separate `folder` param; returned public_id must exactly equal intent publicId or upload is rejected.
  - **Image formats verified against real Cloudinary**: JPEG, PNG, WEBP, AVIF, GIF — all 5 pass. AVIF uses real libavif-encoded bytes; JPEG uses a real JPEG (hand-written stubs for those containers are rejected as corrupt — that is a fixture artifact, not a pipeline limitation).
  - **Frontend/UI**: `CreateTweetCard` uses a native hidden file input (no modal); 5-image limit enforced; adaptive preview grid (1/2/3/4/5); per-tile remove; user-facing states ("Uploading..."/"Posting..."), no infrastructure naming. `TweetMediaViewer` (full-screen, Escape/backdrop/prev-next), `TweetMediaGallery` (single-image framed preview or swipeable carousel with dots/counter), wired through `TweetCard`.
  - **Contracts synced**: `contracts/API-CONTRACT.md` + `contracts/openapi.yaml` document the new signature endpoint and the structured `media` body (both create and reply); AVIF added to supported formats.
  - **Existing tweet features preserved**: create/delete/listing/likes/replies/repost/sharing/auth/counts untouched.

## TASK-016 — Fix Video Upload Provenance Failure + Inline Upload Composer & Category Redesign (2026-09-12)
- Status: IMPLEMENTED — ALL QUALITY GATES PASSED
- Completion Level: `Implemented & Verified` (Cloudinary upload verified against the real provider; production deployment verification in progress)
- Details: see `docs/MODEL-HANDOFF-ARCHIVE.md` → "Video Upload Fix, Inline Composer & Category Redesign (TASK-016)".

## TASK-014 — Complete User Profile System — Dynamic `/profile/[username]`, Profile Editing, Avatar & Banner, Real Content Tabs (2026-09-12)
- Status: IMPLEMENTED — ALL QUALITY GATES PASSED
- Completion Level: `Implemented, Verified & Deployed` (profile route/API/contracts/tests live on Railway + Vercel; per-user interactive smoke still pending owner credentials)
- Details: see `docs/MODEL-HANDOFF-ARCHIVE.md` → "User Profile System Architecture (TASK-014)".

## TASK-012 — Phase 5 — Production Verification (Level 2) & Live Deployment Execution

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
- Frontend: `https://www.yoibi.com` — live (Vercel project linked in `frontend/.vercel`)
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

**Remaining external steps:** confirm Railway env (`BETTER_AUTH_BASE_URL`, `FRONTEND_URL`, `CORS_ORIGIN` = `https://www.yoibi.com`); redeploy both services; run real disposable-account smoke tests (email + Google) per the production verification checklist.

**Superseded (2026-09-11, auth simplification):** email verification and password reset were removed entirely (Resend stack and its env vars, the verification-email Better Auth config, and the three removed auth routes). Email/password signup creates an immediately usable account. No email provider variables are required.

### TASK-014 Responsive Feed & Mobile Navigation Redesign (2026-09-12)
- Replaced the bottom dock mobile navigation with a left-side drawer component.
- The drawer includes sliding animations, a dimming backdrop, Escape key closing, and disables body scroll while open.
- The mobile header now displays the current user's avatar and a hamburger menu icon. Both triggers open the drawer.
- The Feed page was cleaned up by removing the inline Tweet composer and filtering tabs (All Posts / Following). Actual Tweet creation remains fully functional on the dedicated /tweets route.
- Ensured icon consistency across the mobile drawer and desktop sidebar.
- Desktop profile card now displays "My Profile" instead of "View My Profile", matching the mobile navigation label.

## TASK-011 — Phase 5 — Milestone 10: Platform Hardening, End-to-End Verification & Deployment Readiness
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

### TASK-011 Implementation Checklist
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
