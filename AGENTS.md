# YOIBI — AI Agent Entry Point

YOIBI is a Twitter-like social platform with live streaming and meet-up rooms, live in production at **https://www.yoibi.com/** (frontend on Vercel, backend on Railway at `https://yoibi-backend-production.up.railway.app`).

## Read first, every session
Before starting ANY new task, read `docs/MODEL-HANDOFF.md` and `docs/WORKBASE.md` first — they contain the current state of the project and the most recent unfinished work. Do not ask the user to re-explain context that is already in these files. `/yoibi-resume` automates this.

## Mandatory session close
Before ending ANY task/session, you MUST update `docs/WORKBASE.md` (what changed, what's left, current status) and `docs/MODEL-HANDOFF.md` (exact current state, what's done, what's not done, and the precise next step) — this is mandatory, not optional, every single time, regardless of whether the task felt complete or not. Always use the standard section format already in those files (Current Status / Last Completed Step / Next Step / Files Touched This Session / Known Issues / Blockers / Session date).

## Stack
- **Frontend** (`frontend/`): Next.js 16 App Router, React 19, Tailwind CSS v4, Better Auth 1.7.4 (JWT plugin + JWKS). JavaScript only — no TypeScript.
- **Backend** (`backend/`): Node.js + Express 5 (CommonJS), Mongoose 9 / MongoDB Atlas (single `yoibi_database`), layered `routes → controllers → services → repositories`.
- **Media**: Cloudinary with server-issued signed upload intents (`CLOUDINARY_API_SECRET` never leaves the server).
- **Realtime**: LiveKit WebRTC for streams and meet-up rooms (short-lived server-minted tokens; Socket.IO is removed).
- **Auth**: Better Auth owns authentication; backend verifies Bearer JWTs against JWKS and is the final authorization boundary; one canonical `users` profile collection auto-provisioned from verified JWT claims.

## Repo layout
- `frontend/` — Next.js app (`src/app` routes, `src/features` feature slices, `src/shared`, `src/lib` central API client)
- `backend/` — Express API (`src/routes|controllers|services|repositories|models|validators|middleware|integrations`)
- `contracts/` — `API-CONTRACT.md` + `openapi.yaml`; any API change must keep these in sync
- `docs/` — all project docs, including the session-state files above
- `.agents/` — `AI-AGENT.md` (full task protocol) + `skills/` (per-tech guides) + `commands/`
- `legacy/original-yoibi/` — read-only design/architecture reference for the migration

## Non-negotiable rules (compressed)
- Follow the feature-sliced boundaries and ownership rules in `PROJECT-STRUCTURE.md`; keep pages thin, business logic in `features/` (frontend) and `services/` (backend).
- Match the existing YOIBI design system. No generic Twitter/X clone, no aggressive home-page redesign, no new dependency when a small native/custom implementation suffices (especially modals and video-player UI).
- JavaScript only, 4 spaces (no tabs). React Hook Form for all non-trivial forms. All frontend API calls through the central API client.
- Never invent credentials, secrets, env values, or API details. Never hardcode secrets. Never trust client-supplied `userId`/role/ownership — identity comes only from the verified token (`req.user`).
- Do not modify unrelated files.
- Before finishing: run applicable lint, tests, and build. Deploy + live-test `https://www.yoibi.com/` before pushing when the change is user-facing.
- Full detail: `.agents/AI-AGENT.md`, `docs/MANDATORY-RULES.md`, `docs/CODE-STANDARDS.md`, `docs/SECURITY-RULES.md`. Skill files in `.agents/skills/` cover individual technologies; read the relevant one when working in that area.

## Resuming a session
Run `/yoibi-resume` (from `.claude/commands/yoibi-resume.md`). It reads only `AGENTS.md` + `docs/MODEL-HANDOFF.md` + `docs/WORKBASE.md`, reports the last step and exact next step, asks for confirmation, then continues under the rules above. Historical task detail lives in `docs/WORKBASE-ARCHIVE.md` and `docs/MODEL-HANDOFF-ARCHIVE.md` — consult those only when a task specifically needs the history.
