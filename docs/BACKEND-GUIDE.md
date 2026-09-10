# YOIBI Backend Guide

## Stack
- Node.js
- Express.js
- CommonJS (`require`, `module.exports`)
- MongoDB
- Better Auth JWT verification
- Socket.IO
- Cloudinary
- LiveKit

## HTTP structure
Routes wire paths/methods only. Controllers handle HTTP concerns. Services own business logic. Repositories own DB access.

CRUD organization:
- create: create controllers/services
- read: read controllers/services
- update: update controllers/services
- delete: delete controllers/services

Do not create giant feature files that contain every operation.

## Security
- Verify JWT on protected routes.
- Verify token signature using Better Auth JWT/JWKS configuration.
- Enforce ownership/roles on the server.
- Validate input before service logic.
- Apply CORS/trusted-origin rules.
- Rate limit sensitive endpoints.
- Use centralized error handling.
- Keep secrets in environment variables.

## Railway readiness
- Read `PORT` from environment.
- Bind to the runtime host/port correctly.
- Provide a lightweight health endpoint such as `/health`.
- Provide a production `start` script.
- Fail clearly on missing critical configuration.
- Avoid filesystem assumptions that only work locally.

## Environment handling
Use `.env.example` as documentation. Never commit real `.env` files.
If a required value is missing, ask the user for the exact variable name/value needed. If the agent cannot write the env file, tell the user exactly what to add.
