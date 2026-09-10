# YOIBI API & Realtime Contract

Version: 1.0.0  
Specification Type: Human-readable single source of truth for frontend/backend communication.

---

## 1. Global Standards

### 1.1 Base URL & Protocol
- HTTP Base URL: `/api/v1`
- Protocol: HTTPS in production; HTTP in local development (`http://localhost:5000/api/v1`)
- Realtime Gateway: Socket.IO on `/socket.io` with WebSocket transport preference.
- LiveKit Gateway: LiveKit Cloud or self-hosted server (`wss://livekit.yoibi.com`) with tokens issued by the backend.

### 1.2 Authentication
- Authentication Authority: Better Auth (`/api/auth/*`).
- API Authorization: Bearer JWT verification via the Better Auth JWT Plugin and public JWKS endpoint.
- Header format:
  ```http
  Authorization: Bearer <jwt_token>
  ```
- Backend Rule: Backend is the final security boundary. Never trust client-supplied `userId`, `role`, or permissions. All user contexts are derived exclusively from the cryptographically verified JWT payload.

### 1.3 Uniform Response Envelope
All HTTP responses (success and error) adhere strictly to predictable JSON envelopes.

**Success Envelope:**
```json
{
    "success": true,
    "data": {},
    "message": "Operation completed successfully"
}
```

**Paginated Success Envelope:**
```json
{
    "success": true,
    "data": {
        "items": [],
        "pagination": {
            "page": 1,
            "limit": 20,
            "totalItems": 150,
            "totalPages": 8,
            "hasNextPage": true,
            "nextCursor": "65e2..."
        }
    },
    "message": ""
}
```

**Error Envelope:**
```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Please correct the errors in the submitted form.",
        "fields": {
            "email": "Must be a valid email address",
            "age": "Must be at least 16 years of age"
        }
    }
}
```

### 1.4 Standard Error Codes
- `UNAUTHORIZED`: Token missing, expired, or signature invalid (HTTP 401).
- `ACCOUNT_BLOCKED`: User account is blocked; client redirected to blocked status page (HTTP 403).
- `EMAIL_NOT_VERIFIED`: Email verification required before access (HTTP 403).
- `FORBIDDEN`: Insufficient role or not resource owner (HTTP 403).
- `NOT_FOUND`: Target resource does not exist (HTTP 404).
- `VALIDATION_ERROR`: Malformed input payload failing schema rules (HTTP 422).
- `RATE_LIMIT_EXCEEDED`: Too many requests within window (HTTP 429).
- `INTERNAL_SERVER_ERROR`: Unhandled backend exception with sanitized output (HTTP 500).

---

## 2. Health & System

### `GET /api/v1/health`
- Auth: Public
- Description: Lightweight system health status for uptime monitors and Railway deployment health checks.
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "status": "healthy",
          "timestamp": "2026-09-11T00:00:00.000Z",
          "database": "connected",
          "version": "1.0.0"
      },
      "message": "Backend service healthy"
  }
  ```

---

## 3. Auth & Identity

### `GET /api/v1/auth/me`
- Auth: Required (`Bearer <token>`)
- Description: Retrieves current authenticated user context, permissions, and moderation status.
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "id": "usr_65e1a2b3",
          "email": "user@yoibi.com",
          "name": "Jane Doe",
          "handle": "@janedoe",
          "role": "user",
          "isEmailVerified": true,
          "isBlocked": false,
          "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
          "createdAt": "2026-09-01T12:00:00.000Z"
      },
      "message": ""
  }
  ```
- Error (401 `UNAUTHORIZED`): Token invalid or missing.
- Error (403 `ACCOUNT_BLOCKED`): Account is currently blocked by administrator.

---

## 4. Users & Follows

### `GET /api/v1/users/:handle`
- Auth: Optional (if authenticated, returns `isFollowing` and relationship status)
- Description: Fetch public user profile and follow counts by user handle (e.g. `@janedoe` or `janedoe`).
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "id": "usr_65e1a2b3",
          "handle": "@janedoe",
          "name": "Jane Doe",
          "bio": "Building the future of social networks.",
          "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
          "followersCount": 420,
          "followingCount": 180,
          "postsCount": 35,
          "tweetsCount": 112,
          "isFollowing": false,
          "createdAt": "2026-09-01T12:00:00.000Z"
      },
      "message": ""
  }
  ```
- Error (404 `NOT_FOUND`): User not found.

### `PATCH /api/v1/users/me`
- Auth: Required (`Bearer <token>`)
- Description: Update current authenticated user profile bio, display name, and avatar.
- Request Body:
  ```json
  {
      "name": "Jane D.",
      "bio": "Designer & Developer",
      "avatarUrl": "https://res.cloudinary.com/yoibi/image/upload/v12345/avatar.jpg"
  }
  ```
- Response (200): Updated user profile object.
- Error (422 `VALIDATION_ERROR`): Invalid format (e.g. bio exceeds 280 characters).

### `POST /api/v1/users/:id/follow`
- Auth: Required (`Bearer <token>`)
- Description: Follow target user.
- Response (200):
  ```json
  {
      "success": true,
      "data": { "followed": true, "targetUserId": "usr_65e1a2b3" },
      "message": "User followed successfully"
  }
  ```
- Error (400 `INVALID_ACTION`): Cannot follow oneself or already following.

### `DELETE /api/v1/users/:id/follow`
- Auth: Required (`Bearer <token>`)
- Description: Unfollow target user.
- Response (200):
  ```json
  {
      "success": true,
      "data": { "unfollowed": true, "targetUserId": "usr_65e1a2b3" },
      "message": "User unfollowed successfully"
  }
  ```

### `GET /api/v1/users/suggested`
- Auth: Optional
- Description: Returns suggested accounts to follow based on popularity/relevance.

---

## 5. Tweets (YOIBI Social Content Domain)

> **Architectural Standard:** In YOIBI, `Tweet` is the primary social content entity. `POST` is strictly an HTTP request method (e.g. `POST /api/v1/tweets`), not a separate content domain. Feed is a presentation and discovery view of Tweets.
> 
> A Tweet supports short text updates (≤ 280 characters), optional media URLs, likes, retweets, threaded replies (via `replyToId`), interaction counts, and authenticated user interaction states.

### `GET /api/v1/tweets`
- Auth: Optional (personalizes `liked` and `retweeted` state if authenticated)
- Query Parameters:
  - `page` (default `1`)
  - `limit` (default `20`, max `50`)
  - `authorId` (optional)
  - `filter`: `all` | `following`
- Response (200): Paginated list of tweets with author details, media URLs, like count, retweet count, and reply count.

### `POST /api/v1/tweets`
- Auth: Required (`Bearer <token>`)
- Description: Create a new tweet.
- Request Body:
  ```json
  {
      "content": "Launching YOIBI Phase 4. Clean, typed micro-posts! #dev #web",
      "mediaUrls": []
  }
  ```
- Response (201): Created tweet object.
- Error (422 `VALIDATION_ERROR`): Content exceeds 280 characters or is empty.

### `GET /api/v1/tweets/:id`
- Auth: Optional (marks `liked` and `retweeted` if authenticated)
- Description: Get tweet details including direct replies thread.
- Response (200): Tweet object with author info and replies list.
- Error (404 `NOT_FOUND`): Tweet not found.

### `DELETE /api/v1/tweets/:id`
- Auth: Required (`Bearer <token>`)
- Authorization: Must be tweet author (`req.user.id === tweet.authorId`) or user with role `admin`.
- Response (200):
  ```json
  {
      "success": true,
      "data": { "deletedId": "tweet_123" },
      "message": "Tweet deleted successfully"
  }
  ```
- Error (403 `FORBIDDEN`): Not authorized to delete this tweet.
- Error (404 `NOT_FOUND`): Tweet not found.

### `POST /api/v1/tweets/:id/like`
- Auth: Required (`Bearer <token>`)
- Response (200): `{ "liked": true, "likesCount": 12 }`

### `DELETE /api/v1/tweets/:id/like`
- Auth: Required (`Bearer <token>`)
- Response (200): `{ "liked": false, "likesCount": 11 }`

### `POST /api/v1/tweets/:id/retweet`
- Auth: Required (`Bearer <token>`)
- Response (200): `{ "retweeted": true, "retweetsCount": 5 }`

### `DELETE /api/v1/tweets/:id/retweet`
- Auth: Required (`Bearer <token>`)
- Response (200): `{ "retweeted": false, "retweetsCount": 4 }`

### `GET /api/v1/tweets/:id/replies`
- Auth: Optional
- Response (200): List of reply tweets linked via `replyToId`.

### `POST /api/v1/tweets/:id/replies`
- Auth: Required (`Bearer <token>`)
- Request Body:
  ```json
  {
      "content": "Exciting update!",
      "mediaUrls": []
  }
  ```
- Response (201): Created reply tweet object linked via `replyToId`.

---

## 6. Media & Uploads (Cloudinary Integration)

> **Security Rule:** Private Cloudinary API secret is never exposed to the browser. Uploads use server-side signed streams or authenticated endpoint dispatch.

### `POST /api/v1/media/upload`
- Auth: Required (`Bearer <token>`)
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Binary file (image or video)
  - `folder`: string (`posts` | `tweets` | `avatars` | `videos`)
- Constraints:
  - Image MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. Max size: 10 MB.
  - Video MIME types: `video/mp4`, `video/webm`, `video/quicktime`. Max size: 100 MB.
- Response (201):
  ```json
  {
      "success": true,
      "data": {
          "publicId": "yoibi/posts/img_abcdef",
          "url": "https://res.cloudinary.com/yoibi/image/upload/v12345/yoibi/posts/img_abcdef.webp",
          "format": "webp",
          "resourceType": "image",
          "width": 1920,
          "height": 1080,
          "bytes": 245100
      },
      "message": "File uploaded successfully"
  }
  ```
- Error (413 `PAYLOAD_TOO_LARGE`): File exceeds allowed size limits.
- Error (415 `UNSUPPORTED_MEDIA_TYPE`): File format not allowed.

---

## 7. Videos (Shorts & Longform Videos)

> **Architectural & Security Standard:**
> - Video files are hosted and delivered via Cloudinary. The private `CLOUDINARY_API_SECRET` is strictly backend-only.
> - **Asset Provenance:** Direct uploads use server-signed parameters generated via `POST /api/v1/videos/upload-signature`. The backend controls the folder (`yoibi/videos/{userId}`) and assigns a unique `uploadIntentId` and exact `publicId`. Metadata submission via `POST /api/v1/videos` validates the server-issued intent, ensuring users can only register assets they were authorized to upload.
> - **Upload Limits:**
>   - *Cloudinary Provider Limit*: 100 MB maximum for direct single-file uploads on Cloudinary Free tier.
>   - *YOIBI Application Limit*: 100 MB (`104,857,600` bytes) maximum for MVP video community uploads.
>   - *Supported Formats*: `video/mp4`, `video/webm`, `video/quicktime` (`.mov`).
> - **Categories (Option A):** Exactly 8 canonical categories (`politics`, `current-events`, `learning`, `governmental`, `fun`, `conversations`, `commentary`, `news`). Category is optional; omitted or `null` denotes uncategorized.
> - **View Count Semantics:** `viewsCount` measures **playback initiation events** recorded via `POST /api/v1/videos/:id/view`. It does NOT represent unique viewers. Pure detail retrieval (`GET /api/v1/videos/:id`) does NOT increment view counts.

### `POST /api/v1/videos/upload-signature`
- Auth: Required (`Bearer <token>`)
- Description: Generates signed upload parameters and an `uploadIntentId` bound to the authenticated user and a server-controlled folder/public ID.
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "uploadIntentId": "intent_vid_1726000000_a1b2c3d4",
          "publicId": "yoibi/videos/usr_65e1a2b3/intent_vid_1726000000_a1b2c3d4",
          "folder": "yoibi/videos/usr_65e1a2b3",
          "timestamp": 1726000000,
          "signature": "3f8b8...",
          "apiKey": "123456789",
          "cloudName": "yoibi"
      },
      "message": "Upload signature generated successfully"
  }
  ```

### `POST /api/v1/videos`
- Auth: Required (`Bearer <token>`)
- Description: Registers video metadata after successful Cloudinary upload. Verifies asset provenance against the issued `uploadIntentId`.
- Request Body:
  ```json
  {
      "uploadIntentId": "intent_vid_1726000000_a1b2c3d4",
      "title": "State of Free Speech Online",
      "description": "Deep dive into platform censorship and open networks.",
      "category": "politics",
      "videoUrl": "https://res.cloudinary.com/yoibi/video/upload/v12345/yoibi/videos/usr_65e1a2b3/intent_vid_1726000000_a1b2c3d4.mp4",
      "thumbnailUrl": "https://res.cloudinary.com/yoibi/video/upload/v12345/yoibi/videos/usr_65e1a2b3/intent_vid_1726000000_a1b2c3d4.jpg",
      "publicId": "yoibi/videos/usr_65e1a2b3/intent_vid_1726000000_a1b2c3d4",
      "duration": 420,
      "bytes": 52428800,
      "width": 1920,
      "height": 1080,
      "format": "mp4"
  }
  ```
- Constraints:
  - `title`: 3–120 characters, required.
  - `description`: max 2000 characters, optional.
  - `category`: one of the 8 canonical categories, optional.
  - `bytes`: max 104,857,600 (100 MB).
- Response (201): Created Video object with populated author details.
- Error (403 `FORBIDDEN`): Upload intent does not belong to authenticated user or is invalid.
- Error (422 `VALIDATION_ERROR`): Malformed metadata or unconsumed intent mismatch.

### `GET /api/v1/videos`
- Auth: Optional (personalizes `liked` state if authenticated)
- Description: Returns paginated list of videos with author details, viewsCount, and likesCount.
- Query Parameters:
  - `page` (default `1`)
  - `limit` (default `20`, max `50`)
  - `category` (optional, filter by canonical category)
  - `authorId` (optional)
  - `search` (optional)
- Response (200): Paginated success envelope with video items.

### `GET /api/v1/videos/:id`
- Auth: Optional
- Description: Retrieves single video metadata and author details. Pure read-only operation; does NOT increment `viewsCount`.
- Response (200): Video detail object.
- Error (404 `NOT_FOUND`): Video not found.

### `POST /api/v1/videos/:id/view`
- Auth: Optional
- Description: Records a playback initiation event and increments `viewsCount`.
- Response (200):
  ```json
  {
      "success": true,
      "data": { "viewsCount": 12401 },
      "message": "Playback recorded"
  }
  ```

### `DELETE /api/v1/videos/:id`
- Auth: Required (`Bearer <token>`)
- Authorization: Must be video author (`req.user.id === video.authorId`) or user with role `admin`.
- Description: Deletes Cloudinary media asset and removes MongoDB metadata document.
- Response (200):
  ```json
  {
      "success": true,
      "data": { "deletedId": "vid_123" },
      "message": "Video deleted successfully"
  }
  ```
- Error (403 `FORBIDDEN`): Not authorized to delete this video.
- Error (404 `NOT_FOUND`): Video not found.

### `POST /api/v1/videos/:id/like`
- Auth: Required (`Bearer <token>`)
- Response (200): `{ "liked": true, "likesCount": 42 }`

### `DELETE /api/v1/videos/:id/like`
- Auth: Required (`Bearer <token>`)
- Response (200): `{ "liked": false, "likesCount": 41 }`

---

## 8. Messaging & Direct Messages (Socket.IO Realtime)

> **Mandatory DM Follow-Rule:** User A can direct message User B **only if A follows B** (`followsRepository.isFollowing(senderId, recipientId) === true`).
> - The backend enforces this verification on EVERY message send (both REST and Socket.IO).
> - Mutual follow is NOT required.
> - If A unfollows B: conversations and history remain; new messages from A to B are blocked (`403 DM_FOLLOW_REQUIRED`); messaging resumes when A follows B again.
> 
> **Message Idempotency Rule:**
> - Every message payload must provide a unique `clientMessageId` (UUID generated on the client).
> - The compound key `{ senderId, clientMessageId }` is uniquely indexed.
> - Retries with the same idempotency key return the previously persisted message without creating duplicates.
> 
> **Standard Page-Based Pagination:**
> - Conversation list and message history use YOIBI standard page-based pagination: `page`, `limit`, `totalItems`, `totalPages`, `hasNextPage`.
> 
> **Scaling & Transport:**
> - Socket.IO transports: `["polling", "websocket"]`.
> - Single-instance Socket.IO server for MVP; horizontally scalable via `@socket.io/redis-adapter` when required.

### 8.1 HTTP Endpoints

#### `GET /api/v1/messages/conversations`
- Auth: Required (`Bearer <token>`)
- Description: Lists conversations with participants, last message snippet, and unread count for authenticated user.
- Query Parameters:
  - `page` (integer, optional, default: 1)
  - `limit` (integer, optional, default: 20, max: 50)
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "items": [
              {
                  "id": "65e1a2b3c4d5e6f7a8b9c0d1",
                  "participants": [
                      {
                          "id": "usr_sender_123",
                          "name": "Jane Doe",
                          "handle": "@janedoe",
                          "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg"
                      },
                      {
                          "id": "usr_recipient_456",
                          "name": "Bob Smith",
                          "handle": "@bobsmith",
                          "avatarUrl": "https://res.cloudinary.com/.../avatar2.jpg"
                      }
                  ],
                  "lastMessage": {
                      "content": "Hey, let's collaborate on the project!",
                      "senderId": "usr_sender_123",
                      "clientMessageId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                      "createdAt": "2026-09-11T03:00:00.000Z"
                  },
                  "unreadCount": 0,
                  "updatedAt": "2026-09-11T03:00:00.000Z"
              }
          ],
          "pagination": {
              "page": 1,
              "limit": 20,
              "totalItems": 1,
              "totalPages": 1,
              "hasNextPage": false
          }
      },
      "message": ""
  }
  ```

#### `GET /api/v1/messages/conversations/:conversationId`
- Auth: Required (`Bearer <token>`)
- Authorization: User must be a participant in the conversation.
- Description: Retrieves paginated message history for a conversation.
- Query Parameters:
  - `page` (integer, optional, default: 1)
  - `limit` (integer, optional, default: 30, max: 100)
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "items": [
              {
                  "id": "65e1a2b3c4d5e6f7a8b9c0d2",
                  "conversationId": "65e1a2b3c4d5e6f7a8b9c0d1",
                  "senderId": "usr_sender_123",
                  "recipientId": "usr_recipient_456",
                  "content": "Hey, let's collaborate on the project!",
                  "clientMessageId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                  "readAt": null,
                  "createdAt": "2026-09-11T03:00:00.000Z"
              }
          ],
          "pagination": {
              "page": 1,
              "limit": 30,
              "totalItems": 1,
              "totalPages": 1,
              "hasNextPage": false
          }
      },
      "message": ""
  }
  ```
- Error (403 `FORBIDDEN`): Authenticated user is not a participant in this conversation.
- Error (404 `NOT_FOUND`): Conversation not found.

#### `POST /api/v1/messages`
- Auth: Required (`Bearer <token>`)
- Description: Sends a direct message. Enforces follow relationship and idempotency via `clientMessageId`.
- Request Body:
  ```json
  {
      "recipientId": "usr_recipient_456",
      "content": "Hey, let's collaborate on the project!",
      "clientMessageId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
  ```
- Business Rule Checks:
  - Sender must follow recipient (`followsRepository.isFollowing(senderId, recipientId) === true`).
  - Cannot message self (`senderId === recipientId`).
  - Idempotent: if message with `{ senderId, clientMessageId }` already exists, returns existing record with `200 OK`.
- Response (201 Created / 200 OK for retry):
  ```json
  {
      "success": true,
      "data": {
          "id": "65e1a2b3c4d5e6f7a8b9c0d2",
          "conversationId": "65e1a2b3c4d5e6f7a8b9c0d1",
          "senderId": "usr_sender_123",
          "recipientId": "usr_recipient_456",
          "content": "Hey, let's collaborate on the project!",
          "clientMessageId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
          "readAt": null,
          "createdAt": "2026-09-11T03:00:00.000Z"
      },
      "message": "Message sent successfully"
  }
  ```
- Error (400 `CANNOT_MESSAGE_SELF`): Cannot message yourself.
- Error (403 `DM_FOLLOW_REQUIRED`): You can only message users whom you follow.
- Error (422 `VALIDATION_ERROR`): Content empty, exceeds 2000 characters, or invalid `clientMessageId`.

#### `PATCH /api/v1/messages/conversations/:conversationId/read`
- Auth: Required (`Bearer <token>`)
- Authorization: Authenticated user must be a participant in the conversation.
- Description: Marks unread messages received by the current user in the conversation as read (`readAt: Date`). Does not modify user's own outgoing messages.
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "conversationId": "65e1a2b3c4d5e6f7a8b9c0d1",
          "updatedCount": 3
      },
      "message": "Conversation marked as read"
  }
  ```

### 8.2 Socket.IO Realtime Events

- **Connection Handshake:**
  ```javascript
  io.connect({
      transports: ["polling", "websocket"],
      auth: { token: "Bearer <jwt_token>" }
  });
  ```
- **Socket Rooms:**
  - Personal Room: `user:<userId>` (for personal direct message and notification delivery)
  - Conversation Room: `conv:<conversationId>` (for ephemeral events like typing indicators)

- **Client -> Server Events:**
  - `conversation:join`: `{ conversationId: "conv_123" }` (validates participant membership before joining room)
  - `conversation:leave`: `{ conversationId: "conv_123" }`
  - `message:send`: `{ recipientId: "usr_456", content: "Hello", clientMessageId: "uuid" }`
  - `typing:start`: `{ conversationId: "conv_123" }`
  - `typing:stop`: `{ conversationId: "conv_123" }`
  - `conversation:read`: `{ conversationId: "conv_123" }`

- **Server -> Client Events:**
  - `authenticated`: `{ userId: "usr_123" }`
  - `message:ack`: `{ clientMessageId: "uuid", message: { ... } }`
  - `message:new`: `{ message: { ... } }` (delivered to `user:<recipientId>` and `user:<senderId>`)
  - `message:error`: `{ clientMessageId: "uuid", code: "DM_FOLLOW_REQUIRED", message: "..." }`
  - `typing:update`: `{ conversationId: "conv_123", userId: "usr_123", isTyping: true }`
  - `conversation:read_update`: `{ conversationId: "conv_123", readerId: "usr_123" }`

---

## 9. Streams (LiveKit Realtime Broadcasts)

> **Architectural Standard:** A Stream is a live realtime broadcast experience. It is strictly separate from `Tweet`, uploaded `Video` (Cloudinary), and collaborative multi-peer `Meet-Up` rooms.
> 
> **Server-Authoritative Lifecycle:** MongoDB stream status (`ready` → `live` → `ended`) is the authoritative application lifecycle state. LiveKit connection state is transport-level only.
> 
> **Privacy & Opaque Naming Rule:** LiveKit room names and participant identities MUST NEVER contain PII (no user IDs, emails, handles, or names). Room names use cryptographically opaque server-generated UUIDs: `stream_<randomUUID>`. Ownership relations are stored exclusively in MongoDB (`Stream.authorId`).
> 
> **Media Transport:** All realtime media (video, audio, screen share) flows via LiveKit SFU. Media is never stored in MongoDB, and Socket.IO is not used for media transport.
> 
> **Session Termination:** Ending a live stream explicitly closes/deletes the LiveKit room via the LiveKit server API (`RoomServiceClient.deleteRoom`), instantly disconnecting connected participants, preventing new joins, and transitioning MongoDB state to `ended`.

### Lifecycle & Join Rules

| Status | Meaning | Host Action | Viewer Action |
|---|---|---|---|
| `ready` | Stream record created; room reserved | Host prepares & tests devices | Viewer join **NOT allowed** (`400 STREAM_NOT_LIVE`) |
| `live` | Host is actively broadcasting | Host publishes mic / cam / screen | Viewer join **allowed** (receives subscribe-only token) |
| `ended` | Broadcast ended; LiveKit room terminated | Session closed | Viewer join **rejected** (`403 STREAM_ENDED`) |

### Token Permissions (Least Privilege)

| Role | `roomJoin` | `canPublish` | `canSubscribe` | `canPublishData` | `roomAdmin` | Identity Format |
|---|---|---|---|---|---|---|
| **Host** | `true` | `true` (mic/cam/screen) | `true` | `true` | `false` | `host_<uuid>` (opaque) |
| **Viewer** | `true` | `false` | `true` | `false` | `false` | `viewer_<uuid>` (opaque) |

---

### `GET /api/v1/streams`
- Auth: Optional
- Description: Lists broadcast streams by lifecycle status (default `live`).
- Query Parameters:
  - `status` (optional, enum: `live` | `ready` | `ended`, default `live`)
  - `category` (optional, canonical category filter)
  - `authorId` (optional, filter by broadcaster)
  - `page` (default `1`)
  - `limit` (default `20`, max `50`)
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "items": [
              {
                  "id": "strm_65e1a2b3",
                  "title": "Live Coding: Building YOIBI with Next.js & Express",
                  "description": "Full architectural walk-through.",
                  "category": "learning",
                  "thumbnailUrl": null,
                  "status": "live",
                  "viewerCount": 42,
                  "startedAt": "2026-09-11T00:05:00.000Z",
                  "endedAt": null,
                  "createdAt": "2026-09-11T00:00:00.000Z",
                  "author": {
                      "id": "usr_65e1a2b3",
                      "name": "Alex Rivera",
                      "handle": "@arivera",
                      "avatar": "https://res.cloudinary.com/.../avatar.jpg"
                  }
              }
          ],
          "pagination": {
              "page": 1,
              "limit": 20,
              "totalItems": 1,
              "totalPages": 1,
              "hasNextPage": false
          }
      },
      "message": ""
  }
  ```

### `POST /api/v1/streams`
- Auth: Required (`Bearer <token>`)
- Description: Creates a new stream in `ready` state, generates an opaque room name, and issues a preparation host token.
- Request Body:
  ```json
  {
      "title": "Live Coding: Building YOIBI with Next.js & Express",
      "description": "Full architectural walk-through.",
      "category": "learning",
      "thumbnailUrl": null
  }
  ```
- Constraints:
  - `title`: 3–120 characters, required.
  - `description`: max 2000 characters, optional.
  - `category`: one of the 8 canonical categories, optional.
  - `thumbnailUrl`: valid URL or null, optional.
- Response (201):
  ```json
  {
      "success": true,
      "data": {
          "stream": {
              "id": "strm_65e1a2b3",
              "title": "Live Coding: Building YOIBI with Next.js & Express",
              "description": "Full architectural walk-through.",
              "category": "learning",
              "thumbnailUrl": null,
              "status": "ready",
              "roomName": "stream_9f8b7a6c-5d4e-3f2a-1b0c-9e8d7c6b5a4f",
              "viewerCount": 0,
              "startedAt": null,
              "endedAt": null,
              "createdAt": "2026-09-11T00:00:00.000Z",
              "author": {
                  "id": "usr_65e1a2b3",
                  "name": "Alex Rivera",
                  "handle": "@arivera"
              }
          },
          "livekit": {
              "url": "wss://livekit.yoibi.com",
              "token": "eyJhbGciOi..."
          },
          "isHost": true
      },
      "message": "Stream created successfully in ready state"
  }
  ```
- Error (401 `UNAUTHORIZED`): Missing or invalid auth token.
- Error (403 `ACCOUNT_BLOCKED`): User account is suspended.
- Error (422 `VALIDATION_ERROR`): Validation failed for title, category, or description.

### `GET /api/v1/streams/:id`
- Auth: Optional
- Description: Retrieves detailed stream metadata and author profile.
- Response (200): Stream detail object with populated author.
- Error (404 `NOT_FOUND`): Stream does not exist.

### `POST /api/v1/streams/:id/start`
- Auth: Required (`Bearer <token>`)
- Authorization: Stream owner only (`req.user.id === stream.authorId`).
- Description: Transitions stream from `ready` → `live`, records `startedAt`, and returns a fresh host broadcasting token.
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "stream": {
              "id": "strm_65e1a2b3",
              "status": "live",
              "startedAt": "2026-09-11T00:05:00.000Z"
          },
          "livekit": {
              "url": "wss://livekit.yoibi.com",
              "token": "eyJhbGciOi..."
          },
          "isHost": true
      },
      "message": "Stream is now live"
  }
  ```
- Error (403 `FORBIDDEN`): Not authorized (not stream owner).
- Error (403 `STREAM_ENDED`): Cannot start a stream that has already ended.
- Error (404 `NOT_FOUND`): Stream does not exist.

### `POST /api/v1/streams/:id/join`
- Auth: Optional (authenticated or anonymous viewer)
- Description: Issues a viewer token (`canPublish: false`, `canSubscribe: true`) for an active live stream. Viewers are NOT permitted to join `ready` streams.
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "livekit": {
              "url": "wss://livekit.yoibi.com",
              "token": "eyJhbGciOi..."
          },
          "isHost": false,
          "stream": {
              "id": "strm_65e1a2b3",
              "title": "Live Coding: Building YOIBI with Next.js & Express",
              "status": "live",
              "author": {
                  "id": "usr_65e1a2b3",
                  "name": "Alex Rivera",
                  "handle": "@arivera"
              }
          }
      },
      "message": "Joined stream successfully"
  }
  ```
- Error (400 `STREAM_NOT_LIVE`): Stream is in `ready` state; viewer joins are not allowed until host starts broadcasting.
- Error (403 `STREAM_ENDED`): Broadcast has ended; no new viewer joins permitted.
- Error (403 `ACCOUNT_BLOCKED`): Authenticated user account is suspended.
- Error (404 `NOT_FOUND`): Stream does not exist.

### `POST /api/v1/streams/:id/end`
- Auth: Required (`Bearer <token>`)
- Authorization: Stream owner only (`req.user.id === stream.authorId`).
- Description: Terminates the live broadcast. Deletes the LiveKit room session via `RoomServiceClient.deleteRoom()`, disconnects all connected participants immediately, marks MongoDB state as `ended`, and sets `endedAt`.
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "id": "strm_65e1a2b3",
          "status": "ended",
          "endedAt": "2026-09-11T01:30:00.000Z"
      },
      "message": "Stream broadcast ended and LiveKit room closed"
  }
  ```
- Error (403 `FORBIDDEN`): Not authorized (not stream owner).
- Error (403 `STREAM_ALREADY_ENDED`): Stream is already ended.
- Error (404 `NOT_FOUND`): Stream does not exist.

### `DELETE /api/v1/streams/:id`
- Auth: Required (`Bearer <token>`)
- Authorization: Stream owner or admin.
- Description: Deletes stream record from MongoDB. Permitted ONLY when stream status is `ready` or `ended`. Active `live` streams must be ended before deletion.
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "deletedId": "strm_65e1a2b3"
      },
      "message": "Stream deleted successfully"
  }
  ```
- Error (403 `FORBIDDEN`): Not authorized to delete this stream.
- Error (403 `STREAM_LIVE`): Cannot delete an active live stream. End the stream first.
- Error (404 `NOT_FOUND`): Stream does not exist.

---

## 10. Meet-Up Rooms (LiveKit Integration)

> **Architecture:** Multi-participant collaborative rooms supporting bidirectional interactive audio, video, and screen sharing powered by LiveKit SFU.
> 
> **Key Architecture & Security Rules:**
> 1. **Authentication & Owner Identity Model:** All room operations and token issuance require authenticated YOIBI users (`Bearer <token>`). Unauthenticated guests are strictly rejected (`401 UNAUTHORIZED`). The room owner identity (`ownerId: String`) is derived strictly from the verified Better Auth user ID (`req.user.id`), maintaining unified ownership architecture across domains (`Tweet.authorId`, `Video.authorId`, `Stream.authorId`, `MeetUp.ownerId`). Client-supplied owner IDs are never trusted. User profiles (`name`, `handle`, `avatarUrl`) are enriched server-side via the application's user profile repository.
> 2. **Opaque Participant Identity & Minimized Metadata (Zero-PII):** LiveKit participant identities are opaque non-PII strings formatted as `participant_<uuid>`. LiveKit identity strings NEVER contain email, handle, name, phone, or raw MongoDB user IDs. LiveKit participant metadata payload is a presentation snapshot minimized strictly to public presentation fields: `JSON.stringify({ name: user.name, handle: user.handle, avatarUrl: user.avatarUrl })`. Internal MongoDB `_id` is excluded from LiveKit metadata. LiveKit metadata is a display snapshot and not the authoritative user profile source.
> 3. **Server-Side Capacity Enforcement & Race Condition Handling:** `maxParticipants` is bounded between 2 and 50 (default: 12). To prevent race conditions during concurrent joins without heavyweight infrastructure, the backend maintains short-lived server-side join reservations (20s TTL). Total effective load is computed as `connectedLiveKitPeers + activePendingReservations`. When capacity is reached, concurrent join attempts are rejected with `403 ROOM_FULL` (`{ "code": "ROOM_FULL", "message": "Room is at maximum capacity" }`). Stale reservations automatically expire if a user obtains a token but never connects.
> 4. **Standardized Error Status Codes:**
>    - `404 ROOM_NOT_FOUND` → Target room does not exist.
>    - `403 ROOM_ENDED` → Target room exists but joining is rejected because the session has ended.
>    - `403 ROOM_FULL` → Target room exists but cannot accept another participant.
>    - `403 ROOM_ACTIVE` → Target room cannot be deleted because it is still active.
>    - `401 UNAUTHORIZED` → Authentication required or invalid.
>    - `403 FORBIDDEN` → Authenticated user lacks owner permission.
> 5. **Screen Share Concurrency:** Single active primary screen share at a time. When another participant shares their screen, it becomes the active primary screen share track while other tracks remain in the secondary grid.
> 6. **Owner Disconnect & Room Cleanup:** If the room creator/owner disconnects, the room remains `active` and other participants can continue collaborating. Automatic empty-room cleanup after inactivity is documented as a server policy/enhancement; the room ends when the owner explicitly ends it or when empty-room timeout expires.
> 7. **END vs. DELETE Semantics:**
>    - **END (`POST /api/v1/meetup/rooms/:roomId/end`):** Closes the realtime SFU session via LiveKit RoomService (`deleteRoom`), disconnects all participants, sets status to `ended`, and preserves MongoDB room metadata and history. Only the room owner can end the room.
>    - **DELETE (`DELETE /api/v1/meetup/rooms/:roomId`):** Permanently removes the MongoDB room document. Permitted ONLY when room status is `ended`. Deleting an active room is rejected with `403 ROOM_ACTIVE` (`{ "code": "ROOM_ACTIVE", "message": "Cannot delete an active room. End the room first." }`).
> 8. **Token Grants & Least-Privilege:** All participants receive non-admin interactive tokens:
>    - `roomJoin: true`
>    - `canPublish: true` (mic/cam/screen)
>    - `canSubscribe: true`
>    - `canPublishData: true`
>    - `roomAdmin: false` (LiveKit room admin is NEVER granted in participant tokens; room lifecycle is strictly enforced at the Express API layer).

### `GET /api/v1/meetup/rooms`
- **Auth:** Optional / Authenticated
- **Query Parameters:**
  - `status` (string, optional: `active` | `ended` | `all`, default: `active`)
  - `page` (integer, optional, default: 1)
  - `limit` (integer, optional, default: 20)
- **Response (200):**
  ```json
  {
      "success": true,
      "data": {
          "rooms": [
              {
                  "id": "66d1a2b3c4d5e6f7a8b9c0d1",
                  "name": "Frontend Architecture Discussion",
                  "topic": "Next.js App Router & Tailwind v4",
                  "roomName": "meetup_d9f8e7c6-b5a4-3210-9876-fedcba098765",
                  "owner": {
                      "id": "66d1a2b3c4d5e6f7a8b9c000",
                      "name": "Alex Rivers",
                      "handle": "alexrivers",
                      "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
                  },
                  "maxParticipants": 12,
                  "participantCount": 4,
                  "status": "active",
                  "createdAt": "2026-09-11T03:00:00.000Z"
              }
          ],
          "pagination": {
              "total": 1,
              "page": 1,
              "limit": 20,
              "totalPages": 1
          }
      },
      "message": "Meet-Up rooms retrieved successfully"
  }
  ```

### `POST /api/v1/meetup/rooms`
- **Auth:** Required (`Bearer <token>`)
- **Request Body:**
  ```json
  {
      "name": "Frontend Architecture Discussion",
      "topic": "Next.js App Router & Tailwind v4",
      "maxParticipants": 12
  }
  ```
  *(Note: `name` is required (3–100 chars); `topic` is optional (max 100 chars); `maxParticipants` is optional (2–50, default 12)).*
- **Response (201):**
  ```json
  {
      "success": true,
      "data": {
          "room": {
              "id": "66d1a2b3c4d5e6f7a8b9c0d1",
              "name": "Frontend Architecture Discussion",
              "topic": "Next.js App Router & Tailwind v4",
              "roomName": "meetup_d9f8e7c6-b5a4-3210-9876-fedcba098765",
              "ownerId": "66d1a2b3c4d5e6f7a8b9c000",
              "maxParticipants": 12,
              "status": "active",
              "createdAt": "2026-09-11T03:00:00.000Z"
          },
          "livekitUrl": "wss://livekit.yoibi.com",
          "token": "eyJhbGciOi...",
          "participantIdentity": "participant_550e8400-e29b-41d4-a716-446655440000"
      },
      "message": "Meet-Up room created successfully"
  }
  ```

### `GET /api/v1/meetup/rooms/:roomId`
- **Auth:** Optional / Authenticated
- **Response (200):** Room details, active participant count, owner profile.
- **Errors:** `404 ROOM_NOT_FOUND`

### `POST /api/v1/meetup/rooms/:roomId/join`
- **Auth:** Required (`Bearer <token>`)
- **Description:** Verifies room status is `active`, atomicity-reserves a slot against `maxParticipants`, and generates interactive LiveKit participant token.
- **Response (200):**
  ```json
  {
      "success": true,
      "data": {
          "room": {
              "id": "66d1a2b3c4d5e6f7a8b9c0d1",
              "name": "Frontend Architecture Discussion",
              "roomName": "meetup_d9f8e7c6-b5a4-3210-9876-fedcba098765",
              "status": "active"
          },
          "livekitUrl": "wss://livekit.yoibi.com",
          "token": "eyJhbGciOi...",
          "participantIdentity": "participant_770e8400-e29b-41d4-a716-446655440111"
      },
      "message": "Meet-Up room join token generated"
  }
  ```
- **Errors:**
  - `401 UNAUTHORIZED`: Authentication required
  - `403 ROOM_FULL`: Current participant count (active + reserved) has reached `maxParticipants`
  - `403 ROOM_ENDED`: Cannot join an ended room
  - `404 ROOM_NOT_FOUND`: Room does not exist

### `POST /api/v1/meetup/rooms/:roomId/end`
- **Auth:** Required (`Bearer <token>`) — Owner only
- **Description:** Terminates the realtime LiveKit SFU session, disconnects all participants, and updates status to `ended`. Room metadata is preserved.
- **Response (200):**
  ```json
  {
      "success": true,
      "data": {
          "id": "66d1a2b3c4d5e6f7a8b9c0d1",
          "status": "ended",
          "endedAt": "2026-09-11T03:45:00.000Z"
      },
      "message": "Meet-Up room ended successfully"
  }
  ```
- **Errors:**
  - `403 FORBIDDEN`: Only the room owner can end the room
  - `404 ROOM_NOT_FOUND`: Room not found

### `DELETE /api/v1/meetup/rooms/:roomId`
- **Auth:** Required (`Bearer <token>`) — Owner only
- **Description:** Permanently deletes the MongoDB room record. Allowed only after room is `ended`.
- **Response (200):**
  ```json
  {
      "success": true,
      "data": { "id": "66d1a2b3c4d5e6f7a8b9c0d1" },
      "message": "Meet-Up room deleted permanently"
  }
  ```
- **Errors:**
  - `403 ROOM_ACTIVE`: Cannot delete an active room. End the room first.
  - `403 FORBIDDEN`: Only the room owner can delete the room
  - `404 ROOM_NOT_FOUND`: Room not found

---

## 11. Reports & User Flagging

### `POST /api/v1/reports`
- Auth: Required (`Bearer <token>`)
- Description: Submit report on inappropriate user, post, tweet, or media.
- Request Body:
  ```json
  {
      "targetType": "post",
      "targetId": "post_789",
      "reason": "Harassment or inappropriate content",
      "details": "Violates community rules item 3."
  }
  ```
- Response (201):
  ```json
  {
      "success": true,
      "data": { "reportId": "rep_334" },
      "message": "Report submitted for moderation review."
  }
  ```

---

## 12. Admin & Moderation

> **Mandatory Moderation Rules:**
> 1. Requires server-side verification that authenticated user has `role: "admin"`.
> 2. Destructive Ban Cascade: Prerequisite document `docs/BAN-DELETION-PLAN.md` must specify all cascade deletion models before execution.
> 3. Block State: Non-destructive suspension. User redirected to an account-blocked page with contact/appeal form.
> 4. Unblock State: Restores user access.

### `GET /api/v1/admin/stats`
- Auth: Admin (`role === "admin"`)
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "totalUsers": 1250,
          "activeStreams": 3,
          "totalPosts": 4500,
          "totalTweets": 18200,
          "pendingReports": 14
      },
      "message": ""
  }
  ```

### `GET /api/v1/admin/users`
- Auth: Admin
- Query: `page`, `limit`, `search`, `status` (`all` | `active` | `blocked`)
- Response (200): Paginated list of users with moderation flags.

### `GET /api/v1/admin/reports`
- Auth: Admin
- Query: `page`, `limit`, `status` (`pending` | `resolved` | `dismissed`)
- Response (200): Paginated user submitted reports.

### `POST /api/v1/admin/users/:id/block`
- Auth: Admin
- Description: Blocks user account. Denies access across all endpoints; sets `isBlocked = true`.
- Request Body:
  ```json
  {
      "reason": "Repeated violations of community guidelines.",
      "notifyEmail": true
  }
  ```
- Response (200):
  ```json
  {
      "success": true,
      "data": { "userId": "usr_987", "status": "blocked" },
      "message": "User account successfully blocked"
  }
  ```

### `POST /api/v1/admin/users/:id/unblock`
- Auth: Admin
- Description: Restores blocked user account.
- Response (200):
  ```json
  {
      "success": true,
      "data": { "userId": "usr_987", "status": "active" },
      "message": "User account unblocked and restored"
  }
  ```

### `POST /api/v1/admin/users/:id/ban`
- Auth: Admin
- Description: Permanent, destructive purge of user account and all cascaded owned content (posts, tweets, comments, media, relations).
- Request Body:
  ```json
  {
      "confirm": true,
      "reason": "Permanent ban per moderation escalation"
  }
  ```
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "userId": "usr_987",
          "deletedCounts": {
              "posts": 14,
              "tweets": 88,
              "comments": 32,
              "media": 19
          }
      },
      "message": "User account and all associated data permanently purged"
  }
  ```
- Error (400 `CONFIRMATION_REQUIRED`): Must pass `"confirm": true`.

---

## 13. Notifications API

### Overview & Architecture
Notifications represent user activity alerts generated as secondary side effects from primary domain operations (like tweet, retweet, reply to tweet, follow user, like video). Direct messages are excluded as they provide their own realtime channel and unread counters.

#### Key Principles:
1. **Secondary Side Effect:** Primary operations succeed independently. If notification persistence or realtime delivery fails, primary action results are not affected or rolled back.
2. **Identity Model:** `recipientId` and `actorId` are Better Auth verified String user IDs (consistent with `Tweet.authorId`, `Video.authorId`, etc.).
3. **Actor Resolution:** Notifications store `actorId` and resolve current public profile info (`id`, `name`, `handle`, `avatarUrl`) at read/emission time. If actor no longer exists, returns fallback `name: "Unknown user"`, `handle: null`, `avatarUrl: null`.
4. **Target Resolution & Deleted Targets:** Notifications persist even when referenced content is deleted. Frontend displays "This content is no longer available" without crashing. Route mapping:
   - `like_tweet`, `retweet`, `reply` -> `/tweets/:targetId`
   - `like_video` -> `/videos/:targetId`
   - `follow` -> `/wall/:actor.handle` (actor profile)
5. **Duplicate Prevention:** Notifications are generated only on `inactive -> active` state transitions. Undo operations (unlike, unfollow, undo retweet) delete the active notification, allowing clean re-creation. Unique compound index `{ actorId: 1, type: 1, targetId: 1 }` provides database-level deduplication.
6. **Self-Notification:** Notifications are never generated when `actorId === recipientId`.

---

### `GET /api/v1/notifications`
- **Auth:** Required (`Bearer <token>`)
- **Query Parameters:**
  - `page` (integer, default: 1, min: 1)
  - `limit` (integer, default: 20, min: 1, max: 50)
  - `read` (boolean, optional — filter by read state)
- **Response (200):**
  ```json
  {
      "success": true,
      "data": {
          "items": [
              {
                  "id": "notif_65e1a2b3",
                  "type": "like_tweet",
                  "actor": {
                      "id": "ba_usr_abc123",
                      "name": "Jane Doe",
                      "handle": "@janedoe",
                      "avatarUrl": "https://res.cloudinary.com/demo/image/upload/avatar.jpg"
                  },
                  "targetId": "tweet_456",
                  "targetType": "tweet",
                  "read": false,
                  "createdAt": "2026-09-11T05:00:00.000Z"
              }
          ],
          "pagination": {
              "page": 1,
              "limit": 20,
              "totalItems": 42,
              "totalPages": 3,
              "hasNextPage": true
          }
      },
      "message": ""
  }
  ```
- **Error (401 `UNAUTHORIZED`):** Missing or invalid auth token.

---

### `GET /api/v1/notifications/unread-count`
- **Auth:** Required (`Bearer <token>`)
- **Response (200):**
  ```json
  {
      "success": true,
      "data": {
          "unreadCount": 7
      },
      "message": ""
  }
  ```
- **Error (401 `UNAUTHORIZED`):** Missing or invalid auth token.

---

### `PATCH /api/v1/notifications/:id/read`
- **Auth:** Required (`Bearer <token>`)
- **Authorization:** `notification.recipientId === req.user.id`
- **Response (200):**
  ```json
  {
      "success": true,
      "data": {
          "id": "notif_65e1a2b3",
          "read": true
      },
      "message": "Notification marked as read"
  }
  ```
- **Error (401 `UNAUTHORIZED`):** Missing or invalid auth token.
- **Error (403 `FORBIDDEN`):** Cannot modify notifications belonging to another user.
- **Error (404 `NOT_FOUND`):** Notification not found.

---

### `PATCH /api/v1/notifications/read-all`
- **Auth:** Required (`Bearer <token>`)
- **Response (200):**
  ```json
  {
      "success": true,
      "data": {
          "updatedCount": 7
      },
      "message": "All notifications marked as read"
  }
  ```
- **Error (401 `UNAUTHORIZED`):** Missing or invalid auth token.

---

### Socket.IO Event: `notification:new`
- **Direction:** Server -> Client only
- **Room:** `user:<recipientId>` (reusing existing authenticated personal room)
- **Payload:**
  ```json
  {
      "notification": {
          "id": "notif_65e1a2b3",
          "type": "like_tweet",
          "actor": {
              "id": "ba_usr_abc123",
              "name": "Jane Doe",
              "handle": "@janedoe",
              "avatarUrl": "https://res.cloudinary.com/demo/image/upload/avatar.jpg"
          },
          "targetId": "tweet_456",
          "targetType": "tweet",
          "read": false,
          "createdAt": "2026-09-11T05:00:00.000Z"
      }
  }
  ```

