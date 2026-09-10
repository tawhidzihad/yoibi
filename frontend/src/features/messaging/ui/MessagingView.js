"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import {
    getConversations,
    getConversationHistory,
    sendMessage as sendRestMessage,
    markConversationRead,
} from "@/lib/api/messages";
import { useMessagingSocket } from "../hooks/useMessagingSocket";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";

/**
 * Root MessagingView orchestrating REST data fetching, Socket.IO realtime events,
 * reconnect recovery, follow validation feedback, and responsive layout.
 */
export function MessagingView() {
    const { data: session } = authClient.useSession();
    const currentUserId = session?.user?.id;

    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, hasNextPage: false });
    const [pendingClientMessageIds, setPendingClientMessageIds] = useState(new Set());

    const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
    const activeConversationIdRef = useRef(activeConversationId);

    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    // Load user conversations list
    const loadConversations = useCallback(async (page = 1) => {
        try {
            const res = await getConversations({ page, limit: 20 });
            if (res.success && res.data) {
                const items = res.data.items || [];
                setConversations(items);
                if (res.data.pagination) {
                    setPagination(res.data.pagination);
                }
                if (items.length > 0 && !activeConversationIdRef.current) {
                    setActiveConversationId(items[0].id);
                }
            }
        } catch (err) {
            console.error("[MessagingView] Failed to load conversations:", err);
        } finally {
            setIsLoadingConversations(false);
        }
    }, []);

    // Initial conversations load
    useEffect(() => {
        let isCancelled = false;

        async function init() {
            try {
                const res = await getConversations({ page: 1, limit: 20 });
                if (isCancelled) return;
                if (res.success && res.data) {
                    const items = res.data.items || [];
                    setConversations(items);
                    if (res.data.pagination) {
                        setPagination(res.data.pagination);
                    }
                    if (items.length > 0 && !activeConversationIdRef.current) {
                        setActiveConversationId(items[0].id);
                    }
                }
            } catch (err) {
                if (isCancelled) return;
                console.error("[MessagingView] Failed to load conversations:", err);
            } finally {
                if (!isCancelled) {
                    setIsLoadingConversations(false);
                }
            }
        }

        init();

        return () => {
            isCancelled = true;
        };
    }, []);

    // Load message history when active conversation changes
    useEffect(() => {
        let isCancelled = false;

        async function fetchHistory() {
            if (!activeConversationId) return;

            try {
                const res = await getConversationHistory(activeConversationId, { page: 1, limit: 50 });
                if (isCancelled) return;
                if (res.success && res.data) {
                    setMessages(res.data.items || []);
                    markConversationRead(activeConversationId).catch(() => {});
                }
            } catch (err) {
                if (isCancelled) return;
                console.error("[MessagingView] Failed to load messages:", err);
            }
        }

        fetchHistory();

        return () => {
            isCancelled = true;
        };
    }, [activeConversationId]);

    // Handle real-time incoming message
    const handleNewMessage = useCallback((incomingMessage) => {
        const activeId = activeConversationIdRef.current;

        // If the message is for the currently viewed conversation, append it
        if (incomingMessage.conversationId === activeId) {
            setMessages((prev) => {
                // Deduplicate by id or clientMessageId
                const exists = prev.some(
                    (m) =>
                        (m.id && m.id === incomingMessage.id) ||
                        (m.clientMessageId && m.clientMessageId === incomingMessage.clientMessageId)
                );
                if (exists) {
                    return prev.map((m) =>
                        m.clientMessageId === incomingMessage.clientMessageId ? incomingMessage : m
                    );
                }
                return [...prev, incomingMessage];
            });

            // Mark as read immediately if current user is recipient
            if (incomingMessage.recipientId === currentUserId) {
                markConversationRead(activeId).catch(() => {});
            }
        }

        // Update conversation in the sidebar list
        setConversations((prev) => {
            const index = prev.findIndex((c) => c.id === incomingMessage.conversationId);
            if (index !== -1) {
                const updated = [...prev];
                const targetConv = { ...updated[index] };
                targetConv.lastMessage = {
                    content: incomingMessage.content,
                    senderId: incomingMessage.senderId,
                    clientMessageId: incomingMessage.clientMessageId,
                    createdAt: incomingMessage.createdAt,
                };
                targetConv.updatedAt = incomingMessage.createdAt;

                // If not active, increment unread count
                if (
                    incomingMessage.conversationId !== activeId &&
                    incomingMessage.recipientId === currentUserId
                ) {
                    targetConv.unreadCount = (targetConv.unreadCount || 0) + 1;
                }

                // Move conversation to top
                updated.splice(index, 1);
                return [targetConv, ...updated];
            } else {
                // New conversation created elsewhere, refresh list
                loadConversations();
                return prev;
            }
        });
    }, [currentUserId, loadConversations]);

    // Handle message ACK from server
    const handleMessageAck = useCallback((clientMessageId, confirmedMessage) => {
        setPendingClientMessageIds((prev) => {
            const next = new Set(prev);
            next.delete(clientMessageId);
            return next;
        });

        setMessages((prev) =>
            prev.map((m) => (m.clientMessageId === clientMessageId ? confirmedMessage : m))
        );
    }, []);

    // Handle message error (e.g. DM_FOLLOW_REQUIRED)
    const handleMessageError = useCallback((clientMessageId, code, messageText) => {
        setPendingClientMessageIds((prev) => {
            const next = new Set(prev);
            next.delete(clientMessageId);
            return next;
        });

        // Remove optimistic pending message if failed
        setMessages((prev) => prev.filter((m) => m.clientMessageId !== clientMessageId));

        if (code === "DM_FOLLOW_REQUIRED") {
            setErrorMessage("You can only message users whom you follow. Follow this account first.");
        } else {
            setErrorMessage(messageText || "Failed to send message.");
        }
    }, []);

    // Handle typing update
    const handleTypingUpdate = useCallback((data) => {
        if (data.conversationId === activeConversationIdRef.current) {
            setIsTyping(Boolean(data.isTyping));
            setTypingUser(data.userId);
        }
    }, []);

    // Handle conversation read update
    const handleReadUpdate = useCallback((data) => {
        if (data.conversationId === activeConversationIdRef.current) {
            setMessages((prev) =>
                prev.map((m) =>
                    m.senderId === currentUserId && !m.readAt
                        ? { ...m, readAt: new Date().toISOString() }
                        : m
                )
            );
        }
    }, [currentUserId]);

    // Reconnect recovery: fetch recent history via REST to sync missed messages
    const handleReconnect = useCallback(() => {
        const activeId = activeConversationIdRef.current;
        if (activeId) {
            getConversationHistory(activeId, { page: 1, limit: 50 })
                .then((res) => {
                    if (res.success && res.data) {
                        setMessages(res.data.items || []);
                    }
                })
                .catch(() => {});
        }
        loadConversations();
    }, [loadConversations]);

    // Initialize Socket.IO connection
    const {
        isConnected,
        isReconnecting,
        sendMessageSocket,
        sendTypingStart,
        sendTypingStop,
    } = useMessagingSocket({
        activeConversationId,
        onNewMessage: handleNewMessage,
        onMessageAck: handleMessageAck,
        onMessageError: handleMessageError,
        onTypingUpdate: handleTypingUpdate,
        onReadUpdate: handleReadUpdate,
        onReconnect: handleReconnect,
    });

    // Send message dispatcher (uses Socket.IO first, fallback to REST)
    const handleSendMessage = async ({ recipientId, content, clientMessageId }) => {
        setErrorMessage(null);

        // Optimistic UI update
        const optimisticMessage = {
            id: `temp_${clientMessageId}`,
            conversationId: activeConversationId || "",
            senderId: currentUserId,
            recipientId,
            content,
            clientMessageId,
            readAt: null,
            createdAt: new Date().toISOString(),
        };

        setPendingClientMessageIds((prev) => new Set(prev).add(clientMessageId));
        setMessages((prev) => [...prev, optimisticMessage]);

        // Try Socket.IO transport
        const sentViaSocket = sendMessageSocket({ recipientId, content, clientMessageId });
        if (sentViaSocket) {
            return true;
        }

        // Fallback to REST API
        try {
            const res = await sendRestMessage({ recipientId, content, clientMessageId });
            if (res.success && res.data) {
                handleMessageAck(clientMessageId, res.data);
                // If this was a new conversation, refresh conversation list
                if (!activeConversationId) {
                    loadConversations();
                }
                return true;
            } else {
                handleMessageError(
                    clientMessageId,
                    res.error?.code,
                    res.error?.message
                );
                return false;
            }
        } catch (err) {
            handleMessageError(clientMessageId, "NETWORK_ERROR", err.message);
            return false;
        }
    };

    // Start a new chat with a target recipient ID
    const handleStartNewChat = async (recipientId) => {
        // Send initial greeting to establish conversation
        const clientMessageId =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const res = await sendRestMessage({
            recipientId,
            content: "Hello!",
            clientMessageId,
        });

        if (res.success && res.data) {
            await loadConversations();
            setActiveConversationId(res.data.conversationId);
        } else {
            setErrorMessage(
                res.error?.code === "DM_FOLLOW_REQUIRED"
                    ? "You can only message users whom you follow. Follow this user first."
                    : res.error?.message || "Could not start conversation."
            );
        }
    };

    const handleSelectConversation = (id) => {
        setActiveConversationId(id);
        setIsTyping(false);
        setErrorMessage(null);
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-0rem)] w-full overflow-hidden bg-background">
            {/* Sidebar / Conversation List */}
            <div
                className={`w-full sm:w-80 md:w-96 shrink-0 border-r border-border/50 ${
                    activeConversationId ? "hidden sm:block" : "block"
                }`}
            >
                <ConversationList
                    conversations={conversations}
                    activeId={activeConversationId}
                    onSelectConversation={handleSelectConversation}
                    onStartNewChat={handleStartNewChat}
                    currentUserId={currentUserId}
                    isLoading={isLoadingConversations}
                    pagination={pagination}
                    onPageChange={(p) => loadConversations(p)}
                />
            </div>

            {/* Active Message Thread */}
            <div
                className={`flex-1 flex-col ${
                    activeConversationId ? "flex" : "hidden sm:flex"
                }`}
            >
                <MessageThread
                    conversation={activeConversation}
                    messages={messages}
                    currentUserId={currentUserId}
                    onSendMessage={handleSendMessage}
                    onTypingStart={sendTypingStart}
                    onTypingStop={sendTypingStop}
                    isTyping={isTyping}
                    typingUser={typingUser}
                    isConnected={isConnected}
                    isReconnecting={isReconnecting}
                    onBack={() => setActiveConversationId(null)}
                    errorMessage={errorMessage}
                    onClearError={() => setErrorMessage(null)}
                    pendingClientMessageIds={pendingClientMessageIds}
                />
            </div>
        </div>
    );
}
