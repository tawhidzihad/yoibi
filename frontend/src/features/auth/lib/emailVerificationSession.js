/**
 * Per-tab record that this browser session has already completed email
 * verification.
 *
 * Why this exists: the /verify-email page auto-sends a code on mount. After a
 * successful verification the app navigates to /feed, but any bounce back to
 * /verify-email (e.g. a route guard re-evaluating before the auth context has
 * refreshed) would remount the page and fire that auto-send a second time,
 * emailing the user a duplicate code they no longer need.
 *
 * sessionStorage (not a module-scoped variable) is deliberate: it survives the
 * unmount/remount that a router bounce causes, which is exactly the case we
 * need to suppress, while a fresh page load in a new tab starts clean.
 *
 * It is cleared on sign-out so the next account to sign in on this tab still
 * receives its own code.
 */

const KEY = "yoibi:email-verification-completed";

/**
 * Marks email verification as completed for this browser tab.
 */
export function markEmailVerificationCompleted() {
    if (typeof window === "undefined") return;
    try {
        window.sessionStorage.setItem(KEY, "1");
    } catch {
        // Private-mode / storage-disabled browsers: degrade to the normal
        // behaviour rather than breaking verification.
    }
}

/**
 * @returns {boolean} True if this tab has already completed verification.
 */
export function isEmailVerificationCompleted() {
    if (typeof window === "undefined") return false;
    try {
        return window.sessionStorage.getItem(KEY) === "1";
    } catch {
        return false;
    }
}

/**
 * Clears the flag — call on sign-out so the next user on this tab can receive
 * a fresh code.
 */
export function clearEmailVerificationCompleted() {
    if (typeof window === "undefined") return;
    try {
        window.sessionStorage.removeItem(KEY);
    } catch {
        // Best-effort only.
    }
}
