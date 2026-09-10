const tweetsRepository = require("../../repositories/tweets.repository");

/**
 * Service: List paginated top-level feed tweets
 */
async function listTweets({ page = 1, limit = 20, _filter = "all", currentUserId = null }) {
    const skip = (page - 1) * limit;

    const [rawTweets, totalItems] = await Promise.all([
        tweetsRepository.findPaginated({ skip, limit }),
        tweetsRepository.count({})
    ]);

    const enrichedTweets = await tweetsRepository.attachAuthors(rawTweets);

    const items = enrichedTweets.map((tweet) => {
        const liked = Boolean(currentUserId && Array.isArray(tweet.likes) && tweet.likes.includes(currentUserId));
        const retweeted = Boolean(currentUserId && Array.isArray(tweet.retweets) && tweet.retweets.includes(currentUserId));
        const formatted = { ...tweet, liked, retweeted };
        delete formatted.likes;
        delete formatted.retweets;
        return formatted;
    });

    const totalPages = Math.ceil(totalItems / limit) || 1;
    const hasNextPage = page < totalPages;

    return {
        items,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage
        }
    };
}

/**
 * Service: Get single tweet by ID with its replies
 */
async function getTweetById({ id, currentUserId = null }) {
    const rawTweet = await tweetsRepository.findById(id);
    if (!rawTweet) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Tweet not found" };
    }

    const enriched = await tweetsRepository.attachAuthors(rawTweet);
    const rawReplies = await tweetsRepository.findReplies(id);
    const enrichedReplies = await tweetsRepository.attachAuthors(rawReplies);

    const liked = Boolean(currentUserId && Array.isArray(rawTweet.likes) && rawTweet.likes.includes(currentUserId));
    const retweeted = Boolean(currentUserId && Array.isArray(rawTweet.retweets) && rawTweet.retweets.includes(currentUserId));

    const replies = enrichedReplies.map((r) => {
        const replyLiked = Boolean(currentUserId && Array.isArray(r.likes) && r.likes.includes(currentUserId));
        const replyRetweeted = Boolean(currentUserId && Array.isArray(r.retweets) && r.retweets.includes(currentUserId));
        const copy = { ...r, liked: replyLiked, retweeted: replyRetweeted };
        delete copy.likes;
        delete copy.retweets;
        return copy;
    });

    const result = {
        ...enriched,
        replies,
        liked,
        retweeted
    };
    delete result.likes;
    delete result.retweets;

    return result;
}

/**
 * Service: Get replies for a tweet
 */
async function getReplies({ tweetId, currentUserId = null }) {
    const rawReplies = await tweetsRepository.findReplies(tweetId);
    const enrichedReplies = await tweetsRepository.attachAuthors(rawReplies);

    const items = enrichedReplies.map((r) => {
        const liked = Boolean(currentUserId && Array.isArray(r.likes) && r.likes.includes(currentUserId));
        const retweeted = Boolean(currentUserId && Array.isArray(r.retweets) && r.retweets.includes(currentUserId));
        const copy = { ...r, liked, retweeted };
        delete copy.likes;
        delete copy.retweets;
        return copy;
    });

    return { items };
}

module.exports = {
    listTweets,
    getTweetById,
    getReplies
};
