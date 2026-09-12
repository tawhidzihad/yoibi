const assert = require("assert");
const { userHandleParamSchema, updateUserBodySchema, profileMediaSignatureSchema } = require("../src/validators/users.validator");
const { normalizeHandleParam, MAX_HANDLE_LENGTH } = require("../src/utils/handles");
const User = require("../src/models/user.model");
const { buildPublicProfile, collectProfileCounts } = require("../src/controllers/read/users.controller");
const { sanitizeOwnProfile } = require("../src/controllers/update/users.controller");
const { createImageUploadIntent } = require("../src/integrations/cloudinary/cloudinary");
const { listTweetsQuerySchema } = require("../src/validators/tweets.validator");
const { listStreamsQuerySchema } = require("../src/validators/streams.validator");

/**
 * User Profile System tests (deterministic, no live DB).
 *
 * Covers:
 *   - bannerUrl in the canonical users schema
 *   - handle normalization (profile lookup + editable handle rules)
 *   - editable-handle validation (length, URL-safe, invalid rejection)
 *   - strict allowlist: role/betterAuthUserId/isBlocked/ownership spoofing rejected
 *   - public profile projection (no sensitive exposure, real counts, isOwner)
 *   - own-profile projection (no moderation internals, normalized role)
 *   - profile content counts keyed by canonical authorId (zeros when DB down)
 *   - tweets authorHandle filter schema + streams "all" status schema
 *   - server-issued avatar/banner upload signature (folders, no secret exposure)
 */

function expectZodThrow(schema, value) {
    let threw = false;
    try {
        schema.parse(value);
    } catch {
        threw = true;
    }
    assert.ok(threw, "Expected schema to reject invalid input");
}

async function runTests() {
    console.log("[Test] Starting user profile system tests...");

    // ------------------------------------------------------------------
    // 1. Canonical users schema carries bannerUrl
    // ------------------------------------------------------------------
    {
        assert.ok(Object.keys(User.schema.paths).includes("bannerUrl"), "users schema must carry bannerUrl");
        assert.strictEqual(User.schema.paths.bannerUrl.options.default, "");
        assert.ok(Object.keys(User.schema.paths).includes("avatarUrl"), "avatarUrl must remain present");
        console.log("✓ users schema: bannerUrl + avatarUrl present on the canonical profile.");
    }

    // ------------------------------------------------------------------
    // 2. Handle normalization (lookup + edit)
    // ------------------------------------------------------------------
    {
        assert.strictEqual(normalizeHandleParam("@Tawhid"), "tawhid");
        assert.strictEqual(normalizeHandleParam("  John.Doe  "), "johndoe");
        assert.strictEqual(normalizeHandleParam("Rahim-99!"), "rahim99");
        assert.strictEqual(normalizeHandleParam(""), "");
        assert.strictEqual(normalizeHandleParam(null), "");
        assert.strictEqual(normalizeHandleParam("a".repeat(40)), "a".repeat(MAX_HANDLE_LENGTH));
        const parsed = userHandleParamSchema.parse({ handle: "@JaneDoe" });
        assert.strictEqual(parsed.handle, "janedoe");
        console.log("✓ handle normalization: lowercase, URL-safe, '@' stripped, length clamped.");
    }

    // ------------------------------------------------------------------
    // 3. Editable handle validation rules
    // ------------------------------------------------------------------
    {
        const ok = updateUserBodySchema.parse({ handle: "  @Tawhid_Zihad " });
        assert.strictEqual(ok.handle, "tawhidzihad", "handle must be normalized before storage");

        expectZodThrow(updateUserBodySchema, { handle: "ab" }); // below MIN_HANDLE_LENGTH
        expectZodThrow(updateUserBodySchema, { handle: `${"a".repeat(MAX_HANDLE_LENGTH + 1)}` }); // over max
        assert.ok(updateUserBodySchema.safeParse({}).success, "handle is optional");
        console.log("✓ editable handle: normalized, min/max enforced, invalid input rejected.");
    }

    // ------------------------------------------------------------------
    // 4. Strict server-managed field allowlist (identity spoofing fails)
    // ------------------------------------------------------------------
    {
        ["role", "betterAuthUserId", "userId", "isBlocked", "blockedReason", "ownerId", "authorId", "_id", "createdAt", "updatedAt", "isAdmin", "password"].forEach((field) => {
            const body = { name: "Jane" };
            body[field] = field === "role" ? "admin" : field === "isBlocked" ? false : "spoofed";
            expectZodThrow(updateUserBodySchema, body);
        });
        const parsed = updateUserBodySchema.parse({ name: "Jane", bio: "hi", avatarUrl: "https://example.com/a.png", bannerUrl: "https://example.com/b.png", country: "BD", handle: "janedoe" });
        assert.ok(!("role" in parsed) && !("betterAuthUserId" in parsed), "managed fields must never survive parsing");
        assert.strictEqual(parsed.country, "BD");
        console.log("✓ PATCH /users/me allowlist: role, IDs, block state, timestamps and credentials are structurally rejected.");
    }

    // ------------------------------------------------------------------
    // 5. avatar/banner URL validation
    // ------------------------------------------------------------------
    {
        assert.ok(updateUserBodySchema.safeParse({ bannerUrl: "https://res.cloudinary.com/yoibi/profiles/u1/banners/img.jpg" }).success);
        assert.ok(updateUserBodySchema.safeParse({ bannerUrl: "" }).success, "empty string clears the banner");
        expectZodThrow(updateUserBodySchema, { bannerUrl: "not-a-url" });
        expectZodThrow(updateUserBodySchema, { avatarUrl: "javascript:alert(1)" });
        console.log("✓ avatarUrl/bannerUrl: validated as URLs (or '' to clear).");
    }

    // ------------------------------------------------------------------
    // 6. Public profile projection — no sensitive exposure
    // ------------------------------------------------------------------
    {
        const dbUser = {
            _id: "usr_123",
            handle: "@janedoe",
            name: "Jane Doe",
            email: "jane@example.com",
            avatarUrl: "https://res.cloudinary.com/a.png",
            bannerUrl: "https://res.cloudinary.com/b.png",
            bio: "Builder",
            country: "GB",
            age: 30,
            phone: "+44 7000",
            role: "user",
            isBlocked: false,
            blockedReason: "spam",
            followersCount: 12,
            followingCount: 34,
            createdAt: new Date("2026-09-01T12:00:00Z")
        };
        const data = buildPublicProfile(dbUser, { isFollowing: true, isOwner: false, counts: { tweetsCount: 7, videosCount: 3, streamsCount: 2 } });
        assert.strictEqual(data.tweetsCount, 7);
        assert.strictEqual(data.videosCount, 3);
        assert.strictEqual(data.streamsCount, 2);
        assert.strictEqual(data.postsCount, 7, "postsCount is the legacy tweets alias");
        assert.strictEqual(data.isFollowing, true);
        assert.strictEqual(data.isOwner, false);
        assert.strictEqual(data.bannerUrl, dbUser.bannerUrl);
        ["email", "age", "phone", "role", "isBlocked", "blockedReason", "blockedAt", "blockedBy", "__v"].forEach((sensitive) => {
            assert.ok(!(sensitive in data), `public profile must NOT expose ${sensitive}`);
        });
        const own = buildPublicProfile(dbUser, { isOwner: true });
        assert.strictEqual(own.isOwner, true);
        assert.strictEqual(own.isFollowing, false, "owner can never 'follow' self in the response");
        console.log("✓ public profile projection: counts + banner present, sensitive fields never exposed, isOwner correct.");
    }

    // ------------------------------------------------------------------
    // 7. Own-profile projection (PATCH /users/me response sanitization)
    // ------------------------------------------------------------------
    {
        const dbUser = {
            _id: "usr_123",
            handle: "@janedoe",
            name: "Jane Doe",
            email: "jane@example.com",
            avatarUrl: "",
            bannerUrl: "",
            bio: "",
            country: "",
            age: 22,
            phone: "",
            role: "user",
            isBlocked: true,
            blockedReason: "review",
            blockedAt: new Date(),
            blockedBy: "admin_1",
            followersCount: 0,
            followingCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            __v: 0
        };
        const data = sanitizeOwnProfile(dbUser, "usr_123");
        assert.strictEqual(data.id, "usr_123");
        assert.strictEqual(data.isBlocked, true, "own profile keeps live block flag for the layout guard");
        ["blockedReason", "blockedAt", "blockedBy", "__v", "_id"].forEach((internal) => {
            assert.ok(!(internal in data), `own profile response must NOT expose ${internal}`);
        });
        assert.strictEqual(sanitizeOwnProfile({ role: "hacker", handle: "@x", _id: "u1" }).role, "user", "role normalized to user/admin");
        console.log("✓ own-profile projection: moderation internals excluded, role normalized.");
    }

    // ------------------------------------------------------------------
    // 8. Content counts keyed by canonical authorId (DB-down determinism)
    // ------------------------------------------------------------------
    {
        const counts = await collectProfileCounts("usr_123");
        assert.deepStrictEqual(counts, { tweetsCount: 0, videosCount: 0, streamsCount: 0 });
        console.log("✓ profile counts resolve per-domain by authorId (0 when DB is unreachable, never fabricated).");
    }

    // ------------------------------------------------------------------
    // 9. Tweets authorHandle filter + Streams "all" lifecycle support
    // ------------------------------------------------------------------
    {
        const tweetsQuery = listTweetsQuerySchema.parse({ authorHandle: "@JaneDoe" });
        assert.strictEqual(tweetsQuery.authorHandle, "janedoe");
        const streamsQuery = listStreamsQuerySchema.parse({ status: "all", authorId: "usr_123" });
        assert.strictEqual(streamsQuery.status, "all");
        assert.ok(listStreamsQuerySchema.safeParse({ status: "live" }).success);
        expectZodThrow(listStreamsQuerySchema, { status: "bogus" });
        console.log("✓ tweets authorHandle + streams status=all schemas support server-side profile filtering.");
    }

    // ------------------------------------------------------------------
    // 10. Server-issued avatar/banner upload signature (no secret exposure)
    // ------------------------------------------------------------------
    {
        const avatar = createImageUploadIntent("usr_123", "avatar");
        const banner = createImageUploadIntent("usr_123", "banner");
        assert.ok(avatar.folder.startsWith("yoibi/profiles/usr_123/avatars"), `avatar folder: ${avatar.folder}`);
        assert.ok(banner.folder.startsWith("yoibi/profiles/usr_123/banners"), `banner folder: ${banner.folder}`);
        assert.ok(avatar.signature.length > 0 && banner.signature.length > 0, "signature must be present");
        assert.notStrictEqual(avatar.folder, banner.folder, "kinds must use separate folders");
        assert.ok(!("apiSecret" in avatar || "apiSecret" in banner), "no apiSecret field in the upload payload");
        console.log("✓ profile image upload signatures: per-user/kind Cloudinary folders, secret stays server-side.");
    }

    // ------------------------------------------------------------------
    // 11. Profile media signature request validation
    // ------------------------------------------------------------------
    {
        assert.ok(profileMediaSignatureSchema.safeParse({ kind: "avatar" }).success);
        assert.ok(profileMediaSignatureSchema.safeParse({ kind: "banner" }).success);
        expectZodThrow(profileMediaSignatureSchema, { kind: "video" });
        expectZodThrow(profileMediaSignatureSchema, {});
        console.log("✓ upload-signature body validation: only avatar|banner kinds are accepted.");
    }

    // ------------------------------------------------------------------
    // 12. /auth/me returns canonical DB-backed counts (sidebar sync source)
    // ------------------------------------------------------------------
    {
        const { getMe } = require("../src/controllers/read/auth.controller");
        let captured = null;
        let statusCode = 0;
        const res = {
            status(code) { statusCode = code; return this; },
            json(body) { captured = body; return this; }
        };
        await getMe(
            {
                user: {
                    id: "usr_123",
                    email: "user@example.com",
                    name: "Test User",
                    handle: "testuser",
                    role: "user",
                    avatarUrl: "",
                    isBlocked: false
                }
            },
            res
        );
        assert.strictEqual(statusCode, 200);
        assert.strictEqual(captured.success, true);
        assert.strictEqual(captured.data.tweetsCount, 0);
        assert.strictEqual(captured.data.postsCount, 0, "postsCount aliases tweetsCount");
        assert.strictEqual(captured.data.followersCount, 0);
        assert.strictEqual(captured.data.followingCount, 0);
        assert.ok("bannerUrl" in captured.data, "getMe must carry bannerUrl");
        console.log("✓ /auth/me returns canonical DB-backed counts (single source for the sidebar).");
    }

    console.log("\nAll user profile system tests passed!");
}

module.exports = { runUserProfileTests: runTests };

if (require.main === module) {
    runTests().catch((err) => {
        console.error("User profile test failed:", err);
        process.exit(1);
    });
}
