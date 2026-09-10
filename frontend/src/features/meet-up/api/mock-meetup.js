/**
 * Feature-owned mock meet-up rooms data.
 * Shapes mirror GET /api/v1/rooms response envelopes.
 */

/** @type {import('../types').Room[]} */
export const mockRooms = [
    {
        id: "room-1",
        name: "Political Discussion Room",
        topic: "politics",
        participants: [
            { id: "user-1", name: "Alex Rivera", handle: "alexrivera", avatarUrl: null },
            { id: "user-2", name: "Priya Sharma", handle: "priyasharma", avatarUrl: null },
            { id: "user-4", name: "Sam Chen", handle: "samchen", avatarUrl: null },
        ],
        maxParticipants: 10,
        isLive: true,
        host: { id: "user-1", name: "Alex Rivera", handle: "alexrivera", avatarUrl: null },
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
        id: "room-2",
        name: "Tech & Innovation Chat",
        topic: "learning",
        participants: [
            { id: "user-3", name: "Jordan Lee", handle: "jordanlee", avatarUrl: null },
            { id: "user-5", name: "Maria Gonzalez", handle: "mariag", avatarUrl: null },
        ],
        maxParticipants: 8,
        isLive: true,
        host: { id: "user-3", name: "Jordan Lee", handle: "jordanlee", avatarUrl: null },
        createdAt: new Date(Date.now() - 1000 * 60 * 62).toISOString(),
    },
    {
        id: "room-3",
        name: "Music & Chill Lounge",
        topic: "fun",
        participants: [
            { id: "user-7", name: "Vibe Check", handle: "vibecheck", avatarUrl: null },
        ],
        maxParticipants: 6,
        isLive: true,
        host: { id: "user-7", name: "Vibe Check", handle: "vibecheck", avatarUrl: null },
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
];
