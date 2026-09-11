const assert = require("assert");
const http = require("http");
const crypto = require("crypto");
const { generateKeyPair, exportJWK, SignJWT } = require("jose");
const app = require("../src/app");

/**
 * JWT verification test suite.
 *
 * Simulates the deployed Better Auth JWT architecture without touching
 * production: a local JWKS endpoint is served over HTTP, tokens are signed
 * with the corresponding private key (RS256), and the real Express app +
 * auth middleware verify them end-to-end.
 *
 * Claim matrix matches the installed Better Auth v1.7.4 jwt() plugin
 * (dist/plugins/jwt/sign.mjs): sub = user id, iss = baseURL, default
 * aud = baseURL, exp from expirationTime.
 */
async function runTests() {
    console.log("[Test] Starting JWT verification tests...");

    // 1. Generate an RSA keypair representing the Better Auth JWKS signing key.
    const { publicKey, privateKey } = await generateKeyPair("RS256", { modulusLength: 2048 });
    const publicJwk = await exportJWK(publicKey);
    publicJwk.kid = crypto.randomUUID();
    publicJwk.alg = "RS256";
    publicJwk.use = "sig";

    // 2. Local JWKS endpoint (stands in for /api/auth/jwks).
    const jwksServer = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ keys: [publicJwk] }));
    });
    await new Promise((resolve) => jwksServer.listen(0, "127.0.0.1", resolve));
    const { port: jwksPort } = jwksServer.address();
    const jwksUrl = `http://127.0.0.1:${jwksPort}/api/auth/jwks`;

    const { env } = require("../src/config/env");
    const { verifyJwtToken, invalidateJWKS } = require("../src/middleware/auth");

    // Preserve original values for restoration after the suite.
    const originalJwksUrl = env.BETTER_AUTH_JWKS_URL;
    const originalBaseUrl = env.BETTER_AUTH_BASE_URL;

    const ISSUER = "https://auth.test.yoibi.example";
    env.BETTER_AUTH_JWKS_URL = jwksUrl;
    env.BETTER_AUTH_BASE_URL = ISSUER;
    invalidateJWKS(); // Force re-init against the test JWKS endpoint.

    const now = Math.floor(Date.now() / 1000);
    function makeClaims(overrides = {}) {
        return {
            sub: "usr_google_test_1",
            email: "google.user@example.com",
            name: "Google Test User",
            image: "https://example.com/avatar.png",
            emailVerified: true,
            iat: now,
            iss: ISSUER,
            aud: ISSUER,
            exp: now + 3600,
            ...overrides,
        };
    }
    async function sign(claims) {
        const { exp, iat, nbf, jti, sub, ...rest } = claims;
        const builder = new SignJWT(rest)
            .setProtectedHeader({ alg: "RS256", kid: publicJwk.kid })
            .setIssuer(claims.iss)
            .setAudience(claims.aud)
            .setExpirationTime(exp)
            .setIssuedAt(iat);
        if (sub) builder.setSubject(sub);
        if (nbf) builder.setNotBefore(nbf);
        if (jti) builder.setJti(jti);
        return builder.sign(privateKey);
    }

    // A second keypair whose signature will NOT be trusted by the JWKS.
    const { privateKey: roguePrivateKey } = await generateKeyPair("RS256", { modulusLength: 2048 });

    try {
        // Test 1: Valid Better Auth JWT (email-shaped claims) -> verified identity.
        const validToken = await sign(makeClaims());
        const user = await verifyJwtToken(validToken);
        assert.strictEqual(user.id, "usr_google_test_1");
        assert.strictEqual(user.email, "google.user@example.com");
        assert.strictEqual(user.isEmailVerified, true);
        assert.strictEqual(user.role, "user");
        console.log("✓ Valid Better Auth JWT verified: sub/iss/exp/aud accepted, identity derived from token only.");

        // Test 2: Token with wrong issuer -> rejected.
        const wrongIssuerToken = await sign(makeClaims({ iss: "https://evil.example" }));
        await assert.rejects(
            () => verifyJwtToken(wrongIssuerToken),
            (err) => err.status === 401
        );
        console.log("✓ JWT with wrong issuer rejected with 401.");

        // Test 3: Token with wrong audience -> rejected (strict aud validation).
        const wrongAudToken = await sign(makeClaims({ aud: "https://other-service.example" }));
        await assert.rejects(
            () => verifyJwtToken(wrongAudToken),
            (err) => err.status === 401
        );
        console.log("✓ JWT with wrong audience rejected with 401.");

        // Test 4: Expired token -> TOKEN_EXPIRED.
        const expiredToken = await sign(makeClaims({ iat: now - 7200, exp: now - 3600 }));
        await assert.rejects(
            () => verifyJwtToken(expiredToken),
            (err) => err.status === 401 && err.code === "TOKEN_EXPIRED"
        );
        console.log("✓ Expired JWT rejected with 401 TOKEN_EXPIRED.");

        // Test 5: Signature not in JWKS -> rejected.
        const restClaims = makeClaims();
        const forgedToken = await new SignJWT(restClaims)
            .setProtectedHeader({ alg: "RS256", kid: "forged-kid" })
            .setIssuer(ISSUER)
            .setAudience(ISSUER)
            .setExpirationTime(now + 3600)
            .setIssuedAt(now)
            .setSubject("usr_rogue")
            .sign(roguePrivateKey);
        await assert.rejects(
            () => verifyJwtToken(forgedToken),
            (err) => err.status === 401
        );
        console.log("✓ JWT signed by an untrusted key rejected with 401.");

        // Test 6: Empty / missing token -> rejected without crash.
        await assert.rejects(
            () => verifyJwtToken(""),
            (err) => err.status === 401 && err.code === "UNAUTHORIZED"
        );
        console.log("✓ Missing/empty token rejected with 401 UNAUTHORIZED.");

        // Test 7: End-to-end through Express: GET /api/v1/auth/me with a valid JWT.
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
                        try { parsed = JSON.parse(data); } catch { parsed = data; }
                        resolve({ status: res.statusCode, body: parsed });
                    });
                });
                req.on("error", reject);
                req.end();
            });
        }

        try {
            const meRes = await request("/api/v1/auth/me", {
                headers: { Authorization: `Bearer ${validToken}` }
            });
            assert.strictEqual(meRes.status, 200, "Valid JWT must authenticate GET /auth/me");
            assert.strictEqual(meRes.body.success, true);
            assert.strictEqual(meRes.body.data.id, "usr_google_test_1");
            assert.strictEqual(meRes.body.data.email, "google.user@example.com");
            console.log("✓ GET /api/v1/auth/me with valid JWT returns 200 with verified identity.");

            const expiredRes = await request("/api/v1/auth/me", {
                headers: { Authorization: `Bearer ${expiredToken}` }
            });
            assert.strictEqual(expiredRes.status, 401);
            assert.strictEqual(expiredRes.body.error.code, "TOKEN_EXPIRED");
            console.log("✓ GET /api/v1/auth/me with expired JWT returns 401 TOKEN_EXPIRED.");

            const malformedRes = await request("/api/v1/auth/me", {
                headers: { Authorization: "Bearer not-a-real-jwt" }
            });
            assert.strictEqual(malformedRes.status, 401);
            assert.strictEqual(malformedRes.body.error.code, "INVALID_TOKEN");
            console.log("✓ GET /api/v1/auth/me with malformed JWT returns 401 INVALID_TOKEN.");
        } finally {
            await new Promise((resolve) => server.close(resolve));
        }
    } finally {
        // Restore environment so other suites see the default configuration.
        env.BETTER_AUTH_JWKS_URL = originalJwksUrl;
        env.BETTER_AUTH_BASE_URL = originalBaseUrl;
        invalidateJWKS();
        jwksServer.close();
    }

    console.log("\nAll JWT verification tests passed successfully!");
}

module.exports = { runJwtTests: runTests };

if (require.main === module) {
    runTests().catch((err) => {
        console.error("JWT test failed:", err);
        process.exit(1);
    });
}
