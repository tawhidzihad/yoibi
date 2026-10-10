# YOIBI Workbase

Live task scratchpad. The active AI must keep this current at all times. Full historical task detail lives in `docs/WORKBASE-ARCHIVE.md` — read it only when a task needs the history.

Every session writes to this file in EXACTLY this section structure:
`## Current Status` · `## Last Completed Step` · `## Next Step` · `## Files Touched This Session` · `## Known Issues / Blockers` · `## Session Date` · `## Task History Index`

## Core Architectural Standard
> **In YOIBI, `Tweet` is the social content entity. `POST` is an HTTP request method, not a separate content domain.**
> **In YOIBI, `Video` is the video content entity (Shorts & Longform), hosted via Cloudinary with server-issued upload intents and MongoDB metadata.**
> **In YOIBI, Account Moderation enforces the strict distinction: Block is reversible account suspension (Better Auth `banUser()` + session revocation, data preserved); Ban is permanent, irreversible data purge (Better Auth `removeUser()` + 5-phase data purge).**

## Current Status
- Task ID: TASK-032
- Title: Real-time Direct Messaging feature at /message
- Status: **COMPLETE** — Full direct messaging system implemented across backend and frontend, including follow-gated conversations, idempotency, monotonic delivery and read ticks, Socket.IO real-time gateway with Better Auth JWKS verification, multi-connection presence tracking, typing indicators, Cloudinary signed upload intents for media (images and videos) with lightbox preview, active friends row, inbox filters (All, Unread, Following, Online), message search, profile page Message button, unread counts badge in navigation, and full test suite passing 100%. Deployed to Railway (`92fe6d44-f9f6-4a4a-b529-a859c7241282`) and Vercel (`dpl_2GbpX61FDWpPokvAXLqd8eWBRgck`), live verified on `https://www.yoibi.com` with two accounts, confirmed by user, test data cleaned up.
- Completion Level: `COMPLETE`
- Summary:
  - Designed and archived 5 visual reference images in `docs/design-refs/messages/`.
  - Phase 1 & 2 Backend:
    - Centralized messaging constants in `backend/src/config/constants.js` (`MESSAGE_TEXT_MAX_LENGTH = 2000`, `MESSAGE_IMAGE_MAX_BYTES = 10MB`, `MESSAGE_VIDEO_MAX_BYTES = 50MB`, `TYPING_TIMEOUT_MS = 3000`).
    - Models: `conversation.model.js` (participantKey sorted, unreadCounts map, lastReadAt) and `message.model.js` (compound index for idempotency, text, media, status).
    - Repositories: `conversations.repository.js`, `messages.repository.js`, extended `users.repository.js`.
    - Services: `presence.service.js` (multi-socket presence), `messages.service.js` (follow-gated conversation creation, idempotency, grapheme limit enforcement, signed media intent creation).
    - Socket.IO gateway in `backend/src/sockets/socketServer.js` mounted in `server.js` with Better Auth JWT handshake verification, events: `conversation:join/leave`, `message:send/delivered/read`, `typing:start/stop`, `presence:sync`, `auth:force_disconnect`.
    - Controllers & routes mounted at `/api/v1/messages`.
    - Moderation integration in `admin.service.js` (media snapshot in Phase B, message purge in Phase C, real-time socket eviction).
    - Comprehensive test suite in `backend/tests/messages.test.js` passing 100%.
  - Phase 2 Frontend:
    - Socket singleton client in `frontend/src/features/messages/socket/socketClient.js` with dynamic token refreshing.
    - Centralized API methods in `frontend/src/features/messages/api/messagesApi.js`.
    - Context in `frontend/src/features/messages/context/MessagesContext.js` managing live unread counts, presence, typing, active friends.
    - App layout in `frontend/src/app/(protected)/layout.js` wrapped in `MessagesProvider` with live unread badge in desktop and mobile drawer.
    - Profile header in `frontend/src/features/profile/ui/ProfileHeader.js` updated with follow-gated "Message" button.
    - Feature UI components in `frontend/src/features/messages/ui/`: `ActiveFriendsRow.js`, `ConversationCard.js`, `ChatHeader.js`, `TypingIndicator.js`, `MediaCards.js` (with lightbox & video preview), `MessageBubble.js` (with `StatusTicks.js`), `MessageComposer.js` (with `AutoGrowTextarea`, grapheme counter, Cloudinary upload), `ChatThread.js` (cursor pagination, date dividers, auto-scroll), `InboxView.js`, `DirectMessagesView.js`.
    - Route pages: `/message` and `/message/[conversationId]`.
  - Contracts & documentation: `contracts/API-CONTRACT.md`, `contracts/openapi.yaml`, `docs/ENVIRONMENT.md`, `docs/SECURITY-RULES.md`, `docs/BAN-DELETION-PLAN.md`, `PROJECT-STRUCTURE.md`, and `README.md` updated.
  - Quality gates: 100% backend tests passing, 0 backend lint errors, 0 frontend lint errors, 20/20 Next.js routes built and statically optimized.
  - Deployments: Backend deployed to Railway (`92fe6d44-f9f6-4a4a-b529-a859c7241282`), Frontend deployed to Vercel (`dpl_2GbpX61FDWpPokvAXLqd8eWBRgck`).
  - Two-account live testing on `https://www.yoibi.com`: follow-gate rejection, real-time messaging, typing indicators, monotonic status ticks (Sent -> Delivered -> Read), multi-socket presence, media intent creation, and cleanup.

## Last Completed Step
1. **Production Deployment & Verification:**
   - Deployed Railway backend: Deployment `92fe6d44-f9f6-4a4a-b529-a859c7241282` confirmed healthy (200 OK, Socket.IO listening).
   - Deployed Vercel frontend: Deployment `dpl_2GbpX61FDWpPokvAXLqd8eWBRgck` live on `https://www.yoibi.com`. `NEXT_PUBLIC_SOCKET_URL` verified present in client bundle.
2. **Bug Fixes During Live Testing:**
   - Fixed `messages.validator.js`: permitted `media: null` in payload schema when sending text-only messages to avoid 400 validation error.
   - Fixed conversation views: mapped conversation partner cleanly to `recipient` / `otherParticipant`.
   - Exported `getConversationById` alias in `messagesApi.js`.
   - Replaced `useEffect` state adjustment with React 19 render-time adjustment for `initialConversationId`.
3. **Multi-Account Production Live Testing:**
   - User A (`hfztauhid@gmail.com`) and User B (`tawhid.pc3@gmail.com`) tested in real production environment.
   - Follow-gate confirmed: 403 `FOLLOW_REQUIRED` for non-followers; profile Message button appears when following.
   - Real-time WSS connection established for both users.
   - Real-time text messaging over Socket.IO and REST fallback verified.
   - Real-time typing indicators verified both ways.
   - Real-time monotonic status ticks (Sent -> Delivered -> Read) verified.
   - Image/video media upload intent generation and validation verified.
   - User verified in chat: *"i am testing the messages it work now complete other steps"*.
4. **Data Cleanup:**
   - Removed temporary test messages and conversation from MongoDB `yoibi_database`.

## Next Step
- **None** — TASK-032 is COMPLETE.

## Files Touched This Session
- **Backend Created:**
  - `backend/src/models/conversation.model.js`
  - `backend/src/models/message.model.js`
  - `backend/src/repositories/conversations.repository.js`
  - `backend/src/repositories/messages.repository.js`
  - `backend/src/services/presence.service.js`
  - `backend/src/services/messages.service.js`
  - `backend/src/validators/messages.validator.js`
  - `backend/src/sockets/socketServer.js`
  - `backend/src/controllers/messages.controller.js`
  - `backend/src/routes/messages.routes.js`
  - `backend/tests/messages.test.js`
- **Backend Modified:**
  - `backend/src/config/constants.js`
  - `backend/src/repositories/users.repository.js`
  - `backend/src/services/admin.service.js`
  - `backend/src/integrations/cloudinary/cloudinary.js`
  - `backend/src/routes/index.js`
  - `backend/src/server.js`
  - `backend/tests/index.js`
- **Frontend Created:**
  - `frontend/src/features/messages/socket/socketClient.js`
  - `frontend/src/features/messages/api/messagesApi.js`
  - `frontend/src/features/messages/context/MessagesContext.js`
  - `frontend/src/features/messages/ui/ActiveFriendsRow.js`
  - `frontend/src/features/messages/ui/ConversationCard.js`
  - `frontend/src/features/messages/ui/ChatHeader.js`
  - `frontend/src/features/messages/ui/TypingIndicator.js`
  - `frontend/src/features/messages/ui/MediaCards.js`
  - `frontend/src/features/messages/ui/MessageBubble.js`
  - `frontend/src/features/messages/ui/StatusTicks.js`
  - `frontend/src/features/messages/ui/MessageComposer.js`
  - `frontend/src/features/messages/ui/ChatThread.js`
  - `frontend/src/features/messages/ui/InboxView.js`
  - `frontend/src/features/messages/ui/DirectMessagesView.js`
  - `frontend/src/app/(protected)/message/page.js`
  - `frontend/src/app/(protected)/message/[conversationId]/page.js`
  - `frontend/tests/messages-logic.test.js`
- **Frontend Modified:**
  - `frontend/src/app/(protected)/layout.js`
  - `frontend/src/features/profile/ui/ProfileHeader.js`
  - `frontend/src/features/legal/ui/PrivacyPolicyView.js`
  - `frontend/src/features/legal/ui/TermsOfServiceView.js`
- **Design & Documentation:**
  - `docs/design-refs/messages/ref-1-inbox.png` through `ref-5-chat-media.png`
  - `contracts/API-CONTRACT.md`
  - `contracts/openapi.yaml`
  - `docs/ENVIRONMENT.md`
  - `docs/BAN-DELETION-PLAN.md`
  - `docs/SECURITY-RULES.md`
  - `PROJECT-STRUCTURE.md`
  - `README.md`
  - `docs/WORKBASE.md`
  - `docs/MODEL-HANDOFF.md`

## Known Issues / Blockers
- **Known Limitation:** In-memory Cloudinary upload intent store loses pending unredeemed upload intents on a Railway restart (pending upload intents expire within 10 minutes anyway; once redeemed, message records in MongoDB are permanent).

## Session Date
- 2026-10-10 (TASK-032: Real-time Direct Messaging feature at /message)

## What Is Working
- ✅ Direct real-time messaging with Socket.IO over WSS with Better Auth JWKS verification
- ✅ Follow-gated conversation initiation (403 `FOLLOW_REQUIRED` for non-followers)
- ✅ Monotonic status ticks: Sent (`✓`), Delivered (`✓✓` neutral), Read (`✓✓` colored)
- ✅ Multi-connection presence tracking (online/offline transitions)
- ✅ Debounced real-time typing indicators with 3s timeout
- ✅ Cloudinary signed upload intents for images (10MB) and videos (50MB) with lightbox preview
- ✅ Active friends row with live presence dots
- ✅ Inbox filters (All, Unread, Following, Online) and message search
- ✅ Live unread count badges in desktop navigation and mobile drawer
- ✅ Profile page "Message" button for followed users
- ✅ Mobile and desktop responsive layouts with auto-scroll and composer pinning
- ✅ Admin moderation ban/block cascade with socket eviction and message purge
- ✅ Zero regressions on Feed, Tweets, Replies, Videos, Meet-Up, Search, and Profiles

## Task History Index
One line per task; full detail in `docs/WORKBASE-ARCHIVE.md`.

| Task | Title | Status |
|------|-------|--------|
| TASK-032 | Real-time Direct Messaging feature at /message | COMPLETE — Socket.IO real-time delivery, follow-gated conversations, monotonic ticks, presence, typing, media intents, deployed Railway + Vercel prod, live-verified |
| TASK-031 | Seeded recency-weighted discovery tweets and own-post pinning on /feed | COMPLETE — constants centralized, prng utility, disjoint streams, own-post pinning, mode opt-in, 0 duplicates across pages, deployed Rail + Vercel prod, live-verified |
| TASK-030 | Raise Tweet limit to 380, server-enforced limit, auto-grow textarea, clean /tweets header | COMPLETE — server constant 380, dynamic config endpoint, grapheme counting, header removed, AutoGrowTextarea, deployed Rail + Vercel prod, live-verified |
| TASK-029 | Complete Removal of Streams Feature | COMPLETE — all streams code/tests deleted, database collection dropped, contracts/docs synced, deployed Rail + Vercel prod, live-verified |
| TASK-028 | Mandatory Email Verification (React Email + Resend) | COMPLETE — deployed; follow-up 1: emailVerified moved to `user` singular, redirect to /feed w/o duplicate email; follow-up 2 (this session): root-cause fix for verified users bounced to /verify-email mid-session (frontend fallback-branch emailVerified + backend moderation-cache invalidation), deployed Rail `37d05eb4` + Vercel prod |
| TASK-027 | Comment UI revision: simple nesting + "See N Replies" toggle, comment-author profile nav, share-link fix, share modal, @username reply prefix (FE only) | COMPLETE — deployed & live-verified (real-browser E2E 35/35) |
| TASK-026 | Individual tweet page, like/comment icon swap, reply skeleton, Facebook-style threaded comments (FE+BE) | COMPLETE — deployed & live-verified |
| TASK-025 | Mobile search UX fixes (top-bar search bar, top-anchored dropdown, clear-button removal, hidden scrollbars) | COMPLETE — deployed & live-verified |
| TASK-024 | People Search + nav redesign (search endpoint, right panel, Profile nav, account switcher, mobile search modal + drawer preview) | COMPLETE — deployed & live-verified |
| TASK-023 | Persistent Context + Resume System (AGENTS.md, doc restructure, /yoibi-resume) | COMPLETE (history in WORKBASE-ARCHIVE.md) |
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
