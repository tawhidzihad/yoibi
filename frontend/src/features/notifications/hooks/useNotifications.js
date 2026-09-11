"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { getJwtToken } from "@/lib/api/client";
import {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead
} from "@/lib/api/notifications";

const SOCKET_SERVER_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (process.env.NEXT_PUBLIC_API_BASE_URL
        ? process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "")
        : "http://localhost:5000");

/**
 * Hook for managing notifications state, REST fetches, mark-as-read mutations,
 * unread counters, and realtime `notification:new` Socket.IO events.
 */
export function useNotifications({ filterRead = undefined, autoFetch = true } = {}) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    const socketRef = useRef(null);

    // Fetch unread count
    const refreshUnreadCount = useCallback(async () => {
        try {
            const res = await getUnreadCount();
            if (res?.success && typeof res.data?.unreadCount === "number") {
                setUnreadCount(res.data.unreadCount);
            }
        } catch (err) {
            console.warn("[useNotifications] Failed to load unread count:", err?.message);
        }
    }, []);

    // Fetch initial page of notifications
    const fetchNotifications = useCallback(async (page = 1, append = false) => {
        if (page === 1) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }
        setError(null);

        try {
            const res = await getNotifications({
                page,
                limit: 20,
                read: filterRead
            });

            if (res?.success && res.data) {
                const newItems = res.data.items || [];
                setNotifications((prev) => (append ? [...prev, ...newItems] : newItems));
                if (res.data.pagination) {
                    setPagination(res.data.pagination);
                }
            }
        } catch (err) {
            console.error("[useNotifications] Failed to fetch notifications:", err?.message);
            setError(err?.message || "Failed to load notifications");
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [filterRead]);

    // Load next page
    const loadMore = useCallback(() => {
        if (!pagination.hasNextPage || isLoadingMore || isLoading) return;
        fetchNotifications(pagination.page + 1, true);
    }, [pagination.hasNextPage, pagination.page, isLoadingMore, isLoading, fetchNotifications]);

    // Mark single notification as read
    const markRead = useCallback(async (id) => {
        if (!id) return;
        // Optimistic UI update
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
            await markNotificationRead(id);
        } catch (err) {
            console.error("[useNotifications] Failed to mark notification read:", err?.message);
            // Re-sync on failure
            refreshUnreadCount();
        }
    }, [refreshUnreadCount]);

    // Mark all notifications as read
    const markAllRead = useCallback(async () => {
        // Optimistic UI update
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            await markAllNotificationsRead();
        } catch (err) {
            console.error("[useNotifications] Failed to mark all read:", err?.message);
            refreshUnreadCount();
        }
    }, [refreshUnreadCount]);

    // Setup Socket.IO realtime listener
    useEffect(() => {
        let isMounted = true;

        async function initSocket() {
            let token = "";
            try {
                // Centralized Better Auth JWT acquisition (official authClient.token() flow).
                token = await getJwtToken();
            } catch (err) {
                console.warn("[useNotifications Socket] Failed to acquire auth token:", err?.message);
            }

            if (!isMounted) return;

            const socket = io(SOCKET_SERVER_URL, {
                transports: ["polling", "websocket"],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                auth: {
                    token: token ? `Bearer ${token}` : ""
                }
            });

            socketRef.current = socket;

            socket.on("notification:new", (data) => {
                if (!data?.notification) return;
                const newNotif = data.notification;

                // Prepend to feed
                setNotifications((prev) => {
                    // Check if already present to prevent duplicate render
                    if (prev.some((n) => n.id === newNotif.id)) return prev;
                    return [newNotif, ...prev];
                });

                // Increment unread count
                setUnreadCount((prev) => prev + 1);
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

    // Initial fetch on mount
    useEffect(() => {
        let isCancelled = false;

        async function loadInitial() {
            try {
                const unreadRes = await getUnreadCount();
                if (!isCancelled && unreadRes?.success && typeof unreadRes.data?.unreadCount === "number") {
                    setUnreadCount(unreadRes.data.unreadCount);
                }
            } catch (err) {
                console.warn("[useNotifications] Failed to load unread count:", err?.message);
            }

            if (autoFetch) {
                try {
                    const res = await getNotifications({
                        page: 1,
                        limit: 20,
                        read: filterRead
                    });
                    if (!isCancelled && res?.success && res.data) {
                        setNotifications(res.data.items || []);
                        if (res.data.pagination) {
                            setPagination(res.data.pagination);
                        }
                    }
                } catch (err) {
                    if (!isCancelled) {
                        setError(err?.message || "Failed to load notifications");
                    }
                } finally {
                    if (!isCancelled) {
                        setIsLoading(false);
                    }
                }
            }
        }

        loadInitial();

        return () => {
            isCancelled = true;
        };
    }, [autoFetch, filterRead]);

    return {
        notifications,
        unreadCount,
        pagination,
        isLoading,
        isLoadingMore,
        error,
        fetchNotifications,
        loadMore,
        markRead,
        markAllRead,
        refreshUnreadCount
    };
}
