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
| `BETTER_AUTH_SECRET` | Server-Only (Secret) | Yes | 32+ character signing secret (must match backend) |
| `GOOGLE_CLIENT_ID` | Server-Only (Config) | Optional | Google OAuth 2.0 Client ID for social login |
| `GOOGLE_CLIENT_SECRET` | Server-Only (Secret) | Optional | Google OAuth 2.0 Client Secret for social login |

## Authentication Flow Notes
- **JWT acquisition**: The frontend obtains the external-service JWT exclusively via the official Better Auth client API `authClient.token()` (`GET /api/auth/token`), centralized in `src/lib/api/client.js` (`getJwtToken()`). REST calls reuse it. Do NOT call `authClient.getJwtToken()` (non-existent route in Better Auth 1.7.x) and never use the session cookie as a Bearer token.
- **Authentication model**: YOIBI uses ONLY email + password (no login gate after signup — signup creates an immediately usable account) and Google OAuth. Password reset is removed (`/forgot-password` and `/reset-password` are 404).
- **Signup flow**: Signup does NOT auto sign in (approved rule); the user is redirected to `/login` and signs in immediately after creating the account.
- **Session vs JWT**: The Better Auth session cookie stays with Better Auth; the JWKS-verifiable JWT (1d TTL, `iss` = `aud` = Better Auth baseURL) authenticates Railway Express API calls only.
- **Production Google redirect URI**: `https://www.yoibi.com/api/auth/callback/google` (must match the Google Cloud Console OAuth client exactly; update when adopting a custom domain).

See [docs/ENVIRONMENT.md](/docs/ENVIRONMENT.md) for the complete cross-application environment variable matrix.

## Rules
- JavaScript only
- In YOIBI, Tweet is the social content entity. POST is an HTTP method, not a separate content domain.
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
