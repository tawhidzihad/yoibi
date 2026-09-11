# YOIBI Frontend

Standalone Next.js frontend.

## Responsibilities
- UI and page routing
- Better Auth client/authentication UX
- Responsive design
- Shared UI
- Feature UI and client-side interaction
- API consumption through the central API client

## Structure
- `src/app`: routes/layouts/loading/error
- `src/features`: feature systems
- `src/shared`: generic reusable UI
- `src/lib/api`: centralized backend API client

## Features
- `src/features/tweets` & `src/features/feed`: Micro-posts, replies, likes, retweets, and discovery feed.
- `src/features/videos`: Community video library and upload workflows via Cloudinary.
- `src/features/streams`: Live realtime broadcast experiences powered by LiveKit SFU.
- `src/features/meet-up`: Multi-peer collaborative audio/video rooms with screen sharing.
- `src/features/messaging`: Real-time 1-on-1 direct messaging (`MessagingView`, `ConversationList`, `MessageThread`, `MessageComposer`, `useMessagingSocket`) with follow-gated permissions, idempotency protection, typing indicators, and auto-reconnect recovery.
- `src/features/notifications`: Real-time activity alerts feed (`NotificationList`, `NotificationItem`, `NotificationBadge`, `useNotifications`) with optimistic mark-read state, unread badge counters, and deterministic route navigation.
- `src/features/admin`: Administration and moderation suite (`AdminLayout`, `AdminStatsCards`, `AdminUsersTable`, `AdminUserDetailModal`, `BlockUserModal`, `BanUserModal`, `AdminContentTabs`, `AdminReportsTable`, `AdminAuditLogTable`).

## Environment Configuration
Copy `.env.example` to `.env.local` for local development:
```bash
cp .env.example .env.local
```

| Variable | Scope | Required in Prod | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Public (Client) | Yes | Base Express backend REST API endpoint (`http://localhost:5000/api/v1`) |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Public (Client) | Yes | Better Auth origin URL (`http://localhost:3000`) |
| `NEXT_PUBLIC_SOCKET_URL` | Public (Client) | Optional | Socket.IO server URL (auto-derived if empty) |
| `BETTER_AUTH_SECRET` | Server-Only (Secret) | Yes | 32+ character signing secret (must match backend) |
| `GOOGLE_CLIENT_ID` | Server-Only (Config) | Optional | Google OAuth 2.0 Client ID for social login |
| `GOOGLE_CLIENT_SECRET` | Server-Only (Secret) | Optional | Google OAuth 2.0 Client Secret for social login |

See [docs/ENVIRONMENT.md](/docs/ENVIRONMENT.md) for the complete cross-application environment variable matrix.

## Rules
- JavaScript only
- In YOIBI, Tweet is the social content entity. POST is an HTTP method, not a separate content domain.
- Direct Messaging follows the server-authoritative follow rule: A user may send a direct message to another user only when they follow the recipient.
- Notifications are secondary side effects that do not block or fail primary domain actions.
- Admin forms: React Hook Form + Zod for all administrative forms.
- Admin destructive actions: Strict confirmation modals (Ban modal requires explicit handle confirmation and clearly explains irreversible data/media deletion and account removal).
- Backend remains the final authorization boundary (`requireAdmin`); Admin UI is UX protection only.
- Tailwind CSS v4
- 4-space indentation
- ESLint required
- No secrets in browser code

## Run
Install dependencies and use the scripts defined in `package.json`.
The backend must run separately.
