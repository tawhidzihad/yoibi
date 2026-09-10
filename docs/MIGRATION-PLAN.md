# YOIBI Migration Plan

## Phase 0 — Preserve references
1. Clone/copy the current YOIBI repository into `legacy/original-yoibi/`.
2. Inspect the old UI, assets, fonts, colors, `.agents/skills`, and `.github/workflows`.
3. Build `LEGACY-DESIGN-MAP.md` from real findings.

## Phase 1 — New frontend
1. Create standalone `frontend/` Next.js app.
2. Migrate design tokens/assets.
3. Remove obsolete Vite/TypeScript assumptions.
4. Implement layout, loading/error boundaries, shared UI.
5. Implement signup/login/forgot-password/verify-email/privacy.
6. Implement redirect/return-state flows.
7. Finish responsive design foundation.

## Phase 2 — Backend foundation
1. Create standalone `backend/` Express app.
2. CommonJS only.
3. Add config/env validation.
4. MongoDB connection.
5. Better Auth JWT verification.
6. Error, CORS, security middleware.
7. Health endpoint and Railway-ready start.

## Phase 3 — API contract + social systems
Build contract first, then backend, then frontend integration for each slice.

Suggested sequence:
1. users/profile
2. follows
3. tweets
4. comments
5. reactions
6. retweets
7. media upload
8. messaging
9. streams
10. meet-up
11. notifications
12. admin

## Phase 4 — Admin
- dashboard analytics
- paginated resource inspection
- report/message handling
- ban/block/unblock
- destructive data cleanup rules

## Phase 5 — Production verification
- security review
- responsive review
- API contract review
- load/basic realtime checks
- lint/tests/build
- Railway deployment verification
- frontend deployment verification
