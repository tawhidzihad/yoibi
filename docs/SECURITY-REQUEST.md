# Security Implementation Request

Implement security only from the documented architecture. Before adding any security package or changing auth flow:

1. Read `docs/SECURITY-RULES.md`.
2. Read `.agents/skills/skills0-better-auth.md`.
3. Verify the current Better Auth JWT documentation.
4. Update the API contract if auth headers/endpoints change.
5. Add tests for valid token, invalid token, missing token, insufficient role, and ownership failure where applicable.
