"use client";

import { useState, useEffect, useCallback } from "react";
import { getAdminReports, updateAdminReport } from "@/lib/api/admin";

export function useAdminReports({ initialLimit = 20 } = {}) {
    const [reports, setReports] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: initialLimit,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [statusFilter, setStatusFilter] = useState("all"); // "all" | "pending" | "resolved" | "dismissed"
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchReports = useCallback(async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const statusParam = statusFilter === "all" ? undefined : statusFilter;
            const res = await getAdminReports({
                page,
                limit: pagination.limit,
                status: statusParam
            });

            if (res.success && res.data) {
                setReports(res.data.items || []);
                setPagination({
                    page: res.data.pagination.page,
                    limit: res.data.pagination.limit,
                    totalItems: res.data.pagination.totalItems,
                    totalPages: res.data.pagination.totalPages,
                    hasNextPage: res.data.pagination.hasNextPage,
                    hasPrevPage: res.data.pagination.hasPrevPage
                });
            } else {
                setError(res.error?.message || "Failed to load reports.");
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred while fetching reports.");
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, statusFilter]);

    useEffect(() => {
        let isCancelled = false;

        async function loadReports() {
            try {
                const statusParam = statusFilter === "all" ? undefined : statusFilter;
                const res = await getAdminReports({
                    page: 1,
                    limit: initialLimit,
                    status: statusParam
                });

                if (!isCancelled) {
                    if (res.success && res.data) {
                        setReports(res.data.items || []);
                        setPagination({
                            page: res.data.pagination.page,
                            limit: res.data.pagination.limit,
                            totalItems: res.data.pagination.totalItems,
                            totalPages: res.data.pagination.totalPages,
                            hasNextPage: res.data.pagination.hasNextPage,
                            hasPrevPage: res.data.pagination.hasPrevPage
                        });
                    } else {
                        setError(res.error?.message || "Failed to load reports.");
                    }
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(err.message || "An unexpected error occurred while fetching reports.");
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        }

        loadReports();

        return () => {
            isCancelled = true;
        };
    }, [initialLimit, statusFilter]);

    const resolveReport = async (reportId, resolutionNotes) => {
        setActionLoading(true);
        try {
            const res = await updateAdminReport(reportId, {
                status: "resolved",
                resolutionNotes
            });
            if (res.success) {
                await fetchReports(pagination.page);
                return { success: true };
            }
            return { success: false, error: res.error?.message || "Failed to resolve report." };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setActionLoading(false);
        }
    };

    const dismissReport = async (reportId, resolutionNotes) => {
        setActionLoading(true);
        try {
            const res = await updateAdminReport(reportId, {
                status: "dismissed",
                resolutionNotes
            });
            if (res.success) {
                await fetchReports(pagination.page);
                return { success: true };
            }
            return { success: false, error: res.error?.message || "Failed to dismiss report." };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setActionLoading(false);
        }
    };

    return {
        reports,
        pagination,
        statusFilter,
        setStatusFilter,
        loading,
        actionLoading,
        error,
        fetchPage: fetchReports,
        refetch: () => fetchReports(pagination.page),
        resolveReport,
        dismissReport
    };
}
