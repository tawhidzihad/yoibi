# YOIBI Backend

Standalone Node.js + Express.js backend.

## Responsibilities
- REST API
- JWT verification and authorization
- MongoDB access
- Business logic
- Socket.IO realtime messaging
- Cloudinary media operations
- LiveKit token/room operations
- Admin operations

## Architecture
- `routes`: HTTP wiring
- `controllers/create|read|update|delete`: HTTP handlers by operation
- `services/create|read|update|delete`: business logic by operation
- `repositories`: database operations
- `models`: database models
- `validators`: request validation
- `middleware`: auth/security/error middleware
- `sockets`: realtime events
- `integrations`: external provider SDK wrappers

## Environment
See `.env.example`. Never commit the real `.env` file.

## Railway
- production start script
- `PORT` from environment
- `/health`
- environment-driven configuration

## API documentation
The canonical contract starts in `../contracts/API-CONTRACT.md` and `../contracts/openapi.yaml`.
Update both when adding/changing public APIs.
