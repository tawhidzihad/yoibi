import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Handlers are built lazily on the first request so the Better Auth instance
// (and its required runtime environment variables) is never touched during
// the Next.js build's "collecting page data" phase.
let handlers = null;

function getHandlers() {
    if (!handlers) {
        handlers = toNextJsHandler(getAuth());
    }
    return handlers;
}

export async function GET(request) {
    return getHandlers().GET(request);
}

export async function POST(request) {
    return getHandlers().POST(request);
}
