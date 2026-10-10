# YOIBI API & Realtime Contract

Version: 1.0.0  
Specification Type: Human-readable single source of truth for frontend/backend communication.

---

## 1. Global Standards

### 1.1 Base URL & Protocol

- HTTP Base URL: `/api/v1`
- Protocol: HTTPS in production; HTTP in local development (`http://localhost:5000/api/v1`)
- Realtime Gateway: LiveKit rooms (`wss://livekit.yoibi.com`) with tokens issued by the backend.

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
- Description: Retrieves current authenticated user context, permissions, moderation status, and the canonical DB-backed profile statistics (the single source of truth for the right-side user card / sidebar).
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
      "isBlocked": false,
      "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
      "bannerUrl": "https://res.cloudinary.com/.../banner.jpg",
      "bio": "Building the future of social networks.",
      "country": "US",
      "age": 21,
      "phone": "+1 555 000 1234",
      "followersCount": 420,
      "followingCount": 180,
      "tweetsCount": 112,
      "videosCount": 7,
      "postsCount": 112,
      "createdAt": "2026-09-01T12:00:00.000Z"
    },
    "message": ""
  }
  ```
- Statistics notes:
  - `tweetsCount` / `videosCount` are real authorId-based counts
    from the canonical repositories (the same `collectProfileCounts` source the
    public profile uses) — never client-fabricated.
  - `postsCount` is the legacy alias of `tweetsCount` (Tweet = YOIBI post type).
  - `followersCount` / `followingCount` come from the canonical `users` document.
  - After tweet create/delete, follow/unfollow, or profile updates, the frontend
    refetches this endpoint (via the `yoibi:profile-changed` sync event) so the
    sidebar stays in sync without a page reload.
- Error (401 `UNAUTHORIZED`): Token invalid or missing.
- Error (403 `ACCOUNT_BLOCKED`): Account is currently blocked by administrator.

### Identity & profile architecture

- Authentication is owned by **Better Auth** (email + password and Google OAuth only).
  No email verification, forgot-password, or password-reset features exist.
- The YOIBI application profile lives in the single canonical MongoDB collection
  `users` in `yoibi_database`, keyed by `betterAuthUserId` (the canonical Better
  Auth user ID, shared by Email and Google identities — no provider-specific
  identity fields). Profile upserts are idempotent, so repeat logins never
  create duplicates. The collection never stores passwords or hashes.
- Field classification:
  | Field | Classification |
  | --- | --- |
  | `betterAuthUserId` (`_id`) | server-generated (from the verified Better Auth JWT) |
  | `name`, `email` | provider-derived / Better Auth identity (server-side only) |
  | `handle` | canonical username — server-generated on first login (unique); user-editable via `PATCH /users/me` (normalized lowercase, URL-safe `[a-z0-9]`, 3–24 chars, DB-unique → collision returns `422 HANDLE_TAKEN`) |
  | `bio`, `country`, `age`, `phone` | user-submitted via `PATCH /users/me` (empty/null for Google users until completed) |
  | `avatarUrl` | user-uploaded (Cloudinary URL) or provider-derived (verified Google avatar URL at first OAuth login) |
  | `bannerUrl` | user-uploaded (Cloudinary URL, server-issued signed upload via `POST /users/me/upload-signature`); default empty |
  | `role` (`user` \| `admin`), `isBlocked`, `blockReason` | admin/server-managed — never accepted from signup, OAuth payload, query, or client state |
- For Google users the server derives `name`, `email`, and the verified provider
  avatar URL (`avatarUrl`) from the authenticated Better Auth identity — never
  from a browser-submitted value. Missing onboarding data (age/country/phone/bio)
  stays empty and is completed later through the profile flow.

---

## 4. Users & Follows

### `GET /api/v1/users/search`

- Auth: Required (`Bearer <token>`). People search lives in the protected area —
  anonymous account enumeration is not allowed. Rate limited: 60 requests / 1 min per IP.
- Description: Search users by display name or username (case-insensitive partial
  match). Blocked accounts are never returned. The query is regex-escaped
  server-side (metacharacters are matched literally — no pattern injection) and a
  leading `@` is tolerated (`@jane` ≡ `jane`).
- Query Parameters:
  - `q` (required): 1–100 characters, trimmed server-side.
  - `limit` (optional): 1–20, default 10.
- Response (200) — strict public search projection (never email, role, or
  moderation state):
  ```json
  {
    "success": true,
    "data": {
      "users": [
        {
          "id": "usr_65e1a2b3",
          "handle": "janedoe",
          "name": "Jane Doe",
          "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg"
        }
      ]
    },
    "message": ""
  }
  ```
  Results are ordered by follower count (descending), then handle.
- Error (401 `UNAUTHORIZED`): Token missing, malformed, or expired.
- Error (422 `VALIDATION_ERROR`): Missing/over-length `q`, or `limit` outside 1–20.
- Error (429 `RATE_LIMITED`): Search rate limit exceeded.

### `GET /api/v1/users/:handle`

- Auth: Required (`Bearer <token>`). Profile pages live inside the protected area.
- Description: Fetch a public user profile **by canonical handle** (e.g. `janedoe`,
  `@janedoe`, or any casing — the server normalizes it). Identity (`isOwner`,
  `isFollowing`) is derived from the authenticated token only.
- Response (200) — explicit public allowlist (never email/age/phone/role/block state):
  ```json
  {
    "success": true,
    "data": {
      "id": "usr_65e1a2b3",
      "handle": "@janedoe",
      "name": "Jane Doe",
      "bio": "Building the future of social networks.",
      "country": "GB",
      "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
      "bannerUrl": "https://res.cloudinary.com/.../banner.jpg",
      "followersCount": 420,
      "followingCount": 180,
      "tweetsCount": 112,
      "videosCount": 7,
      "postsCount": 112,
      "isFollowing": false,
      "isOwner": false,
      "createdAt": "2026-09-01T12:00:00.000Z"
    },
    "message": ""
  }
  ```

  - Counts are **real application counts** computed server-side by canonical
    `authorId` ownership across the tweets and videos collections.
    `postsCount` is the legacy alias of `tweetsCount` (Tweet = YOIBI post type).
  - `country` is the canonical ISO 3166-1 alpha-2 code (the UI maps it to the
    display name).
- Error (404 `NOT_FOUND`): User not found.
- Error (401 `UNAUTHORIZED`): Token missing, malformed, or expired.

### `POST /api/v1/users/me/upload-signature`

- Auth: Required (`Bearer <token>`)
- Description: Issues a **server-signed Cloudinary upload authorization** for the
  authenticated user's profile image. `CLOUDINARY_API_SECRET` never leaves the
  server; the signed folder is server-controlled per user and per image kind
  (`yoibi/profiles/{userId}/avatars` | `yoibi/profiles/{userId}/banners`).
- **Signed-parameter rule (critical):** The signature covers `public_id` + `timestamp` ONLY;
  `publicId` already embeds the server-controlled folder. Clients MUST NOT send `folder` as a
  separate upload parameter (Cloudinary would prepend `folder` to `public_id`, doubling the
  asset path). The `folder` field in the response is informational only.
- Request Body:
  ```json
  { "kind": "avatar" }
  ```

  - `kind`: `avatar` | `banner` (required).
- Response (200):
  ```json
  {
    "success": true,
    "data": {
      "uploadIntentId": "intent_img_...",
      "publicId": "yoibi/profiles/usr_65e1a2b3/avatars/intent_img_...",
      "folder": "yoibi/profiles/usr_65e1a2b3/avatars",
      "timestamp": 1730000000,
      "signature": "<server-signed-sha1>",
      "apiKey": "<cloudinary-api-key>",
      "cloudName": "yoibi"
    },
    "message": "Profile image upload signature generated successfully"
  }
  ```
  The client uploads the file to `https://api.cloudinary.com/v1_1/{cloudName}/image/upload`
  with the signature fields, then persists the returned `secure_url` via
  `PATCH /users/me` (`avatarUrl` / `bannerUrl`).
- Error (503 `SERVICE_UNCONFIGURED`): Cloudinary not configured on the server.

### `PATCH /api/v1/users/me`

- Auth: Required (`Bearer <token>`); authorization is **always the verified
  `req.user.id`** — client-submitted `userId`/`betterAuthUserId`/`role`/
  `ownerId` are structurally impossible (Zod `.strict()` allowlist) and ignored.
- Description: Update the current authenticated user's application profile:
  display name, username/handle, bio, avatar, banner, and onboarding fields
  (country, age, phone). Identity fields (`id`, `email`) and managed fields
  (`role`, `isBlocked`, timestamps) are never accepted. Password credentials
  are owned exclusively by Better Auth.
- Request Body (all fields optional; server-normalized):
  ```json
  {
    "name": "Jane D.",
    "handle": "janedoe",
    "bio": "Designer & Developer",
    "avatarUrl": "https://res.cloudinary.com/yoibi/image/upload/v12345/avatar.jpg",
    "bannerUrl": "https://res.cloudinary.com/yoibi/image/upload/v12345/banner.jpg",
    "country": "US",
    "age": 21,
    "phone": "+1 555 000 1234"
  }
  ```

  - `handle`: normalized server-side (lowercase, `@` stripped, URL-safe
    `[a-z0-9]`); 3–24 characters post-normalization; unique database index.
    A collision returns `422 HANDLE_TAKEN`. After a handle change the client
    must navigate to `/profile/{newHandle}` (never a stale URL).
  - `avatarUrl` / `bannerUrl`: http(s) Cloudinary URLs; empty string clears.
  - `country`: ISO 3166-1 alpha-2 canonical code (uppercase, server-normalized); empty string clears it.
  - `age`: integer >= 16 (YOIBI onboarding policy); null/empty clears it.
  - `phone`: optional; empty string clears it.
- Response (200): Updated own-profile object (sanitized — moderation internals
  such as `blockedReason`/`blockedAt`/`blockedBy` omitted).
- Error (422 `VALIDATION_ERROR`): Invalid format (e.g. bio exceeds 280 chars, invalid handle).
- Error (422 `HANDLE_TAKEN`): The requested username is already in use.
- Error (401 `UNAUTHORIZED`): Token missing, malformed, or expired.

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
> A Tweet supports short text updates (≤ 380 characters), optional media URLs, likes, retweets, threaded replies (via `replyToId`), interaction counts, and authenticated user interaction states.
>
> **Threaded comments (Facebook-style):** Comments are Tweets. Every comment carries:
>
> - `replyToId` — the DIRECT parent (the tweet, or another comment). This chain stores the true arbitrary-depth nesting; no depth limit exists in the schema (visual flattening beyond the first level is a frontend presentation rule only).
> - `rootTweetId` — the top-level tweet owning the whole thread (null on top-level tweets). One indexed query fetches a tweet's entire comment tree; legacy pre-threading replies are backfilled on read.
> - `rootCommentId` — the top-level comment this comment is grouped under (null for direct replies to the tweet).
>
> Comments are individually likable via the same tweet like endpoints (`:id` = comment ID works because a comment IS a tweet). `repliesCount` semantics: on a top-level tweet it is the TOTAL number of comments in its thread (all depths); on a comment it is that comment's direct-reply count. Deleting a comment cascades to its nested-reply subtree; deleting a top-level tweet removes its entire comment thread.

### `GET /api/v1/tweets/config`

- Auth: Optional / Public
- Description: Returns tweet client configuration and server-enforced validation constraints.
- Response (200):
  ```json
  {
    "success": true,
    "data": {
      "maxLength": 380,
      "maxMediaCount": 5
    }
  }
  ```

### `GET /api/v1/tweets`

- Auth: Optional (personalizes `liked` and `retweeted` state if authenticated)
- Query Parameters:
  - `page` (default `1`, min `1`)
  - `limit` (default `20`, max `50`, min `1`)
  - `filter`: `all` | `following`
  - `authorHandle` (optional string, resolves to user ID for profile Tweets tab)
  - `mode`: `feed` | `tweets` (optional; when `feed`, enables seeded discovery mixing and own-post pinning)
  - `seed`: optional integer (session PRNG seed for deterministic discovery pagination across pages)
  - `cursor`: optional alphanumeric string
- Response (200): Paginated list of tweets (`items`), `pagination` envelope (`page`, `limit`, `totalItems`, `totalPages`, `hasNextPage`), and `feedSeed` (integer returned when `mode=feed`). Pinned own tweets appear at the top of page 1 in `mode=feed`. Base tweets remain strictly chronological without opt-in `mode=feed`.

### `POST /api/v1/tweets/media-signature`

- Auth: Required (`Bearer <token>`)
- Description: Issue a server-signed Cloudinary upload authorization for **one** tweet image of the authenticated user. The folder (`yoibi/tweets/{userId}`) and exact `publicId` are server-controlled per user; the Cloudinary API secret never leaves the browser.
- Response (200):
  ```json
  {
    "success": true,
    "data": {
      "uploadIntentId": "intent_tweetimg_...",
      "cloudName": "yoibi",
      "apiKey": "<cloudinary-api-key>",
      "timestamp": 1700000000,
      "signature": "<sha1(public_id=...&timestamp=...+SECRET)>",
      "publicId": "yoibi/tweets/<userId>/intent_tweetimg_..."
    }
  }
  ```

### `POST /api/v1/tweets`

- Auth: Required (`Bearer <token>`)
- Description: Create a new tweet.
- Request Body:
  ```json
  {
    "content": "Launching YOIBI Phase 4. Clean, typed micro-posts! #dev #web",
    "media": [
      {
        "uploadIntentId": "intent_tweetimg_...",
        "publicId": "yoibi/tweets/<userId>/intent_tweetimg_...",
        "url": "https://res.cloudinary.com/yoibi/image/upload/v.../yoibi/tweets/<userId>/intent_tweetimg_...",
        "type": "image",
        "width": 1920,
        "height": 1080,
        "bytes": 245100,
        "format": "webp"
      }
    ],
    "replyToId": null
  }
  ```
- Constraints:
  - `content`: 1–380 characters (trimmed).
  - `media`: max **5** server-authorized image attachments. Each entry references a server-issued upload intent and is strictly verified (existence, expiry, ownership, exact publicId match, URL correspondence) before the intent is consumed exactly once.
  - Supported image formats: `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`. Max size: 10 MB per image.
- Response (201): Created tweet object.
- Error (400 `VALIDATION_ERROR`): Content exceeds 380 characters or is empty; more than 5 media items.
- Error (403 `FORBIDDEN`): A media attachment failed intent verification (invalid/expired intent, ownership mismatch, or asset identity mismatch).

### `GET /api/v1/tweets/:id`

- Auth: Optional (marks `liked` and `retweeted` if authenticated)
- Description: Get tweet details including its threaded comment tree (same shape as `GET /tweets/:id/replies` — top-level comments each carrying a flat `replies` array).
- Response (200): Tweet object with author info and threaded replies list.
- Error (404 `NOT_FOUND`): Tweet not found.

### `DELETE /api/v1/tweets/:id`

- Auth: Required (`Bearer <token>`)
- Authorization: Must be tweet author (`req.user.id === tweet.authorId`) or user with role `admin`.
- Description: Deletes the tweet. If the target is a top-level tweet, its **entire comment thread is cascade-deleted**; if it is a comment, the comment **and all of its nested replies (subtree)** are removed. Counters on the affected parents are kept consistent.
- Response (200):
  ```json
  {
    "success": true,
    "data": { "deletedId": "tweet_123", "deletedCount": 3 },
    "message": "Tweet deleted successfully"
  }
  ```
  `deletedCount` is the number of documents removed (the target plus cascaded comments/replies).
- Error (403 `FORBIDDEN`): Not authorized to delete this tweet.
- Error (404 `NOT_FOUND`): Tweet not found.

### `POST /api/v1/tweets/:id/like`

- Auth: Required (`Bearer <token>`)
- Description: Like a tweet **or a comment** (`:id` may be either — comments are tweets).
- Response (200): `{ "liked": true, "likesCount": 12 }`

### `DELETE /api/v1/tweets/:id/like`

- Auth: Required (`Bearer <token>`)
- Description: Remove a like from a tweet **or a comment**.
- Response (200): `{ "liked": false, "likesCount": 11 }`

### `POST /api/v1/tweets/:id/retweet`

- Auth: Required (`Bearer <token>`)
- Response (200): `{ "retweeted": true, "retweetsCount": 5 }`

### `DELETE /api/v1/tweets/:id/retweet`

- Auth: Required (`Bearer <token>`)
- Response (200): `{ "retweeted": false, "retweetsCount": 4 }`

### `GET /api/v1/tweets/:id/replies`

- Auth: Optional (marks `liked` on every comment for the authenticated viewer)
- Description: Fetch the **threaded comment tree** of a tweet. Returns the top-level comments (direct replies), each carrying a flat chronological `replies` array with ALL of its descendants (any depth — depth ≥ 2 is flattened into the same group, Facebook-style). Each nested reply also carries `parentAuthor` (the author of the comment it directly replied to) for "replying to @handle" context. Legacy pre-threading replies are backfilled to `rootTweetId` on read.
- Response (200):
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "tweet_c1",
          "content": "First top-level comment",
          "author": {
            "id": "usr_a",
            "name": "Alice",
            "handle": "@alice",
            "avatarUrl": null
          },
          "createdAt": "2026-09-16T10:00:00.000Z",
          "likesCount": 2,
          "liked": false,
          "repliesCount": 3,
          "replyToId": "tweet_root",
          "rootTweetId": "tweet_root",
          "rootCommentId": null,
          "replies": [
            {
              "id": "tweet_c2",
              "content": "Direct reply to the comment",
              "author": {
                "id": "usr_b",
                "name": "Bob",
                "handle": "@bob",
                "avatarUrl": null
              },
              "createdAt": "2026-09-16T10:05:00.000Z",
              "likesCount": 0,
              "liked": false,
              "repliesCount": 1,
              "replyToId": "tweet_c1",
              "rootTweetId": "tweet_root",
              "rootCommentId": "tweet_c1",
              "parentAuthor": {
                "id": "usr_a",
                "name": "Alice",
                "handle": "@alice",
                "avatarUrl": null
              }
            },
            {
              "id": "tweet_c3",
              "content": "Reply-to-a-reply — flattened into the same thread",
              "author": {
                "id": "usr_c",
                "name": "Carol",
                "handle": "@carol",
                "avatarUrl": null
              },
              "createdAt": "2026-09-16T10:10:00.000Z",
              "likesCount": 1,
              "liked": false,
              "repliesCount": 0,
              "replyToId": "tweet_c2",
              "rootTweetId": "tweet_root",
              "rootCommentId": "tweet_c1",
              "parentAuthor": {
                "id": "usr_b",
                "name": "Bob",
                "handle": "@bob",
                "avatarUrl": null
              }
            }
          ]
        }
      ]
    },
    "message": ""
  }
  ```

### `POST /api/v1/tweets/:id/replies`

- Auth: Required (`Bearer <token>`)
- Note: `:id` may be a **tweet** (creates a top-level comment) **or a comment** (creates a nested reply — the Facebook-style threading). The parent relationship (`replyToId`) is derived SERVER-SIDE from the URL `:id` parameter and is never taken from the client request body. Thread roots (`rootTweetId`, `rootCommentId`) are likewise derived server-side from the stored parent chain — a reply can never be attributed to a foreign thread. Replying to a non-existent parent returns 404 `NOT_FOUND`.
- Request Body:
  ```json
  {
    "content": "Exciting update!",
    "media": []
  }
  ```
- Response (201): Created comment object linked via `replyToId`, with its server-derived `rootTweetId` and `rootCommentId`.
- Constraints:
  - `content`: 1–380 characters (trimmed).
- Error (400 `VALIDATION_ERROR`): Content exceeds 380 characters or is empty.
- Counter semantics: creating a nested reply increments BOTH the direct parent comment's `repliesCount` (direct replies) and the root tweet's `repliesCount` (total comments in the thread).

---

## 6. Media & Uploads (Cloudinary Integration)

> **Security Rule:** Private Cloudinary API secret is never exposed to the browser. Uploads use server-side signed upload intents or authenticated endpoint dispatch.

### `POST /api/v1/media/upload`

- Auth: Required (`Bearer <token>`)
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Binary file (image or video)
  - `folder`: string (`posts` | `tweets` | `avatars` | `videos`)
- Constraints:
  - Image MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`. Max size: 10 MB.
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
>
> - Video files are hosted and delivered via Cloudinary. The private `CLOUDINARY_API_SECRET` is strictly backend-only.
> - **Asset Provenance:** Direct uploads use server-signed parameters generated via `POST /api/v1/videos/upload-signature`. The backend controls the folder (`yoibi/videos/{userId}`) and assigns a unique `uploadIntentId` and exact `publicId`. Metadata submission via `POST /api/v1/videos` validates the server-issued intent, ensuring users can only register assets they were authorized to upload.
> - **Upload Limits:**
>   - _Cloudinary Provider Limit_: 100 MB maximum for direct single-file uploads on Cloudinary Free tier.
>   - _YOIBI Application Limit_: 100 MB (`104,857,600` bytes) maximum for MVP video community uploads.
>   - _Supported Formats_: `video/mp4`, `video/webm`, `video/quicktime` (`.mov`).
> - **Categories (Option A):** Exactly 8 canonical categories (`politics`, `current-events`, `learning`, `governmental`, `fun`, `conversations`, `commentary`, `news`). Category is optional; omitted or `null` denotes uncategorized.
> - **View Count Semantics:** `viewsCount` measures **playback initiation events** recorded via `POST /api/v1/videos/:id/view`. It does NOT represent unique viewers. Pure detail retrieval (`GET /api/v1/videos/:id`) does NOT increment view counts.

### `POST /api/v1/videos/upload-signature`

- Auth: Required (`Bearer <token>`)
- Description: Generates signed upload parameters and an `uploadIntentId` bound to the authenticated user and a server-controlled folder/public ID.
- **Signed-parameter rule (critical):** The signature covers `public_id` + `timestamp` ONLY. `publicId` already embeds the server-controlled folder (`yoibi/videos/{userId}`). Clients MUST NOT send `folder` as a separate upload parameter — Cloudinary treats `public_id` as RELATIVE to `folder` when both are provided (resulting asset path: `folder/public_id`), which doubles the path and fails strict asset-provenance verification on metadata registration. The `folder` field in the response is informational only.
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

## 8. Meet-Up Rooms (LiveKit Integration)

> **Architecture:** Multi-participant collaborative rooms supporting bidirectional interactive audio, video, and screen sharing powered by LiveKit SFU.
>
> **Key Architecture & Security Rules:**
>
> 1. **Authentication & Owner Identity Model:** All room operations and token issuance require authenticated YOIBI users (`Bearer <token>`). Unauthenticated guests are strictly rejected (`401 UNAUTHORIZED`). The room owner identity (`ownerId: String`) is derived strictly from the verified Better Auth user ID (`req.user.id`), maintaining unified ownership architecture across domains (`Tweet.authorId`, `Video.authorId`, `MeetUp.ownerId`). Client-supplied owner IDs are never trusted. User profiles (`name`, `handle`, `avatarUrl`) are enriched server-side via the application's user profile repository.
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
  _(Note: `name` is required (3–100 chars); `topic` is optional (max 100 chars); `maxParticipants` is optional (2–50, default 12))._
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

## 9. Reports & User Flagging

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

## 10. Admin & Moderation

> **Mandatory Moderation Rules:**
>
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

## 12. Admin Dashboard & Moderation Tools

### 14.1 Authorization & Protection Rules

- **Admin Guard:** All `/api/v1/admin/*` endpoints strictly require `req.user.role === "admin"`.
- **Admin Self-Protection:**
  - An admin cannot ban themselves (`403 ADMIN_SELF_ACTION_FORBIDDEN`).
  - An admin cannot block themselves (`403 ADMIN_SELF_ACTION_FORBIDDEN`).
  - An admin cannot ban or block another admin (`403 ADMIN_TARGET_PROTECTED`).
- **Canonical User Identity:** All `:id` parameters in `/api/v1/admin/users/:id/*` represent the **Better Auth User ID string**.

---

### `GET /api/v1/admin/stats`

- **Auth:** Required (`role === "admin"`)
- **Description:** Returns system-wide moderation and engagement statistics using indexed count queries.
- **Metric Classifications:**
  - **Current-State Counts:** `currentUsers` (current profiles in database), `activeUsers` (not blocked, not deleted), `blockedUsers` (`isBlocked: true`), `activeMeetUpRooms` (`status: "active"`), `pendingReports` (`status: "pending"`).
  - **Historical Totals:** `bannedUsers` (count of completed/partial BAN_USER audit records), `totalTweets`, `totalVideos`.
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "users": {
        "current": 1250,
        "active": 1210,
        "blocked": 40,
        "banned": 15
      },
      "content": {
        "totalTweets": 15420,
        "totalVideos": 890,
        "activeMeetUpRooms": 2
      },
      "moderation": {
        "pendingReports": 8,
        "resolvedReports": 64,
        "dismissedReports": 12
      }
    },
    "message": "Admin metrics retrieved"
  }
  ```
- **Error (401 `UNAUTHORIZED`):** Unauthenticated.
- **Error (403 `FORBIDDEN`):** Caller is not an admin.

---

### `GET /api/v1/admin/users`

- **Auth:** Required (`role === "admin"`)
- **Query Parameters:**
  - `page`: Integer, default 1
  - `limit`: Integer, default 20, max 100
  - `search`: String (searches `name`, `handle`, `email`)
  - `status`: String (`"all"`, `"active"`, `"blocked"`), default `"all"`
  - `role`: String (`"all"`, `"user"`, `"admin"`), default `"all"`
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "ba_usr_xyz789",
          "name": "Bad Actor",
          "handle": "@badactor",
          "email": "bad@example.com",
          "avatarUrl": null,
          "role": "user",
          "isBlocked": true,
          "blockReason": "Spamming offensive links",
          "blockedAt": "2026-09-11T02:00:00.000Z",
          "createdAt": "2026-09-01T00:00:00.000Z"
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

---

### `GET /api/v1/admin/users/:id`

- **Auth:** Required (`role === "admin"`)
- **Description:** Retrieves detailed user moderation profile including content counts and moderation history.
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": "ba_usr_xyz789",
      "name": "Bad Actor",
      "handle": "@badactor",
      "email": "bad@example.com",
      "avatarUrl": null,
      "bio": "Nothing to see",
      "role": "user",
      "isBlocked": true,
      "blockReason": "Spamming offensive links",
      "blockedAt": "2026-09-11T02:00:00.000Z",
      "createdAt": "2026-09-01T00:00:00.000Z",
      "counts": {
        "tweets": 4,
        "videos": 1,
        "meetupRooms": 0,
        "followers": 12,
        "following": 8
      },
      "reportsCount": 3
    },
    "message": "User moderation details retrieved"
  }
  ```
- **Error (404 `NOT_FOUND`):** User not found.

---

### `POST /api/v1/admin/users/:id/block`

- **Auth:** Required (`role === "admin"`)
- **Description:** Reversibly suspends user account. Preserves all user data. Denies authentication and active JWTs.
- **Request Body:**
  ```json
  {
    "reason": "Violating platform hate speech policies"
  }
  ```
  _(Note: `notifyEmail` is not supported in MVP and must not be sent)._
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": "ba_usr_xyz789",
      "isBlocked": true,
      "blockReason": "Violating platform hate speech policies",
      "blockedAt": "2026-09-11T05:30:00.000Z"
    },
    "message": "User successfully blocked"
  }
  ```
- **Error (400 `VALIDATION_ERROR`):** Missing or empty reason.
- **Error (403 `ADMIN_SELF_ACTION_FORBIDDEN`):** Admin cannot block self.
- **Error (403 `ADMIN_TARGET_PROTECTED`):** Admin cannot block another admin.
- **Error (404 `NOT_FOUND`):** User not found.

---

### `POST /api/v1/admin/users/:id/unblock`

- **Auth:** Required (`role === "admin"`)
- **Description:** Restores suspended user account. Access is fully restored; all previously preserved data remains intact.
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": "ba_usr_xyz789",
      "isBlocked": false,
      "blockReason": null,
      "blockedAt": null
    },
    "message": "User successfully unblocked"
  }
  ```
- **Error (404 `NOT_FOUND`):** User not found.

---

### `POST /api/v1/admin/users/:id/ban`

- **Auth:** Required (`role === "admin"`)
- **Description:** Permanent, destructive purge of user account and owned content. Initializes durable audit record before executing 5-phase cleanup.
- **Request Body:**
  ```json
  {
    "reason": "Persistent abusive behavior and spam",
    "confirmHandle": "@badactor"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "auditId": "audit_65e1b4c8",
      "status": "COMPLETED",
      "targetUserId": "ba_usr_xyz789",
      "deletedCounts": {
        "tweets": 14,
        "videos": 2,
        "meetupRooms": 0,
        "follows": 20,
        "cloudinaryAssets": 2,
        "livekitRooms": 1
      },
      "failedCleanups": []
    },
    "message": "User permanently banned and data purged"
  }
  ```
- **Error (400 `VALIDATION_ERROR`):** Reason missing or confirmation handle does not match target.
- **Error (403 `ADMIN_SELF_ACTION_FORBIDDEN`):** Admin cannot ban self.
- **Error (403 `ADMIN_TARGET_PROTECTED`):** Admin cannot ban another admin.
- **Error (404 `NOT_FOUND`):** User not found.

---

### `GET /api/v1/admin/content/tweets`

- **Auth:** Required (`role === "admin"`)
- **Query Parameters:** `page`, `limit`, `search`, `authorId`
- **Response (200):** Paginated tweets list enriched with author details.

### `DELETE /api/v1/admin/content/tweets/:id`

- **Auth:** Required (`role === "admin"`)
- **Description:** Administrative removal of an offending tweet and decrement of parent reply count if applicable.
- **Response (200):** `{ "success": true, "data": { "id": "tweet_123" }, "message": "Tweet deleted by administrator" }`

---

### `GET /api/v1/admin/content/videos`

- **Auth:** Required (`role === "admin"`)
- **Query Parameters:** `page`, `limit`, `search`, `authorId`
- **Response (200):** Paginated videos list.

### `DELETE /api/v1/admin/content/videos/:id`

- **Auth:** Required (`role === "admin"`)
- **Description:** Administrative removal of an offending video. Deletes Cloudinary asset and MongoDB record.
- **Response (200):** `{ "success": true, "data": { "id": "video_123" }, "message": "Video deleted by administrator" }`

---

### `GET /api/v1/admin/content/meetups`

- **Auth:** Required (`role === "admin"`)
- **Query Parameters:** `page`, `limit`, `status` (`"all"`, `"active"`, `"ended"`)
- **Response (200):** Paginated Meet-Up rooms list.

### `DELETE /api/v1/admin/content/meetups/:id`

- **Auth:** Required (`role === "admin"`)
- **Description:** Administrative termination and removal of an offending Meet-Up room. Terminates LiveKit room if active.
- **Response (200):** `{ "success": true, "data": { "id": "meetup_123" }, "message": "Meet-Up room ended and removed by administrator" }`

---

### `POST /api/v1/reports`

- **Auth:** Required (`Bearer <token>`)
- **Description:** Platform user submits a report against content or a user.
- **Request Body:**
  ```json
  {
    "targetType": "tweet",
    "targetId": "tweet_123",
    "reason": "Harassment and offensive language",
    "description": "User is posting threats in replies"
  }
  ```
  _(Valid `targetType` values: `"tweet"`, `"video"`, `"meetup"`, `"user"`)._
- **Response (201):**
  ```json
  {
    "success": true,
    "data": {
      "id": "rep_65e1c2a1",
      "status": "pending",
      "createdAt": "2026-09-11T05:35:00.000Z"
    },
    "message": "Report submitted successfully"
  }
  ```

---

### `GET /api/v1/admin/reports`

- **Auth:** Required (`role === "admin"`)
- **Query Parameters:**
  - `page`: Integer, default 1
  - `limit`: Integer, default 20
  - `status`: String (`"all"`, `"pending"`, `"resolved"`, `"dismissed"`), default `"all"`
  - `targetType`: String (`"all"`, `"tweet"`, `"video"`, `"meetup"`, `"user"`), default `"all"`
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "rep_65e1c2a1",
          "reporter": {
            "id": "ba_usr_reporter1",
            "name": "Jane Reporter",
            "handle": "@janerep"
          },
          "targetType": "tweet",
          "targetId": "tweet_123",
          "targetPreview": {
            "content": "Offensive tweet text snippet...",
            "authorHandle": "@badactor"
          },
          "reason": "Harassment and offensive language",
          "description": "User is posting threats in replies",
          "status": "pending",
          "resolutionNotes": null,
          "resolvedBy": null,
          "resolvedAt": null,
          "createdAt": "2026-09-11T05:35:00.000Z"
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

---

### `PATCH /api/v1/admin/reports/:id`

- **Auth:** Required (`role === "admin"`)
- **Description:** Moderates a pending report.
- **Request Body:**
  ```json
  {
    "status": "resolved",
    "resolutionNotes": "Offending tweet was removed and user was issued a warning."
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": "rep_65e1c2a1",
      "status": "resolved",
      "resolutionNotes": "Offending tweet was removed and user was issued a warning.",
      "resolvedBy": "ba_usr_admin1",
      "resolvedAt": "2026-09-11T05:40:00.000Z"
    },
    "message": "Report status updated"
  }
  ```

---

### `GET /api/v1/admin/audit-logs`

- **Auth:** Required (`role === "admin"`)
- **Query Parameters:** `page`, `limit`, `action` (`"all"`, `"BAN_USER"`, `"BLOCK_USER"`, `"UNBLOCK_USER"`, `"DELETE_CONTENT"`)
- **Response (200):** Paginated audit log records.

---

## 13. Email Verification

Email verification is required for full platform access. Users with `emailVerified: false` receive a 6-digit verification code via email that expires in 15 minutes.

### Error Codes (Email Verification)

- `EMAIL_NOT_VERIFIED`: User's email has not been verified (HTTP 403)
- `CODE_EXPIRED`: Verification code has expired or already used (HTTP 400)
- `INVALID_CODE`: Verification code is incorrect (HTTP 400)
- `CODE_RATE_LIMITED`: Too many verification attempts (HTTP 429)

### `POST /api/v1/auth/verification/send`

- **Auth:** Required (`Bearer <token>`)
- **Description:** Sends a 6-digit email verification code to the user's registered email address. Rate-limited: 1 request per 60 seconds per user.
- **Response (200):**
  ```json
  {
    "success": true,
    "data": { "sent": true },
    "message": "Verification code sent to your email"
  }
  ```
- **Error (429 `RATE_LIMITED`):** Already sent a code in the last 60 seconds.

### `POST /api/v1/auth/verification/verify`

- **Auth:** Required (`Bearer <token>`)
- **Description:** Verifies the 6-digit code submitted by the user.
- **Request Body:**
  ```json
  {
    "code": "123456"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "verified": true,
      "emailVerified": true
    },
    "message": "Email verified successfully"
  }
  ```
- **Error (400 `INVALID_CODE`):** Code is incorrect or malformed.
- **Error (400 `CODE_EXPIRED`):** Code has expired (15 minutes) or already used.

### `POST /api/v1/auth/verification/resend`

- **Auth:** Required (`Bearer <token>`)
- **Description:** Resends a verification code. Enforces 60-second cooldown between sends.
- **Response (200):**
  ```json
  {
    "success": true,
    "data": { "resent": true },
    "message": "Verification code resent"
  }
  ```
- **Error (429 `RATE_LIMITED`):** Already sent a code in the last 60 seconds.

---

## 11. Direct Messages & Realtime

### 11.1 Endpoints

#### `GET /api/v1/messages/config`
- **Auth:** Optional / Public
- **Description:** Returns limits for message length (2000 graphemes), image upload max bytes (10MB), and video upload max bytes (50MB).

#### `GET /api/v1/messages/conversations`
- **Auth:** Required (`Bearer <token>`)
- **Query:** `filter` (`all` | `unread` | `online`), `search`, `cursor`, `limit` (default 20, max 50).
- **Description:** Lists conversations for the authenticated user that contain at least one message, ordered by most recent message activity. Conversations created without messages (e.g. newly initiated conversations) are omitted from this list and filter tabs until the first message is sent. Empty conversations remain directly accessible via `GET /api/v1/messages/conversations/:id`.

#### `POST /api/v1/messages/conversations`
- **Auth:** Required (`Bearer <token>`)
- **Body:** `{ "recipientId": "<string>" }`
- **Description:** Creates or returns an existing 1-on-1 direct conversation. Follow-gated: user must follow recipient to initiate a new conversation.

#### `GET /api/v1/messages/conversations/:id`
- **Auth:** Required (`Bearer <token>`)
- **Description:** Retrieves conversation details if the authenticated user is a participant.

#### `GET /api/v1/messages/conversations/:id/messages`
- **Auth:** Required (`Bearer <token>`)
- **Query:** `cursor`, `limit` (default 30, max 50).
- **Description:** Returns paginated messages in ascending chronological order for thread view.

#### `POST /api/v1/messages/conversations/:id/messages`
- **Auth:** Required (`Bearer <token>`)
- **Body:** `{ "clientMessageId": "<string>", "text": "<string>", "media": { ... } }`
- **Description:** REST fallback to send a message. Idempotent on `(conversationId, senderId, clientMessageId)`.

#### `POST /api/v1/messages/conversations/:id/delivered`
- **Auth:** Required (`Bearer <token>`)
- **Body:** `{ "messageIds": ["<string>"] }`
- **Description:** Marks specific messages as delivered.

#### `POST /api/v1/messages/conversations/:id/read`
- **Auth:** Required (`Bearer <token>`)
- **Body:** `{ "messageIds": ["<string>"] }` (optional)
- **Description:** Marks messages as read and resets unread count for the participant.

#### `POST /api/v1/messages/media/upload-intent`
- **Auth:** Required (`Bearer <token>`)
- **Body:** `{ "conversationId": "<string>", "resourceType": "image" | "video" }`
- **Description:** Returns server-signed Cloudinary upload parameters with strict folder and expiration constraints.

#### `GET /api/v1/messages/active-friends`
- **Auth:** Required (`Bearer <token>`)
- **Description:** Returns followed users who are currently connected/online.

#### `GET /api/v1/messages/presence`
- **Auth:** Required (`Bearer <token>`)
- **Description:** Returns presence map for relevant conversation partners.

#### `GET /api/v1/messages/search?q=...`
- **Auth:** Required (`Bearer <token>`)
- **Description:** Performs full-text search across messages in user's conversations.

### 11.2 Realtime Socket.IO Events

**Client → Server:**
- `conversation:join` `{ conversationId }` — Joins conversation room for instant broadcasts.
- `conversation:leave` `{ conversationId }` — Leaves conversation room.
- `message:send` `{ conversationId, clientMessageId, text, media }` — Sends message with ack confirmation.
- `message:delivered` `{ conversationId, messageIds }` — Acknowledges delivery.
- `message:read` `{ conversationId, messageIds }` — Acknowledges read receipt.
- `typing:start` `{ conversationId }` — Broadcasts typing state to conversation partner.
- `typing:stop` `{ conversationId }` — Clears typing state.
- `presence:sync` — Requests presence status for followed users.

**Server → Client:**
- `message:new` `{ conversation, message }` — Broadcasts incoming message.
- `message:delivered` `{ conversationId, messageIds }` — Delivery receipt update.
- `message:read` `{ conversationId, messageIds }` — Read receipt update.
- `typing:update` `{ conversationId, userId, isTyping }` — Partner typing indicator.
- `presence:update` `{ userId, isOnline }` — User online/offline state change.
- `unread:update` `{ totalUnread }` — Global badge count update.
- `auth:force_disconnect` `{ reason }` — Disconnects user on account block or ban.

