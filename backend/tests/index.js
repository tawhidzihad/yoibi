// Test harness runs in deterministic unconfigured-database / unconfigured-
// external-services mode. These are pre-set BEFORE any app module loads, so
// dotenv (which never overrides existing process.env values) cannot inject
// local `backend/.env` credentials. The suite exercises services/repositories
// without live MongoDB, Cloudinary, or LiveKit connections; real network calls
// to unreachable third-party hosts would make tests slow and timing-flaky.
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = '';
process.env.CLOUDINARY_CLOUD_NAME = '';
process.env.CLOUDINARY_API_KEY = '';
process.env.CLOUDINARY_API_SECRET = '';
process.env.LIVEKIT_URL = '';
process.env.LIVEKIT_API_KEY = '';
process.env.LIVEKIT_API_SECRET = '';

const { runFoundationTests } = require("./foundation.test");
const { runAuthArchitectureTests } = require("./auth-architecture.test");
const { runUserProfileTests } = require("./users-profile.test");
const { runUserSearchTests } = require("./user-search.test");
const { runJwtTests } = require("./auth-jwt.test");
const { runTweetsTests } = require("./tweets.test");
const { runVideosTests } = require("./videos.test");
const { runStreamsTests } = require("./streams.test");
const { runMeetupTests } = require("./meetup.test");
const { runAdminTests } = require("./admin.test");

async function main() {
    console.log("==================================================");
    console.log("       YOIBI BACKEND TEST SUITE RUNNER           ");
    console.log("==================================================\n");

    await runFoundationTests();
    console.log("\n--------------------------------------------------\n");
    await runAuthArchitectureTests();
    console.log("\n--------------------------------------------------\n");
    await runUserProfileTests();
    await runUserSearchTests();
    console.log("\n--------------------------------------------------\n");
    await runJwtTests();
    console.log("\n--------------------------------------------------\n");
    await runTweetsTests();
    console.log("\n--------------------------------------------------\n");
    await runVideosTests();
    console.log("\n--------------------------------------------------\n");
    await runStreamsTests();
    console.log("\n--------------------------------------------------\n");
    await runMeetupTests();
    console.log("\n--------------------------------------------------\n");
    await runAdminTests();

    console.log("\n==================================================");
    console.log("    ALL BACKEND TEST SUITES PASSED (100%)         ");
    console.log("==================================================");
}

main().catch((err) => {
    console.error("\n[TEST RUNNER FATAL ERROR]:", err);
    process.exit(1);
});

