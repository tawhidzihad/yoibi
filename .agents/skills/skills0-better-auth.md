# Better Auth Skill

Sources:
- https://better-auth.com/docs/
- https://better-auth.com/docs/plugins/jwt

Rules:
- Use Better Auth for authentication.
- Enable the JWT plugin for frontend-to-backend token exchange when the backend needs bearer JWTs.
- The JWT plugin provides a token endpoint and JWKS endpoint; backend verification should use the documented JWKS/public-key flow.
- Do not confuse Better Auth's primary session cookie with the JWT plugin token.
- Keep Better Auth configuration server-side where secrets are involved.
- Email/password signup must require email verification before the user is allowed to log in, per YOIBI product rules.
- Google sign-in may authenticate immediately after successful provider auth.
