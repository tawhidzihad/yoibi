# YOIBI Mandatory Rules

These rules are hard requirements. Do not weaken or bypass them to finish faster.

1. Read the required docs before coding.
2. Create/update the workbase before implementation.
3. Use 4 spaces; never tabs.
4. Use ESLint and keep lint clean.
5. Test meaningful work while building it.
6. Do not invent missing credentials or API details.
7. Keep frontend and backend independent.
8. Keep the API contract synchronized.
9. Do not expose private backend credentials to the browser.
10. Do not trust frontend authorization decisions.
11. Use React Hook Form for forms.
12. Use custom modal and custom video-player implementations unless a later requirement explicitly approves a third-party package.
13. Do not redesign the home page heavily during migration.
14. Preserve the old visual system as the starting point.
15. Prefer simple layouts: flex first when enough, grid where appropriate, avoid unnecessary complexity.
16. Every loading state should have a reusable YOIBI loading fallback.
17. Every protected action needs a clear logged-out redirect path and return URL/state.
18. Every destructive admin action needs confirmation and server-side authorization.
19. Never hardcode the admin password or any other secret.
20. Before marking a task complete, run the applicable lint, tests, build, and diff checks.
