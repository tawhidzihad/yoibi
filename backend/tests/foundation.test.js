const assert = require("assert");
const http = require("http");
const app = require("../src/app");
const { validateEnv } = require("../src/config/env");
const { getDatabaseStatus } = require("../src/config/db");
const { requireAdmin } = require("../src/middleware/authorize");

async function runTests() {
    console.log("[Test] Starting Phase 3 Backend Foundation verification...");

    // 1. Test Environment Validation
    const envResult = validateEnv();
    assert.strictEqual(typeof envResult.isValid, "boolean");
    assert(Array.isArray(envResult.missing));
    console.log("✓ Environment configuration validation passed.");

    // 2. Test Database Status Reporter
    const dbStatus = getDatabaseStatus();
    assert(["unconfigured", "disconnected", "connected", "connecting"].includes(dbStatus));
    console.log(`✓ Database status reporting verified (current: ${dbStatus}).`);

    // 3. Test In-process HTTP endpoints using supertest-free http request
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    function request(path, options = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, baseUrl);
            const req = http.request(url, options, (res) => {
                let data = "";
                res.on("data", (chunk) => { data += chunk; });
                res.on("end", () => {
                    let parsed = null;
                    try {
                        parsed = JSON.parse(data);
                    } catch {
                        parsed = data;
                    }
                    resolve({ status: res.statusCode, headers: res.headers, body: parsed });
                });
            });
            req.on("error", reject);
            req.end();
        });
    }

    try {
        // Test A: Health endpoint
        const healthRes = await request("/api/v1/health");
        assert.strictEqual(healthRes.status, 200, "Health check must return 200");
        assert.strictEqual(healthRes.body.success, true);
        assert.strictEqual(healthRes.body.data.status, "healthy");
        assert.strictEqual(healthRes.body.data.version, "1.0.0");
        console.log("✓ GET /api/v1/health returned valid 200 OK envelope.");

        // Test B: 404 Fallback
        const notFoundRes = await request("/api/v1/nonexistent");
        assert.strictEqual(notFoundRes.status, 404);
        assert.strictEqual(notFoundRes.body.success, false);
        assert.strictEqual(notFoundRes.body.error.code, "NOT_FOUND");
        console.log("✓ 404 handler returned standard error envelope.");

        // Test C: Unauthorized request to protected endpoint (missing token)
        const unauthRes = await request("/api/v1/auth/me");
        assert.strictEqual(unauthRes.status, 401);
        assert.strictEqual(unauthRes.body.success, false);
        assert.strictEqual(unauthRes.body.error.code, "UNAUTHORIZED");
        console.log("✓ GET /api/v1/auth/me without token rejected with 401 UNAUTHORIZED.");

        // Test D: Invalid/Malformed token rejected
        const invalidTokenRes = await request("/api/v1/auth/me", {
            headers: { Authorization: "Bearer forged.invalid.token" }
        });
        assert.strictEqual(invalidTokenRes.status, 401);
        assert.strictEqual(invalidTokenRes.body.success, false);
        console.log("✓ GET /api/v1/auth/me with forged token rejected with 401.");

        // Test E: Admin guard authorization middleware
        let adminPassed = false;
        const mockReqUser = { user: { id: "usr_1", role: "user" } };
        const mockRes = {
            status: (code) => ({
                json: (payload) => {
                    assert.strictEqual(code, 403);
                    assert.strictEqual(payload.error.code, "FORBIDDEN");
                }
            })
        };
        requireAdmin(mockReqUser, mockRes, () => { adminPassed = true; });
        assert.strictEqual(adminPassed, false, "Regular user must be blocked by requireAdmin");

        const mockReqAdmin = { user: { id: "usr_admin", role: "admin" } };
        requireAdmin(mockReqAdmin, mockRes, () => { adminPassed = true; });
        assert.strictEqual(adminPassed, true, "Admin user must pass requireAdmin");
        console.log("✓ Admin authorization middleware passed role checks.");

    } finally {
        await new Promise((resolve) => server.close(resolve));
    }

    console.log("\nAll Phase 3 Backend Foundation tests passed successfully!");
}

module.exports = { runFoundationTests: runTests };

if (require.main === module) {
    runTests().catch((err) => {
        console.error("Test failed:", err);
        process.exit(1);
    });
}

