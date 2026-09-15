# YOIBI Model Handoff

Prevents a new AI model from restarting work from zero. A new model must read this file (plus root `AGENTS.md` and `docs/WORKBASE.md`) before changing code.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Exact Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## What Is Working` · `## Reference`

## Current Status
- Session Date: 2026-09-15
- Active task: TASK-023 — Persistent Context + Resume System (root AGENTS.md, WORKBASE/MODEL-HANDOFF restructure, `/yoibi-resume` command)
- Overall phase: Phase 5 complete; platform live in production; post-launch UX fixes and session-resume tooling
- Completion status: `Implemented & Verified`
- Git repository status: TASK-022 committed on `main` (clean); TASK-023 changes pending commit
- Current branch: `main`

## Last Completed Step
- TASK-023 completed: root `AGENTS.md` created as the canonical AI entry point; `docs/WORKBASE.md` and `docs/MODEL-HANDOFF.md` restructured into the fixed parseable section format; 100% of their historical content migrated to `docs/WORKBASE-ARCHIVE.md` and `docs/MODEL-HANDOFF-ARCHIVE.md`; `/yoibi-resume` slash command created at `.claude/commands/yoibi-resume.md` (and the generic `.agents/commands/yoibi-resume.md` aligned to the same minimal-read protocol); `PROJECT-STRUCTURE.md` tree updated.

## Exact Next Step
- Run `/yoibi-resume` in a fresh session to test the resume system end-to-end — it must reconstruct the TASK-023 completion state from `AGENTS.md` + this file + `docs/WORKBASE.md` alone, with no repo exploration, then await the owner's direction for the next task. No code work is pending.
- Owner-optional follow-ups: (a) live Google OAuth browser smoke test (requires a real Google test account + owner go-ahead — writes to production), (b) LiveKit realtime browser verification between Vercel and Railway.

## Files Touched This Session
- `AGENTS.md` (new — root entry point)
- `docs/WORKBASE.md` (restructured)
- `docs/WORKBASE-ARCHIVE.md` (new — full migrated history)
- `docs/MODEL-HANDOFF.md` (restructured — this file)
- `docs/MODEL-HANDOFF-ARCHIVE.md` (new — full migrated history + architecture notes)
- `.claude/commands/yoibi-resume.md` (new — Claude Code slash command)
- `.agents/commands/yoibi-resume.md` (aligned to the same protocol)
- `PROJECT-STRUCTURE.md` (tree updated with new files)

## Known Issues / Blockers
- 1 pre-existing React Compiler warning in `frontend/src/features/streams/ui/CreateStreamComposer.js` (unrelated; lint exits 0; intentionally not modified per the "do not modify unrelated files" rule).
- Live Google OAuth browser smoke test pending (owner go-ahead required — writes to production).
- Pre-TASK-018 replies may exist in production with `replyToId: null`; deliberately not migrated (indistinguishable from standalone tweets).

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

## Reference
- Entry point for any agent: root `AGENTS.md`
- Resume command: `/yoibi-resume` (`.claude/commands/yoibi-resume.md`)
- Historical session logs + architecture notes (auth, profile, media provenance, reply flow, hardening): `docs/MODEL-HANDOFF-ARCHIVE.md`
- Full task history: `docs/WORKBASE-ARCHIVE.md`
- Full rule set: `.agents/AI-AGENT.md`, `docs/MANDATORY-RULES.md`, `docs/CODE-STANDARDS.md`, `docs/SECURITY-RULES.md`, `PROJECT-STRUCTURE.md`
- API agreements: `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`
- Environment: `docs/ENVIRONMENT.md`
