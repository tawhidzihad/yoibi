# YOIBI Model Handoff

This file prevents a new AI model from restarting work from zero.

## Rule
At the end of every meaningful session/task, the active model must update this file. A new model must read it before changing code.

## Current Snapshot
- Last updated: 2026-09-13
- Active task: TASK-019 — Videos Upload Form Collapse + Repository Cleanup
- Overall phase: Phase 5 — TASK-019 implemented, tested, and quality-gated (backend tests 100%, frontend lint 0/0, build clean)
- Completion status: `Implemented & Verified` (local); production deployment in progress
- Git repository status: Committed on `main`; see latest commits
- Current branch: `main`

## Session Recovery Entry (2026-09-11)
An interrupted session left uncommitted production-preparation work. It was verified, completed, and hardened:
1. **Application User Auto-Provisioning (`backend/src/middleware/auth.js`):**
   - On first authenticated request with a verified JWT `sub` that has no application `users` record, the backend creates the record from verified claims only (`handle`, `name`, `avatarUrl`), with duplicate-handle collision fallback. Required for production because Better Auth's user table and the app `users` collection are separate.
   - Completed the interrupted implementation: live moderation entry now carries `handle` (server-authoritative), and the JWT path uses the same handle-derivation chain as `verifyJwt`.
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
     - Socket.IO and its wildcard fallback were removed from YOIBI. Origin validation remains enforced for Express REST endpoints against `allowedOrigins` (`FRONTEND_URL`, `CORS_ORIGIN`, `CLIENT_URL`). Added `CLIENT_URL` configuration in `backend/src/config/env.js`.
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
- Comprehensive Admin & Moderation suite (dashboard metrics, user block/unblock, canonical 5-phase/9-stage destructive ban orchestrator with pre-cleanup audit logging, content moderation, reports queue).
- Multi-tier rate limiting (Better Auth database-backed + Express rate limiter).
- Security response headers with LiveKit camera/mic permissions.
- Railway deployment config (`backend/railway.json`) and Next.js production configuration (`frontend/next.config.js`).

## What Is Not Working / Remaining Scope (Level 2: Production Verification)
- **Live Deployment Execution**: Live credentials are now present in the local `backend/.env` (MongoDB Atlas, Cloudinary, LiveKit, Better Auth URLs) and the frontend Vercel project is linked. Remaining:
  1. Vercel deployment of `frontend/` with production environment variables.
  2. Railway deployment of `backend/` with the same production variables (`backend/railway.json` ready).
  3. Verify MongoDB Atlas network access (allowlist) and live connection from Railway.
  4. Realtime LiveKit WebRTC communication between deployed Vercel and Railway services.
  5. Execution of canonical end-to-end smoke test checklist with disposable test accounts.

## Tests/Checks Run (this session, 2026-09-11)
- Backend test suite (`npm test`): Passed 100% (9/9 test suites) — with deterministic unconfigured-services harness; now includes `backend/tests/auth-jwt.test.js` (valid/invalid/expired/wrong-issuer/wrong-audience JWT + `/auth/me` end-to-end)
- Backend ESLint (`npm run lint`): 0 errors, 0 warnings
- Backend security audit (`npm audit`): 0 vulnerabilities
- Frontend ESLint (`npm run lint`): 0 errors, 0 warnings
- Frontend unit tests (`npm test`, vitest): 7/7 passing (centralized API client JWT behavior)
- Zero secrets committed to git (`.env` files are gitignored; only variable names inspected, never printed)

## Production Auth Verification Status (TASK-013, 2026-09-11)
- **JWT pipeline**: FIXED — frontend uses official Better Auth 1.7.4 `authClient.token()` centralized in `frontend/src/lib/api/client.js`; REST client reuses it. Deployed JWKS endpoint `https://yoibi-frontend.vercel.app/api/auth/jwks` verified live (EdDSA/Ed25519); deployed `GET /api/auth/token` verified to exist (401 without session). Backend strictly validates `iss`/`aud` (= `BETTER_AUTH_BASE_URL`) and `exp`.
- **Email confirmation step**: REMOVED (2026-09-11, auth simplification). The Resend delivery stack, the confirmation-email Better Auth block, and the `/verify-email` route were deleted. Email/password signup now creates an immediately usable account (no confirmation step); password reset was also removed and `RESEND_API_KEY`/`EMAIL_FROM` are no longer used. See `docs/ENVIRONMENT.md`.
- **Google OAuth → MongoDB sync**: FIXED as a consequence of the JWT fix; the backend auto-provisions the YOIBI `users` profile from verified JWT claims on the first authenticated request. Real disposable Google-account smoke test (OAuth → `/auth/me` → MongoDB profile → tweet/video) still requires redeploy + owner go-ahead.
- **Production env requirements**: Railway `BETTER_AUTH_BASE_URL`/`FRONTEND_URL`/`CORS_ORIGIN` = `https://yoibi-frontend.vercel.app`; Vercel `NEXT_PUBLIC_BETTER_AUTH_URL` = same origin; Google redirect URI `https://yoibi-frontend.vercel.app/api/auth/callback/google`.

## Persistent Auth Storage Verification (TASK-014, 2026-09-11)
Completed the persistent Better Auth user-storage work and verified it end-to-end on the LIVE stack:
1. **Frontend Better Auth → MongoDB (commit `3e06f69`)**: `frontend/src/lib/auth.js` now uses the official Better Auth Mongo adapter (`betterAuth/adapters/mongodb`) pinned to `yoibi_database` with `transaction:false` (works on standalone and replica-set MongoDB). Passwords live only in Better Auth's `account` collection as `"<salt>:<hash>"` — never on the YOIBI app `users` profile.
2. **Lazy auth initialization (build fix)**: `betterAuth(...)` is created on the FIRST REQUEST via `getAuth()`, not at module evaluation — Next.js imports route modules during the production build's "collecting page data" phase, when runtime env vars are unavailable on the build host. A module-level init failed the Vercel build (or would bake in fallback secrets). `frontend/src/app/api/auth/[...all]/route.js` builds the Next handlers lazily the same way.
3. **Production env wiring**: `MONGODB_URI` was MISSING from the Vercel project (the pre-fix deployed frontend never used MongoDB → all `/api/auth/*` routes 500ed with the intentional production guard). The Atlas connection string was transferred from the Railway backend env to Vercel Production via `vercel env add` over stdin (never printed/committed); redeployed with `vercel --prod`.
4. **Deployments**: frontend redeployed (aliased `https://yoibi-frontend.vercel.app`); backend redeployed via `railway up` (auto-provisioning + reservation race fix now live, fresh boot confirmed via uptime).
5. **Live smoke verification (disposable account, cleaned up afterwards)**: `POST /api/auth/sign-up/email` → 200 with `emailVerified:false` (no verification gate); re-login with the same credentials → 200 (persistence); wrong password → 401 (hashed verification); `GET /api/auth/token` without session → 401 (was 500 pre-fix); `GET /api/auth/jwks` → 200 EdDSA/Ed25519; removed routes `/verify-email`, `/forgot-password`, `/reset-password` → 404; backend `/api/v1/health` → 200 with `database: connected`.
6. **Database-level verification (direct Atlas connection)**: cluster contains ONLY `yoibi_database` (plus `admin`/`local`) — the database-name enforcement (`backend/src/config/mongoUri.js`, Better Auth adapter pin) works with the transferred URI; Better Auth collections (`user`, `account`, `session`, `jwks`) coexist with YOIBI app collections in the SAME single database; NO `verification`/resend collections exist (feature removed). All disposable smoke data (2 users, 2 accounts, 3 sessions) was deleted afterwards — final counts `user=0, session=0, account=0`.
7. **Better Auth CSRF note**: `MISSING_OR_NULL_ORIGIN` (403) is returned for POSTs without an `Origin` header — scripts must send `Origin: https://yoibi-frontend.vercel.app`; browsers always do (production UI unaffected).
8. **Tests added**: `frontend/tests/better-auth-persistence.test.js` (real MongoDB via `mongodb-memory-server`: signup → logout → login → wrong-password → hash-only storage); `backend/tests/auth-architecture.test.js` (URI normalization, handle rules, profile auto-provisioning, role system, no-credential schema contract). All suites, lint, and audit pass 100% after the changes.

## Exact Resume Instruction
> TASK-012 Level 2 Production Verification: persistent-storage verification PASSED on the LIVE stack (commit `3e06f69` deployed to both Vercel and Railway on 2026-09-11). Signup → logout → re-login persistence, JWKS, `/api/auth/token` 401, removed-route 404s, and direct Atlas database verification are all done; disposable smoke data was cleaned up (Better Auth collections empty again). Remaining exact steps: (1) run the disposable Google OAuth smoke test in the browser (owner go-ahead — writes to production) to verify the YOIBI profile auto-provisioning on a Google-first login, (2) verify LiveKit realtime in the browser, (3) optionally run a disposable Tweet/Video-upload-signature check via the deployed `/api/v1` with a Bearer token.

## Authentication & User Profile Architecture (TASK-013 redesign, 2026-09-12)

1. **Canonical profile**: exactly ONE YOIBI application profile collection — `users` in `yoibi_database` — keyed by `betterAuthUserId` (unique index), with unique server-generated `handle` and indexed `email`. Both Email and Google users share this identical profile structure. Better Auth's own storage (`user`, `account`, `session`, `jwks`) remains intact and separate — it owns authentication; the `users` collection owns application profile data only. The profile NEVER contains `password`/`passwordHash`/`hashedPassword`.
2. **Email/password flow**: Signup (`/signup`) → Better Auth `signUp.email` with `autoSignIn` (immediate session; email verification does NOT exist) → first authenticated `/auth/me` upserts the canonical profile from the verified JWT (idempotent — re-login never duplicates) → onboarding fields (country ISO alpha-2 / age >=16 / phone / bio) persisted via authenticated `PATCH /users/me` → `/feed`.
3. **Google flow**: `/login` Continue with Google → Better Auth Google provider → verified Better Auth user → same canonical `users` upsert. The server derives `name`, `email`, and the Google avatar URL into `avatarUrl` from the trusted Better Auth identity server-side — NEVER from browser-submitted values. Missing onboarding data (age/country/phone/bio) stays null/empty; users complete it later via the profile flow. Repeat Google logins reuse the same document (`betterAuthUserId` lookup).
4. **JWT flow (both providers, one architecture)**: Better Auth session → `better-auth/plugins` JWT client → `Authorization: Bearer <JWT>` → Railway backend → jose verification against Better Auth JWKS (`iss`/`sub`/`exp`/`iat`) → `req.user`. Identity is always derived from the verified token — client-submitted `betterAuthUserId`/`userId`/`authorId`/`ownerId`/`role` are ignored.
5. **Role system**: exactly `user` | `admin`; default `user` for all new signups (email or Google). Client cannot self-assign; the PATCH validator `.strict()` rejects unknown fields including `role`.
6. **Signup/Login UI**: redesigned with RHF + Zod; Signup fields = Full Name, Email, Telephone (optional), Password, Confirm Password, Age (>=16), Say About You (optional), Country (canonical selector), Community Values Agreement (required, exact 7 values); no profile-picture upload on signup (`avatarUrl` starts null — add later from profile page); legacy-inspired `GlowBorderCard` hover-border sections; both pages have Back to Home. `/verify-email`, `/forgot-password`, `/reset-password` remain 404.
7. **Contracts**: `API-CONTRACT.md` + `openapi.yaml` synchronized (no `isEmailVerified`; `bio/country/age/phone` on `/auth/me`; PATCH body documented; field classification table). Frontend tests updated (`auth-simplified.test.js`).
8. **Tests/gates**: backend `npm test` 100%, lint clean, audit 0 vulns; frontend vitest 37/37, lint clean, build success.
9. **Deployment**: DONE — Railway backend (`https://yoibi-backend-production.up.railway.app`) and Vercel frontend (`https://yoibi-frontend.vercel.app`) redeployed with this architecture; health 200 `database: connected`; removed routes 404. Production Email-user smoke PASSED (signup → JWT → `/auth/me` 200 → Tweet 201 → Video upload-signature 200 → role/ID spoof rejected 422 → re-login same profile). Remaining: live Google OAuth browser smoke (needs a real Google test account + owner go-ahead); disposable smoke account `yoibi-smoke-20260912@example.com` left for audit.

## User Profile System Architecture (TASK-014, 2026-09-12)

1. **Profile route**: `frontend/src/app/(protected)/profile/[username]/page.js` renders `ProfileView`, which loads the profile from the backend by the URL handle (`GET /users/:handle`, handle normalized server-side — lowercase, `@` stripped). The app profile data source is ALWAYS the backend; `AuthContext` is used only to compare identity for owner detection.
2. **Sidebar/right-card cleanup**: `layout.js` no longer contains `/wall` items; the right-side user card shows "View My Profile" → `/profile/{currentUserHandle}` and the duplicate Sign Out was removed (only the left sidebar keeps Sign Out on desktop; mobile keeps its header Sign Out).
3. **Backend profile API**:
   - `GET /api/v1/users/:handle` (verifyJwt): explicit public allowlist + real counts (`tweetsCount`, `videosCount`, `streamsCount`, `postsCount` alias) computed via the tweets/videos/streams repositories by canonical `authorId`; `isOwner` + `isFollowing` from the verified token.
   - `PATCH /api/v1/users/me` (verifyJwt + requireAuth): strict Zod allowlist (`name`, `bio`, `avatarUrl`, `bannerUrl`, `country`, `age`, `phone`, `handle`); updates keyed exclusively by `_id` (verified `req.user.id`); duplicate handle → `422 HANDLE_TAKEN`; response sanitized (no moderation internals).
   - `POST /api/v1/users/me/upload-signature` (expensiveLimiter + auth): server-signed Cloudinary image upload intent (`yoibi/profiles/{userId}/avatars|banners`); `CLOUDINARY_API_SECRET` never leaves the server. Client uploads via `https://api.cloudinary.com/v1_1/{cloud}/image/upload` then persists `secure_url` via PATCH.
4. **Data model**: `users` (canonical) gained `bannerUrl` (Cloudinary URL string, default `''`); no separate profile collections; avatars/banners are URLs, never MongoDB binaries. `handle` remains the canonical username field (no duplicate `username` field) and is now user-editable with server-side normalization + DB-enforced uniqueness.
5. **Content tabs** (server-side filtered, paginated):
   - Tweets: `GET /tweets?authorHandle={handle}` — resolved to a canonical `authorId` in the service.
   - Videos: `GET /videos?authorId={id}` (existing filter).
   - Streams: `GET /streams?authorId={id}&status=all` — new `status=all` lifecycle filter (ready/live/ended).
6. **Author identity links**: TweetCard, VideoCard, StreamCard link to `/profile/{handle}` (dead `/wall/{handle}` links fixed). Videos/streams author enrichment bug fixed (`User.findOne({ id })` → `{ _id }` — authors now resolve real handles/avatars).
7. **Tests**: `backend/tests/users-profile.test.js` (11 sections) and `frontend/tests/profile.test.js` (12 tests). Backend: npm test 100% (9 suites), lint clean, audit 0. Frontend: vitest 55/55, lint clean, build OK (`/profile/[username]` dynamic).

## Responsive Navigation & Feed Cleanup (TASK-015, 2026-09-12)

1. **Mobile Navigation Redesign**: The fixed bottom dock was completely removed. Mobile navigation now uses a slide-out left drawer containing the main navigation links, "My Profile", and "Sign Out". 
2. **Mobile Header**: The static top-left Yoibi logo was replaced with the authenticated user's avatar and a hamburger menu icon, both of which trigger the drawer.
3. **Feed Component Cleanup**: The inline "What's on your mind" tweet composer and the filtering tabs ("All Posts", "Following") were removed from the FeedView. Users now rely on the dedicated /tweets page for tweet creation.
4. **Desktop Adjustments**: "View My Profile" was changed to "My Profile" with a consistent user icon in the desktop profile card.
5. **Consistency and Polish**: Used standard lucide-react icons (Menu, User) consistently across responsive states. Ensured full scroll-lock and accessible interactions for the mobile drawer.

## Video Upload Fix, Inline Composer & Category Redesign (TASK-016, 2026-09-12)

1. **Root cause of the video upload 403**: The backend signed both `folder` and `public_id` and the client sent both parameters to Cloudinary. Cloudinary treats `public_id` as relative to `folder` when both are provided, so the stored asset path doubled (`folder/folder/public_id`) and the strict asset-provenance check on `POST /videos` rejected registration ("Provided asset publicId does not match the server-authorized upload intent.").
2. **Fix**: Signatures now cover `public_id` + `timestamp` only (`backend/src/integrations/cloudinary/cloudinary.js` — video AND image intents); the browser no longer sends a separate `folder` parameter (`videosApi.uploadToCloudinary`, `profileApi` image upload). Folder structure remains fully server-controlled because it is embedded in the authorized `public_id`. No validation was weakened: public_id provenance checks, intent ownership, single-use consumption, auth, and rate limits are unchanged.
3. **Verified against the real Cloudinary provider**: a real small `.mp4` uploaded with the fixed parameter set returns a `public_id` exactly equal to the server-authorized one; `verifyAndConsumeIntent` accepts it. Same verification done for the image upload flow.
4. **Upload UX**: the upload modal was removed. The Videos page now expands an inline composer (consistent with the Tweet composer) containing file selection with a local video preview, title, category chips, description, live progress ("Uploading video..." / "Processing video..."), cancel/reset, and a success state. User-facing copy never mentions infrastructure (no "Cloudinary", signatures, or intent details); raw errors are only logged to the console.
5. **Category UI**: the horizontal scrolling pill row was replaced with wrapping chip-style buttons with semantic lucide icons (Landmark, Newspaper, BookOpen, Building2, PartyPopper, MessageSquare, Mic, Tv), clear active/hover/focus states, and touch-friendly sizing. Category filtering API behavior is unchanged.
6. **Page header**: supporting text simplified to "Discover content across categories".
7. **Contracts**: `API-CONTRACT.md` and `openapi.yaml` now document the signed-parameter rule (public_id + timestamp only, `folder` informational) and the `publicId` field on `POST /videos`.
8. **Tests**: new backend regression test (Test 8b: signature must cover public_id + timestamp only); stale frontend test assertion ("View My Profile") aligned with the intentional TASK-015 rename. Backend npm test 100% + lint clean; frontend vitest 60/60 + lint clean + build OK.

## Tweet Reply/Comment Flow Architecture (TASK-018, 2026-09-13)

1. **Data relationship (unchanged, now used correctly)**: a reply IS a `Tweet` document with `replyToId` set to its parent tweet's `_id` (indexed, with `{ replyToId: 1, createdAt: 1 }`). Parent tweets carry a server-maintained `repliesCount`. Top-level queries (`findPaginated`, `count`) already filter `{ replyToId: null }` — the feed and profile tweet list/count were correct by design; they were only fed bad data.
2. **Root cause of the bug**: on `POST /api/v1/tweets/:id/replies`, the route injected `req.body.replyToId = req.params.id` AFTER the body `validate()` middleware had already produced `req.validatedBody`. `handleCreateTweet` reads from `req.validatedBody`, so the injected parent id was shadowed and every reply was persisted with `replyToId: null` — a standalone top-level tweet: parent `repliesCount` never moved, replies polluted the feed AND the replier's profile list, and profile tweet counts were inflated.
3. **Fix**: `req.body.replyToId` is now injected BEFORE `validate(createReplySchema, "body")` in `backend/src/routes/tweets.routes.js`, and `createReplySchema` (`backend/src/validators/tweets.validator.js`) REQUIRES `replyToId` — fail-safe, a reply without a resolvable parent is rejected 422 instead of silently becoming a standalone tweet. Replying to a non-existent parent returns 404 `NOT_FOUND`.
4. **Client contract unchanged**: the reply request body remains `{ content, media? }`; `replyToId` is server-derived from the URL and never trusted from the client. `contracts/API-CONTRACT.md` documents this; `openapi.yaml` needed no change.
5. **Frontend** (`frontend/src/features/tweets/ui/TweetReplySection.js`): the visible reply count is derived from the computed next replies array and is updated only AFTER the server confirms the reply/deletion. The server response is the source of truth — a rejected reply never changes the count.
6. **Regression tests** (`backend/tests/tweets.test.js`): HTTP-level root-cause test (real Better-Auth-style JWT → reply persisted WITH `replyToId` and parent `repliesCount` incremented) plus service-level tests for feed/profile exclusion of replies, multi-reply counts, embedded reply thread, orphan-reply 404, and reply-deletion count decrement.
7. **Historical data note**: tweets created BEFORE this fix that were intended as replies may exist with `replyToId: null` in production. They are indistinguishable from genuine standalone tweets (no deterministic migration), so NO data migration was performed — existing data was deliberately left untouched per the database-safety rule. All NEW replies are stored correctly.

## Videos Upload Form Collapse + Repository Cleanup (TASK-019, 2026-09-13)

### Phase 1 — Upload Form Inline Collapse

1. **Behavior**: The `/videos` page now renders the `UploadVideoComposer` as an always-mounted, height-animated inline composer below the page header. It starts collapsed; clicking "Upload Video" expands it; clicking again or clicking "Cancel" collapses it; a successful upload auto-collapses it; a failed upload keeps it open for error recovery.
2. **Implementation strategy**: CSS Grid row-height animation (`grid-template-rows: 0fr → 1fr`). The outer `.upload-composer-shell` div uses `display: grid` with `grid-template-rows: 0fr` (collapsed) or `1fr` (expanded, toggled by `data-open="true"`). The inner wrapper uses `overflow: hidden` so the content clips to zero height when collapsed.
3. **Accessibility**:
   - `aria-expanded` on the "Upload Video" button reflects open/collapsed state.
   - `aria-hidden` on the shell prevents the hidden form from being announced.
   - `inert` attribute prevents keyboard focus reaching hidden form elements while collapsed.
4. **Reduced motion**: `transition: none` applied to `.upload-composer-shell` via `@media (prefers-reduced-motion: reduce)` in `globals.css`.
5. **Auto-collapse on success**: `handleVideoUploaded` in `VideosView.js` calls `setIsUploadOpen(false)` after prepending the new video to the list; `UploadVideoComposer.onSubmit` also calls `onClose?.()` after a successful upload for belt-and-suspenders collapse.
6. **Files modified**: `frontend/src/features/videos/ui/VideosView.js`, `frontend/src/features/videos/ui/UploadVideoComposer.js`, `frontend/src/app/globals.css`.

### Phase 2 — Repository Cleanup

| Item | Action | Reason |
|------|--------|--------|
| `frontend/src/features/videos/api/mock-videos.js` | **Deleted** | Zero imports found anywhere in the codebase; purely dead code. |
| `vercel-deploy-root.log` (root) | **Deleted** | Deployment artifact from an incorrect root-level Vercel deploy; gitignored, local-only clutter. |
| `.vercel/` (root) | **Deleted** | Stale Vercel project link (`projectId: prj_O2hmuHav6Wf1vyKoSKGqfcA7zOvo`, `projectName: yoibi`) from an incorrect root deployment. The correct project is `frontend/.vercel/` (`projectName: yoibi-frontend`). Both are gitignored; only the root one was stale. |
| `backend/scripts/` | **Deleted** | Directory was empty; no references anywhere. |
| `frontend/.gitignore` | **Updated** | Added `AGENTS.md` and `CLAUDE.md` — auto-generated by Next.js 16 `agentRules` feature at dev/build time; not source files. |
| `frontend/AGENTS.md`, `frontend/CLAUDE.md` | **Ignored** (not committed) | Runtime artifacts auto-generated by Next.js; added to `frontend/.gitignore`. |
| `legacy/` | **Kept** | Intentional read-only reference to the original YOIBI project during migration. Documented in `PROJECT-STRUCTURE.md`. |
| `START-PROMPT.md` | **Kept** | Active project document — instructs AI agents on how to resume work in this repository. |
| `PROJECT-STRUCTURE.md` | **Kept** | Active architecture documentation. |
| `frontend/src/features/videos/constants/categories.js` | **Kept** | Actively imported by `VideosView.js` and `UploadVideoComposer.js`. |
| `frontend/src/features/videos/constants/categoryIcons.js` | **Kept** | Actively imported by `VideosView.js` and `UploadVideoComposer.js`. |
| All docs, contracts, CI files | **Kept** | Active project documentation and configuration. |

### Quality Gates (TASK-019)
- Backend tests (`npm test`): **100% passing** (all suites)
- Backend lint (`npm run lint`): **0 errors, 0 warnings**
- Frontend lint (`npm run lint`): **0 errors, 0 warnings**
- Frontend build (`npm run build`): **Clean** — all 17+3 routes compiled
- No secrets tracked; no temporary files committed

