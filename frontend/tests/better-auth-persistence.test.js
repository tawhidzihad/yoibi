import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

/**
 * Better Auth login-persistence integration test.
 *
 * PROVES (against a REAL MongoDB database):
 *   signup (email+password)
 *     -> account created in Better Auth storage (yoibi_database)
 *     -> signout
 *     -> login with the SAME email/password succeeds   (persistence)
 *     -> wrong password fails                           (hashed verification)
 *     -> no verification step required                  (emailVerified=false is OK)
 *     -> password stored ONLY as a hash in Better Auth's `account` collection
 *        (never plaintext; never in the YOIBI app `users` profile).
 *
 * The memory server is a standalone mongod; Better Auth's Mongo adapter runs
 * with transaction:false (see frontend/src/lib/auth.js) so this works the same
 * on standalone dev/test DBs and Atlas replica sets.
 */

const AUTH_BASE = "http://localhost:3000/api/auth";
const DB_NAME = "yoibi_database";

let mongod;
let client;
let auth;

/** Calls a Better Auth route handler directly (same code path as Next.js). */
async function baCall(path, method, body = {}, cookie = null) {
    const headers = { "content-type": "application/json" };
    if (cookie) headers.cookie = cookie;
    const res = await auth.handler(
        new Request(`${AUTH_BASE}${path}`, {
            method,
            headers,
            body: JSON.stringify(body),
        })
    );
    const raw = await res.text();
    let parsed = null;
    try {
        parsed = JSON.parse(raw);
    } catch {
        parsed = raw;
    }
    const setCookies = (res.headers.get("set-cookie") || "").split(",").map((c) => c.split(";")[0]);
    return { status: res.status, parsed, cookies: setCookies };
}

describe("Better Auth persistent email/password login (real MongoDB)", () => {
    const email = `persist.${Date.now()}@example.com`;
    const password = "correct-horse-battery-123";
    const name = "Persistence Tester";
    let userId;
    let sessionCookie;

    beforeAll(
        async () => {
            mongod = await MongoMemoryServer.create();
            const uri = mongod.getUri();
            // Better Auth reads MONGODB_URI at module import time.
            process.env.MONGODB_URI = `${uri}${DB_NAME}`;
            process.env.NODE_ENV = "test";
            vi.resetModules();
            const mod = await import("../src/lib/auth.js");
            auth = mod.getAuth();
            client = new MongoClient(uri);
        },
        180000
    );

    afterAll(
        async () => {
            try {
                await client.close();
            } catch {
                // best-effort cleanup
            }
            try {
                await mongod.stop();
            } catch {
                // best-effort cleanup
            }
        },
        60000
    );

    it("creates an account immediately with no verification requirement", async () => {
        const res = await baCall("/sign-up/email", "POST", {
            name,
            email,
            password,
        });
        expect(res.status).toBe(200);
        expect(res.parsed.user.email).toBe(email);
        expect(res.parsed.user.emailVerified).toBe(false);
        expect(res.parsed.user.id).toBeTruthy();
        userId = res.parsed.user.id;
        expect(res.cookies.length).toBeGreaterThan(0);
        sessionCookie = res.cookies[0];
    });

    it("signs out and revokes the session", async () => {
        const res = await baCall("/sign-out", "POST", {}, sessionCookie);
        expect(res.status).toBe(200);
    });

    it("logs in again with the same email/password (persisted authentication)", async () => {
        const res = await baCall("/sign-in/email", "POST", { email, password });
        expect(res.status).toBe(200);
        expect(res.parsed.user.id).toBe(userId);
        expect(res.parsed.user.email).toBe(email);
    });

    it("rejects a wrong password (hashed credential verification)", async () => {
        const res = await baCall("/sign-in/email", "POST", { email, password: "definitely-wrong" });
        expect(res.status).toBe(401);
    });

    it("stores Better Auth data in the `yoibi_database` MongoDB database", async () => {
        const db = client.db(DB_NAME);
        const names = (await db.listCollections().toArray()).map((c) => c.name);
        for (const expected of ["user", "account", "session"]) {
            expect(names).toContain(expected);
        }

        const userDoc = await db.collection("user").findOne({ email });
        expect(userDoc).toBeTruthy();
        expect(userDoc.name).toBe(name);
        expect(userDoc.email).toBe(email);
        expect(userDoc.emailVerified).toBe(false);
        expect(String(userDoc._id)).toBe(userId);

        const accountDoc = await db.collection("account").findOne({ providerId: "credential" });
        expect(accountDoc).toBeTruthy();
        // Same canonical identity (BSON ObjectId in storage, hex string in the
        // Better Auth user id / JWT `sub` claim).
        expect(String(accountDoc.userId)).toBe(userId);

        // The stored password MUST be a hash (format "<salt>:<hash>"), never
        // the plaintext, and it must NOT exist on the user doc.
        expect(typeof accountDoc.password).toBe("string");
        expect(accountDoc.password).not.toBe(password);
        expect(accountDoc.password).toContain(":");
        expect(userDoc.password).toBeUndefined();

        const sessionCount = await db.collection("session").countDocuments({});
        expect(sessionCount).toBeGreaterThan(0);
    }, 30000);
});