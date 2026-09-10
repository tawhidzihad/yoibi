/**
 * Feature-owned mock streams data.
 * Shapes mirror GET /api/v1/streams response envelopes.
 */

/** @type {import('../types').Stream[]} */
export const mockStreams = [
    {
        id: "stream-1",
        title: "LIVE: Debating Media Censorship with Callers",
        description: "Open debate — call in and share your take on free speech online.",
        thumbnailUrl: null,
        viewerCount: 342,
        isLive: true,
        author: { id: "user-1", name: "Alex Rivera", handle: "alexrivera", avatarUrl: null },
        startedAt: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
        category: "politics",
    },
    {
        id: "stream-2",
        title: "Late Night Chill: Music & Gaming",
        description: "Hanging out, playing some indie games, taking requests.",
        thumbnailUrl: null,
        viewerCount: 89,
        isLive: true,
        author: { id: "user-7", name: "Vibe Check", handle: "vibecheck", avatarUrl: null },
        startedAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
        category: "fun",
    },
    {
        id: "stream-3",
        title: "Q&A: Starting Your Own Business in 2025",
        description: "Ask me anything about entrepreneurship, bootstrapping, and building an audience.",
        thumbnailUrl: null,
        viewerCount: 215,
        isLive: true,
        author: { id: "user-3", name: "Jordan Lee", handle: "jordanlee", avatarUrl: null },
        startedAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
        category: "learning",
    },
];
