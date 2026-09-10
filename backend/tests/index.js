const { runFoundationTests } = require("./foundation.test");
const { runTweetsTests } = require("./tweets.test");

async function main() {
    console.log("==================================================");
    console.log("       YOIBI BACKEND TEST SUITE RUNNER           ");
    console.log("==================================================\n");

    await runFoundationTests();
    console.log("\n--------------------------------------------------\n");
    await runTweetsTests();

    console.log("\n==================================================");
    console.log("    ALL BACKEND TEST SUITES PASSED (100%)         ");
    console.log("==================================================");
}

main().catch((err) => {
    console.error("\n[TEST RUNNER FATAL ERROR]:", err);
    process.exit(1);
});

