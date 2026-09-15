# YOIBI Workbase

Live task scratchpad. The active AI must keep this current at all times. Full historical task detail lives in `docs/WORKBASE-ARCHIVE.md` — read it only when a task needs the history.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## Task History Index`

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**

## Current Status
- Task ID: TASK-025
- Title: Mobile search UX fixes (top-bar search bar + top-anchored results dropdown), remove search-input clear button, site-wide hidden scrollbars
- Status: COMPLETE
- Completion Level: `Implemented, Verified & Deployed`
- Summary: Mobile-only fixes to TASK-024's search + two shared/global tweaks (desktop search behavior otherwise unchanged):
  1. **Mobile top bar** — "Yoibi" wordmark removed (logo icon only, left); the middle search *icon* replaced with the actual visible search input bar — the SAME shared `UserSearch` search-bar element/styling as desktop (single styling source).
  2. **Mobile results** — centered `Modal` removed entirely; `UserSearch` gained a `variant` prop: `"inline"` (desktop sidebar, unchanged) vs `"dropdown"` (mobile) where results render in a panel anchored to the top (flush under the search bar via `top-full` of a `self-stretch` header wrapper, aligned to the search bar's width), scrollable (`max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain`), same skeleton/empty/result rows; dismisses on outside pointer-down; resets on navigation (`key={pathname}`).
  3. **Clear button** — shared input switched `type="search"` → `type="text"` so the native webkit clear "x" is gone on BOTH desktop and mobile.
  4. **Global scrollbars** — `globals.css` `@layer base` hides scrollbars site-wide on both axes (`scrollbar-width: none` + `*::-webkit-scrollbar { display: none }` + `-ms-overflow-style: none`) while scrolling stays fully functional.
  5. New `@utility animate-dropdown-in` keyframe in `globals.css` (follows the `animate-marquee` convention, with a `prefers-reduced-motion` guard).
- Backend untouched — no Railway redeploy (frontend-only change).

## Last Completed Step
- All TASK-025 work finished and verified: frontend `npm run lint` clean (only the pre-existing unrelated CreateStreamComposer warning), `npm run build` clean, built CSS confirmed to contain the scrollbar + animation rules. Deployed to Vercel production, aliased `https://www.yoibi.com`. Live verification: compiled layout chunk shows the mobile header as logo-only Link → `variant="dropdown"` UserSearch (inline in the top bar) → hamburger; the old modal strings ("Find people by name or username") are gone; the wordmark class string appears exactly once (desktop brand only); the shared input is `type:"text"` (no clear x on any platform); the desktop inline-results container is unchanged; the live CSS serves `scrollbar-width:none`, `::-webkit-scrollbar{display:none}`, and the `dropdown-in` keyframe + utility + reduced-motion guard; live API sanity check with the test account still returns real search results.

## Next Step
- No pending code work. Next session: run `/yoibi-resume`, then proceed to the owner's next task.
- Note for the owner: this session verified the fixes at compiled-code/live-asset level (no browser automation available); a quick visual pass on a real phone is recommended — mobile: logo-only top bar, inline search bar, top-anchored scrollable dropdown, no clear x; desktop: unchanged except no clear x; scrollbars hidden site-wide.

## Files Touched This Session
- `frontend/src/features/users/ui/UserSearch.js` (variant prop: inline/dropdown; `type="text"`; shared searchBar/resultsBody extraction)
- `frontend/src/app/(protected)/layout.js` (mobile header: logo-only, inline dropdown search, gap layout; removed search Modal + `isSearchOpen`)
- `frontend/src/app/globals.css` (site-wide scrollbar hiding in `@layer base`; `animate-dropdown-in` utility + keyframe + reduced-motion guard)
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
| TASK-025 | Mobile search UX fixes (top-bar search bar, top-anchored dropdown, clear-button removal, hidden scrollbars) | COMPLETE — deployed & live-verified |
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
