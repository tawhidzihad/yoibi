"use client";

import {
    AdminGuard,
    AdminNav,
    ReportsQueue,
    useAdminReports,
    useAdminStats
} from "@/features/admin";

export default function AdminReportsPage() {
    const { stats } = useAdminStats();
    const {
        reports,
        pagination,
        statusFilter,
        setStatusFilter,
        loading,
        actionLoading,
        fetchPage,
        resolveReport,
        dismissReport
    } = useAdminReports();

    return (
        <AdminGuard>
            <div className="mx-auto max-w-6xl px-4 py-6">
                <AdminNav pendingReportsCount={stats?.pendingReports} />
                <ReportsQueue
                    reports={reports}
                    pagination={pagination}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    loading={loading}
                    actionLoading={actionLoading}
                    fetchPage={fetchPage}
                    resolveReport={resolveReport}
                    dismissReport={dismissReport}
                />
            </div>
        </AdminGuard>
    );
}
