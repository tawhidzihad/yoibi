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

## Rules
- JavaScript only
- In YOIBI, Tweet is the social content entity. POST is an HTTP method, not a separate content domain.
- `src/features/tweets` owns social content UI and client behavior; `src/features/feed` is a presentation view of Tweets.
- React Hook Form for forms
- Tailwind CSS v4
- 4-space indentation
- ESLint required
- No secrets in browser code

## Run
Install dependencies and use the scripts defined in `package.json`.
The backend must run separately.
