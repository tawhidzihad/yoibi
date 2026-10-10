const TWEET_MAX_LENGTH = 380;
const TWEET_MAX_MEDIA_COUNT = 5;

// Feed discovery — all tunable numbers in one place.
const FEED_DISCOVERY_EVERY = 4;           // After every 4 base tweets, insert 1 discovery tweet
const FEED_DISCOVERY_WINDOW_DAYS = 14;    // Discovery candidates from the last 14 days
const FEED_DISCOVERY_POOL_SIZE = 100;     // Max candidates fetched per bounded, indexed query
const FEED_OWN_PIN_MINUTES = 10;          // Pin own tweets from the last 10 min on page 1

// Direct Messaging limits & configuration
const MESSAGE_TEXT_MAX_LENGTH = 2000;
const MESSAGE_IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MESSAGE_VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const MESSAGE_ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
];
const MESSAGE_ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime"
];
const MESSAGE_HISTORY_PAGE_SIZE = 30;
const TYPING_TIMEOUT_MS = 3000;

module.exports = {
    TWEET_MAX_LENGTH,
    TWEET_MAX_MEDIA_COUNT,
    FEED_DISCOVERY_EVERY,
    FEED_DISCOVERY_WINDOW_DAYS,
    FEED_DISCOVERY_POOL_SIZE,
    FEED_OWN_PIN_MINUTES,
    MESSAGE_TEXT_MAX_LENGTH,
    MESSAGE_IMAGE_MAX_BYTES,
    MESSAGE_VIDEO_MAX_BYTES,
    MESSAGE_ALLOWED_IMAGE_TYPES,
    MESSAGE_ALLOWED_VIDEO_TYPES,
    MESSAGE_HISTORY_PAGE_SIZE,
    TYPING_TIMEOUT_MS
};

