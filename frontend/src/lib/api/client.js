import { authClient } from "@/lib/auth-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

/**
 * Retrieves the current JWT token from Better Auth client flow.
 */
async function getAuthHeader() {
    try {
        const res = await authClient.getJwtToken();
        const token = res?.data?.token || res?.token;
        if (token) {
            return { Authorization: `Bearer ${token}` };
        }
    } catch (err) {
        console.warn("[ApiClient] Failed to acquire JWT token from Better Auth:", err?.message);
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
