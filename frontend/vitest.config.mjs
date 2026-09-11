import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Vitest configuration for frontend unit tests.
 * Mirrors the Next.js "@" path alias so tests can import app modules directly.
 */
export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.js"],
    },
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "src"),
        },
    },
});
