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
| `RESEND_API_KEY` | Server-Only (Secret) | Yes (email delivery) | Resend API key for verification/password-reset emails (never `NEXT_PUBLIC_`) |
| `EMAIL_FROM` | Server-Only (Config) | Yes (email delivery) | Verified sender address; sending domain must be verified in Resend first |

## Authentication Flow Notes
- **JWT acquisition**: The frontend obtains the external-service JWT exclusively via the official Better Auth client API `authClient.token()` (`GET /api/auth/token`), centralized in `src/lib/api/client.js` (`getJwtToken()`). REST calls and Socket.IO hooks all reuse it. Do NOT call `authClient.getJwtToken()` (non-existent route in Better Auth 1.7.x) and never use the session cookie as a Bearer token.
- **Email verification**: Signup requires verification (`sendOnSignUp: true`, `autoSignInAfterVerification: false`). Signup does NOT auto sign in; verification redirects to `/login`.
- **Session vs JWT**: The Better Auth session cookie stays with Better Auth; the JWKS-verifiable JWT (1d TTL, `iss` = `aud` = Better Auth baseURL) authenticates Railway Express API calls only.
- **Production Google redirect URI**: `https://yoibi-frontend.vercel.app/api/auth/callback/google` (must match the Google Cloud Console OAuth client exactly; update when adopting a custom domain).

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
