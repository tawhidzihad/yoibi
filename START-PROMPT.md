# YOIBI START PROMPT

You are working inside the root `yoibi/` repository.

Before writing any code, read:
- `.agents/AI-AGENT.md`
- `PROJECT-STRUCTURE.md`
- `docs/CODE-STANDARDS.md`
- `docs/MANDATORY-RULES.md`
- `docs/WORKBASE.md`
- `docs/MIGRATION-PLAN.md`
- `docs/MODEL-HANDOFF.md`
- relevant `.agents/skills/*`

Then inspect the legacy project at `legacy/original-yoibi/` and the current git status.

## First objective
Do not immediately implement features. First:
1. verify the repository is the new YOIBI workspace;
2. verify frontend/backend are separate apps;
3. inspect the legacy design, fonts, colors, assets, `.agents/skills`, and `.github/workflows`;
4. complete `docs/LEGACY-DESIGN-MAP.md` from real findings;
5. create/update `docs/WORKBASE.md` with the exact migration step;
6. only then begin implementation.

## Development behavior
- Work in small complete slices.
- Test every meaningful slice while working.
- Run ESLint after code changes.
- Run build checks when routing/config/build changes.
- Do not continue past a failing check without understanding/fixing it.
- Never invent credentials; ask for missing environment values by exact variable name.
- Never hardcode secrets.
- Keep four-space indentation and never use tabs.
- Keep code readable and simple.

## Frontend/backend coordination
If an API is involved:
1. define/update `contracts/API-CONTRACT.md` and `contracts/openapi.yaml`;
2. implement backend contract;
3. verify backend;
4. implement frontend API client integration;
5. verify frontend;
6. update handoff documentation.

## Important product constraints
Preserve YOIBI's legacy visual identity, keep the public homepage close to its existing design until inner work is complete, use React Hook Form for forms, use Better Auth for authentication, enforce JWT/authorization in the backend, and use the documented media/realtime providers.

## Do not finish silently
At the end of the session, update:
- `docs/WORKBASE.md`
- `docs/MODEL-HANDOFF.md`

Record exactly what is complete, what is not complete, what failed, and the next exact step.
