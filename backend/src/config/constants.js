const TWEET_MAX_LENGTH = 380;
const TWEET_MAX_MEDIA_COUNT = 5;

// Feed discovery — all tunable numbers in one place.
const FEED_DISCOVERY_EVERY = 4;           // After every 4 base tweets, insert 1 discovery tweet
const FEED_DISCOVERY_WINDOW_DAYS = 14;    // Discovery candidates from the last 14 days
const FEED_DISCOVERY_POOL_SIZE = 100;     // Max candidates fetched per bounded, indexed query
const FEED_OWN_PIN_MINUTES = 10;          // Pin own tweets from the last 10 min on page 1

module.exports = {
    TWEET_MAX_LENGTH,
    TWEET_MAX_MEDIA_COUNT,
    FEED_DISCOVERY_EVERY,
    FEED_DISCOVERY_WINDOW_DAYS,
    FEED_DISCOVERY_POOL_SIZE,
    FEED_OWN_PIN_MINUTES
};
