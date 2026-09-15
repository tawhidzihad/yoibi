# YOIBI Model Handoff

Prevents a new AI model from restarting work from zero. A new model must read this file (plus root `AGENTS.md` and `docs/WORKBASE.md`) before changing code.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Exact Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## What Is Working` · `## Reference`

## Current Status
- Session Date: 2026-09-15
- Active task: TASK-024 — People Search + navigation redesign (backend `GET /users/search`, desktop right-panel search, left-sidebar Profile nav + account switcher, mobile search modal + drawer profile-preview)
- Overall phase: Phase 5 complete; platform live in production; post-launch feature work
- Completion status: `Implemented, Verified & Deployed`
- Git repository status: TASK-024 committed on `main` (clean)
- Current branch: `main`

## Last Completed Step
- TASK-024 completed end-to-end. Backend: new `GET /api/v1/users/search` endpoint (auth-required, `searchLimiter` 60/min/IP, Zod-validated `q` 1–100 / `limit` 1–20, regex-escaped case-insensitive partial match on handle+name, blocked users excluded, strict `id/handle/name/avatarUrl` projection), implemented through the full route → controller → service (`services/read/users.service.js`) → repository (`repositories/users.repository.js`) layering, with a new test suite (`tests/user-search.test.js`, 5 sections, registered in the runner). Frontend: `UserSearch` feature component (`features/users/ui/UserSearch.js`) shared by the desktop right panel (inline results, idle mini profile card) and a mobile search modal (shared `Modal`); left sidebar gained a Profile nav item above Feed and a Twitter-style account row with a kebab Sign Out menu; mobile top bar is now logo + search + hamburger, and the drawer's logo header was replaced by a tappable profile-preview (banner/avatar/name/handle). Contracts (`API-CONTRACT.md`, `openapi.yaml`) and `SECURITY-RULES.md` updated. Quality gates: backend tests 100%, both lints clean, backend audit 0 vulns, frontend build clean. Deployed: Railway backend (health 200) + Vercel frontend (aliased `https://www.yoibi.com`, new UI chunks confirmed served). Live logged-in verification with the owner's test account passed: real result sets, case-insensitive, @-prefix tolerated, empty result, literal regex handling, 401/422 guards, rate-limit headers, and profile click-through 200.

## Exact Next Step
- No code work pending. Next session: run `/yoibi-resume`, then take the owner's next direction. Optional owner follow-up: a visual phone pass over the mobile search modal + drawer profile-preview (API/code-level live verification passed; no browser automation was available this session).

## Files Touched This Session
- Backend: `src/validators/users.validator.js`, `src/repositories/users.repository.js` (new), `src/services/read/users.service.js` (new), `src/controllers/read/users.controller.js`, `src/routes/users.routes.js`, `src/middleware/rate-limiter.js`, `tests/user-search.test.js` (new), `tests/index.js`
- Frontend: `src/features/users/api/usersApi.js`, `src/features/users/ui/UserSearch.js` (new), `src/app/(protected)/layout.js`
- Contracts/docs: `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`, `docs/SECURITY-RULES.md`, `docs/WORKBASE.md`, `docs/MODEL-HANDOFF.md` (this file)

## Known Issues / Blockers
- 1 pre-existing React Compiler warning in `frontend/src/features/streams/ui/CreateStreamComposer.js` (unrelated; lint exits 0; intentionally not modified per the "do not modify unrelated files" rule).
- Live Google OAuth browser smoke test pending (owner go-ahead required — writes to production).
- Pre-TASK-018 replies may exist in production with `replyToId: null`; deliberately not migrated (indistinguishable from standalone tweets).
- Owner's live-verification test account `test@gmail.com` exists in production; delete at will.

## Session Date
- 2026-09-15

## What Is Working
- All 10 Milestones (Phase 1 through Phase 5 Milestone 10) fully implemented and verified; platform live in production (Vercel `https://www.yoibi.com` + Railway `https://yoibi-backend-production.up.railway.app`, health 200 `database: connected`).
- Twitter-like micro-posting, replies (correct parent linkage post-TASK-018), likes, retweets, feeds; tweet media via secure server-signed Cloudinary intents.
- Cloudinary server-signed video uploads (provenance-verified, single-use intents), metadata registration, playback views tracking.
- LiveKit live stream broadcasts (host publishing, anonymous viewing, lifecycle termination) and Meet-Up multi-peer rooms (reservation TTLs, atomic slot capacity).
- Complete User Profile System: dynamic `/profile/[username]`, editing (name/handle/bio/country/avatar/banner), real content tabs with server-side counts.
- Comprehensive Admin & Moderation suite (dashboard metrics, block/unblock, canonical 5-phase/9-stage ban orchestrator, content moderation, reports queue).
- Auth: Better Auth 1.7.4 (email + Google OAuth, no email verification), JWT + JWKS verified by the backend, canonical `users` profile auto-provisioning, database-backed rate limiting.
- Security: multi-tier rate limiting, security response headers, strict CORS origin validation, LiveKit camera/mic permissions policy.
- Auth-aware home page nav (TASK-022), responsive mobile drawer navigation, inline upload composers.
- People search (TASK-024): authenticated `GET /users/search` (name/username, case-insensitive partial, rate-limited, minimal projection), desktop right-panel inline search, mobile search modal, left-sidebar Profile nav + kebab account switcher, mobile drawer profile-preview.

## Reference
- Entry point for any agent: root `AGENTS.md`
- Resume command: `/yoibi-resume` (`.claude/commands/yoibi-resume.md`)
- Historical session logs + architecture notes (auth, profile, media provenance, reply flow, hardening): `docs/MODEL-HANDOFF-ARCHIVE.md`
- Full task history: `docs/WORKBASE-ARCHIVE.md`
- Full rule set: `.agents/AI-AGENT.md`, `docs/MANDATORY-RULES.md`, `docs/CODE-STANDARDS.md`, `docs/SECURITY-RULES.md`, `PROJECT-STRUCTURE.md`
- API agreements: `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`
- Environment: `docs/ENVIRONMENT.md`
