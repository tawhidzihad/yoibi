# YOIBI Workbase

This file is a live task scratchpad. The active AI must update it before and during work.

## Current Task
- Task ID: TASK-001
- Title: Phase 0 Audit & Final Master Implementation Plan Alignment (All 59 Requirements)
- Goal: Perform complete audit, align implementation plan and workbase with all 59 YOIBI project requirements, resolving all conflicts prior to code changes
- Scope: Workspace audit, `docs/LEGACY-DESIGN-MAP.md`, `docs/WORKBASE.md`, `docs/MODEL-HANDOFF.md`, and master `implementation_plan.md`

## Required References
- [x] AI-AGENT.md
- [x] PROJECT-STRUCTURE.md
- [x] CODE-STANDARDS.md
- [x] MANDATORY-RULES.md
- [x] Relevant skill files (.agents/skills/*)
- [x] API-CONTRACT.md and openapi.yaml
- [x] Legacy reference (legacy/original-yoibi/)

## Planned Changes
- Files/folders expected to change:
  - `docs/LEGACY-DESIGN-MAP.md` (Updated with explicit removal of obsolete signup fields)
  - `docs/WORKBASE.md` (Live active state tracking)
  - `docs/MODEL-HANDOFF.md` (Snapshot updated)
  - Next in Phase 1A: `frontend/package.json`, `frontend/postcss.config.mjs`, `frontend/eslint.config.mjs`, `frontend/src/app/globals.css`, `frontend/public/*`
  - Next in Phase 1B: `frontend/src/shared/*` (generic UI, media, feedback, utils)
  - Next in Phase 1C: `frontend/src/app/layout.js`, `frontend/src/app/(protected)/layout.js`, `not-found.js`, `error.js`, `loading.js`
  - Next in Phase 1D: `frontend/src/features/auth/*` (minimal signup without color/preferences/confetti, login, forgot-password, verify-email UI, reset-password)
  - Next in Phase 1E: `frontend/src/app/(public)/page.js` (preserved legacy homepage baseline under strict freeze rule)
  - Next in Phase 1F: `frontend/src/features/*` (feature-owned mock data: posts, tweets, videos, streams, meet-up, users; Post != Tweet)
- API contract changes: Phase 2 dedicated API & realtime contract completion across all endpoints before backend implementation
- Database changes: None for Phase 1 frontend foundation
- Environment variables required: None currently; matrix defined in plan and READMEs

## Implementation Checklist
- [x] Inspect existing code before editing
- [x] Verify workspace structure and separate frontend/backend applications
- [x] Inspect legacy design, colors, fonts, spacing, patterns, assets, skills, workflows
- [x] Complete `docs/LEGACY-DESIGN-MAP.md`
- [x] Revise implementation plan resolving all 59 YOIBI project requirements
- [x] Phase 1A: Setup frontend dependencies (latest stable Next.js 16.3.4, Tailwind v4.3.3, PostCSS, ESLint, globals.css, assets)
- [x] Phase 1B: Build generic shared UI (`Button`, `Input`, `Textarea`, `Card`, `Modal`, `Logo`, `Dock`), custom video player (`VideoPlayer`), and feedback primitives (`LoadingFallback`, `EmptyState`, `ErrorState`, `UnauthorizedState`)
- [x] Phase 1C: Implement App Router shell layouts (3-column desktop grid & mobile dock)
- [x] Phase 1D: Implement minimal Auth pages using React Hook Form (no favorite color, no preferences, clean verification state without confetti)
- [x] Phase 1E: Port preserved legacy homepage baseline (strict freeze: no early redesign)
- [x] Phase 1F: Implement protected social feature slices with feature-owned mock data (feed, posts, tweets, videos, streams, meet-up, wall; Post != Tweet)
- [x] Phase 1G: Run ESLint, production build, responsive testing, and diff verification
- [x] Phase 2: Design and document complete API contracts (`contracts/API-CONTRACT.md` and `contracts/openapi.yaml`)
- [ ] Phase 3: Implement Backend foundation (CommonJS Express, MongoDB, Better Auth JWT verification, Railway readiness)
- [ ] Phase 4: Sliced Frontend/Backend integration (DM follow-rule, docs/BAN-DELETION-PLAN.md before ban, real email verification)
- [ ] Phase 5: Production verification, security review, and deployment checks
- [x] Update `docs/WORKBASE.md` and `docs/MODEL-HANDOFF.md`

## Verification Log
| Check | Result | Notes |
|---|---|---|
| Legacy Audit | Passed | All visual styles, fonts, tokens, assets, and routes inspected |
| Workspace Separation Check | Passed | Separate frontend and backend apps verified |
| Node.js / npm environment | Passed | Node v24.15.0, npm 11.15.0 confirmed |
| Latest Next.js / Tailwind Check | Passed | next@16.3.4, tailwindcss@4.3.3 verified via npm registry |
| 59 Requirements Audit Alignment | Passed | Master implementation_plan.md created resolving all conflicts |
| ESLint Check | Passed | ESLint 9 flat config configured; 0 errors, 0 warnings across all frontend code |
| Frontend Build Check | Passed | Turbopack Next.js 16.3.4 production build succeeded; 14 static pages generated |
| Git Tracking Check | Passed | Git initialized at workspace root, branch `main`, baseline commit `6d167d0` |
| Phase 2 API Contract Check | Passed | `contracts/API-CONTRACT.md` and `contracts/openapi.yaml` complete; YAML 3.0.3 verified with `js-yaml` parser |

## Git Status
- Git Initialized: Yes (root `yoibi/`)
- Current Branch: `main`
- Baseline Commit: `6d167d0` ("chore: initialize yoibi workspace")
- Working Tree State: Clean (staged/committed per milestone)

## Completion State
- Current Phase: Phase 2 Completed & Verified (Transitioning to Phase 3: Backend Foundation)
- Completed: Full workspace & legacy audit, frontend toolchain (Next.js 16.3.4, Tailwind CSS 4.3.3, ESLint flat config), shared UI and feedback components, App Router shell layouts, minimal auth flow, preserved legacy homepage baseline, feature-owned mock slices (feed, tweets, videos, streams, meetup, messages), ESLint validation, production build, Git tracking initialization, Phase 2 complete API and realtime contracts (`contracts/API-CONTRACT.md` and `contracts/openapi.yaml`).
- Remaining: Phase 3 Backend Foundation -> Phase 4 Integration -> Phase 5 Production Verification
- Blocked by: None
- Next exact step: Phase 3 Backend Foundation — Setup CommonJS Express app, MongoDB connection repository layer, Better Auth JWKS verification middleware, and Railway readiness scripts.





