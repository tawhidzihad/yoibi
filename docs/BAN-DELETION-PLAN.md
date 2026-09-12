# YOIBI Ban Deletion Plan

## Purpose

This document is the canonical source of truth for the permanent **Ban** operation in YOIBI.

It defines what a Ban means, which records/resources are affected, what must be preserved, what must be deleted or anonymized, how external resources are handled, and how the destructive operation must remain auditable and safely resumable.

**Ban implementation MUST NOT begin until this document is reviewed and the implementation plan explicitly follows it.**

---

# 1. Ban, Block, and Unblock

## 1.1 Block

Block is a reversible account suspension.

When a user is blocked:

- account access is suspended;
- existing user data is preserved;
- owned Tweets remain;
- owned Videos remain;
- owned Streams remain according to the approved moderation policy;
- Meet-Up records remain according to the approved moderation policy;
- the user is shown the account-blocked state;
- a block reason is stored;
- an admin audit entry is created.

Block MUST be reversible.

## 1.2 Unblock

Unblock restores access to a previously blocked account.

Unblock MUST NOT delete or rebuild the user's preserved data.

## 1.3 Ban

Ban is a permanent, destructive moderation action.

A successful Ban means:

- the user's authentication account is permanently removed or irreversibly disabled through the supported Better Auth administrative API;
- the user's YOIBI application profile is permanently removed;
- user-owned content is deleted;
- user-owned external media is cleaned up;
- owned realtime resources are terminated;
- user relationships/interactions are cleaned up;
- moderation reports are preserved;
- the Ban audit trail is preserved permanently.

Ban is irreversible.

---

# 2. Canonical User Identity

YOIBI uses the **Better Auth User ID** as the application-wide user identity.

The canonical user identifier is a `String`.

All application-level ownership and user relationships MUST use that same identifier:

- `Tweet.authorId`
- `Tweet.likes[]`
- `Tweet.retweets[]`
- `Video.authorId`
- `Video.likes[]`
- `Stream.authorId`
- `MeetUp.ownerId`
- `Follow.followerId`
- `Follow.followingId`
- `Report.reporterId`
- `AuditLog.adminId`
- `AuditLog.targetUserId`

The MongoDB `users` document uses the same Better Auth User ID as its `_id`.

MongoDB-generated `ObjectId` values MUST NOT be introduced as an alternative application user identity.

All Admin, Block, Unblock, and Ban operations operate on the Better Auth User ID string.

---

# 3. Authentication Authority

Better Auth remains the sole authentication authority.

The backend MUST NOT directly modify undocumented Better Auth internal collections.

For moderation account operations, use the supported Better Auth server/admin API available in the installed project version.

Conceptually:

- Block → supported Better Auth user-ban/suspension operation
- Unblock → supported Better Auth user-unban/restoration operation
- Ban → supported Better Auth user-removal/permanent-disable operation

The implementation plan MUST verify the exact installed Better Auth API before coding and MUST NOT guess internal collection names or fields.

---

# 4. Account-State Authority

The moderation state must have clearly defined authority levels:

### Authentication authority
Better Auth.

### Application moderation state
YOIBI's server-side user moderation state, including `isBlocked` and the stored block metadata.

### JWT
A signed snapshot of authentication claims. A JWT is NOT the final authority for current moderation state.

### Cache
A cache may accelerate moderation checks but is never authoritative.

A stale JWT MUST NOT allow a blocked user to continue using protected backend functionality after the server knows the account is blocked.

The implementation plan must define how stale JWTs are handled safely.

---

# 5. Complete User-Owned Data Inventory

The Ban process MUST evaluate all of the following domains.

| Entity / Resource | Identifier / Ownership | Ban Policy |
|---|---|---|
| Better Auth account | Better Auth user ID | Permanently remove/disable |
| User profile | `users._id` | Delete |
| Outgoing follows | `followerId` | Delete |
| Incoming follows | `followingId` | Delete |
| Owned Tweets | `authorId` | Delete |
| Tweet replies authored by user | `authorId` | Delete; repair parent reply count |
| Tweet likes by user | `tweets.likes[]` | Remove user ID; repair count |
| Tweet retweets by user | `tweets.retweets[]` | Remove user ID; repair count |
| Owned Videos | `authorId` | Delete |
| Video likes by user | `videos.likes[]` | Remove user ID; repair count |
| Owned Streams | `authorId` | Delete after realtime termination |
| Owned Meet-Up rooms | `ownerId` | Delete after realtime termination |
| Reports filed by user | `reporterId` | Preserve |
| Reports targeting user | target reference | Preserve |
| Cloudinary video assets | video `publicId` | Delete |
| Cloudinary avatar | avatar `publicId`, when Cloudinary-hosted | Delete |
| LiveKit Stream rooms | Stream `roomName` | Terminate |
| LiveKit Meet-Up rooms | Meet-Up `roomName` | Terminate |
| Admin audit logs | `targetUserId` | Preserve permanently |

The implementation plan MUST inspect the actual current project models and repositories before assuming any additional relationships.

---

# 6. Tweet Cleanup Policy

For Tweets owned by the banned user:

- delete all Tweets where `authorId === bannedUserId`;
- this includes original Tweets and replies authored by the banned user;
- when a deleted Tweet is a reply, repair the surviving parent Tweet's `repliesCount` if the parent still exists.

For interactions performed by the banned user on other Tweets:

- remove the user ID from `likes[]`;
- decrement `likesCount` safely;
- remove the user ID from `retweets[]`;
- decrement `retweetCount` safely;
- counters MUST NOT become negative.

The implementation MUST not delete other users' Tweets merely because the banned user interacted with them.

---

# 7. Video Cleanup Policy

For Videos owned by the banned user:

- collect provider asset identifiers before deleting MongoDB records;
- delete associated Cloudinary assets;
- delete Video metadata records.

For Video likes created by the banned user on other users' Videos:

- remove the banned user's ID from `likes[]`;
- decrement `likesCount` safely;
- do not delete the other user's Video.

A Ban MUST NOT report successful completion while known external media cleanup remains unresolved.

---

# 8. Stream Cleanup Policy

For Streams owned by the banned user:

- identify all owned streams first;
- if a Stream has an active/ready realtime session, terminate its LiveKit room first;
- then remove the application record;
- prevent future access to those streams.

The LiveKit `roomName` MUST be captured durably before the Stream document is removed.

If LiveKit termination fails, the failure MUST be retained in the Ban operation record so it can be reconciled later.

---

# 9. Meet-Up Cleanup Policy

For Meet-Up rooms owned by the banned user:

- identify all owned rooms first;
- terminate active LiveKit rooms first;
- then remove the application records;
- prevent future joins.

The LiveKit `roomName` MUST be captured durably before the Meet-Up document is removed.

If LiveKit termination fails, retain the failed `roomName` in the durable Ban operation record for later reconciliation.

---

# 10. Follow Cleanup Policy

Delete both relationship directions:

### Outgoing
`followerId === bannedUserId`

### Incoming
`followingId === bannedUserId`

For every affected surviving user:

- update `followersCount` / `followingCount` appropriately;
- counters MUST remain non-negative;
- duplicate/retry execution MUST NOT double-decrement counters.

The Follow collection is the relationship source of truth.

---

# 13. Report Policy

Reports are permanent moderation records.

Ban MUST NOT cascade-delete Reports.

### If banned user was the reporter

- preserve `reporterId`;
- resolve the missing profile as `Unknown user` / `Deleted user` in Admin UI.

### If banned user was the target

- preserve the report;
- show the target as `Deleted / Banned Account` where appropriate.

Report history exists for moderation/audit purposes and is not user-owned content that should be erased by a Ban.

---

# 14. Cloudinary Cleanup

Cloudinary is an external resource and must be handled separately from MongoDB.

Before deleting Video records, collect all Cloudinary `publicId` values associated with the banned user's Videos.

Also inspect the user avatar:

- if the avatar is hosted on Cloudinary, collect its `publicId` and delete it;
- if the avatar is an external provider URL, do not attempt to delete it from Cloudinary.

Recommended execution policy:

- use bounded concurrency rather than unlimited parallel deletion;
- record each resource's cleanup status;
- record failed `publicId` values and safe error information;
- continue other cleanup work after a non-critical Cloudinary failure;
- finalize Ban as `PARTIAL` if external assets remain unresolved.

The Ban operation must retain enough information to retry failed Cloudinary cleanup after the Video documents have been removed.

`CLOUDINARY_API_SECRET` is always backend-only.

---

# 15. LiveKit Cleanup

Before deleting owned Stream/Meet-Up records:

- collect their room names;
- terminate active rooms using the existing LiveKit integration;
- tolerate already-ended/not-found rooms as idempotent no-ops;
- record unexpected failures for reconciliation.

The Ban operation must retain enough information to retry failed LiveKit cleanup after application records have been removed.

Do not expose LiveKit secrets.

---

# 16. Durable Ban Operation

Ban is destructive and multi-step. It MUST NOT be implemented as an uncontrolled sequence with no durable state.

Use a durable operation/audit record with a lifecycle such as:

```text
REQUESTED
    ↓
IN_PROGRESS
    ↓
COMPLETED
```

Failure branches may end in:

```text
PARTIAL
FAILED
```

### State meanings

**REQUESTED**

- validation passed;
- durable operation record created;
- no destructive cleanup has started yet.

**IN_PROGRESS**

- cleanup phases are executing;
- progress and failures are recorded.

**COMPLETED**

- all required internal cleanup completed;
- all required external cleanup completed.

**PARTIAL**

- internal/account cleanup completed;
- one or more non-critical external cleanup items remain unresolved.

**FAILED**

- a critical failure prevented the operation from completing;
- the operation remains resumable where possible.

If the implementation does not need `REQUESTED`, it may omit it, but the final architecture MUST use one consistent lifecycle.

---

# 17. Durable Cleanup Snapshot

Before deleting any resource record that contains information required for external cleanup, create a durable cleanup snapshot.

At minimum retain:

### Cloudinary cleanup item

- resource type
- `publicId`
- cleanup status
- error information when failed

### LiveKit cleanup item

- resource type (`stream` / `meetup`)
- `roomName`
- cleanup status
- error information when failed

This snapshot is required because the Video/Stream/Meet-Up MongoDB records may be deleted during Ban.

The implementation MUST NOT rely on already-deleted domain records to retry failed external cleanup.

---

# 18. Audit Log

Create the Ban audit record **before destructive cleanup starts**.

The audit entry must contain at least:

- `adminId`
- `action = BAN_USER`
- `targetUserId`
- reason
- operation status
- start timestamp
- completion timestamp when finished
- deleted/processed counts
- external cleanup snapshot/status
- failed cleanup information

The audit record MUST survive the user's deletion.

Audit logs MUST NOT be deleted by the Ban process.

Final audit result should distinguish:

- success
- partial
- failed

Do not claim `COMPLETED` when known cleanup failures remain.

---

# 19. Required Ban Execution Phases

The final implementation should follow this conceptual order.

```text
Phase A — Validate & Protect
        ↓
Phase B — Initialize Durable Ban Operation / Audit
        ↓
Phase C — Snapshot External Resources
        ↓
Phase D — Terminate LiveKit Resources
        ↓
Phase E — Clean Cloudinary Resources
        ↓
Phase F — Purge / Repair Application Data
        ↓
Phase G — Remove / Disable Authentication Account
        ↓
Phase H — Remove Application Profile
        ↓
Phase I — Finalize Audit
```

The exact internal ordering of Tweets/Videos/Follows may be optimized, but it MUST preserve the following rules:

- external resource identifiers are captured before their MongoDB records disappear;
- audit state exists before destructive work begins;
- account removal does not happen until the required application cleanup plan has been recorded;
- failed external cleanup remains durably recoverable;
- retrying a partially completed operation is safe.

---

# 20. Idempotency Requirements

Every Ban phase MUST be safe to retry.

Examples:

- deleting an already-deleted MongoDB record → no-op;
- `$pull` of a missing user ID → no-op;
- bounded counter repair → must not become negative;
- anonymizing an already-anonymized message → no-op;
- deleting an already-deleted Cloudinary resource → safe no-op/success handling;
- terminating an already-closed LiveKit room → safe no-op handling;
- removing an already-removed Better Auth account → handle according to supported API behavior.

A retry MUST NOT:

- double-decrement counters;
- create duplicate audit entries for the same operation;
- recreate deleted content;
- corrupt surviving users' data.

---

# 21. Admin Protection

An administrator MUST NOT:

- ban themselves;
- block themselves;
- delete their own account through moderation actions;
- ban another administrator.

Admin-to-admin Block MUST remain disabled unless a separately approved product requirement explicitly enables it.

An administrator privilege change is outside this Ban workflow.

---

# 22. Ban Confirmation and Reason

Ban is destructive.

The API MUST require:

- authenticated admin;
- target user ID;
- non-empty reason;
- explicit confirmation;
- protection against self-ban/admin-ban.

The frontend Ban confirmation modal MUST clearly explain:

- the action is permanent;
- owned content will be deleted;
- external media may be deleted;
- realtime rooms may be terminated;
- sent messages will be anonymized according to policy;
- the account cannot be restored.

Frontend confirmation is UX protection only. Backend validation is mandatory.

---

# 23. Credentials and Secrets

Never hardcode administrator credentials in source code, documentation, API contracts, or Git history.

Never expose:

- `CLOUDINARY_API_SECRET`
- `LIVEKIT_API_SECRET`
- Better Auth private secrets
- database credentials

Use secure environment/deployment configuration.

`.env.example` may document variable names and placeholders only.

---

# 24. Failure and Recovery Policy

### Critical database failure before account removal

- mark operation `FAILED` or resumable failure state;
- preserve audit record;
- do not falsely report Ban as completed.

### Non-critical Cloudinary failure

- record failed resource;
- continue cleanup;
- final state becomes `PARTIAL` until reconciled.

### Non-critical LiveKit termination failure

- record failed room;
- continue according to safety policy;
- final state becomes `PARTIAL` if unresolved.

### Process crash

- durable operation state survives;
- an authorized retry resumes the incomplete operation;
- completed phases are not repeated destructively.

---

# 25. Dashboard Ban Metrics

Dashboard metrics must distinguish current-state counts from historical counts.

Do not call a database count of currently existing users a lifetime signup metric.

Recommended terminology:

- `currentUsers`
- `blockedUsers`
- `bannedUsers` (derived from durable Ban/audit history when appropriate)
- `totalTweets`
- `totalVideos`
- `liveStreams`
- `activeMeetUpRooms`
- `pendingReports`

If lifetime signup history is ever required, introduce a dedicated persistent metric rather than inferring it from deleted user records.

---

# 26. Implementation Safety Gates

Before Ban code is considered complete, the implementation plan and tests MUST cover:

### Identity

- Better Auth ID consistency across all domains;
- no accidental ObjectId-based user identity;
- ID spoofing rejected.

### Block

- block persists moderation state;
- stale JWT cannot bypass the block;
- protected endpoints reject blocked users;
- unblock restores access;
- blocked data remains intact.

### Ban lifecycle

- audit created before cleanup;
- operation state transitions are durable;
- partial failure is recorded;
- retry/resume is safe;
- final status is accurate.

### External resources

- Cloudinary identifiers snapshotted before Video deletion;
- LiveKit room names snapshotted before Stream/Meet-Up deletion;
- failed external cleanup can be reconciled later.

### Content

- owned Tweets deleted;
- tweet interaction cleanup correct;
- owned Videos deleted;
- video interaction cleanup correct;
- owned Stream records removed;
- owned Meet-Up records removed;
- Follows removed and counters repaired.

### Reports

- reports remain after Ban;
- missing reporter/target handled gracefully.

### Protection

- self-ban rejected;
- admin-ban rejected;
- no hardcoded credentials.

---

# 27. Implementation Plan Requirement

Any implementation plan generated from this document MUST:

1. read this entire file first;
2. inspect the actual current YOIBI codebase and data models;
3. identify every real dependency involved in Ban;
4. preserve the policies defined here;
5. explicitly document any unavoidable deviation before implementation;
6. keep API contracts, backend behavior, frontend behavior, tests, and documentation synchronized;
7. never silently invent a new deletion rule;
8. never skip the durable audit/operation state requirement;
9. never begin destructive Ban implementation before the final implementation plan is internally consistent.

---

# 28. Final Ban Definition

The canonical Ban architecture is:

```text
Admin
  ↓
Validate + Confirm + Reason
  ↓
Create durable Ban audit/operation record
  ↓
Snapshot external resources
  ↓
Terminate LiveKit resources
  ↓
Clean Cloudinary resources
  ↓
Delete/repair YOIBI application data
  ↓
Anonymize banned user's sent messages
  ↓
Preserve reports and surviving-user history
  ↓
Remove/disable Better Auth account
  ↓
Delete application profile
  ↓
Finalize audit
  ↓
COMPLETED / PARTIAL / FAILED
```

This file is the **source of truth for Ban deletion behavior**. Any later implementation plan must follow it unless an explicit architectural change is approved and documented.
