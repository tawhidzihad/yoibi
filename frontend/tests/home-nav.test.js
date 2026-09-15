import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Auth-aware home page header nav regression tests (static contract checks):
 *   - the logged-in state shows a single "Go to Feed" button -> /feed
 *   - the logged-out state keeps the existing "Sign in" + "Join Yoibi"
 *   - the loading state renders neither button (no wrong-button flash)
 *   - the nav reuses the existing AuthContext `useAuth()` mechanism
 *   - the home page delegates to the component instead of hardcoding buttons
 */

const ROOT = path.resolve(import.meta.dirname, "..");

function readSrc(relativePath) {
    return readFileSync(path.join(ROOT, "src", relativePath), "utf8");
}

describe("auth-aware home header nav", () => {
    const navSource = readSrc("features/auth/ui/HomeHeaderNav.js");
    const homeSource = readSrc("app/(public)/page.js");

    it("lives in the auth feature and reuses the existing AuthContext hook", () => {
        expect(navSource).toContain('"use client"');
        expect(navSource).toMatch(/useAuth\(\)/);
        expect(navSource).toMatch(/from "\.\.\/context\/AuthContext"/);
        // No new auth mechanism (no direct Better Auth client/session hook here).
        expect(navSource).not.toContain("useSession");
        expect(navSource).not.toContain("authClient");
    });

    it("logged-in state shows a single 'Go to Feed' button pointing at /feed", () => {
        const authenticatedBranch = navSource.slice(
            navSource.indexOf('status === "authenticated"'),
            navSource.indexOf('status === "loading"')
        );
        expect(authenticatedBranch).toContain("Go to Feed");
        expect(authenticatedBranch).toContain('href="/feed"');
        // The signed-in user never sees the sign-in / signup calls to action.
        expect(authenticatedBranch).not.toContain("Sign in");
        expect(authenticatedBranch).not.toContain("Join Yoibi");
    });

    it("loading state renders neither button set (no wrong-button flash)", () => {
        const loadingStart = navSource.indexOf('status === "loading"');
        const loggedOutStart = navSource.lastIndexOf("return (");
        const loadingBranch = navSource.slice(loadingStart, loggedOutStart);
        expect(loadingBranch).not.toContain("Sign in");
        expect(loadingBranch).not.toContain("Join Yoibi");
        expect(loadingBranch).not.toContain("Go to Feed");
        // Accessible status text while the session resolves.
        expect(loadingBranch).toContain("Checking session");
    });

    it("logged-out state preserves the existing 'Sign in' + 'Join Yoibi' buttons", () => {
        const loggedOutBranch = navSource.slice(navSource.lastIndexOf("return ("));
        expect(loggedOutBranch).toContain("Sign in");
        expect(loggedOutBranch).toContain('href="/login"');
        expect(loggedOutBranch).toContain("Join Yoibi");
        expect(loggedOutBranch).toContain('href="/signup"');
        expect(loggedOutBranch).not.toContain("Go to Feed");
    });

    it("home page delegates the header nav to the component", () => {
        expect(homeSource).toContain("HomeHeaderNav");
        expect(homeSource).toContain('from "../../features/auth/ui/HomeHeaderNav"');
        // The hardcoded public auth CTAs must not remain inline in the header.
        expect(homeSource).not.toContain("Join Yoibi");
    });
});
