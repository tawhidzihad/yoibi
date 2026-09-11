const assert = require("assert");
const { DEFAULT_DATABASE_NAME, normalizeMongoDbUri } = require("../src/config/mongoUri");
const { deriveHandleBase, deriveHandleBaseFor, HANDLE_PREFIX, MAX_HANDLE_LENGTH, MIN_HANDLE_LENGTH } = require("../src/utils/handles");
const { getMe } = require("../src/controllers/read/auth.controller");
const User = require("../src/models/user.model");
const userProfileService = require("../src/services/userProfile.service");
const { updateUserBodySchema } = require("../src/validators/users.validator");

/**
 * Authentication & user-storage architecture tests (deterministic, no live DB).
 *
 * Covers:
 *   - MongoDB connection-string normalization to `yoibi_database`
 *   - handle-generation rules (lowercase, URL-safe, length, uniqueness)
 *   - deterministic collision-safe handle suffix strategy
 *   - server-side profile creation (Better Auth user -> YOIBI profile, role=user)
 *   - role system (exactly user/admin, default user, client cannot self-assign)
 *   - User schema (String _id = Better Auth user ID, unique handle index,
 *     no password/credential fields)
 *   - GET /auth/me response contract (no verification residue)
 */

async function runTests() {
    console.log("[Test] Starting authentication & user-storage architecture tests...");

    // ------------------------------------------------------------------
    // 1. MongoDB connection-string normalization (database = yoibi_database)
    // ------------------------------------------------------------------
    {
        const noDb = normalizeMongoDbUri("mongodb://user:pass@atlas.example.net:27017/?ssl=true&replicaSet=rs0");
        assert.strictEqual(noDb.normalized, true, "URI without a database name must be normalized");
        assert.ok(noDb.uri.includes(`/${DEFAULT_DATABASE_NAME}?`), `Normalized URI must contain /${DEFAULT_DATABASE_NAME}: ${noDb.uri}`);
        assert.strictEqual(noDb.databaseName, DEFAULT_DATABASE_NAME);
        const noSlashNoDb = normalizeMongoDbUri("mongodb+srv://cluster.example.net");
        assert.ok(noSlashNoDb.uri.includes(`/${DEFAULT_DATABASE_NAME}`), "srv URI without a path segment must gain the database segment");
        assert.strictEqual(noSlashNoDb.normalized, true);

        const wrongDb = normalizeMongoDbUri("mongodb://localhost:27017/test?retryWrites=true");
        assert.strictEqual(wrongDb.normalized, true, "Wrong database name must be normalized");
        assert.strictEqual(wrongDb.replacedFrom, "test", "`test` database must be replaced");
        assert.ok(wrongDb.uri.includes("/yoibi_database?"), `Replaced URI: ${wrongDb.uri}`);

        const alreadyCorrect = normalizeMongoDbUri(`mongodb://localhost:27017/${DEFAULT_DATABASE_NAME}?retryWrites=true`);
        assert.strictEqual(alreadyCorrect.normalized, false, "Correct database must be left untouched");
        assert.ok(alreadyCorrect.uri.includes(`/${DEFAULT_DATABASE_NAME}?`));

        const wrongSrv = normalizeMongoDbUri("mongodb+srv://u:p@cluster.mongodb.net/yoibi_test?retryWrites=true");
        assert.strictEqual(wrongSrv.replacedFrom, "yoibi_test", "yoibi_test database must be replaced");
        assert.ok(wrongSrv.uri.includes("/yoibi_database?"));

        const empty = normalizeMongoDbUri("");
        assert.strictEqual(empty.uri, "");
        console.log("✓ MongoDB connection strings are normalized to the yoibi_database database (never test/sample/dev).");
    }
    // ------------------------------------------------------------------
    // 2. Handle generation rules
    // ------------------------------------------------------------------
    {
        assert.strictEqual(deriveHandleBase("John Doe"), "johndoe");
        assert.strictEqual(deriveHandleBase("John   Doe"), "johndoe", "spaces are normalized");
        assert.strictEqual(deriveHandleBase("  John  "), "john", "leading/trailing whitespace trimmed");
        assert.strictEqual(deriveHandleBase("José O'Brien"), "joseobrien", "diacritics and unsupported chars removed");
        assert.strictEqual(deriveHandleBase("john.doe@example.com"), "johndoeexamplecom");
        assert.ok(/^[a-z0-9]*$/.test(deriveHandleBase(" Special &* Characters!! ")), "handle base must be URL-safe");

        const longBase = deriveHandleBase("a".repeat(60));
        assert.ok(longBase.length <= MAX_HANDLE_LENGTH, `handle base capped at ${MAX_HANDLE_LENGTH}`);

        const shortFallback = deriveHandleBaseFor({ name: "A", email: "alice@example.com", userId: "usr_1" });
        assert.strictEqual(shortFallback, "alice", "min-length fallback uses email local part");
        assert.ok(deriveHandleBaseFor({ name: "", email: "", userId: "!!!" }).length >= MIN_HANDLE_LENGTH);

        const fullHandle = `${HANDLE_PREFIX}${deriveHandleBaseFor({ name: "John Doe" })}`;
        assert.strictEqual(fullHandle, "@johndoe");
        console.log("✓ Handles are lowercase, URL-safe, length-bounded, and derived from the server-owned name.");
    }

    // ------------------------------------------------------------------
    // 3. Server-side profile creation (deterministic collision-safe handle)
    // ------------------------------------------------------------------
    {
        const originalDb = User.db;
        const originalCreate = User.create;
        const originalFindById = User.findById;

        // Mimics a mongoose Query: awaitable AND chainable with .lean().
        const queryResult = (doc) => Object.assign(Promise.resolve(doc), {
            lean: () => queryResult(doc)
        });

        try {
            User.db = { readyState: 1 }; // simulate connected application database

            // Case A: first candidate is free -> canonical base used.
            User.findById = () => queryResult(null);
            User.create = async (doc) => {
                const copy = { ...doc, role: "user" };
                copy.toObject = () => ({ ...copy, toObject: undefined });
                return copy;
            };
            const created = await userProfileService.findProfileOrCreate({
                userId: "usr_john_1",
                name: "John Doe",
                email: "john@example.com"
            });
            assert.strictEqual(created.handle, "@johndoe", "First handle must be the canonical base");
            assert.strictEqual(created.role, "user", "New profiles always default to role=user");
            assert.strictEqual(created._id, "usr_john_1", "_id must be the Better Auth user ID");
            assert.ok(!("password" in created) && !("passwordHash" in created), "No credential fields in profile");

            // Case B: collision -> deterministic suffix strategy.
            const taken = new Set(["@janedoe"]);
            User.findById = () => queryResult(null);
            User.create = async (doc) => {
                if (taken.has(doc.handle)) {
                    const err = new Error("E11000 duplicate key");
                    err.code = 11000;
                    throw err;
                }
                const copy = { ...doc, role: "user" };
                copy.toObject = () => ({ ...copy, toObject: undefined });
                return copy;
            };
            const createdB = await userProfileService.findProfileOrCreate({
                userId: "usr_jane_1",
                name: "Jane Doe",
                email: "jane@example.com"
            });
            assert.strictEqual(createdB.handle, "@janedoe2", "Collision must advance deterministically to @janedoe2");

            // Case C: concurrent winner for the same Better Auth user ID is adopted.
            const raceWinner = { _id: "usr_racy_1", handle: "@racyuser", name: "Racy User", role: "user" };
            let firstAttempt = true;
            User.findById = () => queryResult(firstAttempt ? null : raceWinner);
            User.create = async () => {
                if (firstAttempt) {
                    firstAttempt = false;
                    const err = new Error("E11000 duplicate key (_id)");
                    err.code = 11000;
                    throw err;
                }
                throw new Error("must not reach second create");
            };
            const adopted = await userProfileService.findProfileOrCreate({
                userId: "usr_racy_1",
                name: "Racy User"
            });
            assert.strictEqual(adopted.handle, "@racyuser", "Concurrent provisioned profile must be adopted");
        } finally {
            User.db = originalDb;
            User.create = originalCreate;
            User.findById = originalFindById;
        }
        console.log("✓ Profiles are created server-side with deterministic, DB-enforced unique handles.");
    }
    // ------------------------------------------------------------------
    // 4. Role system (exactly user/admin; default user; no client role)
    // ------------------------------------------------------------------
    {
        const doc = new User({ _id: "usr_role_1", handle: "@newuser", name: "New User" });
        assert.strictEqual(doc.role, "user", "Default role must be 'user'");

        const adminDoc = new User({ _id: "usr_role_2", handle: "@admin2", name: "Admin", role: "admin" });
        assert.strictEqual(adminDoc.role, "admin", "'admin' is a permitted role");
        const adminValidation = await adminDoc.validate();
        assert.strictEqual(adminValidation, undefined);

        const rogueDoc = new User({ _id: "usr_role_3", handle: "@rogue", name: "Rogue", role: "superadmin" });
        let roleRejected = false;
        try {
            await rogueDoc.validate();
        } catch (validationErr) {
            roleRejected = Boolean(validationErr && validationErr.errors && validationErr.errors.role);
        }
        assert.ok(roleRejected, "Unknown roles must be rejected by validation");

        const schemaPaths = Object.keys(User.schema.paths);
        assert.ok(!schemaPaths.includes("isAdmin"), "Schema must not carry an isAdmin flag");
        assert.ok(!schemaPaths.includes("password"), "Schema must not carry a password field");
        assert.ok(!schemaPaths.includes("passwordHash"), "Schema must not carry a passwordHash field");
        assert.ok(!schemaPaths.includes("hashedPassword"), "Schema must not carry a hashedPassword field");

        const parsedBody = updateUserBodySchema.parse({ name: "x", bio: "y", avatarUrl: "https://example.com/a.png" });
        assert.ok(!("role" in parsedBody), "PATCH /users/me must not accept a role field");

        console.log("✓ Role system: exactly user/admin, default user, client cannot self-assign role.");
    }

    // ------------------------------------------------------------------
    // 5. User schema identity mapping & indexes
    // ------------------------------------------------------------------
    {
        const idPath = User.schema.paths["_id"];
        assert.strictEqual(String(idPath.instance), "String", "_id must be a String (Better Auth user ID)");
        assert.strictEqual(User.schema.paths.handle.options.unique, true, "handle must carry a unique index");

        const indexSpecs = User.schema.indexes().map(([keys]) => keys);
        assert.ok(indexSpecs.some((keys) => keys.handle === 1 && keys._id === undefined), "unique handle index present");
        assert.ok(indexSpecs.some((keys) => keys.role === 1), "role index present");
        assert.ok(indexSpecs.some((keys) => keys.isBlocked === 1), "isBlocked index present");

        assert.ok(!Object.keys(User.schema.paths).includes("betterAuthUserId"), "No duplicate identity field: _id IS the Better Auth user ID");
        console.log("✓ User schema: _id = Better Auth user ID (String), unique handle index, role index, no password fields.");
    }

    // ------------------------------------------------------------------
    // 6. GET /auth/me response contract (no verification residue, role user)
    // ------------------------------------------------------------------
    {
        const req = {
            user: {
                id: "usr_me_1",
                email: "me@example.com",
                name: "Me User",
                role: "user",
                isBlocked: false,
                createdAt: new Date().toISOString()
            }
        };
        let statusCode = null;
        let body = null;
        const res = {
            status(code) {
                statusCode = code;
                return this;
            },
            json(payload) {
                body = payload;
                return this;
            }
        };
        await getMe(req, res);
        assert.strictEqual(statusCode, 200);
        assert.strictEqual(body.success, true);
        assert.strictEqual(body.data.id, "usr_me_1");
        assert.ok(!("isEmailVerified" in body.data), "/auth/me must NOT expose email-verification state");
        assert.strictEqual(body.data.role, "user", "role defaults to user when DB is unavailable");
        assert.ok(!("password" in body.data), "/auth/me must never expose credentials");
        console.log("✓ GET /auth/me contract: verification state removed, role user, no credential exposure.");
    }

    console.log("\nAll authentication & user-storage architecture tests passed!");
}

module.exports = { runAuthArchitectureTests: runTests };

if (require.main === module) {
    runTests().catch((err) => {
        console.error("Auth architecture test failed:", err);
        process.exit(1);
    });
}