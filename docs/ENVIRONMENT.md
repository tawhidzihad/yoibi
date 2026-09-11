# YOIBI Environment Variables & Configuration Architecture

This document is the authoritative reference for all environment variables across the YOIBI platform.

YOIBI is architected as two decoupled, independently deployable applications:
1. **Frontend (`frontend/`)**: Next.js (App Router) client UI + Next.js server runtime (Better Auth server handler & session APIs).
2. **Backend (`backend/`)**: Node.js + Express REST API, MongoDB Mongoose data layer, Socket.IO gateway, LiveKit token authority, and Cloudinary upload intent signing authority.

---

# 1. Master Environment Variable Ownership Matrix

| Variable | Owner | Classification | Browser Safe | Required in Prod | Default / Local Example | Production Requirement | Purpose |
|---|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | Public (Client) | **Yes** | **Yes** | `http://localhost:5000/api/v1` | `https://api.yourdomain.com/api/v1` | Base REST API URL for frontend-to-backend communication. |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Frontend | Public (Client) | **Yes** | **Yes** | `http://localhost:3000` | `https://yourdomain.com` | Base URL for Better Auth authentication client & server endpoints. |
| `NEXT_PUBLIC_SOCKET_URL` | Frontend | Public (Client) | **Yes** | No (Optional) | `http://localhost:5000` (or empty) | `https://api.yourdomain.com` (or empty) | Optional override for Socket.IO realtime connection URL; auto-derived if empty. |
| `BETTER_AUTH_SECRET` | Frontend & Backend | Server-Only Secret | **NO** | **Yes** | `replace_with_secure_random_32_character_secret` | Random 32+ char cryptographic secret | Signs Better Auth sessions/JWTs on frontend and verifies them / signs admin API calls on backend. |
| `GOOGLE_CLIENT_ID` | Frontend | Server-Only Config | **NO** | No (Optional) | `your_google_oauth_client_id` | Valid Google OAuth Client ID | Google Social Login OAuth Client ID. Production redirect URI: `https://yoibi-frontend.vercel.app/api/auth/callback/google` (must match the Google Cloud Console OAuth client exactly; update it if a custom domain is adopted). |
| `GOOGLE_CLIENT_SECRET` | Frontend | Server-Only Secret | **NO** | No (Optional) | `your_google_oauth_client_secret` | Valid Google OAuth Client Secret | Google Social Login OAuth Client Secret. |
| `MONGODB_URI` (Frontend) | Frontend | Server-Only Secret | **NO** | **Yes** | `mongodb://localhost:27017/yoibi_database` | `mongodb+srv://<user>:<pass>@cluster.mongodb.net/yoibi_database?retryWrites=true&w=majority` | Server-only connection string for the **Better Auth Mongo adapter** (persistent user/account/session storage in `yoibi_database`). Same Atlas cluster/database as the backend. NEVER exposed to the browser. |
| `NODE_ENV` | Backend | Server-Only Config | **NO** | **Yes** | `development` | `production` | Node execution environment mode (`development`, `production`, `test`). |
| `PORT` | Backend | Server-Only Config | **NO** | **Yes** | `5000` | Auto-assigned (e.g. `$PORT` on Railway) | TCP listening port for Express HTTP and WebSocket server. |
| `HOST` | Backend | Server-Only Config | **NO** | **Yes** | `0.0.0.0` | `0.0.0.0` | Bind host address (0.0.0.0 required for containers and Railway). |
| `MONGODB_URI` | Backend | Server-Only Secret | **NO** | **Yes** | `mongodb://localhost:27017/yoibi_database` | `mongodb+srv://<user>:<pass>@cluster.mongodb.net/yoibi_database?retryWrites=true&w=majority` | MongoDB connection string. The database name is **always** `yoibi_database`; the backend normalizes the URI (inserting `/yoibi_database` when missing, replacing `test`/sibling names) and verifies the active database after connecting. Never a `test`/`dev`/`sample` DB. |
| `BETTER_AUTH_BASE_URL` | Backend | Server-Only Config | **NO** | **Yes** | `http://localhost:3000` | `https://yourdomain.com` | Next.js frontend origin used for server-to-server admin calls and default JWKS derivation. |
| `BETTER_AUTH_JWKS_URL` | Backend | Server-Only Config | **NO** | No (Optional) | Empty (auto-derived) | `https://yourdomain.com/api/auth/jwks` (or empty) | Explicit remote JWKS endpoint; defaults to `${BETTER_AUTH_BASE_URL}/api/auth/jwks`. |
| `FRONTEND_URL` | Backend | Server-Only Config | **NO** | **Yes** | `http://localhost:3000` | `https://yourdomain.com` | Trusted frontend origin URL. |
| `CORS_ORIGIN` | Backend | Server-Only Config | **NO** | **Yes** | `http://localhost:3000` | `https://yourdomain.com` | Allowed origin for Express REST endpoints and Socket.IO CORS policies. |
| `CLOUDINARY_CLOUD_NAME` | Backend | Server-Only Config | **NO** | **Yes** (Videos) | `your_cloudinary_cloud_name` | Cloudinary account name | Cloudinary cloud name for video media management. |
| `CLOUDINARY_API_KEY` | Backend | Server-Only Config | **NO** | **Yes** (Videos) | `your_cloudinary_api_key` | Cloudinary API Key | Cloudinary API Key for generating signed upload signatures. |
| `CLOUDINARY_API_SECRET` | Backend | Server-Only Secret | **NO** | **Yes** (Videos) | `your_cloudinary_api_secret` | Cloudinary API Secret | Cloudinary signing secret for SHA-256 signatures and asset purge operations. |
| `LIVEKIT_URL` | Backend | Server-Only Config | **NO** | **Yes** (Streams/MeetUp) | `wss://your-project.livekit.cloud` | LiveKit Cloud WebSocket URL | LiveKit SFU server URL (sent securely to authenticated clients in room tokens). |
| `LIVEKIT_API_KEY` | Backend | Server-Only Config | **NO** | **Yes** (Streams/MeetUp) | `your_livekit_api_key` | LiveKit API Key | LiveKit API key for room creation and participant token minting. |
| `LIVEKIT_API_SECRET` | Backend | Server-Only Secret | **NO** | **Yes** (Streams/MeetUp) | `your_livekit_api_secret` | LiveKit API Secret | LiveKit signing secret for JWT access tokens and server SDK room management. |

---

# 2. Service-by-Service Classification

## 2.1 Better Auth & JWT Verification
- **Frontend**: Better Auth runs as a server route handler at `frontend/src/app/api/auth/[...all]/route.js`. It consumes `NEXT_PUBLIC_BETTER_AUTH_URL` for public client redirection and `BETTER_AUTH_SECRET` for signing sessions and JWT tokens.
- **JWT acquisition (single centralized path)**: The frontend acquires the external-service JWT exclusively via the official Better Auth JWT plugin client API — `authClient.token()` (`GET /api/auth/token`, session-cookie authenticated) — implemented once in `frontend/src/lib/api/client.js` (`getJwtToken()`) and reused by REST calls and Socket.IO hooks. The previous `authClient.getJwtToken()` call resolved to a non-existent route in Better Auth v1.7.4 and produced no token at all.
- **Session vs JWT distinction**: The primary Better Auth session cookie stays with Better Auth. The JWT plugin issues a separate, JWKS-verifiable token (`iss` = `aud` = Better Auth baseURL, `sub` = Better Auth user ID, `exp` = 1d) used ONLY for `Authorization: Bearer` calls to the Railway Express API and Socket.IO. The session cookie is never used as the external-service token.
- **Backend**: Express verifies incoming JWT tokens (`Authorization: Bearer <token>`) against the Better Auth public JWKS endpoint (`createRemoteJWKSet`, default `${BETTER_AUTH_BASE_URL}/api/auth/jwks`, override with `BETTER_AUTH_JWKS_URL`) and uses `BETTER_AUTH_SECRET` for HMAC signature verification on administrative actions (`auth.api.banUser`, `unbanUser`, `removeUser`).
- **Production JWKS**: `https://yoibi-frontend.vercel.app/api/auth/jwks` (verified live: EdDSA/Ed25519 key with `kid`). Railway's `BETTER_AUTH_BASE_URL` must be `https://yoibi-frontend.vercel.app` (never `http://localhost:3000`), because it determines both the JWKS URL and the strictly validated `iss`/`aud` claims.
- **Rule**: `BETTER_AUTH_SECRET` must be identical on both Frontend and Backend environments.
- **Persistent storage (single authority)**: Better Auth stores users, email/password credentials (hashed), authentication sessions, and OAuth provider accounts in MongoDB via the official Better Auth **MongoDB adapter** (`better-auth/adapters/mongodb`). The adapter targets the same `MONGODB_URI` → `yoibi_database` (collections `user`, `session`, `account`, `verification`). Without this adapter Better Auth falls back to an **in-memory** store and users could not log in after a restart — the adapter is required in every environment. The YOIBI application `users` collection NEVER stores passwords or verification state.
- **No verification / no password reset**: Email verification and password reset are removed from YOIBI (no emailer, no hooks, no routes). Email/password signup creates an immediately usable account; the only login methods are email+password and Google OAuth.

## 2.1.1 Transactional Email (Removed)
- **Removed**: YOIBI no longer sends any transactional email. Account-confirmation emails and password reset were removed from the authentication system.
- **Behavior**: `frontend/src/lib/auth.js` configures Better Auth with `emailAndPassword.enabled` only — no extra account gate is set (Better Auth default), there is no account-email sender block, and there is no password-reset hook. Signup creates an immediately usable account; the user signs in right away.
- **Environment variables**: `RESEND_API_KEY` and `EMAIL_FROM` are no longer used by any code and are removed from `.env.example` files and from Vercel/Railway environment requirements.

## 2.2 MongoDB
- **One database — `yoibi_database`** (Atlas). YOIBI uses exactly one database with two related data layers:
  1. **Better Auth (authentication-owned)**: the frontend server runtime connects through the official Better Auth Mongo adapter and owns the `user`, `session`, and `account` collections — email, hashed password credentials, login sessions, and OAuth (Google) provider accounts. Better Auth is the SINGLE authentication authority. No email-verification or password-reset flows exist, so no verification/resend state is stored anywhere.
  2. **YOIBI application profile**: the Express backend connects with Mongoose and owns the `users` collection plus all feature collections (`tweets`, `videos`, `streams`, `meetup_rooms`, `follows`, `conversations`, `messages`, `notifications`, `reports`, `auditLogs`).
- **Identity mapping (single canonical identity)**: `users._id` (String) ≡ Better Auth user ID (JWT `sub`). All ownership fields reuse the same string: `Tweet.authorId`, `Video.authorId`, `Stream.authorId`, `MeetUp.ownerId`, follow/message/notification/report IDs, and admin target IDs. There is no second/duplicate identity field.
- **No password duplication**: the application `users` profile has NO `password`/`passwordHash`/`hashedPassword` fields; credentials live only in Better Auth storage.
- **Database-name enforcement**: `backend/src/config/mongoUri.js` normalizes `MONGODB_URI` so the resolved database is always `yoibi_database` (inserted when the URI omits a database segment — MongoDB would otherwise default to `test` — and replacing accidental `test`/`sampledb` names); `backend/src/config/db.js` verifies and logs the REAL active database name after connecting.
- **Indexes**: `users.handle` is UNIQUE (canonical handle — the DB is the final authority), `users.role` and `users.isBlocked` are indexed; Better Auth's Mongo adapter creates its own required indexes.

## 2.3 Cloudinary Video Media Storage
- **Backend Only**: Upload intents are created on the backend (`backend/src/integrations/cloudinary/cloudinary.js`), generating signed parameters (`signature`, `timestamp`, `apiKey`, `publicId`).
- **Secret Isolation**: `CLOUDINARY_API_SECRET` resides strictly on the backend. The browser uploads directly to Cloudinary using only the ephemeral server-signed intent.

## 2.4 LiveKit SFU Realtime Video & Audio
- **Backend Only Authority**: The backend (`backend/src/integrations/livekit/livekit.js`) uses `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` to mint short-lived participant tokens containing least-privilege permissions and opaque identities (`host_<uuid>`, `viewer_<uuid>`, `meetup_<userId>_<uuid>`).
- **Frontend Client**: The frontend receives the ephemeral token and `LIVEKIT_URL` via authenticated REST endpoints (`POST /api/v1/streams/:id/join`, `POST /api/v1/meetup/rooms/:id/join`). Neither `LIVEKIT_API_KEY` nor `LIVEKIT_API_SECRET` is ever exposed to the client.

## 2.5 Socket.IO Realtime Gateway
- **Frontend**: Connects to the WebSocket server using `NEXT_PUBLIC_SOCKET_URL` (or auto-derived `NEXT_PUBLIC_API_BASE_URL` origin).
- **Backend**: Listens on the same HTTP server instance initialized by Express and enforces CORS origin matching `CORS_ORIGIN`.

---

# 3. Local Development Setup

To run YOIBI locally:

### 1. Frontend Configuration
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=yoibi-dev-secret-key-32-chars-minimum-length
MONGODB_URI=mongodb://localhost:27017/yoibi_database
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

### 2. Backend Configuration
Create `backend/.env`:
```env
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017/yoibi_database
BETTER_AUTH_BASE_URL=http://localhost:3000
BETTER_AUTH_SECRET=yoibi-dev-secret-key-32-chars-minimum-length
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

---

# 4. Production Deployment Mapping

### Vercel (Frontend)
Configure in Vercel Dashboard -> Project Settings -> Environment Variables:
- `NEXT_PUBLIC_API_BASE_URL` = Railway Express API URL + `/api/v1`
- `NEXT_PUBLIC_BETTER_AUTH_URL` = `https://yoibi-frontend.vercel.app` (actual deployed frontend origin)
- `BETTER_AUTH_SECRET` = `<production-random-32-char-secret>`
- `MONGODB_URI` = `mongodb+srv://<user>:<password>@cluster.mongodb.net/yoibi_database?retryWrites=true&w=majority` (SECRET, server-only — powers the Better Auth Mongo adapter persistent storage. Must target `yoibi_database`.)
- `GOOGLE_CLIENT_ID` = `<production-google-client-id>` (Optional)
- `GOOGLE_CLIENT_SECRET` = `<production-google-client-secret>` (Optional)

NOTE: `RESEND_API_KEY` and `EMAIL_FROM` are no longer required (account-confirmation emails and password reset are removed).

### Railway (Backend)
Configure in Railway Dashboard -> Variables:
- `NODE_ENV` = `production`
- `HOST` = `0.0.0.0`
- `MONGODB_URI` = `mongodb+srv://<user>:<password>@cluster.mongodb.net/yoibi_database?retryWrites=true&w=majority` (must include `yoibi_database`; the backend enforces it)
- `BETTER_AUTH_BASE_URL` = `https://yoibi-frontend.vercel.app` (JWKS + issuer/audience derivation — never localhost)
- `BETTER_AUTH_SECRET` = `<production-random-32-char-secret>` (Matches Vercel value)
- `FRONTEND_URL` = `https://yoibi-frontend.vercel.app`
- `CORS_ORIGIN` = `https://yoibi-frontend.vercel.app`
- `CLOUDINARY_CLOUD_NAME` = `<production-cloud-name>`
- `CLOUDINARY_API_KEY` = `<production-api-key>`
- `CLOUDINARY_API_SECRET` = `<production-api-secret>`
- `LIVEKIT_URL` = `wss://your-project.livekit.cloud`
- `LIVEKIT_API_KEY` = `<production-livekit-api-key>`
- `LIVEKIT_API_SECRET` = `<production-livekit-api-secret>`

---

# 5. Security & Git Protection Verification

- Root `.gitignore` strictly ignores:
  ```gitignore
  .env
  .env.local
  .env.development.local
  .env.test.local
  .env.production.local
  .env.*
  !.env.example
  ```
- **Rule**: Never commit production credentials, `.env`, or `.env.local` to Git repository history. `.env.example` contains only non-sensitive templates and placeholders.

---

# 6. Administrator Provisioning (Secure, No Hardcoded Credentials)

YOIBI has EXACTLY two application roles: `user` (default for every new signup) and `admin`. New accounts can NEVER self-assign `admin`. There is no admin-password in source code, README, API contract, or Git.

To (re)create the administrator account after the database was deleted, use the approved server-side provisioning method:

1. **Create the account first through Better Auth** — sign up normally at `/signup` (email + password) or sign in with Google. This creates the Better Auth user (email, hashed password) and, on the first authenticated request, the YOIBI `users` profile with `role = "user"`.
2. **Promote the profile to admin server-side** — run one command against the **`yoibi_database`** `users` collection with the account's Better Auth user ID (verify it first via the authenticated `GET /api/v1/auth/me` `id`):
   ```js
   // mongosh (authenticated Atlas session) — NOT in application code:
   use yoibi_database
   db.users.updateOne({ _id: "<BetterAuthUserId>" }, { $set: { role: "admin", updatedAt: new Date() } })
   ```
   The role takes effect on the next authenticated request (the backend re-reads role from the `users` document on every request).
3. **Verify** — sign out, sign back in, and confirm `GET /api/v1/auth/me` returns `"role": "admin"`, and the Admin nav appears.

Rules:
- The role is only ever granted by a trusted operator in the database (or a future admin tool protected by `requireAdmin`). The client can never send a role; the PATCH `/api/v1/users/me` validator strips `role` before it reaches the service.
- No signup/request path ever defaults to `admin`.
