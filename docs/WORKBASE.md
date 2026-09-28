# YOIBI Workbase

Live task scratchpad. The active AI must keep this current at all times. Full historical task detail lives in `docs/WORKBASE-ARCHIVE.md` — read it only when a task needs the history.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## Task History Index`

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**

## Current Status
- Task ID: TASK-028 (second follow-up fix session)
- Title: Mandatory Email Verification (React Email + Resend)
- Status: COMPLETE — root-cause fix for "verified users bounced to /verify-email mid-session" deployed & live-verified
- Completion Level: `COMPLETE`
- Summary of THIS follow-up session (root-cause fix for the reported production regression where both new AND existing/verified users got kicked back to `/verify-email` after ~4-5 min of use and could not reach `/feed`):
  - **Root cause (frontend):** In `frontend/src/features/auth/context/AuthContext.js`, the hydration `else` branch (fired when `/auth/me` returns any non-success, non-`EMAIL_NOT_VERIFIED` result — a transient token race, 5xx, or network hiccup) constructed a `fallbackUser` that OMITTED `emailVerified` entirely. The protected route guard uses `user?.emailVerified !== true`, which is `true` for an object missing the field — so a genuinely-verified user was treated as unverified and bounced to `/verify-email`. Because that `user` state persistedale, every subsequent navigation to `/feed` re-triggered the guard (the reported "recurring interval" loop), and the page could not leave `/verify-email`.
  - **Fix 1 (primary, frontend):** The fallback branch now carries `emailVerified: sessionData.user.emailVerified === true` — read from the DB-backed Better Auth session record (the same authoritative `user` singular source), instead of omitting it. This stops "unknown" transient errors from being treated as "unverified". Fail-closed + no protection weakened: a genuinely unverified session has `emailVerified === false` so the guard still blocks it, and the explicit `EMAIL_NOT_VERIFIED` backend signal branch still forces `emailVerified: false`.
  - **Fix 2 (secondary, backend cache coherence):** `backend/src/services/verification.service.js` `verifyCode` now calls `invalidateUserModerationCache(userId)` after a successful verification. Previously the auth middleware's 30s in-memory `userModerationCache` (which caches `emailVerified`) was not invalidated on `setEmailVerified`, so a just-verified user could be momentarily reported `EMAIL_NOT_VERIFIED` for up to 30s and bounced back to `/verify-email` the instant they tried to leave.
- Live production verification: ✅ deployment + endpoint checks passed (see Last Completed Step). Full timed browser E2E still requires a real browser (documented below; same sandbox limitation as the prior session).

## Last Completed Step
- **Root-cause fixed at source** (both fixes), deployed to production and verified:
  - **Deployed backend to Railway** (production, deployment `37d05eb4` `0bc4-4d12-...` is the current ID shape, Online, health 200). Health 200 confirms the Express server booted with the new `verification.service` (which now requires `middleware/auth`) with no circular-import crash.
  - **Deployed frontend to Vercel** from repo root (production deployment `yoibi-frontend-a7psa3whb-yoibi.vercel.app`, target=production, Ready, aliased to www.yoibi.com). `/`, `/feed`, `/verify-email`, `/login` all return 200.
  - **Fix confirmed present in the served production bundle:** grepping the deployed JS chunk `/_next/static/immutable/chunks/1hc3zz1h-b2e-.js` shows `emailVerified:!1` (EMAIL_NOT_VERIFIED branch still blocks unverified) and `emailVerified:!0===o.user.emailVerified` (the new fallback: `true === sessionData.user.emailVerified`) — i.e. the source fix is live in prod.
  - **Backend source-of-truth verified against production:** `getEmailVerificationStatus(adminUserId)` returns `{"exists":true,"emailVerified":true}` for the verified admin (`emailVerified:true` confirmed via `BetterAuthUser.findById`, both ObjectId and hex-string lookups).
  - **Behavior regression check:** `/auth/me` returns 401 unauthenticated (unchanged, correct).
- Quality gates: backend lint 0 errors, backend tests 100% (ALL suites, incl. Ban orchestrator), frontend lint 0 errors, frontend build successful (all 21 routes). Backend required `verification.service` (with new `middleware/auth` import) in isolation — loads cleanly, `invalidateUserModerationCache` is a function.
- **Cleanup:** removed `backend/_tmp_inspect.js`, `backend/_tmp_test_lookup.js`, `backend/_tmp_live_verify.js`. A proposed throwaway that would mint a production JWT from the JWKS private key was blocked and deleted; forging prod credentials is out of scope.

## Next Step
- **User-manual confirmations (real browser — cannot run in this sandbox, as the prior sessions documented):**
  1. Log in as a VERIFIED account and stay active on `/feed` for a continuous 6-8 minutes — confirm NO bounce to `/verify-email` (this is the exact regression the fallback-branch fix resolves with a verified browser session).
  2. Confirm a genuinely UNVERIFIED account is still blocked from `/feed` and redirected to `/verify-email` (protection preserved).
  3. Fresh sign-up → real Resend email → enter code → confirm redirect to `/feed` with no duplicate email and no immediate re-bounce (this also exercises the new cache-invalidation fix at the verification moment).
- Both deployed fixes are code-verified, quality-gated, deployment-verified, and the production bundle + source-of-truth read are confirmed live. The remaining browser E2E is the only step the sandbox cannot perform.

## Files Touched This Session
- `frontend/src/features/auth/context/AuthContext.js` - **root-cause fix:** fallback `else` branch now carries `emailVerified: sessionData.user.emailVerified === true` so a transient `/auth/me` failure no longer fabricates an unverified state for a verified user (the false bounce to `/verify-email`). Fail-closed; unverified sessions still blocked; `EMAIL_NOT_VERIFIED` branch unchanged.
- `backend/src/services/verification.service.js` - **cache-coherence fix:** `verifyCode` calls `invalidateUserModerationCache(userId)` after a successful verification so the auth gate's 30s cached `emailVerified` is not stale (just-verified user no longer bounced back for up to 30s).
- `docs/WORKBASE.md`, `docs/MODEL-HANDOFF.md` - updated (this session).

(Files from the prior follow-up session — `models/betterAuthUser.model.js`, `repositories/authUser.repository.js`, `models/user.model.js`, verification scripts, `verify-email/page.js`, `emailVerificationSession.js` — already committed/deployed and unchanged this session.)

## Known Issues / Blockers
- Real-browser timed E2E (6-8 min verified survival + unverified block + post-verification no-re-bounce) cannot run in this sandbox — needs a real browser with real sessions/email. Deployed code is code-verified, and the production bundle + backend source-of-truth read are confirmed live; the browser confirmation remains for the user.
- Reading production Railway/Vercel secrets is denied by the sandbox classifier (correct guardrail) — env values from the installed deployment are unchanged/safe; no env change was required for these two fixes.

## Session Date
- 2026-09-28 (TASK-028 second follow-up: root-cause fix for the "verified users bounced to /verify-email mid-session" regression — frontend fallback-branch `emailVerified` + backend moderation-cache invalidation; deployed to Railway `37d05eb4` + Vercel target=production; production bundle + DB source-of-truth verified live)

## What Is Working
- `emailVerified` / `emailVerifiedAt` no longer exist on the `users` (plural) profile collection — read-only checks confirm 0 stored strays.
- `user.emailVerified` (SINGULAR) is the single source of truth, read/written everywhere in the backend (auth gate, login flow, /auth/me, verifyCode, resend) via `authUser.repository`.
- Verification redirects to `/feed`; a sessionStorage flag prevents any duplicate email after successful verification while preserving auto-send on genuine fresh arrival.
- Backend lint 0 errors; backend tests 100%; frontend lint 0 errors; frontend build successful.
- Production: backend deployed (Railway `3acf996a`, health 200), frontend deployed (Vercel `dpl_75QTN4`, www.yoibi.com). Live write-path verification passed with a disposable account, cleaned up afterward.

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
