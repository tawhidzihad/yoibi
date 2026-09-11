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
| `GOOGLE_CLIENT_ID` | Frontend | Server-Only Config | **NO** | No (Optional) | `your_google_oauth_client_id` | Valid Google OAuth Client ID | Google Social Login OAuth Client ID. |
| `GOOGLE_CLIENT_SECRET` | Frontend | Server-Only Secret | **NO** | No (Optional) | `your_google_oauth_client_secret` | Valid Google OAuth Client Secret | Google Social Login OAuth Client Secret. |
| `NODE_ENV` | Backend | Server-Only Config | **NO** | **Yes** | `development` | `production` | Node execution environment mode (`development`, `production`, `test`). |
| `PORT` | Backend | Server-Only Config | **NO** | **Yes** | `5000` | Auto-assigned (e.g. `$PORT` on Railway) | TCP listening port for Express HTTP and WebSocket server. |
| `HOST` | Backend | Server-Only Config | **NO** | **Yes** | `0.0.0.0` | `0.0.0.0` | Bind host address (0.0.0.0 required for containers and Railway). |
| `MONGODB_URI` | Backend | Server-Only Secret | **NO** | **Yes** | `mongodb://localhost:27017/yoibi` | MongoDB Atlas Replica Set Connection URI | MongoDB connection string for database operations. |
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
- **Backend**: Express verifies incoming JWT tokens (`Authorization: Bearer <token>`) via Better Auth public JWKS endpoint (`/api/auth/jwks`) or shared secret fallback, and uses `BETTER_AUTH_SECRET` for HMAC signature verification on administrative actions (`auth.api.banUser`, `unbanUser`, `removeUser`).
- **Rule**: `BETTER_AUTH_SECRET` must be identical on both Frontend and Backend environments.

## 2.2 MongoDB
- **Backend Only**: MongoDB is connected exclusively by the Express backend (`backend/src/config/database.js`) using `MONGODB_URI`.
- **Frontend Never Connects Directly**: The frontend makes zero direct MongoDB connections.

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
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

### 2. Backend Configuration
Create `backend/.env`:
```env
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017/yoibi
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
- `NEXT_PUBLIC_API_BASE_URL` = `https://api.yourdomain.com/api/v1` (Railway Express API URL)
- `NEXT_PUBLIC_BETTER_AUTH_URL` = `https://yourdomain.com` (Vercel Custom Domain)
- `BETTER_AUTH_SECRET` = `<production-random-32-char-secret>`
- `GOOGLE_CLIENT_ID` = `<production-google-client-id>` (Optional)
- `GOOGLE_CLIENT_SECRET` = `<production-google-client-secret>` (Optional)

### Railway (Backend)
Configure in Railway Dashboard -> Variables:
- `NODE_ENV` = `production`
- `HOST` = `0.0.0.0`
- `MONGODB_URI` = `mongodb+srv://<user>:<password>@cluster.mongodb.net/yoibi?retryWrites=true&w=majority`
- `BETTER_AUTH_BASE_URL` = `https://yourdomain.com`
- `BETTER_AUTH_SECRET` = `<production-random-32-char-secret>` (Matches Vercel value)
- `FRONTEND_URL` = `https://yourdomain.com`
- `CORS_ORIGIN` = `https://yourdomain.com`
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
