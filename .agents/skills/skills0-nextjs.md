# Next.js Skill

Source of truth: https://nextjs.org/docs

Current docs reference (verified): Next.js 16.3.4. Always re-check the official docs before making a version-sensitive decision.

Key rules:
- Use App Router.
- Route files belong under `src/app`.
- Use Server Components by default; add `"use client"` only where browser state/events are required.
- Use the current `proxy.js` convention/documentation for request interception when needed; do not treat it as the final backend security boundary.
- Use `loading.js`, `error.js`, `not-found.js`, and route-level layouts where appropriate.
- Do not expose secrets through client code or public environment variables.
- Keep feature business logic in `src/features`.
- Use the official upgrade/migration docs for version changes.
