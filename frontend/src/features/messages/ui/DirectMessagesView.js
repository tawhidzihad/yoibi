"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { InboxView } from "./InboxView";
import { ChatHeader } from "./ChatHeader";
import { ChatThread } from "./ChatThread";
import { MessageComposer } from "./MessageComposer";
import { useMessages } from "../context/MessagesContext";
import { messagesApi } from "../api/messagesApi";
import { getSocket } from "../socket/socketClient";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export function DirectMessagesView({
    conversationId = null,
    initialConversationId = null,
    currentUserId
}) {
    const activeConversationId = conversationId || initialConversationId || null;
    const router = useRouter();

    const {
        onlineUsers,
        activeFriends,
        connectionStatus,
        typingUsers,
        refreshUnread,
        setActiveConversationId: setGlobalActiveConvId
    } = useMessages();

    // ── Conversations state (for inbox view) ──
    const [conversations, setConversations] = useState([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(!activeConversationId);

    // ── Active chat state (for conversation view) ──
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [partnerError, setPartnerError] = useState("");

    const activeConvRef = useRef(activeConversationId);
    useEffect(() => {
        activeConvRef.current = activeConversationId;
    }, [activeConversationId]);

    // Synchronize global active conv id for badge tracking
    useEffect(() => {
        setGlobalActiveConvId(activeConversationId);
        return () => setGlobalActiveConvId(null);
    }, [activeConversationId, setGlobalActiveConvId]);

    // ── Load conversations list (inbox) ──
    const fetchConversations = useCallback(async () => {
        setIsLoadingConversations(true);
        try {
            const res = await messagesApi.getConversations({ limit: 50 });
            if (res.success && Array.isArray(res.data)) {
                setConversations(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch conversations:", err);
        } finally {
            setIsLoadingConversations(false);
        }
    }, []);

    useEffect(() => {
        if (!activeConversationId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchConversations();
        }
    }, [activeConversationId, fetchConversations]);

    // ── Load single conversation & messages if activeConversationId is provided ──
    const fetchConversationDetails = useCallback(async (convId) => {
        if (!convId) return;
        try {
            const res = await messagesApi.getConversationById(convId);
            if (res.success && res.data) {
                setConversation(res.data);
            } else if (res.status === 403 || res.status === 404 || res.error === "FORBIDDEN" || res.error === "CONVERSATION_NOT_FOUND") {
                setPartnerError(res.message || "This conversation is unavailable or you do not have permission to view it.");
            }
        } catch (err) {
            setPartnerError(err.message || "Unable to load conversation details.");
        }
    }, []);

    const fetchMessages = useCallback(async (convId) => {
        if (!convId) {
            setMessages([]);
            setCursor(null);
            setHasMore(false);
            return;
        }

        setPartnerError("");

        try {
            const res = await messagesApi.getMessages(convId, { limit: 30 });
            if (res.success && Array.isArray(res.data)) {
                // Backend returns messages in ascending chronological order (WhatsApp style)
                setMessages(res.data);
                setCursor(res.meta?.nextCursor || null);
                setHasMore(Boolean(res.meta?.hasMore));

                // Mark read immediately upon loading
                messagesApi.markRead(convId).catch(() => {});
                const socket = getSocket();
                if (socket.connected) {
                    socket.emit("message:read", { conversationId: convId });
                }
                refreshUnread();
            } else if (res.status === 403 || res.status === 404 || res.error === "FORBIDDEN" || res.error === "CONVERSATION_NOT_FOUND") {
                setPartnerError(res.message || "You cannot access this conversation.");
            }
        } catch (err) {
            setPartnerError(err.message || "Failed to load messages.");
        }
    }, [refreshUnread]);

    useEffect(() => {
        if (activeConversationId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchConversationDetails(activeConversationId);
            fetchMessages(activeConversationId);
        } else {
            setConversation(null);
            setMessages([]);
            setPartnerError("");
        }
    }, [activeConversationId, fetchConversationDetails, fetchMessages]);

    // Join/leave socket room for active conversation
    useEffect(() => {
        if (!activeConversationId) return;
        const socket = getSocket();

        if (socket.connected) {
            socket.emit("conversation:join", { conversationId: activeConversationId });
        }

        const handleConnect = () => {
            socket.emit("conversation:join", { conversationId: activeConversationId });
        };
        socket.on("connect", handleConnect);

        return () => {
            socket.off("connect", handleConnect);
            if (socket.connected) {
                socket.emit("conversation:leave", { conversationId: activeConversationId });
            }
        };
    }, [activeConversationId]);

    // Real-time socket events
    useEffect(() => {
        const socket = getSocket();

        const handleNewMessage = ({ conversation: convData, message }) => {
            const convId = convData?.id || message?.conversationId;

            // If message is for currently active conversation
            if (convId === activeConvRef.current) {
                setMessages((prev) => {
                    const existingIndex = prev.findIndex(
                        (m) =>
                            (message.clientMessageId && m.clientMessageId === message.clientMessageId) ||
                            (message.id && m.id === message.id)
                    );
                    if (existingIndex !== -1) {
                        const copy = [...prev];
                        copy[existingIndex] = message;
                        return copy;
                    }
                    return [...prev, message];
                });

                // Auto-mark read if we are not the sender
                if (message.senderId !== currentUserId) {
                    socket.emit("message:read", {
                        conversationId: convId,
                        messageIds: [message.id]
                    });
                    messagesApi.markRead(convId, [message.id]).catch(() => {});
                }
            }

            // Always update conversation list ordering & preview:
            // Latest activity moves to top immediately
            setConversations((prev) => {
                const index = prev.findIndex((c) => c.id === convId);
                const isCurrentActive = convId === activeConvRef.current;
                const isIncoming = message.senderId !== currentUserId;

                if (index !== -1) {
                    const existing = prev[index];
                    const updated = {
                        ...existing,
                        lastMessage: message,
                        updatedAt: message.createdAt || new Date().toISOString(),
                        unreadCount: isCurrentActive || !isIncoming
                            ? 0
                            : (existing.unreadCount || 0) + 1
                    };
                    const rest = prev.filter((_, i) => i !== index);
                    return [updated, ...rest];
                }

                if (convData) {
                    return [{
                        ...convData,
                        lastMessage: message,
                        unreadCount: isCurrentActive || !isIncoming ? 0 : 1
                    }, ...prev];
                }

                return prev;
            });
        };

        const handleDelivered = ({ conversationId: convId, messageIds }) => {
            if (convId === activeConvRef.current) {
                setMessages((prev) =>
                    prev.map((m) =>
                        messageIds.includes(m.id) && m.status === "sent"
                            ? { ...m, status: "delivered" }
                            : m
                    )
                );
            }
        };

        const handleRead = ({ conversationId: convId, messageIds }) => {
            if (convId === activeConvRef.current) {
                setMessages((prev) =>
                    prev.map((m) =>
                        !messageIds || messageIds.includes(m.id)
                            ? { ...m, status: "read" }
                            : m
                    )
                );
            }
        };

        socket.on("message:new", handleNewMessage);
        socket.on("message:delivered", handleDelivered);
        socket.on("message:read", handleRead);

        return () => {
            socket.off("message:new", handleNewMessage);
            socket.off("message:delivered", handleDelivered);
            socket.off("message:read", handleRead);
        };
    }, [currentUserId]);

    // Load older messages (cursor pagination)
    const handleLoadMore = async () => {
        if (!activeConversationId || !cursor || isLoadingMore) return;
        setIsLoadingMore(true);

        try {
            const res = await messagesApi.getMessages(activeConversationId, { cursor, limit: 30 });
            if (res.success && Array.isArray(res.data)) {
                setMessages((prev) => [...res.data, ...prev]);
                setCursor(res.meta?.nextCursor || null);
                setHasMore(Boolean(res.meta?.hasMore));
            }
        } catch (err) {
            console.error("Failed to load older messages:", err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Send message (optimistic UI + Socket.IO with REST fallback)
    const handleSendMessage = async ({ text, media, uploadIntentId }) => {
        if (!activeConversationId) return;

        const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const optimisticMessage = {
            id: `temp_${clientMessageId}`,
            clientMessageId,
            conversationId: activeConversationId,
            senderId: currentUserId,
            text,
            media,
            status: "sending",
            createdAt: new Date().toISOString()
        };

        // 1. Optimistic append to thread
        setMessages((prev) => [...prev, optimisticMessage]);

        // 2. Update conversation list preview & move to top
        setConversations((prev) => {
            const index = prev.findIndex((c) => c.id === activeConversationId);
            if (index !== -1) {
                const updated = {
                    ...prev[index],
                    lastMessage: optimisticMessage,
                    updatedAt: optimisticMessage.createdAt
                };
                const rest = prev.filter((_, i) => i !== index);
                return [updated, ...rest];
            }
            return prev;
        });

        // 3. Send payload
        const payload = {
            conversationId: activeConversationId,
            clientMessageId,
            type: media ? (media.resourceType || "image") : "text",
            text: text.trim(),
            media: media || undefined,
            uploadIntentId: uploadIntentId || (media && media.uploadIntentId) || undefined
        };

        const socket = getSocket();

        if (socket.connected) {
            socket.emit("message:send", payload, (ack) => {
                if (ack?.success && ack.data) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.clientMessageId === clientMessageId
                                ? { ...ack.data, status: ack.data.status || "sent" }
                                : m
                        )
                    );
                } else {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.clientMessageId === clientMessageId
                                ? { ...m, status: "failed" }
                                : m
                        )
                    );
                }
            });
        } else {
            // REST Fallback
            try {
                const res = await messagesApi.sendMessage(activeConversationId, payload);
                if (res.success && res.data) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.clientMessageId === clientMessageId
                                ? { ...res.data, status: res.data.status || "sent" }
                                : m
                        )
                    );
                } else {
                    throw new Error(res.message || "Failed to send");
                }
            } catch {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.clientMessageId === clientMessageId
                            ? { ...m, status: "failed" }
                            : m
                    )
                );
            }
        }
    };

    const handleRetryMessage = (failedMsg) => {
        setMessages((prev) => prev.filter((m) => m.clientMessageId !== failedMsg.clientMessageId));
        handleSendMessage({
            text: failedMsg.text,
            media: failedMsg.media,
            uploadIntentId: failedMsg.media?.uploadIntentId
        });
    };

    // Navigation handlers
    const handleSelectConversation = (conv) => {
        router.push(`/message/${conv.id}`);
    };

    const handleSelectFriend = async (friend) => {
        try {
            const res = await messagesApi.createConversation(friend.id || friend._id);
            if (res.success && res.data?.id) {
                router.push(`/message/${res.data.id}`);
            }
        } catch (err) {
            console.error("Failed to start conversation with friend:", err);
        }
    };

    const handleBackToInbox = () => {
        router.push("/message");
    };

    // Partner info for active chat
    const partner = conversation?.otherParticipant || conversation?.recipient;
    const isPartnerOnline = partner ? Boolean(onlineUsers[partner.id] || partner.isOnline) : false;
    const isPartnerTyping = activeConversationId ? Boolean(typingUsers[activeConversationId]?.has(partner?.id)) : false;

    // ── IF NO ACTIVE CONVERSATION: Render full-width INBOX VIEW ONLY ──
    if (!activeConversationId) {
        return (
            <div className="flex flex-col h-full w-full bg-background min-h-0">
                <InboxView
                    conversations={conversations}
                    onSelectConversation={handleSelectConversation}
                    onSelectFriend={handleSelectFriend}
                    activeFriends={activeFriends}
                    onlineUsers={onlineUsers}
                    typingUsers={typingUsers}
                    connectionStatus={connectionStatus}
                    currentUserId={currentUserId}
                    isLoading={isLoadingConversations}
                />
            </div>
        );
    }

    // ── IF ACTIVE CONVERSATION: Render full-width CHAT VIEW ONLY ──
    return (
        <div className="flex flex-col h-full w-full bg-background min-h-0">
            <ChatHeader
                partner={partner}
                conversation={conversation}
                isOnline={isPartnerOnline}
                onBack={handleBackToInbox}
            />

            {/* Connection status banners */}
            {connectionStatus === "reconnecting" && (
                <div className="flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-500 font-medium select-none">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Reconnecting to chat server...</span>
                </div>
            )}
            {connectionStatus === "disconnected" && (
                <div className="flex items-center justify-center gap-2 bg-rose-500/10 border-b border-rose-500/20 px-4 py-1.5 text-xs text-rose-500 font-medium select-none">
                    <span>Disconnected. Real-time messages paused until reconnect.</span>
                </div>
            )}

            {partnerError ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground my-auto">
                    <ShieldAlert size={36} className="text-rose-500 mb-2" />
                    <p className="text-sm font-semibold text-foreground">Access Restricted</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">{partnerError}</p>
                    <button
                        type="button"
                        onClick={handleBackToInbox}
                        className="mt-4 flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={14} />
                        <span>Back to Messages</span>
                    </button>
                </div>
            ) : (
                <>
                    <ChatThread
                        messages={messages}
                        partner={partner}
                        currentUserId={currentUserId}
                        isPartnerTyping={isPartnerTyping}
                        hasMore={hasMore}
                        isLoadingMore={isLoadingMore}
                        onLoadMore={handleLoadMore}
                        onRetryMessage={handleRetryMessage}
                    />

                    <MessageComposer
                        conversationId={activeConversationId}
                        onSendMessage={handleSendMessage}
                        placeholder={
                            partner?.name
                                ? `Message ${partner.name.split(" ")[0]}...`
                                : "Type a message..."
                        }
                    />
                </>
            )}
        </div>
    );
}
