"use client";

/**
 * Lightweight cross-feature synchronization for the authenticated user's
 * canonical data (profile + statistics).
 *
 * Features that change user-owned data (tweet create/delete, follow/unfollow,
 * profile update) emit `yoibi:profile-changed`; AuthContext listens and
 * refetches `/auth/me` — the single source of truth for the right-side user
 * card / sidebar — so no feature has to maintain duplicated count state.
 */
export const PROFILE_CHANGED_EVENT = "yoibi:profile-changed";

export function emitProfileChanged() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(PROFILE_CHANGED_EVENT));
    }
}
