import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Centralized API client JWT behavior tests.
 *
 * The Better Auth client (`@/lib/auth-client`) is mocked so these tests
 * exercise the real `client.js` logic: official `authClient.token()` flow,
 * Authorization header construction, malformed-header prevention, and 401
 * error mapping.
 */

const tokenMock = vi.fn();

vi.mock("@/lib/auth-client", () => ({
    authClient: {
        // The official Better Auth v1.7.4 JWT plugin client API.
        token: (...args) => tokenMock(...args),
    },
}));

const { apiClient, getJwtToken } = await import("@/lib/api/client");

describe("getJwtToken (centralized Better Auth JWT acquisition)", () => {
    beforeEach(() => {
        tokenMock.mockReset();
    });

    it("returns the JWT string from the official authClient.token() flow", async () => {
        tokenMock.mockResolvedValue({ data: { token: "header.payload.signature" }, error: null });
        const token = await getJwtToken();
        expect(token).toBe("header.payload.signature");
        expect(tokenMock).toHaveBeenCalledTimes(1);
    });

    it("returns empty string when Better Auth reports an error (no session)", async () => {
        tokenMock.mockResolvedValue({ data: null, error: { message: "Unauthorized" } });
        const token = await getJwtToken();
        expect(token).toBe("");
    });

    it("never returns a non-string token that would produce a malformed header", async () => {
        tokenMock.mockResolvedValue({ data: { token: undefined }, error: null });
        expect(await getJwtToken()).toBe("");
        tokenMock.mockResolvedValue({ data: { token: null }, error: null });
        expect(await getJwtToken()).toBe("");
        tokenMock.mockResolvedValue({ data: {}, error: null });
        expect(await getJwtToken()).toBe("");
    });

    it("returns empty string when the auth client throws", async () => {
        tokenMock.mockRejectedValue(new Error("network down"));
        expect(await getJwtToken()).toBe("");
    });
});

describe("apiClient Authorization header behavior", () => {
    beforeEach(() => {
        tokenMock.mockReset();
        vi.stubGlobal("fetch", vi.fn());
    });

    it("attaches 'Authorization: Bearer <jwt>' when a valid JWT is acquired", async () => {
        tokenMock.mockResolvedValue({ data: { token: "valid.jwt.token" }, error: null });
        fetch.mockResolvedValue(new Response(JSON.stringify({ success: true, data: { ok: 1 } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }));

        const res = await apiClient.get("/auth/me");
        expect(res.success).toBe(true);
        const [, init] = fetch.mock.calls[0];
        expect(init.headers.Authorization).toBe("Bearer valid.jwt.token");
    });

    it("sends NO Authorization header when no JWT is available (never 'Bearer undefined/null')", async () => {
        tokenMock.mockResolvedValue({ data: { token: undefined }, error: null });
        fetch.mockResolvedValue(new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }));

        await apiClient.get("/tweets");
        const [, init] = fetch.mock.calls[0];
        expect(init.headers.Authorization).toBeUndefined();
        expect(JSON.stringify(init.headers)).not.toContain("Bearer undefined");
        expect(JSON.stringify(init.headers)).not.toContain("Bearer null");
    });

    it("maps 401 responses to a UNAUTHORIZED error state", async () => {
        tokenMock.mockResolvedValue({ data: { token: "expired.jwt.token" }, error: null });
        fetch.mockResolvedValue(new Response(JSON.stringify({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication token is missing or malformed." },
        }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        }));

        const res = await apiClient.post("/tweets", { content: "hello" });
        expect(res.success).toBe(false);
        expect(res.status).toBe(401);
        expect(res.error.code).toBe("UNAUTHORIZED");
    });
});
