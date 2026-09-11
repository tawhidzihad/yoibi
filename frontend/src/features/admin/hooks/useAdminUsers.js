"use client";

import { useState, useEffect, useCallback } from "react";
import { getAdminUsers, blockUser, unblockUser, banUser } from "@/lib/api/admin";

export function useAdminUsers({ initialLimit = 20 } = {}) {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: initialLimit,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [search, setSearch] = useState("");
    const [isBlockedFilter, setIsBlockedFilter] = useState("all"); // "all" | "active" | "blocked"
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const blockedParam = isBlockedFilter === "blocked" ? true : isBlockedFilter === "active" ? false : undefined;
            const res = await getAdminUsers({
                page,
                limit: pagination.limit,
                search: search.trim() || undefined,
                isBlocked: blockedParam
            });

            if (res.success && res.data) {
                setUsers(res.data.items || []);
                setPagination({
                    page: res.data.pagination.page,
                    limit: res.data.pagination.limit,
                    totalItems: res.data.pagination.totalItems,
                    totalPages: res.data.pagination.totalPages,
                    hasNextPage: res.data.pagination.hasNextPage,
                    hasPrevPage: res.data.pagination.hasPrevPage
                });
            } else {
                setError(res.error?.message || "Failed to load users list.");
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred while fetching users.");
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, search, isBlockedFilter]);

    useEffect(() => {
        let isCancelled = false;

        async function loadUsers() {
            try {
                const blockedParam = isBlockedFilter === "blocked" ? true : isBlockedFilter === "active" ? false : undefined;
                const res = await getAdminUsers({
                    page: 1,
                    limit: initialLimit,
                    search: search.trim() || undefined,
                    isBlocked: blockedParam
                });

                if (!isCancelled) {
                    if (res.success && res.data) {
                        setUsers(res.data.items || []);
                        setPagination({
                            page: res.data.pagination.page,
                            limit: res.data.pagination.limit,
                            totalItems: res.data.pagination.totalItems,
                            totalPages: res.data.pagination.totalPages,
                            hasNextPage: res.data.pagination.hasNextPage,
                            hasPrevPage: res.data.pagination.hasPrevPage
                        });
                    } else {
                        setError(res.error?.message || "Failed to load users list.");
                    }
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(err.message || "An unexpected error occurred while fetching users.");
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        }

        loadUsers();

        return () => {
            isCancelled = true;
        };
    }, [initialLimit, search, isBlockedFilter]);

    const handleBlock = async (userId, reason) => {
        setActionLoading(true);
        try {
            const res = await blockUser(userId, { reason });
            if (res.success) {
                await fetchUsers(pagination.page);
                return { success: true };
            }
            return { success: false, error: res.error?.message || "Failed to block user." };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnblock = async (userId, reason) => {
        setActionLoading(true);
        try {
            const res = await unblockUser(userId, { reason });
            if (res.success) {
                await fetchUsers(pagination.page);
                return { success: true };
            }
            return { success: false, error: res.error?.message || "Failed to unblock user." };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setActionLoading(false);
        }
    };

    const handleBan = async (userId, { reason, confirmationHandle }) => {
        setActionLoading(true);
        try {
            const res = await banUser(userId, { reason, confirmationHandle });
            if (res.success) {
                await fetchUsers(pagination.page);
                return { success: true, data: res.data };
            }
            return { success: false, error: res.error?.message || "Failed to ban user." };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setActionLoading(false);
        }
    };

    return {
        users,
        pagination,
        search,
        setSearch,
        isBlockedFilter,
        setIsBlockedFilter,
        loading,
        actionLoading,
        error,
        fetchPage: fetchUsers,
        refetch: () => fetchUsers(pagination.page),
        blockUser: handleBlock,
        unblockUser: handleUnblock,
        banUser: handleBan
    };
}
