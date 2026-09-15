# YOIBI Model Handoff

Prevents a new AI model from restarting work from zero. A new model must read this file (plus root `AGENTS.md` and `docs/WORKBASE.md`) before changing code.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Exact Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## What Is Working` · `## Reference`

## Current Status
- Session Date: 2026-09-16
- Active task: TASK-025 — Mobile search UX fixes (top-bar search bar + top-anchored results dropdown, clear-button removal, site-wide hidden scrollbars)
- Overall phase: Phase 5 complete; platform live in production; post-launch feature work
- Completion status: `Implemented, Verified & Deployed`
- Git repository status: TASK-025 changes pending commit/push (frontend + docs only)
- Current branch: `main`

## Last Completed Step
- TASK-025 completed. `UserSearch` gained a `variant` prop — `"inline"` (desktop sidebar, behavior unchanged) and `"dropdown"` (mobile): the search input now sits visibly in the mobile top bar (same shared searchBar element/styling as desktop), and results render in a scrollable panel anchored to the top (flush under the search bar, aligned to its width; `max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain`; outside-tap dismiss; `key={pathname}` reset on navigation) instead of the old centered `Modal` (removed). Mobile header wordmark removed (logo icon only). Shared input changed `type="search"` → `type="text"` (native clear "x" gone on both desktop and mobile — the only desktop-visible change). `globals.css`: site-wide scrollbar hiding (`scrollbar-width: none` + `*::-webkit-scrollbar { display: none }` in `@layer base`) and a new `animate-dropdown-in` utility with reduced-motion guard. Backend untouched (no Railway redeploy). Quality gates: lint clean (pre-existing warning only), build clean, built CSS verified. Deployed to Vercel, aliased `https://www.yoibi.com`; live verification confirmed the compiled mobile header structure (logo-only → dropdown UserSearch → hamburger), modal strings gone, one shared `type:"text"` input, unchanged desktop inline container, and the live CSS serving the scrollbar + animation rules; live API sanity check passed.

## Exact Next Step
- Commit and push TASK-025 to `main` (this session's remaining step), then no code work pending. Next session: run `/yoibi-resume`, then take the owner's next direction. Optional owner follow-up: visual phone pass over the mobile search dropdown (compiled-code/live-asset verification passed; no browser automation was available this session).

## Files Touched This Session
- `frontend/src/features/users/ui/UserSearch.js` (variant prop, `type="text"`, shared searchBar/resultsBody)
- `frontend/src/app/(protected)/layout.js` (mobile header: logo-only + inline dropdown search; search Modal + `isSearchOpen` removed)
- `frontend/src/app/globals.css` (site-wide scrollbar hiding; `animate-dropdown-in`)
- `docs/WORKBASE.md`, `docs/MODEL-HANDOFF.md` (this file)

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
- People search (TASK-024): authenticated `GET /users/search` (name/username, case-insensitive partial, rate-limited, minimal projection), desktop right-panel inline search, left-sidebar Profile Nav + kebab account switcher, mobile drawer profile-preview.
- Mobile search UX (TASK-025): visible search bar in the mobile top bar (shared `UserSearch` styling with desktop), top-anchored scrollable results dropdown (no centered modal), logo-only mobile header, no native clear button on the search input, site-wide hidden scrollbars (scrolling fully functional).

## Reference
- Entry point for any agent: root `AGENTS.md`
- Resume command: `/yoibi-resume` (`.claude/commands/yoibi-resume.md`)
- Historical session logs + architecture notes (auth, profile, media provenance, reply flow, hardening): `docs/MODEL-HANDOFF-ARCHIVE.md`
- Full task history: `docs/WORKBASE-ARCHIVE.md`
- Full rule set: `.agents/AI-AGENT.md`, `docs/MANDATORY-RULES.md`, `docs/CODE-STANDARDS.md`, `docs/SECURITY-RULES.md`, `PROJECT-STRUCTURE.md`
- API agreements: `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`
- Environment: `docs/ENVIRONMENT.md`
