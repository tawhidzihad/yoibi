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

## 5. Posts (General Social Feed)

> **Domain Boundary Note:** `Posts` and `Tweets` are strictly independent domains (`Post != Tweet`). Posts represent media-rich, long-form or community wall posts with comments and reactions.

### `GET /api/v1/posts`
- Auth: Optional (personalized if authenticated)
- Query Parameters:
  - `page` (default `1`)
  - `limit` (default `20`, max `50`)
  - `filter`: `all` | `following`
- Response (200): Paginated list of posts with author info, media attachments, like counts, and comments count.

### `POST /api/v1/posts`
- Auth: Required (`Bearer <token>`)
- Request Body:
  ```json
  {
      "content": "Check out this amazing architectural render!",
      "media": [
          {
              "url": "https://res.cloudinary.com/.../render.jpg",
              "type": "image",
              "publicId": "yoibi/posts/img_12345"
          }
      ]
  }
  ```
- Response (201): Created post object.
- Error (422 `VALIDATION_ERROR`): Content and media cannot both be empty.

### `GET /api/v1/posts/:id`
- Auth: Optional
- Response (200): Post details with complete comment thread.

### `DELETE /api/v1/posts/:id`
- Auth: Required (`Bearer <token>`)
- Authorization: Must be post author or user with role `admin`.
- Response (200):
  ```json
  {
      "success": true,
      "data": { "deletedId": "post_789" },
      "message": "Post deleted successfully"
  }
  ```
- Error (403 `FORBIDDEN`): Not authorized to delete this post.

### `POST /api/v1/posts/:id/like`
- Auth: Required (`Bearer <token>`)
- Response (200): `{ "liked": true, "likesCount": 43 }`

### `DELETE /api/v1/posts/:id/like`
- Auth: Required (`Bearer <token>`)
- Response (200): `{ "liked": false, "likesCount": 42 }`

### `POST /api/v1/posts/:id/comments`
- Auth: Required (`Bearer <token>`)
- Request Body: `{ "content": "Brilliant work!" }`
- Response (201): Created comment object.

### `DELETE /api/v1/posts/:id/comments/:commentId`
- Auth: Required (`Bearer <token>`)
- Authorization: Must be comment author, post author, or `admin`.

---

## 6. Tweets (Micro-posts Domain)

> **Domain Boundary Note:** `Tweets` represent short status updates (<= 280 characters) supporting replies, retweets, and likes.

### `GET /api/v1/tweets`
- Auth: Optional
- Query Parameters: `page`, `limit`, `authorId`
- Response (200): Paginated list of tweets.

### `POST /api/v1/tweets`
- Auth: Required (`Bearer <token>`)
- Request Body:
  ```json
  {
      "content": "Launching YOIBI Phase 2 API specifications today. Clean, typed contracts! #dev #web",
      "mediaUrls": []
  }
  ```
- Response (201): Created tweet object.
- Error (422 `VALIDATION_ERROR`): Content exceeds 280 characters or is empty.

### `DELETE /api/v1/tweets/:id`
- Auth: Required (`Bearer <token>`)
- Authorization: Must be tweet author or `admin`.

### `POST /api/v1/tweets/:id/like`
- Auth: Required (`Bearer <token>`)
- Response (200): `{ "liked": true, "likesCount": 12 }`

### `POST /api/v1/tweets/:id/retweet`
- Auth: Required (`Bearer <token>`)
- Response (200): `{ "retweeted": true, "retweetsCount": 5 }`

### `POST /api/v1/tweets/:id/replies`
- Auth: Required (`Bearer <token>`)
- Request Body: `{ "content": "Exciting update!" }`
- Response (201): Created reply tweet object linked via `replyToId`.

---

## 7. Media & Uploads (Cloudinary Integration)

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

## 8. Messaging & Direct Messages (Socket.IO Realtime)

> **Mandatory DM Follow-Rule:** User A can direct message User B **only if A follows B**. The backend enforces this verification prior to message creation or socket dispatch.

### 8.1 HTTP Endpoints

#### `GET /api/v1/messages/conversations`
- Auth: Required (`Bearer <token>`)
- Description: Lists conversations with participants, last message snippet, and unread count.

#### `GET /api/v1/messages/conversations/:conversationId`
- Auth: Required (`Bearer <token>`)
- Description: Paginated chat history for conversation.
- Query: `page`, `limit` (default 30)

#### `POST /api/v1/messages`
- Auth: Required (`Bearer <token>`)
- Request Body:
  ```json
  {
      "recipientId": "usr_987654",
      "content": "Hey, let's collaborate on the stream!"
  }
  ```
- Business Rule Check: Backend verifies `followsRepository.isFollowing(senderId, recipientId) === true`.
- Response (201): Created message object.
- Error (403 `DM_FOLLOW_REQUIRED`): "You can only message users whom you follow."

#### `PATCH /api/v1/messages/conversations/:conversationId/read`
- Auth: Required (`Bearer <token>`)
- Description: Marks conversation messages as read for current user.

### 8.2 Socket.IO Realtime Events

- Connection Handshake:
  ```javascript
  io.connect({
      auth: { token: "Bearer <jwt_token>" }
  });
  ```
- **Client -> Server Events:**
  - `join_conversation`: `{ conversationId: "conv_123" }`
  - `leave_conversation`: `{ conversationId: "conv_123" }`
  - `send_message`: `{ recipientId: "usr_987", content: "Hello!" }` (enforces follow-rule server-side)
  - `typing_start`: `{ conversationId: "conv_123" }`
  - `typing_stop`: `{ conversationId: "conv_123" }`
- **Server -> Client Events:**
  - `authenticated`: `{ userId: "usr_123" }`
  - `new_message`: `{ id: "msg_456", conversationId: "conv_123", senderId: "usr_123", content: "...", createdAt: "..." }`
  - `typing_status`: `{ conversationId: "conv_123", userId: "usr_123", isTyping: true }`
  - `error`: `{ code: "DM_FOLLOW_REQUIRED", message: "..." }`

---

## 9. Streams (LiveKit Integration)

> **Architecture:** Streamer creates a broadcast session; LiveKit credentials are kept exclusively server-side. Access tokens are generated with granular participant permissions.

### `GET /api/v1/streams`
- Auth: Optional
- Description: Lists live broadcasts (`status = "live"`).

### `POST /api/v1/streams`
- Auth: Required (`Bearer <token>`)
- Description: Initiates a new broadcast session.
- Request Body:
  ```json
  {
      "title": "Live Coding: Building YOIBI with Next.js & Express",
      "description": "Full architectural walk-through.",
      "category": "Technology"
  }
  ```
- Response (201):
  ```json
  {
      "success": true,
      "data": {
          "streamId": "strm_1001",
          "title": "Live Coding: Building YOIBI with Next.js & Express",
          "livekitUrl": "wss://livekit.yoibi.com",
          "token": "eyJhbGciOi...",
          "isStreamer": true
      },
      "message": "Stream created successfully"
  }
  ```

### `POST /api/v1/streams/:streamId/join`
- Auth: Optional / Authenticated
- Description: Generates viewer token (canSubscribe: true, canPublish: false).
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "livekitUrl": "wss://livekit.yoibi.com",
          "token": "eyJhbGciOi...",
          "isStreamer": false
      },
      "message": "Joined stream successfully"
  }
  ```

### `POST /api/v1/streams/:streamId/end`
- Auth: Required (`Bearer <token>`)
- Authorization: Stream creator only.
- Response (200): `{ "ended": true, "streamId": "strm_1001" }`

---

## 10. Meet-Up Rooms (LiveKit Integration)

> **Architecture:** Multi-participant interactive rooms supporting audio, video, and screen sharing.

### `GET /api/v1/meetup/rooms`
- Auth: Optional / Authenticated
- Description: Lists active collaborative rooms.

### `POST /api/v1/meetup/rooms`
- Auth: Required (`Bearer <token>`)
- Request Body:
  ```json
  {
      "name": "Frontend Architecture Discussion",
      "topic": "Next.js App Router & Tailwind v4",
      "maxParticipants": 12
  }
  ```
- Response (201): Room details and host LiveKit token.

### `POST /api/v1/meetup/rooms/:roomId/token`
- Auth: Required (`Bearer <token>`)
- Description: Generates interactive participant token (`canPublish: true`, `canSubscribe: true`).
- Response (200):
  ```json
  {
      "success": true,
      "data": {
          "livekitUrl": "wss://livekit.yoibi.com",
          "token": "eyJhbGciOi...",
          "roomId": "room_500"
      },
      "message": "Room token generated"
  }
  ```

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
