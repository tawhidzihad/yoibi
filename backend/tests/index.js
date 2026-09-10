const { runFoundationTests } = require("./foundation.test");
const { runTweetsTests } = require("./tweets.test");
const { runVideosTests } = require("./videos.test");
const { runStreamsTests } = require("./streams.test");
const { runMeetupTests } = require("./meetup.test");
const { runMessagingTests } = require("./messaging.test");
const { runNotificationsTests } = require("./notifications.test");

async function main() {
    console.log("==================================================");
    console.log("       YOIBI BACKEND TEST SUITE RUNNER           ");
    console.log("==================================================\n");

    await runFoundationTests();
    console.log("\n--------------------------------------------------\n");
    await runTweetsTests();
    console.log("\n--------------------------------------------------\n");
    await runVideosTests();
    console.log("\n--------------------------------------------------\n");
    await runStreamsTests();
    console.log("\n--------------------------------------------------\n");
    await runMeetupTests();
    console.log("\n--------------------------------------------------\n");
    await runMessagingTests();
    console.log("\n--------------------------------------------------\n");
    await runNotificationsTests();

    console.log("\n==================================================");
    console.log("    ALL BACKEND TEST SUITES PASSED (100%)         ");
    console.log("==================================================");
}

main().catch((err) => {
    console.error("\n[TEST RUNNER FATAL ERROR]:", err);
    process.exit(1);
});

