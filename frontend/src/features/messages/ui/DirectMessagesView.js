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
import { MessageSquare, ShieldAlert } from "lucide-react";

export function DirectMessagesView({
    initialConversationId = null,
    currentUserId,
    isMobileView = false
}) {
    const router = useRouter();
    const {
        onlineUsers,
        activeFriends,
        connectionStatus,
        typingUsers,
        markAllRead,
        refreshUnread,
        setActiveConversationId: setGlobalActiveConvId
    } = useMessages();

    const [conversations, setConversations] = useState([]);
    const [selectedConvId, setSelectedConvId] = useState(initialConversationId);
    const [prevInitialConvId, setPrevInitialConvId] = useState(initialConversationId);

    // Adjust state during render when initialConversationId prop changes (React recommended pattern)
    if (initialConversationId !== prevInitialConvId) {
        setPrevInitialConvId(initialConversationId);
        setSelectedConvId(initialConversationId);
    }

    const [messages, setMessages] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [partnerError, setPartnerError] = useState("");

    const activeConvRef = useRef(selectedConvId);
    useEffect(() => {
        activeConvRef.current = selectedConvId;
    }, [selectedConvId]);

    // Synchronize global active conv id for badge tracking
    useEffect(() => {
        setGlobalActiveConvId(selectedConvId);
        return () => setGlobalActiveConvId(null);
    }, [selectedConvId, setGlobalActiveConvId]);

    // If selected conversation is not yet in conversations list, fetch it directly
    useEffect(() => {
        if (selectedConvId && !conversations.some((c) => c.id === selectedConvId)) {
            messagesApi.getConversationById(selectedConvId)
                .then((res) => {
                    if (res?.success && res.data) {
                        setConversations((prev) => {
                            if (prev.some((c) => c.id === res.data.id)) return prev;
                            return [res.data, ...prev];
                        });
                    }
                })
                .catch(() => {});
        }
    }, [selectedConvId, conversations]);

    // Active conversation object
    const activeConversation = conversations.find((c) => c.id === selectedConvId);
    const partner = activeConversation?.otherParticipant || activeConversation?.recipient;
    const isPartnerOnline = partner ? Boolean(onlineUsers[partner.id] || partner.isOnline) : false;
    const isPartnerTyping = selectedConvId ? Boolean(typingUsers[selectedConvId]?.has(partner?.id)) : false;

    // Load conversations list
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchConversations();
    }, [fetchConversations]);

    // Load messages when selected conversation changes
    const fetchMessages = useCallback(async (convId) => {
        if (!convId) {
            setMessages([]);
            setCursor(null);
            setHasMore(false);
            return;
        }

        setIsLoadingMessages(true);
        setPartnerError("");

        try {
            const res = await messagesApi.getMessages(convId, { limit: 30 });
            if (res.success && Array.isArray(res.data)) {
                // Backend returns messages in ascending chronological order
                setMessages(res.data);
                setCursor(res.meta?.nextCursor || null);
                setHasMore(Boolean(res.meta?.hasMore));

                // Mark read immediately upon loading
                messagesApi.markRead(convId).catch(() => {});
                const socket = getSocket();
                if (socket.connected) {
                    socket.emit("message:read", { conversationId: convId });
                }

                // Decrement unread count locally for this conversation
                setConversations((prev) =>
                    prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
                );
                refreshUnread();
            } else if (res.status === 403 || res.error === "FORBIDDEN") {
                setPartnerError("You cannot access this conversation.");
            }
        } catch (err) {
            console.error("Failed to load messages:", err);
        } finally {
            setIsLoadingMessages(false);
        }
    }, [refreshUnread]);

    useEffect(() => {
        if (selectedConvId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchMessages(selectedConvId);
        }
    }, [selectedConvId, fetchMessages]);

    // Join/leave socket room for selected conversation
    useEffect(() => {
        if (!selectedConvId) return;
        const socket = getSocket();

        if (socket.connected) {
            socket.emit("conversation:join", { conversationId: selectedConvId });
        }

        const handleConnect = () => {
            socket.emit("conversation:join", { conversationId: selectedConvId });
        };
        socket.on("connect", handleConnect);

        return () => {
            socket.off("connect", handleConnect);
            if (socket.connected) {
                socket.emit("conversation:leave", { conversationId: selectedConvId });
            }
        };
    }, [selectedConvId]);

    // Listen to real-time socket events
    useEffect(() => {
        const socket = getSocket();

        const handleNewMessage = ({ conversation, message }) => {
            const convId = conversation?.id || message?.conversationId;

            // If message is for currently active conversation
            if (convId === activeConvRef.current) {
                setMessages((prev) => {
                    // Check if already present (e.g. optimistic match)
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

            // Update conversation card preview in inbox list
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

                // If brand new conversation
                if (conversation) {
                    return [{
                        ...conversation,
                        lastMessage: message,
                        unreadCount: isCurrentActive || !isIncoming ? 0 : 1
                    }, ...prev];
                }

                return prev;
            });
        };

        const handleDelivered = ({ conversationId, messageIds }) => {
            if (conversationId === activeConvRef.current) {
                setMessages((prev) =>
                    prev.map((m) =>
                        messageIds.includes(m.id) && m.status === "sent"
                            ? { ...m, status: "delivered" }
                            : m
                    )
                );
            }
        };

        const handleRead = ({ conversationId, messageIds }) => {
            if (conversationId === activeConvRef.current) {
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
        if (!selectedConvId || !cursor || isLoadingMore) return;
        setIsLoadingMore(true);

        try {
            const res = await messagesApi.getMessages(selectedConvId, { cursor, limit: 30 });
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
    const handleSendMessage = async ({ text, media }) => {
        if (!selectedConvId) return;

        const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const optimisticMessage = {
            id: `temp_${clientMessageId}`,
            clientMessageId,
            conversationId: selectedConvId,
            senderId: currentUserId,
            text,
            media,
            status: "sending",
            createdAt: new Date().toISOString()
        };

        // 1. Optimistic append to thread
        setMessages((prev) => [...prev, optimisticMessage]);

        // 2. Update conversation list preview
        setConversations((prev) => {
            const index = prev.findIndex((c) => c.id === selectedConvId);
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

        // 3. Send via socket or REST fallback
        const payload = {
            conversationId: selectedConvId,
            clientMessageId,
            text,
            media
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
                const res = await messagesApi.sendMessage(selectedConvId, payload);
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

    // Retry sending a failed message
    const handleRetryMessage = (failedMsg) => {
        setMessages((prev) => prev.filter((m) => m.clientMessageId !== failedMsg.clientMessageId));
        handleSendMessage({ text: failedMsg.text, media: failedMsg.media });
    };

    // Start chat with an active friend
    const handleSelectFriend = async (friend) => {
        try {
            const res = await messagesApi.createConversation(friend.id || friend._id);
            if (res.success && res.data?.id) {
                const convId = res.data.id;
                setSelectedConvId(convId);
                if (isMobileView) {
                    router.push(`/message/${convId}`);
                } else {
                    router.push(`/message?conversationId=${convId}`, { scroll: false });
                }
                fetchConversations();
            }
        } catch (err) {
            console.error("Failed to start conversation with friend:", err);
        }
    };

    const handleSelectConversation = (conv) => {
        setSelectedConvId(conv.id);
        if (isMobileView) {
            router.push(`/message/${conv.id}`);
        } else {
            router.push(`/message?conversationId=${conv.id}`, { scroll: false });
        }
    };

    const handleBackToInbox = () => {
        setSelectedConvId(null);
        if (isMobileView) {
            router.push("/message");
        } else {
            router.push("/message", { scroll: false });
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden rounded-2xl border border-border/50 bg-background shadow-xs">
            {/* Left Pane: Inbox (Conversations List) */}
            <div
                className={`w-full lg:w-[380px] shrink-0 h-full ${
                    selectedConvId && isMobileView ? "hidden lg:flex" : "flex"
                } flex-col`}
            >
                <InboxView
                    conversations={conversations}
                    selectedConversationId={selectedConvId}
                    onSelectConversation={handleSelectConversation}
                    onSelectFriend={handleSelectFriend}
                    activeFriends={activeFriends}
                    onlineUsers={onlineUsers}
                    typingUsers={typingUsers}
                    connectionStatus={connectionStatus}
                    currentUserId={currentUserId}
                    onMarkAllRead={markAllRead}
                    isLoading={isLoadingConversations}
                />
            </div>

            {/* Right Pane: Chat Thread View */}
            <div
                className={`flex-1 h-full flex-col min-w-0 ${
                    !selectedConvId && isMobileView ? "hidden lg:flex" : "flex"
                }`}
            >
                {selectedConvId && activeConversation ? (
                    <>
                        <ChatHeader
                            partner={partner}
                            conversation={activeConversation}
                            isOnline={isPartnerOnline}
                            onBack={isMobileView ? handleBackToInbox : null}
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
                            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                <ShieldAlert size={36} className="text-rose-500 mb-2" />
                                <p className="text-sm font-semibold text-foreground">Access Restricted</p>
                                <p className="text-xs text-muted-foreground mt-1">{partnerError}</p>
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
                                    conversationId={selectedConvId}
                                    onSendMessage={handleSendMessage}
                                    placeholder={
                                        partner?.name
                                            ? `Message ${partner.name.split(" ")[0]}...`
                                            : "Type a message..."
                                    }
                                />
                            </>
                        )}
                    </>
                ) : (
                    /* Empty desktop state when no conversation is selected */
                    <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground bg-secondary/10">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500 mb-4">
                            <MessageSquare size={32} />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">Select a conversation</h2>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                            Choose an existing chat from the left or select an active friend to start messaging.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
