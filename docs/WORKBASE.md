# YOIBI Workbase

Live task scratchpad. The active AI must keep this current at all times. Full historical task detail lives in `docs/WORKBASE-ARCHIVE.md` — read it only when a task needs the history.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## Task History Index`

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**

## Current Status
- Task ID: TASK-024
- Title: People Search (desktop right panel + mobile modal), left-sidebar Profile nav + account switcher, mobile top bar & drawer redesign, `GET /users/search` backend endpoint
- Status: COMPLETE
- Completion Level: `Implemented, Verified & Deployed`
- Summary: Cross-cutting navigation/search feature:
  1. **Backend** — new `GET /api/v1/users/search?q=&limit=` (auth-required, regex-escaped case-insensitive partial match on `handle`/`name`, blocked users excluded, strict public projection `id/handle/name/avatarUrl`, dedicated `searchLimiter` 60 req/min/IP, Zod query validation `q` 1–100 chars / `limit` 1–20 default 10). Layered: route → `controllers/read/users.controller.js` → new `services/read/users.service.js` → new `repositories/users.repository.js`. Tests in new `backend/tests/user-search.test.js` (registered in `tests/index.js`). Contracts updated (`API-CONTRACT.md` + `openapi.yaml`) plus `SECURITY-RULES.md` limiter list.
  2. **Desktop** — right sidebar is now a search panel: search bar pinned at top, debounced inline results below (skeleton idiom while loading, shared `EmptyState`/`ErrorState` otherwise); the logged-in user's compact profile card (avatar/name/handle/stats) shows as idle content below the search bar (buttons removed — superseded by the new left-nav Profile item). Left sidebar gains a "Profile" nav item (top, above Feed) and the Sign Out row became a Twitter-style account row (avatar/name/handle + kebab menu containing only Sign Out).
  3. **Mobile** — top bar: YOIBI logo (left, links to /feed), search icon (middle, opens a search modal using the shared `Modal`), hamburger (right, sole drawer trigger). Drawer: logo/wordmark removed, replaced by a compact profile-preview (banner + avatar + name + handle, single tappable area → own profile); "My Profile" nav item removed; nav list + bottom Sign Out unchanged.
  4. Deployed: backend → Railway, frontend → Vercel (`https://www.yoibi.com`), live-verified (see Last Completed Step).

## Last Completed Step
- All TASK-024 work finished and verified:
  - Backend: `npm test` 100% (incl. new user-search suite), `npm run lint` clean, `npm audit` 0 vulnerabilities. Deployed to Railway (health 200 `database: connected`).
  - Frontend: `npm run lint` clean (only the pre-existing unrelated CreateStreamComposer warning), `npm run build` clean. Deployed to Vercel production, aliased to `https://www.yoibi.com`; new UI chunks confirmed live (Search people / Account options / View my profile strings present in served JS).
  - Live logged-in verification (owner-provided test account `test@gmail.com`): search `q=tawhid` and `q=test` returned real users (handle AND name matches, both Tawhidul Islam accounts + the test account); `q=TAWHID` case-insensitive ✓; `q=@tawhidzihad` @-prefix tolerated ✓; `q=zzzzzqqqq` → empty `users[]` ✓; regex metacharacters (`a.*`) matched literally (no injection) ✓; missing `q` / `limit=50` → 422 VALIDATION_ERROR ✓; unauthenticated → 401 ✓; rate-limit headers confirm `60-in-1min` searchLimiter live ✓; profile click-through target `/profile/tawhidzihad` returns 200 on the live site ✓. Temp cookie/scratch files deleted.

## Next Step
- No pending code work. Next session: run `/yoibi-resume`, then proceed to the next feature/fix task as directed by the owner.
- Note for the owner: the test account `test@gmail.com` was used for live verification and can be deleted at will; recommend a visual pass over the mobile search modal + drawer profile-preview on a real phone (this session verified code + API level; no browser automation was available for pixel-level UI confirmation).

## Files Touched This Session
- `backend/src/validators/users.validator.js` (new `searchUsersQuerySchema`)
- `backend/src/repositories/users.repository.js` (new — users repository layer)
- `backend/src/services/read/users.service.js` (new — people search service)
- `backend/src/controllers/read/users.controller.js` (new `searchUsers` controller)
- `backend/src/routes/users.routes.js` (`GET /users/search` before `/users/:handle`)
- `backend/src/middleware/rate-limiter.js` (new `searchLimiter`)
- `backend/tests/user-search.test.js` (new) + `backend/tests/index.js` (registered)
- `frontend/src/features/users/api/usersApi.js` (new `searchUsers`)
- `frontend/src/features/users/ui/UserSearch.js` (new — shared desktop/mobile search component)
- `frontend/src/app/(protected)/layout.js` (left nav Profile item + account switcher; right panel search; mobile header logo/search/hamburger; search modal; drawer profile-preview)
- `contracts/API-CONTRACT.md` + `contracts/openapi.yaml` (new search endpoint + `UserSearchResult` schema)
- `docs/SECURITY-RULES.md` (searchLimiter documented)
- `docs/WORKBASE.md` + `docs/MODEL-HANDOFF.md` (this session)

## Known Issues / Blockers
- 1 pre-existing React Compiler warning in `frontend/src/features/streams/ui/CreateStreamComposer.js` (unrelated to any active task; lint exits 0; intentionally not modified per the "do not modify unrelated files" rule).
- Live Google OAuth browser smoke test still pending (requires owner go-ahead — writes to production).
- Historical data note (from TASK-018): pre-fix replies may exist with `replyToId: null` in production; deliberately not migrated.

## Session Date
- 2026-09-15

## Task History Index
One line per task; full detail in `docs/WORKBASE-ARCHIVE.md` (or `docs/MODEL-HANDOFF-ARCHIVE.md` where noted).

| Task | Title | Status |
|------|-------|--------|
| TASK-024 | People Search + nav redesign (search endpoint, right panel, Profile nav, account switcher, mobile search modal + drawer preview) | COMPLETE — deployed & live-verified |
| TASK-023 | Persistent Context + Resume System (AGENTS.md, doc restructure, /yoibi-resume) | COMPLETE (history in WORKBASE-ARCHIVE.md) |
| TASK-022 | Stale Frontend URL Cleanup + Auth-Aware Home Page Nav Button | COMPLETE — deployed & live-verified |
| TASK-021 | Mobile Edit Profile Spacing & Past Meet-Up Room Card Hierarchy | COMPLETE — deployed & live-verified |
| TASK-020 | Meet Up Page UI/UX, Room Card & Responsiveness | COMPLETE — implemented & verified |
| TASK-019 | Videos Upload Form Collapse + Repository Cleanup | COMPLETE — deployed (Vercel + Railway) |
| TASK-018 | Fix Tweet Reply/Comment Flow (reply belongs to parent tweet) | COMPLETE — verified locally (detail in MODEL-HANDOFF-ARCHIVE) |
| TASK-017 | Tweet Media Upload Redesign — Direct Device Upload, Secure Cloudinary | COMPLETE — real Cloudinary E2E verified |
| TASK-016 | Video Upload Provenance Fix + Inline Composer & Category Redesign | COMPLETE (detail in MODEL-HANDOFF-ARCHIVE) |
| TASK-014 | Complete User Profile System — /profile/[username], editing, avatar & banner | COMPLETE — deployed (detail in MODEL-HANDOFF-ARCHIVE) |
| TASK-013 | Production Authentication Fix (JWT pipeline, auth simplification) | COMPLETE — superseded parts documented |
| TASK-012 | Phase 5 Level 2 — Production Verification & Live Deployment | COMPLETE — deployed & live-smoked |
| TASK-011 | Phase 5 Milestone 10 — Platform Hardening & Deployment Readiness | COMPLETE — 100% quality gates |
