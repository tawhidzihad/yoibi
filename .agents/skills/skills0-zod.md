# Zod Skill

Source of truth: https://zod.dev/

Zod is an optional but recommended schema-validation layer for shared form/API validation when it simplifies correctness.

Rules:
- Do not introduce Zod for trivial one-field forms unless useful.
- Keep validation schemas close to the feature that owns them.
- Backend validation is mandatory even when frontend validation exists.
- Never treat client validation as authorization/security.
