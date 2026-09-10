/**
 * Feature-owned mock tweets data.
 * Shapes mirror POST /api/v1/tweets response envelopes.
 * Tweet != Post. Tweets are concise microblog with char limits, quote tweets, retweets, replies.
 */

/** @type {import('../types').Tweet[]} */
export const mockTweets = [
    {
        id: "tweet-1",
        author: {
            id: "user-2",
            name: "Priya Sharma",
            handle: "priyasharma",
            avatarUrl: null,
        },
        content: "Hot take: most 'news' sites are just vibes with SEO now. Yoibi is the only place I get real takes from real people 🔥",
        likesCount: 127,
        retweetCount: 34,
        repliesCount: 23,
        isRetweet: false,
        quoteTweet: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
        id: "tweet-2",
        author: {
            id: "user-4",
            name: "Sam Chen",
            handle: "samchen",
            avatarUrl: null,
        },
        content: "Free speech doesn't mean free of consequences, but it DOES mean you get to say what you think without a corporation deciding it's 'harmful'. That's Yoibi.",
        likesCount: 203,
        retweetCount: 89,
        repliesCount: 47,
        isRetweet: false,
        quoteTweet: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    {
        id: "tweet-3",
        author: {
            id: "user-5",
            name: "Maria Gonzalez",
            handle: "mariag",
            avatarUrl: null,
        },
        content: "Finally a platform where I can talk about actual politics without getting shadow-banned or put in 'time out' 👏",
        likesCount: 89,
        retweetCount: 21,
        repliesCount: 15,
        isRetweet: false,
        quoteTweet: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
    {
        id: "tweet-4",
        author: {
            id: "user-3",
            name: "Jordan Lee",
            handle: "jordanlee",
            avatarUrl: null,
        },
        content: "Just watched the most insane live stream debate on here. 500 people in the room, nobody cancelled. This is what the internet was supposed to be.",
        likesCount: 312,
        retweetCount: 104,
        repliesCount: 58,
        isRetweet: false,
        quoteTweet: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
];
