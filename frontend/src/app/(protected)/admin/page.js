"use client";

import { AdminGuard, AdminNav, StatsOverview, useAdminStats } from "@/features/admin";

export default function AdminOverviewPage() {
    const { stats, loading, refetch } = useAdminStats();

    return (
        <AdminGuard>
            <div className="mx-auto max-w-6xl px-4 py-6">
                <AdminNav pendingReportsCount={stats?.pendingReports} />
                <StatsOverview
                    stats={stats}
                    loading={loading}
                    onRefresh={refetch}
                />
            </div>
        </AdminGuard>
    );
}
