"use client";

import { useState, useEffect, useCallback } from "react";
import { getAdminContent, deleteAdminContent } from "@/lib/api/admin";

export function useAdminContent({ initialType = "tweet", initialLimit = 20 } = {}) {
    const [contentType, setContentType] = useState(initialType); // "tweet" | "video" | "stream" | "meetup"
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: initialLimit,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchContent = useCallback(async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getAdminContent({
                type: contentType,
                page,
                limit: pagination.limit,
                search: search.trim() || undefined
            });

            if (res.success && res.data) {
                setItems(res.data.items || []);
                setPagination({
                    page: res.data.pagination.page,
                    limit: res.data.pagination.limit,
                    totalItems: res.data.pagination.totalItems,
                    totalPages: res.data.pagination.totalPages,
                    hasNextPage: res.data.pagination.hasNextPage,
                    hasPrevPage: res.data.pagination.hasPrevPage
                });
            } else {
                setError(res.error?.message || "Failed to load content.");
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred while fetching content.");
        } finally {
            setLoading(false);
        }
    }, [contentType, pagination.limit, search]);

    useEffect(() => {
        let isCancelled = false;

        async function loadContent() {
            try {
                const res = await getAdminContent({
                    type: contentType,
                    page: 1,
                    limit: initialLimit,
                    search: search.trim() || undefined
                });

                if (!isCancelled) {
                    if (res.success && res.data) {
                        setItems(res.data.items || []);
                        setPagination({
                            page: res.data.pagination.page,
                            limit: res.data.pagination.limit,
                            totalItems: res.data.pagination.totalItems,
                            totalPages: res.data.pagination.totalPages,
                            hasNextPage: res.data.pagination.hasNextPage,
                            hasPrevPage: res.data.pagination.hasPrevPage
                        });
                    } else {
                        setError(res.error?.message || "Failed to load content.");
                    }
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(err.message || "An unexpected error occurred while fetching content.");
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        }

        loadContent();

        return () => {
            isCancelled = true;
        };
    }, [contentType, initialLimit, search]);

    const deleteItem = async (id, reason) => {
        setActionLoading(true);
        try {
            const res = await deleteAdminContent(contentType, id, { reason });
            if (res.success) {
                await fetchContent(pagination.page);
                return { success: true };
            }
            return { success: false, error: res.error?.message || "Failed to delete content." };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setActionLoading(false);
        }
    };

    return {
        contentType,
        setContentType,
        items,
        pagination,
        search,
        setSearch,
        loading,
        actionLoading,
        error,
        fetchPage: fetchContent,
        refetch: () => fetchContent(pagination.page),
        deleteItem
    };
}
