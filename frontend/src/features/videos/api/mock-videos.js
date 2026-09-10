/**
 * Feature-owned mock videos data.
 * Shapes mirror GET /api/v1/videos response envelopes.
 */

export const videoCategories = [
    { id: "politics",       label: "Politics",          icon: "Landmark"       },
    { id: "current-events", label: "Current Events",    icon: "Newspaper"      },
    { id: "learning",       label: "Learning",          icon: "BookOpen"       },
    { id: "governmental",   label: "Governmental Info", icon: "Building2"      },
    { id: "fun",            label: "Just Having Fun",   icon: "PartyPopper"    },
    { id: "conversations",  label: "Conversations",     icon: "MessageSquare"  },
    { id: "commentary",     label: "Commentary",        icon: "Mic"            },
    { id: "news",           label: "News",              icon: "Tv"             },
];

/** @type {import('../types').Video[]} */
export const mockVideos = [
    {
        id: "video-1",
        title: "The State of Free Speech Online in 2025",
        description: "A deep dive into platform censorship, alternative social media, and why more people are moving to open platforms.",
        thumbnailUrl: null,
        videoUrl: null,
        duration: 1842,
        viewsCount: 12400,
        likesCount: 892,
        category: "politics",
        author: { id: "user-1", name: "Alex Rivera", handle: "alexrivera", avatarUrl: null },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
        id: "video-2",
        title: "How to Start a Live Stream on Yoibi",
        description: "Step-by-step tutorial for going live and building your audience on Yoibi.",
        thumbnailUrl: null,
        videoUrl: null,
        duration: 420,
        viewsCount: 3200,
        likesCount: 210,
        category: "learning",
        author: { id: "user-3", name: "Jordan Lee", handle: "jordanlee", avatarUrl: null },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
        id: "video-3",
        title: "Breaking: Congressional Hearing Highlights",
        description: "Key moments from today's congressional hearing on social media regulation.",
        thumbnailUrl: null,
        videoUrl: null,
        duration: 600,
        viewsCount: 28000,
        likesCount: 1240,
        category: "news",
        author: { id: "user-6", name: "News Desk", handle: "newsdesk", avatarUrl: null },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
        id: "video-4",
        title: "Just Vibing: Compilation of the Week",
        description: "Funniest moments from across Yoibi this week. Pure fun, no agenda.",
        thumbnailUrl: null,
        videoUrl: null,
        duration: 780,
        viewsCount: 45000,
        likesCount: 3100,
        category: "fun",
        author: { id: "user-7", name: "Vibe Check", handle: "vibecheck", avatarUrl: null },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
];
