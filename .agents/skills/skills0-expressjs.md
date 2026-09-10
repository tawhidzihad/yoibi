# Express.js Skill

Source of truth: https://expressjs.com/

Rules:
- CommonJS (`require`, `module.exports`).
- Keep routes small.
- Controllers translate HTTP to service calls.
- Services contain business rules.
- Repositories contain database access.
- Centralize validation, auth, authorization, and errors.
- Add health endpoint.
- Read `PORT` from environment for Railway deployment.
