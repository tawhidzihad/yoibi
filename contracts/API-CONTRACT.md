# YOIBI API Contract

This document is the single human-readable source of truth for frontend/backend communication.

## Rules
- Frontend must not invent endpoints.
- Backend must not silently change request/response shapes.
- Breaking API changes update this document first.
- Use `/api/v1/...` versioned paths unless a documented exception exists.
- Use consistent response envelopes and error codes.

## Example response envelope
```json
{
    "success": true,
    "data": {},
    "message": ""
}
```

## Example error envelope
```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Please check the submitted fields.",
        "fields": {}
    }
}
```

## Contract sections to complete per feature
### Auth
- endpoint
- method
- auth requirement
- request
- success response
- error responses

### Users / Follows
Document profile reads, follow/unfollow, counts, and permissions.

### Tweets / Comments / Reactions / Retweets
Document create/read/update/delete and interaction endpoints.

### Media
Document upload initiation/completion, asset metadata, size/type limits, and ownership.

### Messaging
Document conversations, message history, send message, unread state, and Socket.IO events.

### Streams
Document stream create/start/end/join and LiveKit token generation.

### Meet-Up
Document room create/join/leave and LiveKit token generation.

### Admin
Document dashboard stats, paginated resources, reports/messages, and ban/block/unblock actions.
