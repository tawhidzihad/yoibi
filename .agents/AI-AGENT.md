# YOIBI AI Agent Rules

## Mission
Build and maintain YOIBI as a clean, readable, production-minded testing/MVP social platform. Preserve the existing YOIBI visual identity while migrating the application to a separate Next.js frontend and Node.js/Express backend.

## Mandatory reading order before any code
1. `PROJECT-STRUCTURE.md`
2. `docs/CODE-STANDARDS.md`
3. `docs/MANDATORY-RULES.md`
4. `docs/WORKBASE.md`
5. The relevant frontend/backend skill files
6. `contracts/API-CONTRACT.md` for any API/realtime change
7. Relevant legacy references under `legacy/original-yoibi/.agents/skills` and `legacy/original-yoibi/.github/workflows`
8. `docs/MODEL-HANDOFF.md` when resuming work from another model

## Non-negotiable rules
- Do not start implementation before creating/updating `docs/WORKBASE.md`.
- Use JavaScript, not TypeScript, for application code.
- Frontend and backend are separate applications with separate `package.json` and `README.md` files.
- Frontend uses Next.js App Router and Tailwind CSS v4.
- Backend uses Node.js + Express.js with CommonJS (`require`, `module.exports`).
- Every form uses React Hook Form. Add schema validation where it improves correctness.
- Backend is the final authentication/authorization boundary.
- Better Auth is used for user authentication; its JWT plugin is used for backend JWT verification.
- Never trust a client-supplied `userId`, role, ownership flag, or permission.
- Never hardcode secrets, credentials, API keys, database URIs, or admin passwords.
- Use 4 spaces for indentation. Tabs are forbidden in source files.
- ESLint must pass before a task is considered complete.
- Test incrementally during implementation; do not postpone all testing until the end.
- Keep code easy to read. Prefer simple, explicit code over clever abstractions.
- Do not redesign the public home page aggressively until inner product work is complete.
- Do not replace existing YOIBI design language with a generic Twitter/X clone.
- Do not add a dependency when a small native/custom implementation is sufficient, especially for modals and video-player UI.
- Do not modify unrelated files.

## Task protocol
Before coding:
- inspect the existing implementation and relevant legacy reference
- state the intended files and behavior in `docs/WORKBASE.md`
- confirm API contract impact
- identify required env vars

During coding:
- implement in small, reviewable steps
- run lint/tests/build checks after meaningful milestones
- fix failures immediately
- keep `WORKBASE.md` current

After coding:
- run applicable tests
- run ESLint
- run production build where applicable
- inspect git diff/status
- update documentation/API contract if changed
- write a handoff entry in `docs/MODEL-HANDOFF.md`

## When a task cannot be safely completed
Stop at the smallest safe boundary, document what is complete, what is blocked, the exact missing input/env variable, and the next safe step. Never invent credentials or APIs.
