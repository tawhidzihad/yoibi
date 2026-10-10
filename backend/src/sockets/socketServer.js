const { Server } = require("socket.io");
const { verifyJwtToken } = require("../middleware/auth");
const { env } = require("../config/env");
const messagesService = require("../services/messages.service");
const presenceService = require("../services/presence.service");
const conversationsRepository = require("../repositories/conversations.repository");
const { TYPING_TIMEOUT_MS } = require("../config/constants");

let io = null;
const typingTimers = new Map(); // key: `${conversationId}:${userId}` -> NodeJS.Timeout

/**
 * Initializes the Socket.IO server and binds it to the HTTP server instance.
 */
function initSocketServer(httpServer) {
    const allowedOrigins = [
        env.FRONTEND_URL,
        env.CORS_ORIGIN
    ].filter(Boolean);

    io = new Server(httpServer, {
        path: "/socket.io",
        cors: {
            origin: function(origin, callback) {
                if (!origin) return callback(null, true);
                if (env.NODE_ENV === "development") {
                    if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
                        return callback(null, true);
                    }
                }
                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                return callback(new Error(`CORS policy blocked socket connection from: ${origin}`));
            },
            credentials: true
        },
        transports: ["websocket", "polling"],
        pingTimeout: 20000,
        pingInterval: 25000
    });

    // Handshake Authentication Middleware
    io.use(async(socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization;

            if (!token) {
                const err = new Error("Authentication token required for realtime connection.");
                err.data = { code: "UNAUTHORIZED" };
                return next(err);
            }

            const cleanToken = typeof token === "string" && token.startsWith("Bearer ")
                ? token.substring(7).trim()
                : token;

            const user = await verifyJwtToken(cleanToken);

            if (user.isBlocked) {
                const err = new Error("Your account has been suspended by an administrator.");
                err.data = { code: "ACCOUNT_BLOCKED" };
                return next(err);
            }

            if (env.EMAIL_VERIFICATION_REQUIRED === "true" && !user.emailVerified) {
                const err = new Error("Please verify your email address to connect.");
                err.data = { code: "EMAIL_NOT_VERIFIED" };
                return next(err);
            }

            socket.user = user;
            return next();
        } catch (authError) {
            const isExpired = authError.code === "TOKEN_EXPIRED";
            const code = authError.code || (isExpired ? "TOKEN_EXPIRED" : "INVALID_TOKEN");
            const err = new Error(authError.message || "Authentication verification failed.");
            err.data = { code };
            return next(err);
        }
    });

    io.on("connection", async(socket) => {
        const user = socket.user;
        const userId = user.id;

        // Register user socket in user room (supports multiple tabs per user)
        socket.join(`user:${userId}`);
        const isFirstConnection = presenceService.addConnection(userId, socket.id);

        if (isFirstConnection) {
            // Broadcast presence to all users sharing active conversations
            socket.broadcast.emit("presence:update", {
                userId,
                isOnline: true
            });
        }

        // Join active conversation room
        socket.on("conversation:join", async({ conversationId }, ack) => {
            try {
                if (!conversationId) return ack && ack({ success: false, error: "conversationId required" });
                const conv = await conversationsRepository.findById(conversationId);
                if (!conv || !conv.participants.includes(userId)) {
                    return ack && ack({ success: false, error: "Not authorized for this conversation" });
                }

                socket.join(`conversation:${conversationId}`);
                if (ack) ack({ success: true, conversationId });
            } catch (err) {
                if (ack) ack({ success: false, error: err.message });
            }
        });

        // Leave conversation room
        socket.on("conversation:leave", ({ conversationId }, ack) => {
            try {
                if (conversationId) {
                    socket.leave(`conversation:${conversationId}`);
                    clearTypingState(conversationId, userId);
                }
                if (ack) ack({ success: true });
            } catch {
                if (ack) ack({ success: true });
            }
        });

        // Send direct message
        socket.on("message:send", async(payload, ack) => {
            try {
                const {
                    conversationId,
                    clientMessageId,
                    type = "text",
                    text = "",
                    media = null,
                    uploadIntentId = null
                } = payload || {};

                if (!conversationId || !clientMessageId) {
                    const errorResp = { code: "INVALID_PAYLOAD", message: "conversationId and clientMessageId required" };
                    socket.emit("message:error", { clientMessageId, ...errorResp });
                    if (ack) ack({ success: false, error: errorResp });
                    return;
                }

                const result = await messagesService.sendMessage({
                    conversationId,
                    userId,
                    clientMessageId,
                    type,
                    text,
                    media,
                    uploadIntentId
                });

                const { message, conversation, recipientId, isDuplicate } = result;

                // Clear typing indicator for sender
                clearTypingState(conversationId, userId);

                // Acknowledge to sender
                socket.emit("message:sent", {
                    message,
                    clientMessageId
                });

                if (!isDuplicate && recipientId) {
                    // Send to recipient's connected sockets
                    io.to(`user:${recipientId}`).emit("message:new", {
                        message,
                        conversation
                    });

                    // Update conversation summary on recipient
                    io.to(`user:${recipientId}`).emit("conversation:updated", {
                        conversation
                    });
                }

                // Update sender conversation summary
                socket.emit("conversation:updated", {
                    conversation
                });

                if (ack) ack({ success: true, data: message });
            } catch (err) {
                const code = err.code || "SEND_FAILED";
                const message = err.message || "Failed to send message.";
                socket.emit("message:error", {
                    clientMessageId: payload?.clientMessageId,
                    code,
                    message
                });
                if (ack) ack({ success: false, error: { code, message } });
            }
        });

        // Delivery receipt acknowledge
        socket.on("message:delivered", async({ conversationId, messageIds }, ack) => {
            try {
                if (!conversationId) return;
                const result = await messagesService.markDelivered({
                    conversationId,
                    userId,
                    messageIds
                });

                if (result.modifiedCount > 0) {
                    io.to(`conversation:${conversationId}`).emit("message:status", {
                        conversationId,
                        status: "delivered",
                        messageIds,
                        timestamp: result.deliveredAt,
                        userId
                    });
                }

                if (ack) ack({ success: true });
            } catch (err) {
                if (ack) ack({ success: false, error: err.message });
            }
        });

        // Read receipt acknowledge
        socket.on("message:read", async({ conversationId, messageIds }, ack) => {
            try {
                if (!conversationId) return;
                const { conversation, totalUnread } = await messagesService.markRead({
                    conversationId,
                    userId,
                    messageIds
                });

                const timestamp = new Date();

                // Notify both participants in conversation of read status
                io.to(`conversation:${conversationId}`).emit("message:status", {
                    conversationId,
                    status: "read",
                    messageIds,
                    timestamp,
                    userId
                });

                // Update unread count for reader
                io.to(`user:${userId}`).emit("unread:update", {
                    conversationId,
                    unreadCount: 0,
                    totalUnread
                });

                io.to(`user:${userId}`).emit("conversation:updated", {
                    conversation
                });

                if (ack) ack({ success: true, totalUnread });
            } catch (err) {
                if (ack) ack({ success: false, error: err.message });
            }
        });

        // Typing start indicator
        socket.on("typing:start", async({ conversationId }, ack) => {
            try {
                if (!conversationId) return;
                const conv = await conversationsRepository.findById(conversationId);
                if (!conv || !conv.participants.includes(userId)) return;

                // Broadcast to conversation room (excluding the typing sender)
                socket.to(`conversation:${conversationId}`).emit("typing:update", {
                    conversationId,
                    userId,
                    isTyping: true
                });

                // Set/renew auto-expiry timer
                const timerKey = `${conversationId}:${userId}`;
                if (typingTimers.has(timerKey)) {
                    clearTimeout(typingTimers.get(timerKey));
                }

                const timer = setTimeout(() => {
                    typingTimers.delete(timerKey);
                    io.to(`conversation:${conversationId}`).emit("typing:update", {
                        conversationId,
                        userId,
                        isTyping: false
                    });
                }, TYPING_TIMEOUT_MS);

                typingTimers.set(timerKey, timer);

                if (ack) ack({ success: true });
            } catch {
                if (ack) ack({ success: false });
            }
        });

        // Typing stop indicator
        socket.on("typing:stop", ({ conversationId }, ack) => {
            try {
                if (conversationId) {
                    clearTypingState(conversationId, userId);
                }
                if (ack) ack({ success: true });
            } catch {
                if (ack) ack({ success: false });
            }
        });

        // Presence sync on initial mount / reload
        socket.on("presence:sync", ({ userIds }, ack) => {
            try {
                const statuses = presenceService.getOnlineStatuses(userIds);
                if (ack) ack({ success: true, data: statuses });
            } catch (err) {
                if (ack) ack({ success: false, error: err.message });
            }
        });

        // Disconnect
        socket.on("disconnect", () => {
            const { wasLast } = presenceService.removeConnection(socket.id);

            // Clear all typing states for this user
            for (const [key, timer] of typingTimers.entries()) {
                if (key.endsWith(`:${userId}`)) {
                    clearTimeout(timer);
                    typingTimers.delete(key);
                    const convId = key.split(":")[0];
                    io.to(`conversation:${convId}`).emit("typing:update", {
                        conversationId: convId,
                        userId,
                        isTyping: false
                    });
                }
            }

            if (wasLast) {
                // Broadcast offline presence
                socket.broadcast.emit("presence:update", {
                    userId,
                    isOnline: false
                });
            }
        });
    });

    return io;
}

/**
 * Clears typing timer and broadcasts isTyping: false.
 */
function clearTypingState(conversationId, userId) {
    const timerKey = `${conversationId}:${userId}`;
    if (typingTimers.has(timerKey)) {
        clearTimeout(typingTimers.get(timerKey));
        typingTimers.delete(timerKey);
    }
    if (io) {
        io.to(`conversation:${conversationId}`).emit("typing:update", {
            conversationId,
            userId,
            isTyping: false
        });
    }
}

/**
 * Force-disconnects all sockets for a user (called when admin bans/blocks user).
 */
function disconnectUserSockets(userId, reason = "Account suspended") {
    if (!io || !userId) return;
    const socketIds = presenceService.getUserSockets(userId);
    for (const sid of socketIds) {
        const s = io.sockets.sockets.get(sid);
        if (s) {
            s.emit("auth:force_disconnect", { reason });
            s.disconnect(true);
        }
    }
}

function getIO() {
    return io;
}

module.exports = {
    initSocketServer,
    getIO,
    disconnectUserSockets
};
