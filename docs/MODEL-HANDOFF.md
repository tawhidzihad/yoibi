# YOIBI Model Handoff

This file prevents a new AI model from restarting work from zero.

## Rule
At the end of every meaningful session/task, the active model must update this file. A new model must read it before changing code.

## Current Snapshot
- Last updated: 2026-09-11
- Active task: Phase 2 API & Realtime Contract Design (Completed & Verified)
- Overall phase: Phase 2 API Contracts (Completed & Verified) → Phase 3 Backend Foundation
- Git repository status: Initialized at `yoibi/` root, tracking frontend, backend, contracts, docs, skills, configs
- Current branch: `main`
- Baseline commit: `6d167d0` ("chore: initialize yoibi workspace")
- Working tree state: Clean
- Last completed step: Documented complete API & Realtime contracts in `contracts/API-CONTRACT.md` and `contracts/openapi.yaml` covering all 8 feature domains, standard envelopes, error codes, Socket.IO realtime events, LiveKit token endpoints, and admin moderation rules. Verified OpenAPI YAML validity using `js-yaml` parser.
- Current step: Transitioning to Phase 3 (Backend Foundation)
- Next exact step: Phase 3 Backend Foundation — Setup CommonJS Express app (`backend/src/app.js`, `backend/src/server.js`), MongoDB Mongoose schemas, Better Auth JWKS verification middleware (`backend/src/middleware/auth.js`), and health check endpoint `/api/v1/health`.

## What Is Working
- Git repository initialized at root `yoibi/` on branch `main` with baseline commit `6d167d0`
- Root `.gitignore` in place protecting all secrets, `.env*` files, `node_modules/`, `.next/`, and caches while tracking `.env.example`
- Complete human-readable API contract (`contracts/API-CONTRACT.md`)
- Complete machine-readable OpenAPI 3.0.3 specification (`contracts/openapi.yaml`)
- Frontend stack running Next.js 16.3.4 (Turbopack), React 19, Tailwind CSS 4.3.3, Lucide React, Motion
- ESLint flat configuration working cleanly with 0 errors and 0 warnings (`npm run lint`)
- Production build passing with 14 static App Router pages prerendered (`npm run build`)
- App Router layout hierarchy active: 3-column desktop shell with mobile dock
- Minimal auth pages active: signup (minimal fields only, no favorite color/preferences/confetti), login, forgot-password, verify-email, reset-password
- Preserved legacy homepage baseline intact under strict freeze rule
- Feature slices implemented with feature-owned mock data: feed, tweets, videos (custom player), streams, meetup, messages
- Strict separation maintained: Post != Tweet, zero cross-feature private imports

## What Is Not Working
- Backend implementation in `backend/` has not started yet (scheduled for Phase 3)

## Files Changed in Latest Session
- `contracts/API-CONTRACT.md`
- `contracts/openapi.yaml`
- `docs/WORKBASE.md`
- `docs/MODEL-HANDOFF.md`

## API/Contract Changes
- Completely documented `/api/v1` endpoints across Auth (`/auth/me`), Users (`/users/:username`, `/users/profile`, `/users/:id/follow`, `/users/suggested`), Posts (`/posts`, `/posts/:id`, `/posts/:id/like`, `/posts/:id/comments`), Tweets (`/tweets`, `/tweets/:id`, `/tweets/:id/like`, `/tweets/:id/retweet`, `/tweets/:id/replies`), Media (`/media/upload`), Messaging (`/messages/conversations`, `/messages`, `/messages/conversations/:id/read`), Streams (`/streams`, `/streams/:id/join`, `/streams/:id/end`), Meet-Up (`/meetup/rooms`, `/meetup/rooms/:id/token`), Reports (`/reports`), and Admin (`/admin/stats`, `/admin/users`, `/admin/reports`, `/admin/users/:id/block`, `/admin/users/:id/unblock`, `/admin/users/:id/ban`).
- Realtime event contracts established for Socket.IO (`join_conversation`, `send_message`, `new_message`, etc.) and LiveKit token generation.

## Database Changes
- None

## Environment Variables Added/Needed
- None currently; full ownership matrix documented in master plan

## Tests/Checks Run
- Directory structure and file checks: All passed
- Node.js runtime check: Node v24.15.0, npm 11.15.0 passed
- Version check on npm: `next@16.3.4` and `tailwindcss@4.3.3` verified
- Git status check: Checked repository state

## Known Issues
- None

## Important Decisions
- Target latest stable `next@16.3.4` and `tailwindcss@^4.3.3`.
- Strict feature-owned mock data: no monolithic mock file.
- The new signup page is minimal: only Name, Email, Password, Confirm Password, Age (>= 16), Phone (optional), Photo (optional), and Community rules checkbox. Preferences and favorite color are completely removed. Zero confetti or decorative success effects.
- Homepage is preserved matching legacy reference without early redesign (strict homepage freeze rule).
- Post != Tweet domain separation in both frontend (`features/posts/` vs `features/tweets/`) and backend (`/api/v1/posts` vs `/api/v1/tweets`).
- Generic shared UI (`src/shared/ui/`), custom video player (`src/shared/media/`), and feedback primitives (`src/shared/feedback/`).
- API contract first before backend implementation (Phase 2).
- Backend is CommonJS only with CRUD-separated layers and server-side Better Auth JWT verification.
- Admin panel supports user/content inspection, contact/report forms, and exactly 3 moderation actions: `ban` (cascade delete), `block` (account-blocked page + reason form), and `unblock`.
- Prerequisite rule: `docs/BAN-DELETION-PLAN.md` must be written and approved before ban deletion code.
- DM follow-rule: User A can DM User B only if A follows B.
- Realtime uses Socket.IO for DM and LiveKit for Streams/Rooms. Media uses Cloudinary with server-side SDK.

## Exact Resume Instruction
> Continue from the `Next exact step` above. Do not restart completed work. First inspect the current files and git diff, verify the current state, then implement only the remaining work.




