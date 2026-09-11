"use client";

import { useState, useEffect, useCallback } from "react";
import { getAdminStats } from "@/lib/api/admin";

export function useAdminStats() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getAdminStats();
            if (res.success && res.data) {
                setStats(res.data);
            } else {
                setError(res.error?.message || "Failed to load dashboard statistics.");
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isCancelled = false;

        async function loadInitial() {
            try {
                const res = await getAdminStats();
                if (!isCancelled) {
                    if (res.success && res.data) {
                        setStats(res.data);
                    } else {
                        setError(res.error?.message || "Failed to load dashboard statistics.");
                    }
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(err.message || "An unexpected error occurred.");
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        }

        loadInitial();

        return () => {
            isCancelled = true;
        };
    }, []);

    return {
        stats,
        loading,
        error,
        refetch: fetchStats
    };
}
