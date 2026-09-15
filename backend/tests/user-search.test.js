const assert = require("assert");
const { searchUsersQuerySchema } = require("../src/validators/users.validator");
const {
    escapeSearchRegex,
    buildUserSearchFilter,
    toSearchResult,
    searchUsers
} = require("../src/services/read/users.service");
const usersRepository = require("../src/repositories/users.repository");

/**
 * People search (GET /users/search) tests — deterministic, no live DB.
 *
 * Covers:
 *   - query validation (required q, 100-char cap, limit bounds + default)
 *   - regex metacharacter escaping (no pattern injection / regex DoS)
 *   - "@"-prefix tolerance + blocked-account exclusion in the filter
 *   - strict public search projection (no email/role/moderation state)
 *   - empty-query short-circuit and DB-down determinism ([])
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
    console.log("[Test] Starting user search tests...");

    // ------------------------------------------------------------------
    // 1. Query validation
    // ------------------------------------------------------------------
    {
        const parsed = searchUsersQuerySchema.parse({ q: "  jane  " });
        assert.strictEqual(parsed.q, "jane", "q is trimmed");
        assert.strictEqual(parsed.limit, 10, "limit defaults to 10");
        const limited = searchUsersQuerySchema.parse({ q: "jane", limit: "5" });
        assert.strictEqual(limited.limit, 5, "limit is coerced from string");

        expectZodThrow(searchUsersQuerySchema, { q: "" }); // required
        expectZodThrow(searchUsersQuerySchema, { q: "   " }); // whitespace-only
        expectZodThrow(searchUsersQuerySchema, { q: "a".repeat(101) }); // over cap
        expectZodThrow(searchUsersQuerySchema, { q: "jane", limit: 0 }); // below min
        expectZodThrow(searchUsersQuerySchema, { q: "jane", limit: 21 }); // above max
        expectZodThrow(searchUsersQuerySchema, { q: "jane", extra: true }); // strict
        console.log("✓ search query schema: trim, 100-char cap, limit 1-20 coerced, strict allowlist.");
    }

    // ------------------------------------------------------------------
    // 2. Regex escaping — metacharacters can never alter the pattern
    // ------------------------------------------------------------------
    {
        assert.strictEqual(escapeSearchRegex("a.b*c"), "a\\.b\\*c");
        assert.strictEqual(escapeSearchRegex("^$()[]{}|+?\\"), "\\^\\$\\(\\)\\[\\]\\{\\}\\|\\+\\?\\\\");
        // A hostile query stays a literal match, never a valid injection:
        const pattern = new RegExp(escapeSearchRegex(".*"), "i");
        assert.strictEqual(".*".match(pattern)[0], ".*");
        assert.strictEqual("abc".match(pattern), null);
        console.log("✓ search regex escaping: metacharacters neutralized (no pattern injection).");
    }

    // ------------------------------------------------------------------
    // 3. Filter construction — "@" tolerance + blocked exclusion
    // ------------------------------------------------------------------
    {
        const filter = buildUserSearchFilter("  @JaneDoe ");
        assert.deepStrictEqual(filter.isBlocked, { $ne: true }, "blocked users are never searchable");
        assert.strictEqual(filter.$or.length, 2, "matches handle OR name");
        assert.strictEqual(filter.$or[0].handle.source, "JaneDoe", "@-prefix stripped, literal pattern");
        assert.strictEqual(filter.$or[0].handle.flags, "i", "case-insensitive");
        assert.strictEqual(filter.$or[1].name.source, "JaneDoe");
        assert.strictEqual(buildUserSearchFilter(""), null, "empty query short-circuits");
        assert.strictEqual(buildUserSearchFilter("   @  "), null, "@-only query short-circuits");
        console.log("✓ search filter: handle+name $or, case-insensitive, blocked excluded, @ tolerated.");
    }

    // ------------------------------------------------------------------
    // 4. Strict public projection — no sensitive fields
    // ------------------------------------------------------------------
    {
        const dbUser = {
            _id: "usr_123",
            handle: "janedoe",
            name: "Jane Doe",
            email: "jane@example.com",
            avatarUrl: "https://res.cloudinary.com/a.png",
            role: "user",
            isBlocked: false,
            bio: "secret-ish",
            country: "GB",
            age: 30,
            phone: "+44 7000",
            followersCount: 12
        };
        const result = toSearchResult(dbUser);
        assert.deepStrictEqual(result, {
            id: "usr_123",
            handle: "janedoe",
            name: "Jane Doe",
            avatarUrl: "https://res.cloudinary.com/a.png"
        });
        ["email", "role", "isBlocked", "bio", "country", "age", "phone", "followersCount"].forEach((sensitive) => {
            assert.ok(!(sensitive in result), `search result must NOT expose ${sensitive}`);
        });
        console.log("✓ search projection: id/handle/name/avatarUrl only — sensitive fields never exposed.");
    }

    // ------------------------------------------------------------------
    // 5. Service + repository determinism (no live DB in tests)
    // ------------------------------------------------------------------
    {
        const empty = await searchUsers({ q: "" });
        assert.deepStrictEqual(empty, { users: [] }, "empty query never hits the database");

        const dbDown = await usersRepository.searchUsers({ filter: buildUserSearchFilter("jane"), limit: 10 });
        assert.deepStrictEqual(dbDown, [], "repository returns [] when the database is unreachable");

        const result = await searchUsers({ q: "jane" });
        assert.deepStrictEqual(result, { users: [] }, "service maps the DB-down result deterministically");
        console.log("✓ search service: empty-query short-circuit + DB-down determinism (never fabricated).");
    }

    console.log("\nAll user search tests passed!");
}

module.exports = { runUserSearchTests: runTests };

if (require.main === module) {
    runTests().catch((err) => {
        console.error("User search test failed:", err);
        process.exit(1);
    });
}
