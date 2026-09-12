import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * User Profile System frontend regression tests (static contract checks):
 *   - /wall references are gone (sidebar, dock, tweet author)
 *   - the right-side card links to /profile/{handle} ("View My Profile")
 *   - the right-side card no longer contains Sign Out
 *   - /profile/[username] dynamic route exists
 *   - profile feature uses the backend API (no mock/static data)
 *   - edit profile supports avatar + banner uploads via server signatures
 *   - server-controlled fields are never sent by the edit form
 */

const ROOT = path.resolve(import.meta.dirname, "..");

function readSrc(relativePath) {
    return readFileSync(path.join(ROOT, "src", relativePath), "utf8");
}

describe("sidebar & navigation cleanup", () => {
    const layoutSource = readSrc("app/(protected)/layout.js");

    it("removes 'My Wall' from the left sidebar and mobile dock", () => {
        expect(layoutSource).not.toMatch(/href: "\/wall"/);
        expect(layoutSource).not.toContain("My Wall");
    });

    it("keeps the remaining sidebar items (natural reflow, no empty slot)", () => {
        expect(layoutSource).toContain('label: "Feed"');
        expect(layoutSource).toContain('label: "Tweets"');
        expect(layoutSource).toContain('label: "Videos"');
        expect(layoutSource).toContain('label: "Streams"');
        expect(layoutSource).toContain("Sign Out");
    });

    it("right-side card shows 'My Profile' linked to /profile/{handle}", () => {
        expect(layoutSource).toContain("My Profile");
        expect(layoutSource).toMatch(/`\/profile\/\$\{profileHandle\}`/);
    });

    it("right-side card no longer contains Sign Out (single logout in sidebar)", () => {
        expect(layoutSource).toContain("Sign Out"); // left sidebar still has it
        const rightPanelEnd = layoutSource.indexOf("export default function ProtectedLayout");
        const rightPanelSection = layoutSource.slice(layoutSource.indexOf("function RightPanel"), rightPanelEnd);
        expect(rightPanelSection).not.toContain("Sign Out");
        expect(rightPanelSection).not.toContain("onLogout");
    });
});

describe("author identity profile links", () => {
    it("TweetCard navigates to /profile/{handle} (not /wall)", () => {
        const tweetCard = readSrc("features/tweets/ui/TweetCard.js");
        expect(tweetCard).toContain("router.push(`/profile/${cleanHandle}`)");
        expect(tweetCard).not.toMatch(/\/wall/);
    });

    it("VideoCard author row links to /profile/{handle}", () => {
        const videoCard = readSrc("features/videos/ui/VideoCard.js");
        expect(videoCard).toContain('href={`/profile/${(video.author?.handle || "member").replace(/^@/, "")}`');
    });

    it("StreamCard author identity links to /profile/{handle}", () => {
        const streamCard = readSrc("features/streams/ui/StreamCard.js");
        expect(streamCard).toContain('href={`/profile/${(stream.author?.handle || "broadcaster").replace(/^@/, "")}`');
    });
});

describe("dynamic profile route", () => {
    it("creates /profile/[username]/page.js (dynamic, never static)", () => {
        expect(existsSync(path.join(ROOT, "src/app/(protected)/profile/[username]/page.js"))).toBe(true);
        expect(existsSync(path.join(ROOT, "src/app/(protected)/profile/page.js"))).toBe(false);
    });

    it("does not use a static /wall page", () => {
        expect(existsSync(path.join(ROOT, "src/app/(protected)/wall/page.js"))).toBe(false);
    });
});

describe("profile feature loads real backend data", () => {
    it("ProfileView fetches the backend profile by the URL handle", () => {
        const profileView = readSrc("features/profile/ui/ProfileView.js");
        expect(profileView).toContain("profileApi.getProfile(username)");
        expect(profileView).not.toMatch(/mock|fixture|dummy/);
    });

    it("profile API targets GET /users/:handle and PATCH /users/me", () => {
        const profileApi = readSrc("features/profile/api/profileApi.js");
        expect(profileApi).toContain('apiClient.get(`/users/${encodeURIComponent(String(handle).replace(/^@/, ""))}`)');
        expect(profileApi).toContain('apiClient.patch("/users/me", data)');
        expect(profileApi).toContain('apiClient.post("/users/me/upload-signature", { kind })');
    });

    it("tweets tab filters server-side by authorHandle", () => {
        const contentSource = readSrc("features/profile/ui/ProfileContent.js");
        expect(contentSource).toContain("authorHandle: profile.handle");
        const tweetsApiSource = readSrc("features/tweets/api/tweetsApi.js");
        expect(tweetsApiSource).toContain('params.set("authorHandle"');
    });

    it("videos and streams tabs filter by canonical authorId", () => {
        const contentSource = readSrc("features/profile/ui/ProfileContent.js");
        expect(contentSource).toContain("authorId: profile.id");
        expect(contentSource).toContain('status: "all"');
    });
});

describe("dedicated edit profile page (/settings/profile)", () => {
    const pageSource = readSrc("features/profile/ui/EditProfilePage.js");

    it("exposes avatar + banner pickers and a country selector", () => {
        expect(pageSource).toContain('<ImagePicker kind="avatar"');
        expect(pageSource).toContain('<ImagePicker kind="banner"');
        expect(pageSource).toContain("COUNTRIES.map");
    });

    it("shows the username read-only — never editable", () => {
        expect(pageSource).toContain("Your username cannot be changed.");
        expect(pageSource).toContain("readOnly");
        // Username is intentionally NOT sent on save (no handle updates here).
        expect(pageSource).not.toMatch(/\bhandle:/);
    });

    it("sends only editable fields — never role, IDs or block state", () => {
        expect(pageSource).toContain("bannerUrl,");
        expect(pageSource).not.toContain("betterAuthUserId");
        expect(pageSource).not.toMatch(/\brole:/);
        expect(pageSource).not.toMatch(/\buserId\b/);
        expect(pageSource).not.toMatch(/isBlocked/);
    });

    it("replaces the modal: ProfileView navigates to /settings/profile", () => {
        const profileView = readSrc("features/profile/ui/ProfileView.js");
        expect(profileView).toContain('router.push("/settings/profile")');
        expect(profileView).not.toContain("EditProfileModal");
        expect(existsSync(path.join(ROOT, "src/app/(protected)/settings/profile/page.js"))).toBe(true);
    });

    it("has proper loading, saving, success and error states", () => {
        expect(pageSource).toContain("isSaving");
        expect(pageSource).toContain("saveSuccess");
        expect(pageSource).toContain("Save Changes");
        expect(pageSource).toContain("Cancel");
        expect(pageSource).toContain("role=\"alert\"");
        expect(pageSource).toContain("role=\"status\"");
    });
});

describe("sidebar stats synchronization", () => {
    it("uses a single canonical sync event instead of duplicated state", () => {
        const syncSource = readSrc("lib/profileSync.js");
        expect(syncSource).toContain("PROFILE_CHANGED_EVENT");
        const authContext = readSrc("features/auth/context/AuthContext.js");
        expect(authContext).toContain("PROFILE_CHANGED_EVENT");
    });

    it("follow/unfollow emits the sync event", () => {
        const follows = readSrc("lib/api/follows.js");
        expect(follows).toContain("emitProfileChanged()");
    });

    it("tweet create/delete emit the sync event", () => {
        expect(readSrc("features/tweets/ui/CreateTweetCard.js")).toContain("emitProfileChanged()");
        expect(readSrc("features/tweets/ui/TweetCard.js")).toContain("emitProfileChanged()");
    });

    it("profile save emits the sync event", () => {
        expect(readSrc("features/profile/ui/EditProfilePage.js")).toContain("emitProfileChanged()");
    });
});

describe("legacy wall feature removal", () => {
    it("removes the legacy WallView and old EditProfileModal from users feature", () => {
        expect(existsSync(path.join(ROOT, "src/features/users/ui/WallView.js"))).toBe(false);
        expect(existsSync(path.join(ROOT, "src/features/users/ui/EditProfileModal.js"))).toBe(false);
    });
});