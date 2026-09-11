# YOIBI — Modern Social Network Platform

YOIBI is a next-generation social networking platform featuring micro-posts (Tweets), community video sharing (Shorts & Longform), live video broadcasts (Streams), multi-peer collaborative rooms (Meet-Up), follow-gated direct messaging, real-time activity notifications, and comprehensive administrative moderation.

---

## 1. Monorepo Architecture

YOIBI is built with strict boundary separation between frontend and backend services:

```text
yoibi/
├── frontend/             # Next.js 16 (App Router) + Tailwind CSS v4 + Better Auth client
│   ├── src/app/          # Page routes, layouts, error/loading boundaries
│   ├── src/features/     # Feature-sliced modules (tweets, videos, streams, meet-up, messages, notifications, admin)
│   ├── src/shared/       # Reusable components (buttons, modals, inputs, layout navigation)
│   ├── src/lib/          # API client, Better Auth configuration, utils
│   └── next.config.js    # Security response headers & permissions policy
│
├── backend/              # Node.js + Express 5 (CommonJS) REST API & Realtime Gateway
│   ├── src/app.js        # Express app, Helmet, CORS, body parsers, rate limiters, error handler
│   ├── src/server.js     # Server entrypoint (0.0.0.0 bind, graceful shutdown)
│   ├── src/config/       # Environment validator (env.js) and Mongoose connector (db.js)
│   ├── src/middleware/   # JWT verification, admin guards, rate limiters, validation
│   ├── src/routes/       # Modular versioned routers (/api/v1/*)
│   ├── src/controllers/  # HTTP request/response handlers
│   ├── src/services/     # Pure business logic and domain orchestration
│   ├── src/repositories/ # MongoDB data access layers
│   ├── src/models/       # Mongoose schemas
│   ├── src/validators/   # Zod request validation schemas
│   ├── src/sockets/      # Socket.IO realtime server (messaging, notifications)
│   ├── src/integrations/ # LiveKit and Cloudinary server SDK integrations
│   ├── tests/            # Automated test suite runner (8 test suites)
│   └── railway.json      # Railway Config-as-Code deployment specification
│
├── contracts/            # API specifications & OpenAPI 3.1 contracts
│   └── API-CONTRACT.md   # Single source of truth for frontend/backend integration
│
└── docs/                 # Authoritative project documentation
    ├── ENVIRONMENT.md    # Cross-application environment variable matrix
    ├── SECURITY-RULES.md # Security constraints, JWT verification & rate limiting rules
    ├── WORKBASE.md       # Roadmap & milestone status tracker
    └── MODEL-HANDOFF.md  # Session handoff notes & architectural checkpoints
```

---

## 2. Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, Motion, Lucide React, React Hook Form, Zod | Modern responsive UI, App Router, client UX |
| **Authentication** | Better Auth v1.7.4 (JWT plugin, Admin plugin) | User registration, verified JWT issuance, JWKS endpoint |
| **Backend** | Node.js, Express 5, Mongoose 9, `jose`, `express-rate-limit` | REST API, authorization, business rules, DB management |
| **Database** | MongoDB / MongoDB Atlas | Persistent document storage |
| **Realtime Gateway** | Socket.IO 4 | Direct messaging, typing indicators, activity notifications |
| **Live Media & Video**| LiveKit Cloud (SFU) & Cloudinary | Realtime live streaming, Meet-Up rooms, video storage |
| **Deployment** | Vercel (Frontend), Railway (Backend) | Production hosting & zero-downtime scaling |

---

## 3. Local Quick Start

### Prerequisites
- Node.js 20+ (LTS recommended)
- MongoDB instance running locally (or MongoDB Atlas connection string)

### 3.1 Backend Setup
```bash
cd backend
npm install
cp .env.example .env

# Start in development mode (auto-reloading on port 5000)
npm run dev

# Run automated tests
npm test

# Run code linter
npm run lint
```

### 3.2 Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local

# Start Next.js dev server on http://localhost:3000
npm run dev

# Run code linter & production build check
npm run lint
npm run build
```

---

## 4. Key Platform Features

1. **Tweets & Social Feed (`/tweets`, `/feed`)**: 280-character micro-posts with image/video attachments, threaded replies, likes, retweets, and algorithmic/following feeds.
2. **Community Videos (`/videos`)**: Short and long-form video sharing with server-signed Cloudinary direct uploads, 8 canonical categories, and playback initiation tracking.
3. **Live Streams (`/streams`)**: Live video broadcasts via LiveKit SFU with public discovery, anonymous viewer access, owner-only broadcasting, and anti-PII opaque room naming.
4. **Meet-Up Collaborative Rooms (`/meetup`)**: Multi-participant interactive audio/video/screen-sharing rooms with reservation TTLs, capacity enforcement, and presentation snapshots.
5. **Direct Messaging (`/messages`)**: Real-time 1-on-1 direct messaging protected by the mandatory server-authoritative follow rule (User A must follow User B), client message idempotency, and live typing indicators.
6. **Activity Notifications (`/notifications`)**: Real-time alerts for likes, retweets, replies, and follows with unread badge counters, safe fallbacks for deleted actors, and optimistic mark-read state.
7. **Admin & Moderation Suite (`/admin`)**: Dashboard analytics, user management, reversible user blocking (session revocation), content moderation, and permanent 5-phase / 9-stage destructive user ban orchestrator with pre-cleanup audit logging.

---

## 5. Security & Platform Hardening

- **JWT Authentication via JWKS**: Cryptographic validation with `jose` against Better Auth JWKS endpoint.
- **Distributed Rate Limiting**:
  - Better Auth database-backed rate limiting on sensitive authentication routes.
  - Backend multi-tier rate limiting via `express-rate-limit` (300 req/min global, 60 req/min writes, 10 req/15min expensive media/rooms, 15 req/15min auth probing, 20 req/hr reports).
- **Strict Origin CORS**: Socket.IO and REST CORS strictly whitelist configured production origins with zero wildcard fallbacks.
- **Security Headers**: `next.config.js` enforces `DENY` framing, `nosniff` MIME types, strict HSTS, and `camera=(self), microphone=(self)` Permissions-Policy for LiveKit capture.
- **Readiness Probes**: `/api/v1/health` reports live MongoDB connection readiness with HTTP 503 fallback when degraded.

---

## 6. Deployment Guide

### Backend (Railway)
1. Link your repository on [Railway](https://railway.com/) and set the service root directory to `backend/`.
2. Configure required environment variables (see [`docs/ENVIRONMENT.md`](file:///c:/projects/yoibi/docs/ENVIRONMENT.md)):
   `NODE_ENV=production`, `MONGODB_URI`, `BETTER_AUTH_BASE_URL`, `BETTER_AUTH_SECRET`, `FRONTEND_URL`, `CORS_ORIGIN`, `CLIENT_URL`, `CLOUDINARY_*`, `LIVEKIT_*`.
3. Railway automatically recognizes [`backend/railway.json`](file:///c:/projects/yoibi/backend/railway.json) to build via Nixpacks, run `npm start`, and monitor `/api/v1/health`.

### Frontend (Vercel)
1. Import the repository on [Vercel](https://vercel.com/) and set the root directory to `frontend/`.
2. Configure required environment variables:
   `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID` (optional), `GOOGLE_CLIENT_SECRET` (optional).
3. Deploy.

---

## 7. Quality Gates

Run all quality gates before committing:

```bash
# Backend Quality Gates
cd backend && npm test && npm run lint && npm audit

# Frontend Quality Gates
cd frontend && npm run lint && npm run build
```
