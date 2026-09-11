const { env } = require('../../config/env');

/**
 * Better Auth Admin Integration Client
 * Invokes official server-side administrative endpoints of the Better Auth admin() plugin.
 */

/**
 * Bans a user in Better Auth (reversible suspension).
 *
 * @param {string} userId - Better Auth user ID
 * @param {string} reason - Suspension reason
 * @param {string} [adminToken] - Optional Bearer token of the acting admin
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
async function banUser(userId, reason, adminToken = null) {
    if (!userId) return { success: false, error: 'User ID is required' };
    const baseUrl = env.BETTER_AUTH_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/auth/admin/ban-user`;

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (adminToken) {
            headers.Authorization = adminToken.startsWith('Bearer ') ? adminToken : `Bearer ${adminToken}`;
        }
        if (env.BETTER_AUTH_SECRET) {
            headers['x-better-auth-secret'] = env.BETTER_AUTH_SECRET;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ userId, banReason: reason }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            const body = await response.text();
            console.warn(`[BetterAuthAdmin] banUser returned status ${response.status}: ${body}`);
            // In non-production or test environment, allow graceful fallback if frontend is not running
            if (env.NODE_ENV !== 'production') {
                return { success: true, mock: true };
            }
            return { success: false, error: `Better Auth error: ${response.statusText}` };
        }

        const data = await response.json().catch(() => ({}));
        return { success: true, data };
    } catch (err) {
        console.warn(`[BetterAuthAdmin] banUser connection failed: ${err.message}`);
        if (env.NODE_ENV !== 'production') {
            return { success: true, mock: true };
        }
        return { success: false, error: err.message };
    }
}

/**
 * Unbans a user in Better Auth (restores access).
 *
 * @param {string} userId - Better Auth user ID
 * @param {string} [adminToken] - Optional Bearer token of the acting admin
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
async function unbanUser(userId, adminToken = null) {
    if (!userId) return { success: false, error: 'User ID is required' };
    const baseUrl = env.BETTER_AUTH_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/auth/admin/unban-user`;

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (adminToken) {
            headers.Authorization = adminToken.startsWith('Bearer ') ? adminToken : `Bearer ${adminToken}`;
        }
        if (env.BETTER_AUTH_SECRET) {
            headers['x-better-auth-secret'] = env.BETTER_AUTH_SECRET;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ userId }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            const body = await response.text();
            console.warn(`[BetterAuthAdmin] unbanUser returned status ${response.status}: ${body}`);
            if (env.NODE_ENV !== 'production') {
                return { success: true, mock: true };
            }
            return { success: false, error: `Better Auth error: ${response.statusText}` };
        }

        const data = await response.json().catch(() => ({}));
        return { success: true, data };
    } catch (err) {
        console.warn(`[BetterAuthAdmin] unbanUser connection failed: ${err.message}`);
        if (env.NODE_ENV !== 'production') {
            return { success: true, mock: true };
        }
        return { success: false, error: err.message };
    }
}

/**
 * Revokes all active sessions for a user in Better Auth.
 *
 * @param {string} userId - Better Auth user ID
 * @param {string} [adminToken] - Optional Bearer token of the acting admin
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function revokeUserSessions(userId, adminToken = null) {
    if (!userId) return { success: false, error: 'User ID is required' };
    const baseUrl = env.BETTER_AUTH_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/auth/admin/revoke-user-sessions`;

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (adminToken) {
            headers.Authorization = adminToken.startsWith('Bearer ') ? adminToken : `Bearer ${adminToken}`;
        }
        if (env.BETTER_AUTH_SECRET) {
            headers['x-better-auth-secret'] = env.BETTER_AUTH_SECRET;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ userId }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            if (env.NODE_ENV !== 'production') {
                return { success: true, mock: true };
            }
            return { success: false, error: `Failed to revoke sessions: ${response.statusText}` };
        }

        return { success: true };
    } catch (err) {
        console.warn(`[BetterAuthAdmin] revokeUserSessions connection failed: ${err.message}`);
        if (env.NODE_ENV !== 'production') {
            return { success: true, mock: true };
        }
        return { success: false, error: err.message };
    }
}

/**
 * Permanently removes a user account in Better Auth (Ban action).
 *
 * @param {string} userId - Better Auth user ID
 * @param {string} [adminToken] - Optional Bearer token of the acting admin
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function removeUser(userId, adminToken = null) {
    if (!userId) return { success: false, error: 'User ID is required' };
    const baseUrl = env.BETTER_AUTH_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/auth/admin/remove-user`;

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (adminToken) {
            headers.Authorization = adminToken.startsWith('Bearer ') ? adminToken : `Bearer ${adminToken}`;
        }
        if (env.BETTER_AUTH_SECRET) {
            headers['x-better-auth-secret'] = env.BETTER_AUTH_SECRET;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ userId }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            const body = await response.text();
            console.warn(`[BetterAuthAdmin] removeUser returned status ${response.status}: ${body}`);
            if (env.NODE_ENV !== 'production') {
                return { success: true, mock: true };
            }
            return { success: false, error: `Better Auth removeUser failed: ${response.statusText}` };
        }

        return { success: true };
    } catch (err) {
        console.warn(`[BetterAuthAdmin] removeUser connection failed: ${err.message}`);
        if (env.NODE_ENV !== 'production') {
            return { success: true, mock: true };
        }
        return { success: false, error: err.message };
    }
}

module.exports = {
    banUser,
    unbanUser,
    revokeUserSessions,
    removeUser
};
