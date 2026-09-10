/**
 * Feature-owned mock posts data.
 * Shapes mirror POST /api/v1/posts response envelopes.
 * Post != Tweet. Posts are long-form with media attachments and threaded comments.
 */

/** @type {import('../types').Post[]} */
export const mockPosts = [
    {
        id: "post-1",
        author: {
            id: "user-1",
            name: "Alex Rivera",
            handle: "alexrivera",
            avatarUrl: null,
        },
        content: "The media landscape is broken. Not because of 'misinformation' — but because the gatekeepers decided their job was to control what you believe rather than report what happened.\n\nYoibi exists because people deserve a place to actually talk. This is my corner. What's yours?",
        mediaUrls: [],
        commentsCount: 14,
        likesCount: 56,
        sharesCount: 8,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        comments: [
            {
                id: "comment-1-1",
                author: { id: "user-2", name: "Priya Sharma", handle: "priyasharma", avatarUrl: null },
                content: "100% this. The trust in legacy media is at an all-time low for a reason.",
                likesCount: 12,
                createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
            },
        ],
    },
    {
        id: "post-2",
        author: {
            id: "user-3",
            name: "Jordan Lee",
            handle: "jordanlee",
            avatarUrl: null,
        },
        content: "I streamed for 3 hours last night and the conversation never stopped. Political debates, memes, random life advice. That's what community looks like.\n\nIf you're not using the Meet Up rooms yet, you're sleeping on the best feature here.",
        mediaUrls: [],
        commentsCount: 7,
        likesCount: 33,
        sharesCount: 4,
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        comments: [],
    },
];

/** @type {import('../types').Post[]} */
export const mockPostComments = [];
