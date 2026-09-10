const http = require("http");
const app = require("./app");
const { env, validateEnv } = require("./config/env");
const { connectDatabase, disconnectDatabase } = require("./config/db");
const { initMessagingSocket } = require("./sockets/messaging.socket");

// Validate critical environment
const { isValid, missing } = validateEnv();
if (!isValid) {
    console.error(`[Server] Critical missing environment configuration: ${missing.join(", ")}`);
    if (env.NODE_ENV === "production") {
        process.exit(1);
    }
}

const server = http.createServer(app);

// Attach Socket.IO to the existing HTTP listener
initMessagingSocket(server);

/**
 * Boots the server and required services.
 */
async function startServer() {
    // Attempt database connection
    await connectDatabase();

    const host = env.HOST;
    const port = env.PORT;

    server.listen(port, host, () => {
        console.log(`===========================================`);
        console.log(`  YOIBI Backend Service`);
        console.log(`  Environment: ${env.NODE_ENV}`);
        console.log(`  Listening on: http://${host}:${port}`);
        console.log(`  Health check: http://${host}:${port}/api/v1/health`);
        console.log(`===========================================`);
    });
}

/**
 * Handles graceful shutdown on SIGINT / SIGTERM.
 */
async function shutdown(signal) {
    console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);

    server.close(async() => {
        console.log("[Server] Closed HTTP listener.");
        try {
            await disconnectDatabase();
            console.log("[Server] Cleanup complete. Exiting.");
            process.exit(0);
        } catch (err) {
            console.error("[Server] Error during shutdown:", err.message);
            process.exit(1);
        }
    });

    // Force exit if hanging after 10s
    setTimeout(() => {
        console.error("[Server] Shutdown timed out. Forcing process exit.");
        process.exit(1);
    }, 10000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((error) => {
    console.error("[Server] Fatal error during startup:", error);
    process.exit(1);
});
