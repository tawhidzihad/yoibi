/**
 * Feature-owned mock feed data.
 * Shapes mirror API contract envelopes — swap for real API client in Phase 4 with zero UI refactoring.
 */

/** @type {import('../types').FeedItem[]} */
export const mockFeed = [
    {
        id: "feed-1",
        type: "post",
        author: {
            id: "user-1",
            name: "Alex Rivera",
            handle: "alexrivera",
            avatarUrl: null,
        },
        content: "Just published my first long-form post on here. The community vibe is unreal — people actually respond with substance. Love this place. 🙌",
        mediaUrls: [],
        likesCount: 42,
        commentsCount: 8,
        sharesCount: 5,
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
        id: "feed-2",
        type: "tweet",
        author: {
            id: "user-2",
            name: "Priya Sharma",
            handle: "priyasharma",
            avatarUrl: null,
        },
        content: "Hot take: most 'news' sites are just vibes with SEO now. Yoibi is the only place where I get real takes from real people 🔥",
        mediaUrls: [],
        likesCount: 127,
        commentsCount: 23,
        sharesCount: 34,
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
        id: "feed-3",
        type: "post",
        author: {
            id: "user-3",
            name: "Jordan Lee",
            handle: "jordanlee",
            avatarUrl: null,
        },
        content: "Had the most amazing live stream last night. 200+ people watching and the conversation was fire. Building something here feels different.",
        mediaUrls: [],
        likesCount: 89,
        commentsCount: 15,
        sharesCount: 12,
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
        id: "feed-4",
        type: "tweet",
        author: {
            id: "user-4",
            name: "Sam Chen",
            handle: "samchen",
            avatarUrl: null,
        },
        content: "Free speech doesn't mean free of consequences, but it DOES mean you get to say what you think without a corporation deciding it's 'harmful'. That's Yoibi.",
        mediaUrls: [],
        likesCount: 203,
        commentsCount: 47,
        sharesCount: 89,
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
];
