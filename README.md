# YOIBI AI Development Guide

This folder is the operating manual for AI agents working on YOIBI.

## Purpose
YOIBI is being rebuilt as a separate Next.js frontend and Node.js/Express backend using JavaScript, MongoDB, Better Auth, Socket.IO, Cloudinary, and LiveKit. The initial product is a testing/MVP social platform with a Twitter-like experience without cloning Twitter/X.

## Start here
1. `.agents/AI-AGENT.md`
2. `PROJECT-STRUCTURE.md`
3. `docs/CODE-STANDARDS.md`
4. `docs/MANDATORY-RULES.md`
5. `docs/WORKBASE.md`
6. Relevant skill files
7. `contracts/API-CONTRACT.md`
8. `docs/MODEL-HANDOFF.md` when resuming

## Legacy source
Place the old repository at:
`legacy/original-yoibi/`

Its design/assets/skills/workflows are references, not the architecture to copy.

## Official documentation references
- Next.js: https://nextjs.org/docs
- Tailwind CSS upgrade guide: https://tailwindcss.com/docs/upgrade-guide
- React Hook Form: https://react-hook-form.com/get-started
- Better Auth JWT: https://better-auth.com/docs/plugins/jwt
- MongoDB: https://www.mongodb.com/docs/
- Express: https://expressjs.com/
- Socket.IO: https://socket.io/docs/v4/
- Cloudinary: https://cloudinary.com/documentation/node_image_and_video_upload
- LiveKit JS client: https://docs.livekit.io/reference/client-sdk-js/
- LiveKit JS server: https://docs.livekit.io/reference/server-sdk-js/
- Railway: https://docs.railway.com/
- ESLint: https://eslint.org/docs/latest/

## Legacy design references
The old YOIBI repository contained useful `.agents/skills` guidance, especially Feature-Sliced Design and landing-page design. Inspect and preserve relevant design decisions in the new structure.

## Resume command
Use `/yoibi-resume` with an AI agent when switching models or recovering from a crash/limit. The command tells the next agent to recover context from the workbase and handoff rather than restarting.
