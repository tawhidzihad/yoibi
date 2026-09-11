import { authClient } from "@/lib/auth-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

/**
 * Official Better Auth JWT acquisition flow (single centralized path).
 *
 * Uses the installed Better Auth (v1.7.4) JWT plugin client API:
 *   `authClient.token()` -> GET ${NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth/token
 *   which is authenticated by the primary Better Auth session cookie and
 *   returns `{ token: "<JWKS-verifiable JWT>" }`.
 *
 * NOTE: The previous implementation called `authClient.getJwtToken()`, which
 * the client's dynamic path proxy resolves to `GET /get-jwt-token` — a route
 * that does not exist in Better Auth 1.7.x — so every request 404'd and no
 * Authorization header was ever attached. `authClient.token()` is the
 * official API for the installed version.
 *
 * This is the ONLY place in the frontend that acquires the JWT. The Better
 * Auth session cookie is never used as the external-service JWT.
 *
 * @returns {Promise<string>} The JWT, or "" when no session/JWT is available.
 */
export async function getJwtToken() {
    try {
        const { data, error } = await authClient.token();
        if (error) {
            // Not logged in, expired session, or auth service unreachable.
            return "";
        }
        const token = data?.token;
        // Never return a non-string truthy value that could produce
        // "Authorization: Bearer undefined" / "Bearer [object Object]".
        return typeof token === "string" && token.length > 0 ? token : "";
    } catch (err) {
        console.warn("[ApiClient] Failed to acquire JWT token from Better Auth:", err?.message);
        return "";
    }
}

/**
 * Builds the Authorization header for the current session, or {} when no
 * valid JWT exists (never a malformed "Bearer undefined/null" header).
 */
async function getAuthHeader() {
    const token = await getJwtToken();
    if (token) {
        return { Authorization: `Bearer ${token}` };
    }
    return {};
}

/**
 * Centralized API fetch helper for Express backend requests.
 */
export async function apiFetch(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const authHeaders = await getAuthHeader();
    const headers = {
        "Content-Type": "application/json",
        ...authHeaders,
        ...(options.headers || {}),
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        let data = null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        }

        if (!response.ok) {
            const errorCode = data?.error?.code || (response.status === 401 ? "UNAUTHORIZED" : response.status === 403 ? "FORBIDDEN" : "API_ERROR");
            const errorMessage = data?.error?.message || response.statusText || "An API error occurred";
            return {
                success: false,
                status: response.status,
                error: {
                    code: errorCode,
                    message: errorMessage,
                    fields: data?.error?.fields,
                },
            };
        }

        return {
            success: true,
            status: response.status,
            data: data?.data ?? data,
            message: data?.message || "",
        };
    } catch (error) {
        console.error("[ApiClient] Network failure:", error);
        return {
            success: false,
            status: 0,
            error: {
                code: "NETWORK_ERROR",
                message: "Unable to connect to the server. Please check your network connection.",
            },
        };
    }
}

export const apiClient = {
    get: (endpoint, options) => apiFetch(endpoint, { ...options, method: "GET" }),
    post: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
    patch: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) }),
    delete: (endpoint, options) => apiFetch(endpoint, { ...options, method: "DELETE" }),
};
