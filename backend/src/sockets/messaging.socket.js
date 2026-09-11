const { Server } = require('socket.io');
const { verifyJwtToken } = require('../middleware/auth');
const messagesService = require('../services/messages.service');
const messagesRepository = require('../repositories/messages.repository');
const { env } = require('../config/env');

/**
 * Initializes Socket.IO attached to the existing HTTP server.
 * Handles authentication, personal and conversation rooms, realtime direct messages,
 * typing events, and read indicators.
 *
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
function initMessagingSocket(httpServer) {
    const allowedOrigins = [
        env.FRONTEND_URL,
        env.CORS_ORIGIN,
        env.CLIENT_URL
    ].filter(Boolean);

    const io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                // Allow requests with no origin (e.g. server-to-server or mobile tools)
                if (!origin) return callback(null, true);
                if (env.NODE_ENV === 'development') {
                    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
                        return callback(null, true);
                    }
                }
                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                return callback(new Error(`Socket.IO CORS policy blocked access from origin: ${origin}`));
            },
            credentials: true
        },
        transports: ['polling', 'websocket']
    });

    // Socket.IO authentication middleware
    io.use(async(socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization;

            if (!token) {
                const err = new Error('Authentication token required');
                err.data = { code: 'UNAUTHORIZED' };
                return next(err);
            }

            const user = await verifyJwtToken(token);
            if (!user || user.isBlocked) {
                const err = new Error('Account suspended or invalid token');
                err.data = { code: user?.isBlocked ? 'ACCOUNT_BLOCKED' : 'UNAUTHORIZED' };
                return next(err);
            }

            socket.data.user = {
                id: user.id,
                role: user.role,
                isBlocked: user.isBlocked
            };

            return next();
        } catch (err) {
            console.error('[Socket.IO Auth] Connection rejected:', err.message);
            const authError = new Error('Authentication failed');
            authError.data = { code: err.code || 'UNAUTHORIZED', message: err.message };
            return next(authError);
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.data.user.id;
        const personalRoom = `user:${userId}`;

        // Join personal room for 1-to-1 message delivery
        socket.join(personalRoom);

        // Confirm authenticated connection
        socket.emit('authenticated', { userId });

        /**
         * Event: Join a conversation room (for typing indicators / read status)
         */
        socket.on('conversation:join', async(data) => {
            try {
                const conversationId = data?.conversationId;
                if (!conversationId) return;

                const conv = await messagesRepository.getConversationById(conversationId);
                if (!conv || !conv.participants.includes(userId)) {
                    socket.emit('message:error', {
                        code: 'FORBIDDEN',
                        message: 'Not authorized to join this conversation'
                    });
                    return;
                }

                socket.join(`conv:${conversationId}`);
            } catch (err) {
                console.error('[Socket conversation:join] error:', err.message);
            }
        });

        /**
         * Event: Leave a conversation room
         */
        socket.on('conversation:leave', (data) => {
            const conversationId = data?.conversationId;
            if (conversationId) {
                socket.leave(`conv:${conversationId}`);
            }
        });

        /**
         * Event: Send direct message in realtime
         * Validates follow relationship, idempotency, persists to DB, and delivers.
         */
        socket.on('message:send', async(data) => {
            const { recipientId, content, clientMessageId } = data || {};
            if (!clientMessageId) {
                socket.emit('message:error', {
                    code: 'VALIDATION_ERROR',
                    message: 'clientMessageId is required for message sending'
                });
                return;
            }

            try {
                const result = await messagesService.sendMessage({
                    senderId: userId,
                    recipientId,
                    content,
                    clientMessageId
                });

                // Acknowledge sending client
                socket.emit('message:ack', {
                    clientMessageId,
                    message: result.message
                });

                // Deliver to recipient's personal room
                io.to(`user:${recipientId}`).emit('message:new', {
                    message: result.message
                });

                // Deliver to sender's other sockets (multi-tab sync)
                socket.to(personalRoom).emit('message:new', {
                    message: result.message
                });
            } catch (err) {
                socket.emit('message:error', {
                    clientMessageId,
                    code: err.code || 'ERROR',
                    message: err.message
                });
            }
        });

        /**
         * Event: Typing start
         */
        socket.on('typing:start', async(data) => {
            try {
                const conversationId = data?.conversationId;
                if (!conversationId) return;

                const conv = await messagesRepository.getConversationById(conversationId);
                if (!conv || !conv.participants.includes(userId)) return;

                socket.to(`conv:${conversationId}`).emit('typing:update', {
                    conversationId,
                    userId,
                    isTyping: true
                });
            } catch (err) {
                console.error('[Socket typing:start] error:', err.message);
            }
        });

        /**
         * Event: Typing stop
         */
        socket.on('typing:stop', (data) => {
            const conversationId = data?.conversationId;
            if (conversationId) {
                socket.to(`conv:${conversationId}`).emit('typing:update', {
                    conversationId,
                    userId,
                    isTyping: false
                });
            }
        });

        /**
         * Event: Conversation read
         */
        socket.on('conversation:read', async(data) => {
            try {
                const conversationId = data?.conversationId;
                if (!conversationId) return;

                await messagesService.markAsRead(conversationId, userId);
                io.to(`conv:${conversationId}`).emit('conversation:read_update', {
                    conversationId,
                    readerId: userId
                });
            } catch (err) {
                console.error('[Socket conversation:read] error:', err.message);
            }
        });

        socket.on('disconnect', () => {
            // Clean up personal room membership automatically handled by Socket.IO
        });
    });

    return io;
}

module.exports = { initMessagingSocket };
