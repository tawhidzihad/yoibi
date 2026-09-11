"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { getJwtToken } from "@/lib/api/client";

const SOCKET_SERVER_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (process.env.NEXT_PUBLIC_API_BASE_URL
        ? process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "")
        : "http://localhost:5000");

/**
 * Hook for managing Socket.IO real-time direct messaging connection,
 * room subscriptions, message delivery, typing events, and reconnect recovery.
 */
export function useMessagingSocket({
    activeConversationId = null,
    onNewMessage = null,
    onMessageAck = null,
    onMessageError = null,
    onTypingUpdate = null,
    onReadUpdate = null,
    onReconnect = null,
} = {}) {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);

    // Stable references to callbacks
    const callbacksRef = useRef({
        onNewMessage,
        onMessageAck,
        onMessageError,
        onTypingUpdate,
        onReadUpdate,
        onReconnect,
    });

    useEffect(() => {
        callbacksRef.current = {
            onNewMessage,
            onMessageAck,
            onMessageError,
            onTypingUpdate,
            onReadUpdate,
            onReconnect,
        };
    });

    const activeConversationIdRef = useRef(activeConversationId);
    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    useEffect(() => {
        let isMounted = true;

        async function initSocket() {
            let token = "";
            try {
                // Centralized Better Auth JWT acquisition (official authClient.token() flow).
                token = await getJwtToken();
            } catch (err) {
                console.warn("[MessagingSocket] Failed to acquire auth token:", err?.message);
            }

            if (!isMounted) return;

            const socket = io(SOCKET_SERVER_URL, {
                transports: ["polling", "websocket"],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                auth: {
                    token: token ? `Bearer ${token}` : "",
                },
            });

            socketRef.current = socket;

            socket.on("connect", () => {
                if (!isMounted) return;
                setIsConnected(true);
                setIsReconnecting(false);

                // Re-join active conversation room if set
                if (activeConversationIdRef.current) {
                    socket.emit("conversation:join", { conversationId: activeConversationIdRef.current });
                }
            });

            socket.on("authenticated", (_data) => {
                // Connection authenticated
            });

            socket.on("disconnect", (reason) => {
                if (!isMounted) return;
                setIsConnected(false);
                if (reason === "io server disconnect") {
                    // Reconnect manually if disconnected by server
                    socket.connect();
                }
            });

            socket.io.on("reconnect", () => {
                if (!isMounted) return;
                setIsConnected(true);
                setIsReconnecting(false);

                // Recover missed messages and rejoin conversation
                if (activeConversationIdRef.current) {
                    socket.emit("conversation:join", { conversationId: activeConversationIdRef.current });
                }
                if (callbacksRef.current.onReconnect) {
                    callbacksRef.current.onReconnect();
                }
            });

            socket.io.on("reconnect_attempt", () => {
                if (!isMounted) return;
                setIsReconnecting(true);
            });

            socket.on("message:new", (data) => {
                if (callbacksRef.current.onNewMessage && data?.message) {
                    callbacksRef.current.onNewMessage(data.message);
                }
            });

            socket.on("message:ack", (data) => {
                if (callbacksRef.current.onMessageAck) {
                    callbacksRef.current.onMessageAck(data.clientMessageId, data.message);
                }
            });

            socket.on("message:error", (data) => {
                if (callbacksRef.current.onMessageError) {
                    callbacksRef.current.onMessageError(data.clientMessageId, data.code, data.message);
                }
            });

            socket.on("typing:update", (data) => {
                if (callbacksRef.current.onTypingUpdate) {
                    callbacksRef.current.onTypingUpdate(data);
                }
            });

            socket.on("conversation:read_update", (data) => {
                if (callbacksRef.current.onReadUpdate) {
                    callbacksRef.current.onReadUpdate(data);
                }
            });
        }

        initSocket();

        return () => {
            isMounted = false;
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // Handle joining / leaving active conversation room
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !isConnected || !activeConversationId) return;

        socket.emit("conversation:join", { conversationId: activeConversationId });

        return () => {
            if (socket && socket.connected) {
                socket.emit("conversation:leave", { conversationId: activeConversationId });
            }
        };
    }, [activeConversationId, isConnected]);

    const sendMessageSocket = useCallback(({ recipientId, content, clientMessageId }) => {
        if (!socketRef.current || !isConnected) return false;
        socketRef.current.emit("message:send", {
            recipientId,
            content,
            clientMessageId,
        });
        return true;
    }, [isConnected]);

    const sendTypingStart = useCallback((conversationId) => {
        if (!socketRef.current || !isConnected || !conversationId) return;
        socketRef.current.emit("typing:start", { conversationId });
    }, [isConnected]);

    const sendTypingStop = useCallback((conversationId) => {
        if (!socketRef.current || !isConnected || !conversationId) return;
        socketRef.current.emit("typing:stop", { conversationId });
    }, [isConnected]);

    const sendConversationRead = useCallback((conversationId) => {
        if (!socketRef.current || !isConnected || !conversationId) return;
        socketRef.current.emit("conversation:read", { conversationId });
    }, [isConnected]);

    return {
        isConnected,
        isReconnecting,
        sendMessageSocket,
        sendTypingStart,
        sendTypingStop,
        sendConversationRead,
    };
}
