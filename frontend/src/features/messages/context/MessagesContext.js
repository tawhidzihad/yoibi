"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getSocket, subscribeConnectionStatus, disconnectSocket } from "../socket/socketClient";
import { messagesApi } from "../api/messagesApi";

const MessagesContext = createContext(null);

export function MessagesProvider({ children }) {
    const { status, user } = useAuth();
    const [totalUnread, setTotalUnread] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState("disconnected");
    const [onlineUsers, setOnlineUsers] = useState({}); // userId -> boolean
    const [activeFriends, setActiveFriends] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [typingUsers, setTypingUsers] = useState({}); // convId -> Set<userId>

    const isAuthenticated = status === "authenticated" && user && user.emailVerified === true && !user.isBlocked;

    const refreshUnread = useCallback(async() => {
        if (!isAuthenticated) return;
        try {
            const res = await messagesApi.getConversations({ limit: 1 });
            if (res.success && res.meta) {
                setTotalUnread(res.meta.totalUnread || 0);
            }
        } catch {}
    }, [isAuthenticated]);

    const refreshActiveFriends = useCallback(async() => {
        if (!isAuthenticated) return;
        try {
            const res = await messagesApi.getActiveFriends();
            if (res.success && Array.isArray(res.data)) {
                setActiveFriends(res.data);
            }
        } catch {}
    }, [isAuthenticated]);

    // Manage socket lifecycle based on auth
    useEffect(() => {
        if (!isAuthenticated) {
            disconnectSocket();
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTotalUnread(0);
            setOnlineUsers({});
            setActiveFriends([]);
            return;
        }

        const unsubStatus = subscribeConnectionStatus((s) => {
            setConnectionStatus(s);
        });

        const socket = getSocket();

        // Initial data sync
        refreshUnread();
        refreshActiveFriends();

        // Socket listeners
        const handlePresenceUpdate = ({ userId, isOnline }) => {
            setOnlineUsers((prev) => ({
                ...prev,
                [userId]: isOnline
            }));
            // Refresh active friends row when presence changes
            refreshActiveFriends();
        };

        const handleUnreadUpdate = ({ totalUnread: count }) => {
            if (typeof count === "number") {
                setTotalUnread(count);
            }
        };

        const handleTypingUpdate = ({ conversationId, userId: typingUserId, isTyping }) => {
            setTypingUsers((prev) => {
                const currentSet = new Set(prev[conversationId] || []);
                if (isTyping) {
                    currentSet.add(typingUserId);
                } else {
                    currentSet.delete(typingUserId);
                }
                return {
                    ...prev,
                    [conversationId]: currentSet
                };
            });
        };

        const handleNewMessage = ({ conversation }) => {
            if (conversation?.id !== activeConversationId) {
                setTotalUnread((prev) => prev + 1);
            }
        };

        socket.on("presence:update", handlePresenceUpdate);
        socket.on("unread:update", handleUnreadUpdate);
        socket.on("typing:update", handleTypingUpdate);
        socket.on("message:new", handleNewMessage);

        return () => {
            unsubStatus();
            socket.off("presence:update", handlePresenceUpdate);
            socket.off("unread:update", handleUnreadUpdate);
            socket.off("typing:update", handleTypingUpdate);
            socket.off("message:new", handleNewMessage);
        };
    }, [isAuthenticated, activeConversationId, refreshUnread, refreshActiveFriends]);

    return (
        <MessagesContext.Provider
            value={{
                totalUnread,
                connectionStatus,
                onlineUsers,
                activeFriends,
                activeConversationId,
                setActiveConversationId,
                typingUsers,
                refreshUnread,
                refreshActiveFriends
            }}
        >
            {children}
        </MessagesContext.Provider>
    );
}

export function useMessages() {
    const context = useContext(MessagesContext);
    if (!context) {
        return {
            totalUnread: 0,
            connectionStatus: "disconnected",
            onlineUsers: {},
            activeFriends: [],
            activeConversationId: null,
            setActiveConversationId: () => {},
            typingUsers: {},
            refreshUnread: async() => {},
            refreshActiveFriends: async() => {}
        };
    }
    return context;
}
