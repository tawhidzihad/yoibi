# YOIBI Workbase

Live task scratchpad. The active AI must keep this current at all times. Full historical task detail lives in `docs/WORKBASE-ARCHIVE.md` — read it only when a task needs the history.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## Task History Index`

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**
> **In YOIBI, NO HEADLESS CLI BROWSER TESTING (Playwright, Puppeteer, Chromium, Selenium) may ever be run from the terminal. Use the IDE browser or explicit manual testing checklists.**

## Current Status
- Task ID: TASK-034
- Title: Direct Messaging Message Persistence Investigation & Empty Conversation Suppression
- Status: **COMPLETE & DEPLOYED TO PRODUCTION** — Root cause of missing messages definitively proven with evidence from previous session's cleanup script; permanent safeguards against destructive data purges implemented across rules and docs; empty conversation suppression implemented in backend and frontend; 100% backend unit/integration tests and frontend vitest suites pass; 0 lint errors; clean production build; backend deployed to Railway (`573ebaa2-6477-4839-914e-1e248b41ce89`) and frontend deployed to Vercel (`dpl_DcToM6brsDe7nZSuaZbAZ1c3oTyh` on `https://www.yoibi.com`); verified live in production database.
- Completion Level: `COMPLETE`
- Summary of Findings & Implemented Fixes:
  1. **Root Cause of Disappeared Messages:**
     - Evidence: In the preceding session (`ae52e0d6-6136-449d-b9f0-0bfa563c0d8d`), at 14:10:28 UTC+6, a temporary cleanup script `backend/scripts/temp-cleanup.js` was executed following user instructions to purge test messages. The script performed an overbroad `deleteMany({ createdAt: { $gte: sixHoursAgo } })` and reset `lastMessage = null` on conversations. This hard-deleted all 12 messages created across the database between 08:10 and 14:10 UTC+6 (including the user's "Hello" at 11:47 and "hi" at 11:02).
     - When the user subsequently sent "Hey" at 15:01, it became the only message in the conversation, updating the preview to "Hey".
     - Recovery feasibility: Because records were hard-deleted via Mongoose `deleteMany()`, application-level restoration is impossible. Recovery is only possible via MongoDB Atlas Point-in-Time Restore (PITR) or a pre-14:10 snapshot in the MongoDB Atlas console (must not be done without explicit user authorization).
  2. **Problem 2 (Empty Conversation Suppression in Inbox):**
     - Root cause: `conversationsRepository.listForUser` queried only `{ participants: userId }` without checking `lastMessage` or message count. Conversations initialized via find-or-create or whose messages were purged showed in the inbox with "No messages yet".
     - Backend fix: `conversationsRepository.listForUser` and `getTotalUnreadCount` now filter by `"lastMessage.id": { $exists: true, $ne: null }`. `messages.service.js` similarly enforces `c.lastMessage && c.lastMessage.id` across `unread`, `online`, and `search`. `getConversationById` remains intact so direct navigation from user profiles works.
     - Frontend fix: `InboxView.js` and `DirectMessagesView.js` filter out conversations lacking `lastMessage?.id`.
     - Once a first message is sent, the conversation immediately appears in the conversation list across all tabs.
  3. **Permanent Safeguards & Protections:**
     - Written into `AGENTS.md`, `docs/MANDATORY-RULES.md`, and `docs/BACKEND-GUIDE.md`: Agents must NEVER bulk-delete messages, conversations, or media of real accounts. Test cleanups may only delete records specifically marked by the test with dedicated prefixes (e.g. `testmsg_`) or explicitly recorded document IDs. Never delete by user, date range, or "all". Any destructive operation must print the exact filter and matching count first and require explicit user confirmation.
     - Confirmed by schema and live index queries that no TTL index exists on `messages` or `conversations`.

## Last Completed Step
1. **Root Cause Analysis & Forensic DB Inspection:**
   - Identified the exact script `backend/scripts/temp-cleanup.js` from the prior session transcript that deleted messages via `deleteMany({ createdAt: { $gte: sixHoursAgo } })`.
   - Verified that conversation ID `6ac9c6dc1f6ad0eb3c972a0b` remained identical and was never recreated.
   - Verified no TTL index or auto-purge exists in Mongoose schema or live MongoDB indexes.
   - Verified database URI normalization: both local and Railway environments point to the canonical `yoibi_database`.
2. **Backend & Frontend Implementation:**
   - `backend/src/repositories/conversations.repository.js`: added `"lastMessage.id": { $exists: true, $ne: null }` filter to `listForUser` and `getTotalUnreadCount`.
   - `backend/src/services/messages.service.js`: suppressed empty conversations in `listConversations` across `all`, `unread`, `online`, and `search`. Preserved direct `getConversationById`.
   - `frontend/src/features/messages/ui/InboxView.js` & `DirectMessagesView.js`: added empty conversation suppression guard in conversation lists.
   - `contracts/API-CONTRACT.md` & `contracts/openapi.yaml`: documented empty conversation suppression semantics.
3. **Protections Added:**
   - `AGENTS.md` and `docs/MANDATORY-RULES.md`: added strict prohibitions against bulk deletion, date-range wipes, and untagged test data deletion.
   - `docs/BACKEND-GUIDE.md`: added Direct Messaging data safety and persistence requirements.
4. **Quality Gates & Tests:**
   - Backend tests: Added tests in `backend/tests/messages.test.js` verifying empty conversation suppression in `all`, `unread`, and `online`, direct conversation access by ID, appearance after first message, and multi-page message history pagination without gaps. 100% backend tests passed.
   - Frontend tests: Added tests in `frontend/tests/messages-logic.test.js` verifying empty conversation suppression in tabs and search, and appearance upon first message. 74/74 vitest tests passed.
   - Lints clean (0 errors across backend and frontend).
   - Production Next.js build clean (20/20 routes).
5. **CLI Deployments to Production:**
   - Backend: Deployed via `railway up` in `backend/` (Deployment `573ebaa2-6477-4839-914e-1e248b41ce89`). Verified online and healthy with database connected at `https://yoibi-backend-production.up.railway.app/api/v1/health`.
   - Frontend: Deployed via `vercel --prod` from repo root (Deployment `dpl_DcToM6brsDe7nZSuaZbAZ1c3oTyh`). Aliased to `https://www.yoibi.com`.
6. **Live Production Database State Check:**
   - Inspected live `yoibi_database` via read-only script: verified message persistence in conversation `6ac9c6dc1f6ad0eb3c972a0b` (7 messages persisting, from 15:01 "Hey" to newest messages), and Sophia Rothschild conversation having `hi` message delivered and persisting.
   - Removed all scratch check scripts. Working tree clean.

## Next Step
- Provide user with detailed final report including root cause evidence, restore options, problem 2 fixes, protections, deployment IDs, and manual test checklist.
- Push local commits to `origin/main`.

## Files Touched This Session
- `AGENTS.md`
- `contracts/API-CONTRACT.md`
- `contracts/openapi.yaml`
- `docs/BACKEND-GUIDE.md`
- `docs/MANDATORY-RULES.md`
- `docs/WORKBASE.md`
- `docs/MODEL-HANDOFF.md`
- `backend/src/repositories/conversations.repository.js`
- `backend/src/services/messages.service.js`
- `backend/tests/messages.test.js`
- `frontend/src/features/messages/ui/DirectMessagesView.js`
- `frontend/src/features/messages/ui/InboxView.js`
- `frontend/tests/messages-logic.test.js`
- `frontend/vitest.config.mjs`

## Known Issues / Blockers
- None.

## Session Date
- 2026-10-10
