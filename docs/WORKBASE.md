# YOIBI Workbase

Live task scratchpad. The active AI must keep this current at all times. Full historical task detail lives in `docs/WORKBASE-ARCHIVE.md` — read it only when a task needs the history.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## Task History Index`

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**

## Current Status
- Task ID: TASK-023
- Title: Persistent Context + Resume System (root AGENTS.md, WORKBASE/MODEL-HANDOFF restructure, `/yoibi-resume` command)
- Status: COMPLETE
- Completion Level: `Implemented & Verified`
- Summary: Built a token-efficient session-resume system on top of the existing doc structure (nothing replaced, nothing contradicted):
  1. **Root `AGENTS.md` (new)** — canonical AI entry point: project/stack/layout summary, compressed mandatory rules with pointers to full docs, the mandatory "read MODEL-HANDOFF + WORKBASE first" rule, and the mandatory session-close rule.
  2. **`docs/WORKBASE.md` + `docs/MODEL-HANDOFF.md` restructured** into a fixed, parseable section format (Current Status / Last Completed Step / Next Step / Files Touched This Session / Known Issues / Blockers / Session Date). All historical content migrated verbatim into `docs/WORKBASE-ARCHIVE.md` (new) and `docs/MODEL-HANDOFF-ARCHIVE.md` (new) — nothing deleted; the active files are now cheap to read.
  3. **`.claude/commands/yoibi-resume.md` (new)** — Claude Code custom slash command implementing the minimal-context resume protocol (read only AGENTS.md + MODEL-HANDOFF.md + WORKBASE.md → report last step / next step / blockers → ask "Resume with this?" → continue under AGENTS.md rules). The generic `.agents/commands/yoibi-resume.md` was aligned to the same protocol for non-Claude agents.
  4. **`PROJECT-STRUCTURE.md`** tree updated to include the new files.

## Last Completed Step
- All four deliverables created/updated and verified: root `AGENTS.md`, both archive files with 100% of the prior content migrated, both active state files rewritten in the new format, `/yoibi-resume` command created in `.claude/commands/` and aligned in `.agents/commands/`, `PROJECT-STRUCTURE.md` tree updated.

## Next Step
- No pending code work. Next session: run `/yoibi-resume` to test the resume system end-to-end (it should reconstruct TASK-023 completion from these files without any repo exploration), then proceed to the next feature/fix task as directed by the owner.
- Optional follow-ups the owner may choose: (a) live Google OAuth browser smoke test (needs a real Google test account + owner go-ahead — writes to production), (b) LiveKit realtime browser verification between Vercel and Railway.

## Files Touched This Session
- `AGENTS.md` (new — root entry point)
- `docs/WORKBASE.md` (restructured; history moved out)
- `docs/WORKBASE-ARCHIVE.md` (new — full migrated history)
- `docs/MODEL-HANDOFF.md` (restructured; history/architecture notes moved out)
- `docs/MODEL-HANDOFF-ARCHIVE.md` (new — full migrated history + architecture notes)
- `.claude/commands/yoibi-resume.md` (new — Claude Code slash command)
- `.agents/commands/yoibi-resume.md` (aligned to the same minimal-read protocol)
- `PROJECT-STRUCTURE.md` (tree updated with new files)

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
| TASK-023 | Persistent Context + Resume System (AGENTS.md, doc restructure, /yoibi-resume) | COMPLETE — see Current Status above |
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
