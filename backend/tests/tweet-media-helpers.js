const assert = require("assert");

/**
 * Shared helpers for the tweet image-upload contract tests (imported by
 * tweets.test.js so the main suite file stays readable).
 */
function fakeMediaItem(n) {
    return {
        uploadIntentId: `intent_tweetimg_test_${n}`,
        publicId: `yoibi/tweets/usr_test/intent_tweetimg_test_${n}`,
        url: `https://res.cloudinary.com/mock/image/upload/yoibi/tweets/usr_test/intent_tweetimg_test_${n}.jpg`
    };
}

async function assertRejectsForbidden(promise, message) {
    let rejected = false;
    try {
        await promise;
    } catch (err) {
        rejected = (err.statusCode === 403);
    }
    assert.strictEqual(rejected, true, message);
}

module.exports = { fakeMediaItem, assertRejectsForbidden };
