import { io } from "socket.io-client";
import { getJwtToken } from "@/lib/api/client";

let socketInstance = null;
let connectionListeners = new Set();
let currentStatus = "disconnected"; // "connected" | "connecting" | "reconnecting" | "disconnected"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ||
    (process.env.NEXT_PUBLIC_API_BASE_URL
        ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api\/v1\/?$/, "")
        : "http://localhost:5000");

function updateStatus(newStatus) {
    currentStatus = newStatus;
    connectionListeners.forEach((listener) => {
        try {
            listener(newStatus);
        } catch (e) {
            console.warn("[SocketClient] Error in status listener:", e);
        }
    });
}

/**
 * Returns the singleton Socket.IO client.
 * Connects automatically only if user is logged in and email verified.
 */
export function getSocket() {
    if (socketInstance) {
        return socketInstance;
    }

    updateStatus("connecting");

    socketInstance = io(SOCKET_URL, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        // Handshake auth as a function so every reconnect fetches a fresh JWT!
        auth: async(cb) => {
            try {
                const token = await getJwtToken();
                cb({ token });
            } catch {
                cb({ token: "" });
            }
        }
    });

    socketInstance.on("connect", () => {
        updateStatus("connected");
    });

    socketInstance.on("disconnect", (reason) => {
        if (reason === "io server disconnect") {
            // Server disconnected socket (e.g. auth failed / banned)
            updateStatus("disconnected");
        } else {
            updateStatus("reconnecting");
        }
    });

    socketInstance.on("connect_error", () => {
        updateStatus("reconnecting");
    });

    socketInstance.on("reconnect", () => {
        updateStatus("connected");
    });

    socketInstance.on("reconnect_attempt", () => {
        updateStatus("reconnecting");
    });

    socketInstance.on("auth:force_disconnect", ({ reason }) => {
        console.warn("[SocketClient] Force disconnected by server:", reason);
        disconnectSocket();
    });

    return socketInstance;
}

/**
 * Subscribes to socket connection status changes.
 * Returns unsubscribe function.
 */
export function subscribeConnectionStatus(callback) {
    connectionListeners.add(callback);
    callback(currentStatus);
    return () => {
        connectionListeners.delete(callback);
    };
}

/**
 * Returns current connection status.
 */
export function getConnectionStatus() {
    return currentStatus;
}

/**
 * Gracefully disconnects and resets the socket singleton.
 */
export function disconnectSocket() {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
    updateStatus("disconnected");
}
