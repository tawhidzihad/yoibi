/**
 * Feature-owned mock users data.
 * Shapes mirror GET /api/v1/users/:id response envelopes.
 */

/** @type {import('../types').User[]} */
export const mockUsers = [
    {
        id: "user-1",
        name: "Alex Rivera",
        handle: "alexrivera",
        bio: "Journalist. Free speech advocate. Yoibi early adopter. 📡",
        avatarUrl: null,
        postsCount: 42,
        followersCount: 1240,
        followingCount: 387,
        joinedAt: "2025-01-15T00:00:00.000Z",
        isFollowing: false,
    },
    {
        id: "user-2",
        name: "Priya Sharma",
        handle: "priyasharma",
        bio: "Software engineer. Politics nerd. Coffee enthusiast. ☕",
        avatarUrl: null,
        postsCount: 28,
        followersCount: 890,
        followingCount: 234,
        joinedAt: "2025-02-01T00:00:00.000Z",
        isFollowing: false,
    },
    {
        id: "user-3",
        name: "Jordan Lee",
        handle: "jordanlee",
        bio: "Streamer. Entrepreneur. I make things and talk about it live. 🚀",
        avatarUrl: null,
        postsCount: 67,
        followersCount: 5400,
        followingCount: 112,
        joinedAt: "2025-01-28T00:00:00.000Z",
        isFollowing: true,
    },
];

/** @returns {import('../types').User | null} */
export function getMockUserByHandle(handle) {
    return mockUsers.find((u) => u.handle === handle) ?? null;
}
