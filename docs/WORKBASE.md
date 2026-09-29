# YOIBI Workbase

Live task scratchpad. The active AI must keep this current at all times. Full historical task detail lives in `docs/WORKBASE-ARCHIVE.md` — read it only when a task needs the history.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## Task History Index`

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**

## Current Status
- Task ID: TASK-028
- Title: Privacy Policy & Terms of Service Pages
- Status: **COMPLETE** — All pages created, lint/build passed, deployed to Vercel, live-verified.
- Completion Level: `COMPLETE`
- Summary: Privacy Policy and Terms of Service pages created with proper legal copy matching YOIBI tech stack (Cloudinary, LiveKit, Resend, MongoDB, Better Auth). Lint passes (0 errors), build succeeds, Vercel deploy complete, all 4 live-test checks passed.
- Completion Level: `COMPLETE`
- Summary of THIS follow-up session (root-cause fix for the reported production regression where both new AND existing/verified users got kicked back to `/verify-email` after ~4-5 min of use and could not reach `/feed`):
  - **Root cause (frontend):** In `frontend/src/features/auth/context/AuthContext.js`, the hydration `else` branch (fired when `/auth/me` returns any non-success, non-`EMAIL_NOT_VERIFIED` result — a transient token race, 5xx, or network hiccup) constructed a `fallbackUser` that OMITTED `emailVerified` entirely. The protected route guard uses `user?.emailVerified !== true`, which is `true` for an object missing the field — so a genuinely-verified user was treated as unverified and bounced to `/verify-email`. Because that `user` state persistedale, every subsequent navigation to `/feed` re-triggered the guard (the reported "recurring interval" loop), and the page could not leave `/verify-email`.
  - **Fix 1 (primary, frontend):** The fallback branch now carries `emailVerified: sessionData.user.emailVerified === true` — read from the DB-backed Better Auth session record (the same authoritative `user` singular source), instead of omitting it. This stops "unknown" transient errors from being treated as "unverified". Fail-closed + no protection weakened: a genuinely unverified session has `emailVerified === false` so the guard still blocks it, and the explicit `EMAIL_NOT_VERIFIED` backend signal branch still forces `emailVerified: false`.
  - **Fix 2 (secondary, backend cache coherence):** `backend/src/services/verification.service.js` `verifyCode` now calls `invalidateUserModerationCache(userId)` after a successful verification. Previously the auth middleware's 30s in-memory `userModerationCache` (which caches `emailVerified`) was not invalidated on `setEmailVerified`, so a just-verified user could be momentarily reported `EMAIL_NOT_VERIFIED` for up to 30s and bounced back to `/verify-email` the instant they tried to leave.
- Live production verification: ✅ deployment + endpoint checks passed (see Last Completed Step). Full timed browser E2E still requires a real browser (documented below; same sandbox limitation as the prior session).

## Last Completed Step
- **Privacy Policy & Terms of Service pages deployed and verified:**
  1. Fixed lint errors (14 react/no-unescaped-entities violations fixed by escaping `"` → `&quot;` and `'` → `&apos;`)
  2. Build passed — both `/privacy-policy` and `/terms` prerendered as static content
  3. Deployed to Vercel — production URL: `yoibi-frontend-3m5k2l8n-yoibi.vercel.app` (aliased to www.yoibi.com)
  4. Live-test verification:
     - `/privacy-policy` — **HTTP 200**, correct content rendered
     - `/terms` — **HTTP 200**, correct content rendered
     - `/privacy` — **HTTP 301 redirect** to `/privacy-policy` ✓
     - Signup form Privacy Policy link — points to `/privacy-policy` ✓
- **Email verification fix (TASK-028 follow-up 2):** already deployed & verified in prior session.

## Next Step
- **None** — TASK-028 complete. All objectives achieved:
  - Privacy Policy page created at `/privacy-policy`
  - Terms of Service page created at `/terms`
  - `/privacy` redirect to `/privacy-policy` working
  - Signup form links updated
  - Lint/build/deploy passed
  - Live URLs verified

## Files Touched This Session
- `frontend/src/features/auth/context/AuthContext.js` - **root-cause fix:** fallback `else` branch now carries `emailVerified: sessionData.user.emailVerified === true` so a transient `/auth/me` failure no longer fabricates an unverified state for a verified user.
- `backend/src/services/verification.service.js` - **cache-coherence fix:** `verifyCode` calls `invalidateUserModerationCache(userId)` after a successful verification.
- `frontend/src/shared/layout/LegalLayout.js` - **NEW:** Shared legal page layout with header, footer, prose styling, and table of contents.
- `frontend/src/app/(public)/terms/page.js` - **NEW:** Terms of Service page with 11 sections and proper SEO metadata.
- `frontend/src/app/(public)/privacy-policy/page.js` - **NEW:** Privacy Policy page with 12 sections and proper SEO metadata.
- `frontend/next.config.js` - **updated:** Added redirects for `/privacy` → `/privacy-policy`.
- `docs/WORKBASE.md`, `docs/MODEL-HANDOFF.md` - updated (this session).

(Files from the prior follow-up session — `models/betterAuthUser.model.js`, `repositories/authUser.repository.js`, `models/user.model.js`, verification scripts, `verify-email/page.js`, `emailVerificationSession.js` — already committed/deployed and unchanged this session.)

## Known Issues / Blockers
- None — all issues resolved. Shell access worked. Vercel deploy succeeded. Live tests passed.

## Session Date
- 2026-09-29 (TASK-028: Privacy Policy & Terms pages created, lint/build passed, Vercel deployed, live URLs verified)

## What Is Working
- Privacy Policy at `/privacy-policy` — HTTP 200, correct content rendered
- Terms at `/terms` — HTTP 200, correct content rendered
- `/privacy` redirect — HTTP 301 to `/privacy-policy`
- Signup form Privacy Policy link — points to correct `/privacy-policy`
- LegalLayout follows YOIBI design system patterns
- All pages use shared layout from `src/shared/layout/`
- SEO metadata properly configured via Next.js App Router `export const metadata`
- Email verification fix (TASK-028 follow-up) remains deployed and verified
- Linting: 0 error after escaping JSX entities
- Build: all routes compile, new routes prerendered as static

## Task History Index
One line per task; full detail in `docs/WORKBASE-ARCHIVE.md`.

| Task | Title | Status |
|------|-------|--------|
| TASK-028 | Mandatory Email Verification (React Email + Resend) | COMPLETE — deployed; follow-up 1: emailVerified moved to `user` singular, redirect to /feed w/o duplicate email; follow-up 2 (this session): root-cause fix for verified users bounced to /verify-email mid-session (frontend fallback-branch emailVerified + backend moderation-cache invalidation), deployed Rail `37d05eb4` + Vercel prod |
| TASK-027 | Comment UI revision: simple nesting + "See N Replies" toggle, comment-author profile nav, share-link fix, share modal, @username reply prefix (FE only) | COMPLETE — deployed & live-verified (real-browser E2E 35/35) |
| TASK-026 | Individual tweet page, like/comment icon swap, reply skeleton, Facebook-style threaded comments (FE+BE) | COMPLETE — deployed & live-verified |
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
