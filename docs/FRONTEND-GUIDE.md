# YOIBI Frontend Guide

## Stack
- Next.js App Router (current stable; verify the official docs before dependency changes)
- JavaScript
- Tailwind CSS v4
- React Hook Form
- Better Auth client integration

## Page architecture
`src/app` owns routes and page composition. Feature behavior lives in `src/features`.

Suggested route groups:
- `(public)`: home, privacy policy, public profile/content views
- `(auth)`: login, signup
- `(protected)`: authenticated feed, profile, messaging, stream, meet-up
- `admin`: admin dashboard and moderation views

## Design system
- Inspect legacy YOIBI colors and fonts first.
- Define tokens in `src/app/globals.css`.
- Reuse existing assets where appropriate.
- Keep shared content components in `src/shared/ui`.

## UX requirements
- Responsive-first: mobile, tablet, desktop.
- Keep container widths consistent.
- Use simple flex/grid layouts.
- Custom modal.
- Custom video player.
- Reusable YOIBI logo loading fallback.
- Clear empty, error, and loading states.

## Authentication UX
- Email/password login.
- Google login.
- Email signup creates an immediately usable account (no verification, no password reset).
- Signup must not automatically sign the user in.
- Google sign-in may authenticate immediately.
- Login redirect must preserve the originally requested page/action where practical.
- Protected interactions such as like, retweet, comment, DM, joining rooms, and joining streams require authentication.

## Home page rule
Keep the existing recognizable home design during the migration. Make only small improvements initially. Do not let the agent redesign it heavily before inner systems are complete.
