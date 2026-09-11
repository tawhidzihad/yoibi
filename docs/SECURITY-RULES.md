# YOIBI Security Rules

## 1. Authentication Architecture
- Better Auth manages user authentication, password hashing, and session lifecycles.
- Better Auth JWT plugin supplies a verifiable JWT and JWKS endpoint (`/api/auth/jwks`).
- Backend protected APIs verify the Bearer token against the JWKS endpoint before business logic.
- The frontend is an additional UX/request guard, never the final security boundary.
- **JWT acquisition flow (single centralized path)**:
  1. User session established (email/password after verification, or Google OAuth) -> primary Better Auth session cookie.
  2. Frontend calls `authClient.token()` (`GET /api/auth/token`) — the official Better Auth v1.7.4 client API — implemented ONCE in `frontend/src/lib/api/client.js` (`getJwtToken()`); REST client and Socket.IO hooks both reuse it. The Better Auth session cookie is never itself used as the external-service token.
  3. `Authorization: Bearer <JWT>` attached by the centralized API client; malformed headers (`Bearer undefined`/`Bearer null`) are impossible — a missing/failed JWT yields NO header and a clean 401 error state.
- **JWT Verification**:
  - `jwtVerify` validates the cryptographic signature against the remote JWKS set.
  - Issuer validation (`issuer: env.BETTER_AUTH_BASE_URL`) is strictly enforced.
  - Token expiration (`exp`) is checked (`1d` TTL). Expired tokens return `401 TOKEN_EXPIRED`.
  - Audience validation (`aud` claim): Better Auth v1.7.4's `jwt()` plugin sets the default `aud` claim to the Better Auth baseURL (verified in the installed package: `dist/plugins/jwt/sign.mjs` calls `setAudience(aud ?? defaultAud)`). Audience validation is therefore STRICTLY enforced (`audience: env.BETTER_AUTH_BASE_URL`) — tokens issued for any other audience are rejected with 401.
  - `isBlocked` is checked on the JWT payload AND re-verified against live database state on every request via `getLiveUserModeration` with a 30s cache TTL to prevent stale JWT bypasses.
  - **Application User Record Auto-Provisioning:** If a verified JWT `sub` has no corresponding record in the application `users` collection (e.g., first authenticated request after deployment, or after the 5-phase ban purge), the backend creates the record server-side from verified JWT claims only (`handle`, `name`, `avatarUrl`). Handles are derived server-side (`payload.handle`/`username`/email local-part) with duplicate-handle collision resolution; client-supplied identity fields are never trusted for role, block state, or ownership. Roles always default to `user` unless set by an admin server-side.

## 2. Authorization & Least Privilege
- Backend checks the authenticated user on every protected operation.
- Never trust `userId`, `role`, `isAdmin`, ownership, or permissions from the client body or params.
- Derive the acting user ID exclusively from the verified token/session context (`req.user.id`).
- Resource mutations enforce ownership (`resource.authorId === req.user.id` or `req.user.role === 'admin'`).
- Admin actions require server-side admin authorization (`verifyJwt` -> `requireAuth` -> `requireAdmin`).
- Self-block, self-ban, and admin-to-admin bans are strictly rejected.

## 3. Rate Limiting & Abuse Prevention
- **Better Auth Rate Limiting**: Auth endpoints (`/api/auth/*`) run inside Next.js and use Better Auth's built-in, database-backed `rateLimit` configuration with explicit custom rules for sensitive endpoints (`/sign-in/email`, `/sign-up/email`, `/forget-password`, `/reset-password`, `/send-verification-email`). Distributed state is shared reliably without relying on stateless Edge Runtime memory or requiring external Redis. Vercel L3/L4/L7 DDoS and WAF protections act as the production backstop.
- **Backend Rate Limiting (`express-rate-limit`)**:
  - `globalLimiter`: 300 requests / 1 min per IP across all endpoints.
  - `authLimiter`: 15 requests / 15 min per IP on `GET /auth/me`.
  - `writeLimiter`: 60 requests / 1 min per IP on social/content mutations (tweets, replies, likes, messages, follow, notifications).
  - `expensiveLimiter`: 10 requests / 15 min per IP on media signatures, stream create/start/join, and meetup create/join.
  - `reportLimiter`: 20 requests / 1 hour per IP on `POST /reports`.
  - `adminLimiter`: 60 requests / 1 min per IP on all `/admin/*` operations.
  - All limiters skip automatically when `NODE_ENV === 'test'`.
  - All 429 responses return standard error envelope: `{ success: false, error: { code: 'RATE_LIMITED', message: '...' } }`.
- **Request Abuse & Input Bounds**:
  - Admin search queries are capped at 100 characters to prevent regex denial-of-service.
  - User profile update fields are bounded (name: 50 chars, bio: 280 chars, avatarUrl: 1000 chars).
  - Tweet content: max 280 chars. Direct message: max 2000 chars. Report description: max 2000 chars. Admin reason: max 1000 chars.
  - Video upload size: max 100 MB (`104,857,600` bytes).

## 4. Secrets Isolation
Never expose to the browser:
- MongoDB URI (`MONGODB_URI`)
- Better Auth signing secret (`BETTER_AUTH_SECRET`)
- Cloudinary API secret (`CLOUDINARY_API_SECRET`)
- LiveKit API secret (`LIVEKIT_API_SECRET`)
- Admin credentials

Only explicitly public client variables may use the `NEXT_PUBLIC_` prefix (`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`).

## 5. HTTP, Realtime & Network Safety
- **CORS & Origin Validation**:
  - Strict origin validation using `allowedOrigins` (`FRONTEND_URL`, `CORS_ORIGIN`, `CLIENT_URL`).
  - Socket.IO CORS never uses wildcard `*` in production.
- **Security Response Headers (`next.config.js`)**:
  - `X-Frame-Options: DENY` (anti-clickjacking)
  - `X-Content-Type-Options: nosniff` (anti-MIME sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS)
  - `Permissions-Policy: camera=(self), microphone=(self), geolocation=(), interest-cohort=()` (permits LiveKit camera/mic on same-origin pages while blocking unauthorized third-party embeds)
- **Content Security Policy (CSP)**:
  - Restrictive CSP is intentionally deferred for post-MVP hardening to prevent breakage of LiveKit WebRTC media transport, WebSocket upgrade protocols, inline Next.js Turbopack hydration scripts, and Cloudinary media delivery.
- **Socket.IO Realtime Security**:
  - Connection handshake verifies JWT Bearer token before accepting socket connections.
  - Personal rooms (`user:<userId>`) isolate private message and notification delivery.
  - Conversation rooms (`conv:<id>`) enforce participant authorization before admitting sockets.

## 6. LiveKit & Realtime Media Access Policy
- **Stream Discovery & Viewing**:
  - Stream discovery (`GET /streams`, `GET /streams/:id`) is public.
  - Stream join (`POST /streams/:id/join`) uses `optionalAuth`. Anonymous viewers receive viewer-only LiveKit tokens (`canPublish: false`, `canSubscribe: true`) with an opaque identity (`viewer_<uuid>`).
  - Only authenticated users may create streams (`POST /streams`) or start broadcasting (`POST /streams/:id/start`).
  - Anonymous viewers cannot publish media and cannot perform authenticated social actions (likes, comments, follows).
- **Meet-Up Collaborative Rooms**:
  - All Meet-Up participants require authentication (`verifyJwt`).
  - Room capacity is strictly enforced with reservation TTLs and atomic slot management.
  - Presentation metadata contains only sanitized display attributes (`name`, `handle`, `avatarUrl`) with zero internal user IDs.
- **Zero-PII Media Tokens**:
  - LiveKit rooms use random UUIDs (`stream_<uuid>`, `meetup_<uuid>`).
  - LiveKit identities are opaque (`host_<uuid>`, `viewer_<uuid>`, `participant_<uuid>`).

## 7. Cloudinary Media Asset Provenance
- Direct video uploads require a server-issued upload intent (`POST /videos/upload-signature`).
- Signatures enforce server-controlled folders (`yoibi/videos/{userId}`) and unique intent IDs.
- Metadata registration (`POST /videos`) validates intent ownership and single-use consumption.
- Asset deletion uses server-side signed API requests with `CLOUDINARY_API_SECRET`.

## 8. Admin Moderation & Ban Orchestration
- **Block**: Access-denial state (`isBlocked: true`). Revokes Better Auth sessions and immediately denies API and socket access with 403 `ACCOUNT_BLOCKED`. User is redirected to account-blocked page. Unblock restores access.
- **Ban**: Permanent destructive data cleanup orchestrated across 5 phases and 9 stages. Requires handle confirmation. Purges tweets, replies, videos, Cloudinary assets, LiveKit sessions, follows, notifications, and deletes MongoDB and Better Auth accounts while preserving an immutable AuditLog record.

## 9. Code Readability & Maintenance
Security code must remain clean, modular, and maintainable. Avoid monolithic middleware files, magic condition chains, or unexplained security abstractions.
