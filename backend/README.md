# YOIBI Backend Application

Standalone CommonJS Node.js + Express.js backend service powering the YOIBI modern social platform.

---

## 1. Installation & Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run in development mode (with node --watch)
npm run dev

# Run automated tests
npm test

# Run ESLint check
npm run lint

# Start production server
npm start
```

---

## 2. Environment Configuration

Copy the sample environment file:
```bash
cp .env.example .env
```

| Variable | Description | Default / Example | Required |
|---|---|---|---|
| `NODE_ENV` | Runtime environment | `development` / `production` | Yes |
| `PORT` | HTTP listener port | `5000` (auto-assigned on Railway) | Yes |
| `HOST` | Bind host address | `0.0.0.0` (required for containers/Railway) | Yes |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/yoibi_database` | Yes in Prod |
| `BETTER_AUTH_BASE_URL` | Better Auth server origin | `http://localhost:3000` | Yes |
| `BETTER_AUTH_SECRET` | Shared secret with Better Auth | `replace_with_secure_random_secret` | Yes |
| `BETTER_AUTH_JWKS_URL` | Public JWKS endpoint URL | Auto-derived from `BETTER_AUTH_BASE_URL` | Optional |
| `FRONTEND_URL` | Trusted Next.js frontend origin | `http://localhost:3000` | Yes |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | `your_cloudinary_cloud_name` | Yes for Videos |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your_cloudinary_api_key` | Yes for Videos |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_cloudinary_api_secret` (never browser) | Yes for Videos |
| `LIVEKIT_URL` | LiveKit SFU WebSocket URL | `wss://your-project.livekit.cloud` | Yes for Streams/MeetUp |
| `LIVEKIT_API_KEY` | LiveKit API key | `your_livekit_api_key` | Yes for Streams/MeetUp |
| `LIVEKIT_API_SECRET` | LiveKit API secret | `your_livekit_api_secret` (never browser) | Yes for Streams/MeetUp |

> **Security Rule:** Never commit real `.env` files. Keep `.env.example` as the canonical documentation. Full cross-application reference is documented in [docs/ENVIRONMENT.md](/docs/ENVIRONMENT.md).
> 
> **Social Domain Rule:** In YOIBI, Tweet is the primary social content entity. `POST` is strictly an HTTP request method (e.g. `POST /api/v1/tweets`), not a separate content domain. All user micro-posts, likes, retweets, and replies are managed under `/api/v1/tweets`.

---

## 3. Architecture & Layer Boundaries

```text
backend/src/
├── app.js               # Express app instance, security headers, CORS, error middleware
├── server.js            # Server entrypoint, 0.0.0.0 listener, graceful shutdown
├── config/              # Environment validator (env.js) and Mongoose connector (db.js)
├── middleware/          # JWT verification (auth.js), auth guards (authorize.js), error handling
├── routes/              # Express routers (index.js, health.routes.js, auth.routes.js)
├── controllers/         # HTTP request/response handlers (create, read, update, delete)
├── services/            # Pure business logic layers
├── repositories/        # MongoDB database access layer
├── models/              # Mongoose data schemas
├── validators/          # Request validation schemas
├── integrations/        # Vendor SDK wrappers (Cloudinary, LiveKit)
└── utils/               # Generic utility helpers
```

---

## 4. Authentication & Authorization Architecture

- **Single Auth Authority:** Better Auth handles user registration, passwords, and sessions. (Email verification and password reset are removed: signup creates an immediately usable account; users sign in right away.)
- **JWT Plugin:** Issues verifiable JWTs containing user claims (`sub`, `email`, `role`, `isBlocked`).
- **Backend Verification:** `verifyJwt` middleware uses `jose` to verify incoming `Authorization: Bearer <jwt>` against the Better Auth JWKS endpoint (`createRemoteJWKSet`).
- **Issuer/Audience/Expiry:** Strictly enforced — `iss` and the default `aud` both equal Better Auth's baseURL (Better Auth v1.7.4 behavior, verified in the installed package), so both are validated against `BETTER_AUTH_BASE_URL`; expired tokens return `401 TOKEN_EXPIRED`. In production `BETTER_AUTH_BASE_URL` must be the deployed frontend origin (`https://yoibi-frontend.vercel.app`), never `http://localhost:3000`.
- **Uniform Security Boundary:** Email/password and Google OAuth users pass through the exact same JWT verification path. There is no separate Google authentication path.
- **MongoDB Profile Sync:** The YOIBI application `users` record (MongoDB) is created/upserted server-side on the first verified-JWT request (`GET /api/v1/auth/me` or any protected route) using verified JWT claims only — the Better Auth user ID is the canonical identity; client-supplied user IDs are never trusted.
- **Identity Derivation:** `req.user` is attached exclusively by verified token claims. Client-supplied IDs or roles are never trusted.
- **Access Gates:**
  - `requireAuth`: Guards protected routes against anonymous callers.
  - `requireAdmin`: Enforces `req.user.role === "admin"`.
  - `requireOwnerOrAdmin`: Enforces resource ownership.
  - `ACCOUNT_BLOCKED`: Instantly denies blocked accounts (HTTP 403).

---

## 5. Health & Monitoring

- Endpoint: `GET /api/v1/health`
- Envelope:
  ```json
  {
      "success": true,
      "data": {
          "status": "healthy",
          "timestamp": "2026-09-11T00:14:00.000Z",
          "database": "connected",
          "version": "1.0.0"
      },
      "message": "Backend service healthy"
  }
  ```

---

## 6. Realtime Architecture

**Socket.IO is not used in the current YOIBI product scope.** Direct messaging and notifications were intentionally removed; the `backend/src/sockets/` directory no longer exists and no `socket.io` package is installed.

- **LiveKit is the realtime transport** for all in-product realtime features — Streams (live broadcasts) and Meet-Up rooms (collaborative multi-peer sessions) use LiveKit SFU with server-issued access tokens.
- **No WebSocket gateway** is attached to the HTTP listener. The remaining realtime surfaces are driven by LiveKit rooms (`wss://livekit.yoibi.com`) orchestrated through LiveKit server SDK calls.

---

## 7. Admin & Moderation Architecture

- **Canonical Identity Mapping:** The Better Auth User ID (`String`) is the application-wide ownership identity across all entities (`Tweet.authorId`, `Video.authorId`, `Stream.authorId`, `MeetUp.ownerId`, `Follow.followerId/followingId`, `Report.reporterId`). MongoDB `User._id` maps 1:1 to the Better Auth User ID string. Autogenerated ObjectIds are never used for user identity.
- **Better Auth Authentication Authority:** Uses official `better-auth` v1.7.4 `admin()` plugin (`auth.api.banUser`, `unbanUser`, `removeUser`, `revokeUserSessions`). No direct raw database mutations on undocumented internal Better Auth collections.
- **Strict Block vs Ban Semantics:**
  - **Block (Reversible):** Sets `isBlocked = true`, invokes Better Auth `banUser` + session revocation. All user data is preserved 100%. Protected endpoints return HTTP 403 `ACCOUNT_BLOCKED`.
  - **Unblock (Reversible):** Sets `isBlocked = false`, invokes Better Auth `unbanUser`. Access is restored.
  - **Ban (Irreversible Purge):** Phased destructive cleanup purging all owned content, terminating LiveKit rooms, deleting Cloudinary media, permanently deleting Better Auth account via `removeUser`, and deleting MongoDB `User` profile.
- **Durable Ban State Machine & Pre-Cleanup Audit Log:** Audit log record is created in MongoDB *before* any destructive work begins (`action: 'BAN_USER'`, `status: 'IN_PROGRESS'`). Tracks lifecycle: `REQUESTED` -> `IN_PROGRESS` -> `COMPLETED` / `PARTIAL` / `FAILED`. Operations are strictly idempotent and resumable.
- **Admin Self-Protection:** Admin cannot ban/block self; admin cannot ban/block another admin.
- **Reports Preservation:** Reports are permanent moderation history. Never cascade-deleted upon user deletion. Missing actors gracefully resolve to "Unknown user".

---

## 9. Railway Deployment Readiness

- Reads `PORT` dynamically from the environment.
- Binds listener explicitly to `0.0.0.0`.
- Health check configured for zero-downtime deployment probes at `/api/v1/health`.
- Graceful shutdown handles `SIGTERM` / `SIGINT` and cleanly disconnects Mongoose.
- Fails fast on missing required production environment variables.

