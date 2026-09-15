---
description: Resume the most recent YOIBI task from the handoff files with minimal context
---

You are resuming work on the YOIBI monorepo (C:\projects\yoibi) with a fresh/empty context. Your entire knowledge of the project must come from the three files below — do NOT re-explain or re-derive the project from the codebase.

## Step 1 — Read ONLY these three files, in this order, before anything else
1. `AGENTS.md` (repo root) — project summary, stack, and the compressed mandatory rules
2. `docs/MODEL-HANDOFF.md` — exact current state, last completed step, exact next step, known issues
3. `docs/WORKBASE.md` — current task status and task history index

Do NOT explore the repo, read other docs, read skill files, or run broad searches as a first action. These three files are sufficient to reconstruct exactly where work left off. A full-repo read is a failure of this command.

## Step 2 — Extract the resume state
From `docs/MODEL-HANDOFF.md` identify:
- The exact **last completed step**
- The exact **next step**
- Any **known issues / blockers**

If the next step references historical architecture decisions you need (auth flow, media provenance, reply flow, etc.), read only the specific section in `docs/MODEL-HANDOFF-ARCHIVE.md` or `docs/WORKBASE-ARCHIVE.md` — never the whole archive.

## Step 3 — Targeted code reading (only if needed)
Only if the next step requires touching specific files, read THOSE specific files (the minimum needed to act). Every file read must be justified by the next step. Never read the whole repo.

## Step 4 — Report, then confirm
Before writing any code, print a short, clear summary to the user:
- **Last done:** (one or two lines)
- **Immediate next step:** (one line)
- **Blockers / known issues:** (if any)

Then ask: **"Resume with this?"** and wait for the user's confirmation — they may want to redirect to different work.

## Step 5 — On confirmation, continue the work
Follow ALL rules in `AGENTS.md`, including:
- Existing code structure and feature-sliced boundaries; match the existing YOIBI design system
- No invented auth/env values, credentials, or API details
- Run applicable lint, tests, and build before finishing
- Deploy + live-test `https://www.yoibi.com/` before pushing when the change is user-facing
- Do not restart or re-verify already-completed work unless verification proves it broken

## Step 6 — Mandatory session close
Before finishing, update `docs/WORKBASE.md` (what changed, what's left, current status) and `docs/MODEL-HANDOFF.md` (exact current state, what's done/not done, precise next step) in their standard section format. This is mandatory, every single time, regardless of whether the task felt complete.

Token discipline throughout: minimal-context-in, precise-resume-out. That is the entire point of this command.
