# YOIBI Workbase

This file is a live task scratchpad. The active AI must update it before and during work.

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Direct Messaging follows the server-authoritative rule: User A can direct message User B only if A follows B (`followsRepository.isFollowing(senderId, recipientId) === true`).**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**

## Current Task
- Task ID: TASK-010
- Title: Phase 5 — Milestone 9: Admin Dashboard & Moderation Tools
- Status: COMPLETED & VERIFIED (100% QUALITY GATES PASSED)
- Goal: Implement comprehensive admin moderation dashboard, user management (Block/Unblock/Ban), content moderation (browse & delete across Tweets, Videos, Streams, Meet-Up), reports queue with resolution lifecycle, permanent audit log explorer with external snapshot telemetry, and account-blocked enforcement with dedicated UX.
- Scope Accomplished:
  - Contracts & Specifications:
    - `contracts/API-CONTRACT.md`: Section 14 added with full specifications for all `/admin/*` and `/reports` endpoints.
    - `contracts/openapi.yaml`: Synchronized with Admin and Reports paths, models, schemas, and security requirements.
    - `docs/BAN-DELETION-PLAN.md`: Canonical 5-phase deletion plan and 9-stage technical mapping documented and enforced.
  - Backend Admin & Moderation:
    - Models: `backend/src/models/auditLog.model.js` (durable state machine, snapshots, deletedCounts) and `backend/src/models/report.model.js`.
    - Repositories: `backend/src/repositories/admin.repository.js`, `backend/src/repositories/auditLog.repository.js`, `backend/src/repositories/reports.repository.js`.
    - Services: `backend/src/services/admin.service.js` (canonical 5-phase Ban orchestrator, Block/Unblock, dashboard stats), `backend/src/services/reports.service.js`, `backend/src/services/contentModeration.service.js`.
    - Integration & Security: `backend/src/integrations/betterAuth/betterAuthAdmin.js`, `backend/src/middleware/authorize.js` (`requireAdmin`), `backend/src/middleware/auth.js` (`ACCOUNT_BLOCKED` 403 guard with caching and instant invalidation).
    - Validators & Routes: `backend/src/validators/admin.validator.js`, `backend/src/validators/reports.validator.js`, `backend/src/routes/admin.routes.js`, `backend/src/routes/reports.routes.js`.
    - Automated Tests: `backend/tests/admin.test.js` covering HTTP route security, reports system, block/unblock, content moderation, canonical 5-phase Ban orchestrator, idempotency & resumability, and dashboard metrics; integrated into `backend/tests/index.js` (all 8 backend test suites pass 100%).
  - Frontend Admin Dashboard:
    - API Clients: `frontend/src/lib/api/admin.js`, `frontend/src/lib/api/reports.js`.
    - Account Blocked UX: `frontend/src/app/(auth)/account-blocked/page.js` with server-provided reason and sign-out.
    - Admin Feature: `frontend/src/features/admin/` with custom hooks (`useAdminStats`, `useAdminUsers`, `useAdminReports`, `useAdminContent`, `useAdminAuditLogs`) and UI components (`AdminGuard`, `AdminNav`, `StatsOverview`, `UserTable`, `UserDetailModal`, `BlockUserModal`, `UnblockUserModal`, `BanUserModal`, `ReportsQueue`, `ReportDetailModal`, `ContentModerator`, `AuditLogViewer`).
    - Admin Pages: `/admin`, `/admin/users`, `/admin/content`, `/admin/reports`, `/admin/audit-logs`.
    - Layout Integration: `frontend/src/app/(protected)/layout.js` updated with `isBlocked` redirect guard and conditional Admin navigation.
  - Quality Gates Passed:
    - `backend`: `npm test` -> 100% passing across all 8 suites (Foundation, Tweets, Videos, Streams, Meet-Up, Messaging, Notifications, Admin).
    - `backend`: `npm run lint` -> 0 errors, 0 warnings.
    - `frontend`: `npm run lint` -> 0 errors, 0 warnings.
    - `frontend`: `npm run build` -> Clean production compile, all 21 routes static/dynamic optimized.

## Implementation Checklist
- [x] Synchronize API contracts (`API-CONTRACT.md`, `openapi.yaml`)
- [x] Backend: AuditLog and Report Mongoose models (`auditLog.model.js`, `report.model.js`)
- [x] Backend: Admin, AuditLog, and Reports repositories
- [x] Backend: Better Auth official admin plugin integration (`betterAuthAdmin.js`)
- [x] Backend: Admin service with Block, Unblock, and canonical 5-phase Ban orchestrator
- [x] Backend: Content moderation service and Reports service
- [x] Backend: Admin validators, controllers, and routes
- [x] Backend: Automated test suite (`admin.test.js`, integrated in `index.js`) -> 100% passing
- [x] Backend: ESLint clean (0 errors, 0 warnings)
- [x] Frontend: Admin and Reports API client modules (`admin.js`, `reports.js`)
- [x] Frontend: Account Blocked page (`(auth)/account-blocked/page.js`)
- [x] Frontend: Admin feature hooks and UI components (`frontend/src/features/admin/`)
- [x] Frontend: Admin routes (`/admin`, `/admin/users`, `/admin/content`, `/admin/reports`, `/admin/audit-logs`)
- [x] Frontend: Protected layout integration with `isBlocked` redirect and Admin navigation
- [x] Frontend: ESLint clean (0 errors, 0 warnings)
- [x] Frontend: Production build clean (`npm run build`)
- [x] Documentation updated (`WORKBASE.md`, `MODEL-HANDOFF.md`, `README.md`)

## Next Task
- Task ID: TASK-011
- Title: Phase 5 — Milestone 10: Platform Hardening, End-to-End Polish & Deployment Readiness
- Status: READY FOR NEXT SESSION
- Goal: Perform end-to-end integration smoke testing across all 9 milestones, security audits, rate-limiting hardening, and deployment readiness checks.
