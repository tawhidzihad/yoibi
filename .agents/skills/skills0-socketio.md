# Socket.IO Skill

Source of truth: https://socket.io/docs/v4/

Use Socket.IO for realtime application messaging/presence.

Rules:
- Authenticate the socket connection.
- Authorize every sensitive event.
- Keep event names documented in the API contract/realtime section.
- Persist message history in MongoDB; do not treat in-memory socket state as durable storage.
- Keep room/channel naming deterministic.
- Handle disconnects and reconnections explicitly.
