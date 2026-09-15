# YOIBI Model Handoff

Prevents a new AI model from restarting work from zero. A new model must read this file (plus root `AGENTS.md` and `docs/WORKBASE.md`) before changing code.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Exact Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## What Is Working` · `## Reference`

## Current Status
- Session Date: 2026-09-16
- Active task: TASK-027 — Comment UI revision (simple nesting + "See N Replies"), comment-author profile navigation, share-link fix, share modal, @username reply prefix (frontend-only)
- Overall phase: Phase 5 complete; platform live in production; post-launch feature work
- Completion status: `Implemented, Verified & Deployed`
- Git repository status: TASK-027 committed and pushed to `main`
- Current branch: `main`

## Last Completed Step
- TASK-027 completed end-to-end (frontend only — **no backend change needed**: the share-link fix is pure frontend URL construction; contracts untouched). **(1) Simplified comment UI:** the TASK-026 connector-line design (`ml-4 border-l-2 border-border/60 pl-3` thread lines) is fully REMOVED from the code and the live bundle (verified absent); replies render in one simple nesting level (`ml-10`), collapsed by default behind a dynamic "See {n} Replies" toggle (real count, singular/plural), flipping to "Hide Replies" when expanded; no toggle on zero-reply comments; posting a reply auto-expands its group; collapsing dismisses the open composer. **(2) Profile navigation:** avatar + display name + @username on every comment/reply row are buttons → `/profile/<handle>`; comment text is plain non-navigating text. **(3) Share-link fix:** old `<origin>/feed#<id>` hash-fragment URL (dead since dynamic tweet pages) replaced by `buildTweetShareUrl()` → `<origin>/tweets/<id>` (matches the real route). **(4) Share modal:** Share now opens a sheet on the existing shared `Modal` primitive (Escape / backdrop / X dismiss) with Copy link (real clipboard round-trip verified) + X / Facebook / WhatsApp / LinkedIn share targets via standard URL schemes (brand icons as inline single-path SVGs — lucide-react 1.44 has no brand marks). **(5) @username prefix:** Reply on a comment/reply prefills the inline composer with THAT comment's author `@handle ` as normal editable text (caret at end, verified editable); top-level tweet comment box never prefixed. Quality gates: frontend lint clean (pre-existing warning only) + build clean. Deployed frontend → Vercel (`vercel --prod` from REPO ROOT — rootDirectory is `frontend`). Live verification on https://www.yoibi.com/ passed: **real headless-Chrome CDP E2E 35/35** (expand/collapse, no connector lines, profile nav vs non-nav text, @prefill at both depths + editability + DB persistence, share modal content/dismissal/clipboard, social hrefs, and the pasted-share-link test opening the exact tweet in a fresh browser target), plus API-level E2E and live-bundle marker checks (all PASS). Seeded content deleted (cascade verified); temp test scripts deleted; committed and pushed to `main`.

## Exact Next Step
- No pending work. Next session: run `/yoibi-resume`, then take the owner's next direction. Optional owner follow-up: delete the disposable live-test accounts (content already deleted): `yoibi-rev027-dbg-1789511864692`, `yoibi-rev027-a-1789512268275`, `yoibi-rev027-b-1789512268275`, `yoibi-thread-smoke-1789506915` (all `@example.com`).

## Files Touched This Session
- `frontend/src/features/tweets/ui/TweetShareModal.js` (NEW — share modal + `buildTweetShareUrl` + inline brand SVGs + social targets)
- `frontend/src/features/tweets/ui/TweetReplySection.js` (simplified nesting, See/Hide N Replies state, comment-author profile nav, @handle prefill + caret, composer dismissal on collapse)
- `frontend/src/features/tweets/ui/TweetCard.js` (share button → modal; removed `handleShare`/`copied` state + `/feed#` URL + `showThreadLine` prop/markup + unused imports)
- `docs/WORKBASE.md`, `docs/MODEL-HANDOFF.md` (this file)

## Known Issues / Blockers
- 1 pre-existing React Compiler warning in `frontend/src/features/streams/ui/CreateStreamComposer.js` (unrelated; lint exits 0; intentionally not modified per the "do not modify unrelated files" rule).
- Live Google OAuth browser smoke test pending (owner go-ahead required — writes to production).
- Pre-TASK-018 replies may exist in production with `replyToId: null`; deliberately not migrated (indistinguishable from standalone tweets).
- Disposable live-test accounts exist in production (all content deleted); delete at will (list in Exact Next Step).

## Session Date
- 2026-09-16

## What Is Working
- All 10 Milestones (Phase 1 through Phase 5 Milestone 10) fully implemented and verified; platform live in production (Vercel `https://www.yoibi.com` + Railway `https://yoibi-backend-production.up.railway.app`, health 200 `database: connected`).
- Twitter-like micro-posting, likes, retweets, feeds; tweet media via secure server-signed Cloudinary intents.
- **Threaded comments (TASK-026 + TASK-027 revision):** individual tweet pages at `/tweets/[tweetId]` (body-text click navigates; image clicks still open the lightbox); [comment][retweet][like][share] action row everywhere; skeleton loading; backend stores arbitrary-depth `replyToId`/`rootTweetId`/`rootCommentId` (grouping is presentation-only); per-comment likes; inline per-comment reply composers with **@handle prefill**; comment/reply avatar + name + username navigate to profiles (comment text does not); **simplified one-level nesting with collapsed-by-default "See N Replies" / "Hide Replies" toggles (connector lines removed in TASK-027)**; cascade deletes with consistent counters; legacy replies backfilled on read.
- **Tweet sharing (TASK-027):** share button opens a modal (reuses the shared `Modal` primitive; Escape/backdrop/X dismiss) with Copy link (correct `<origin>/tweets/<id>` URL — the old `/feed#` fragment pattern is gone) and X / Facebook / WhatsApp / LinkedIn share targets via plain URL schemes.
- Cloudinary server-signed video uploads (provenance-verified, single-use intents), metadata registration, playback views tracking.
- LiveKit live stream broadcasts (host publishing, anonymous viewing, lifecycle termination) and Meet-Up multi-peer rooms (reservation TTLs, atomic slot capacity).
- Complete User Profile System: dynamic `/profile/[username]`, editing (name/handle/bio/country/avatar/banner), real content tabs with server-side counts.
- Comprehensive Admin & Moderation suite (dashboard metrics, block/unblock, canonical 5-phase/9-stage ban orchestrator, content moderation, reports queue).
- Auth: Better Auth 1.7.4 (email + Google OAuth, no email verification), JWT + JWKS verified by the backend, canonical `users` profile auto-provisioning, database-backed rate limiting.
- Security: multi-tier rate limiting, security response headers, strict CORS origin validation, LiveKit camera/mic permissions policy.
- Auth-aware home page nav (TASK-022), responsive mobile drawer navigation, inline upload composers.
- People search (TASK-024): authenticated `GET /users/search`, desktop right-panel inline search, left-sidebar Profile Nav + kebab account switcher, mobile drawer profile-preview.
- Mobile search UX (TASK-025): visible search bar in the mobile top bar, top-anchored scrollable results dropdown, logo-only mobile header, no native clear button, site-wide hidden scrollbars (scrolling fully functional).

## Reference
- Entry point for any agent: root `AGENTS.md`
- Resume command: `/yoibi-resume` (`.claude/commands/yoibi-resume.md`)
- Historical session logs + architecture notes (auth, profile, media provenance, reply flow, hardening): `docs/MODEL-HANDOFF-ARCHIVE.md`
- Full task history: `docs/WORKBASE-ARCHIVE.md`
- Full rule set: `.agents/AI-AGENT.md`, `docs/MANDATORY-RULES.md`, `docs/CODE-STANDARDS.md`, `docs/SECURITY-RULES.md`, `PROJECT-STRUCTURE.md`
- API agreements: `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`
- Environment: `docs/ENVIRONMENT.md`
- Deployment note: Vercel deploys must run from the REPO ROOT (`vercel --prod` in `C:\projects\yoibi`), because the Vercel project's rootDirectory is `frontend`; Railway deploys run from `backend/` (`railway up`).
