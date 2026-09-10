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
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/yoibi` | Yes in Prod |
| `BETTER_AUTH_BASE_URL` | Better Auth server origin | `http://localhost:3000` | Yes |
| `BETTER_AUTH_JWKS_URL` | Public JWKS endpoint URL | `http://localhost:3000/api/auth/jwks` | Optional |
| `FRONTEND_URL` | Trusted Next.js frontend origin | `http://localhost:3000` | Yes |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | Server-side only | Future |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Server-side only | Future |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | Server-side only (never browser) | Future |
| `LIVEKIT_URL` | LiveKit server websocket URL | `wss://livekit.yoibi.com` | Future |
| `LIVEKIT_API_KEY` | LiveKit API key | Server-side only | Future |
| `LIVEKIT_API_SECRET` | LiveKit API secret | Server-side only (never browser) | Future |

> **Security Rule:** Never commit real `.env` files. Keep `.env.example` as the canonical documentation.
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
├── sockets/             # Socket.IO event handlers and guards
├── integrations/        # Vendor SDK wrappers (Cloudinary, LiveKit)
└── utils/               # Generic utility helpers
```

---

## 4. Authentication & Authorization Architecture

- **Single Auth Authority:** Better Auth handles user registration, email verification, passwords, and sessions.
- **JWT Plugin:** Issues verifiable JWTs containing user claims (`sub`, `email`, `role`, `isBlocked`).
- **Backend Verification:** `verifyJwt` middleware uses `jose` to verify incoming `Authorization: Bearer <jwt>` against the Better Auth JWKS endpoint.
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

## 6. Railway Deployment Readiness

- Reads `PORT` dynamically from the environment.
- Binds listener explicitly to `0.0.0.0`.
- Health check configured for zero-downtime deployment probes at `/api/v1/health`.
- Graceful shutdown handles `SIGTERM` / `SIGINT` and cleanly disconnects Mongoose.
- Fails fast on missing required production environment variables.
