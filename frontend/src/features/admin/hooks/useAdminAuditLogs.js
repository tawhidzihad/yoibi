"use client";

import { useState, useEffect, useCallback } from "react";
import { getAdminAuditLogs } from "@/lib/api/admin";

export function useAdminAuditLogs({ initialLimit = 20 } = {}) {
    const [auditLogs, setAuditLogs] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: initialLimit,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [actionFilter, setActionFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAuditLogs = useCallback(async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const actionParam = actionFilter === "all" ? undefined : actionFilter;
            const res = await getAdminAuditLogs({
                page,
                limit: pagination.limit,
                action: actionParam
            });

            if (res.success && res.data) {
                setAuditLogs(res.data.items || []);
                setPagination({
                    page: res.data.pagination.page,
                    limit: res.data.pagination.limit,
                    totalItems: res.data.pagination.totalItems,
                    totalPages: res.data.pagination.totalPages,
                    hasNextPage: res.data.pagination.hasNextPage,
                    hasPrevPage: res.data.pagination.hasPrevPage
                });
            } else {
                setError(res.error?.message || "Failed to load audit logs.");
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred while fetching audit logs.");
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, actionFilter]);

    useEffect(() => {
        let isCancelled = false;

        async function loadLogs() {
            try {
                const actionParam = actionFilter === "all" ? undefined : actionFilter;
                const res = await getAdminAuditLogs({
                    page: 1,
                    limit: initialLimit,
                    action: actionParam
                });

                if (!isCancelled) {
                    if (res.success && res.data) {
                        setAuditLogs(res.data.items || []);
                        setPagination({
                            page: res.data.pagination.page,
                            limit: res.data.pagination.limit,
                            totalItems: res.data.pagination.totalItems,
                            totalPages: res.data.pagination.totalPages,
                            hasNextPage: res.data.pagination.hasNextPage,
                            hasPrevPage: res.data.pagination.hasPrevPage
                        });
                    } else {
                        setError(res.error?.message || "Failed to load audit logs.");
                    }
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(err.message || "An unexpected error occurred while fetching audit logs.");
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        }

        loadLogs();

        return () => {
            isCancelled = true;
        };
    }, [initialLimit, actionFilter]);

    return {
        auditLogs,
        pagination,
        actionFilter,
        setActionFilter,
        loading,
        error,
        fetchPage: fetchAuditLogs,
        refetch: () => fetchAuditLogs(pagination.page)
    };
}
