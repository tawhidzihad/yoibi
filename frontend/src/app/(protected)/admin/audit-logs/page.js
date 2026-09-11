"use client";

import {
    AdminGuard,
    AdminNav,
    AuditLogViewer,
    useAdminAuditLogs,
    useAdminStats
} from "@/features/admin";

export default function AdminAuditLogsPage() {
    const { stats } = useAdminStats();
    const {
        auditLogs,
        pagination,
        actionFilter,
        setActionFilter,
        loading,
        fetchPage
    } = useAdminAuditLogs();

    return (
        <AdminGuard>
            <div className="mx-auto max-w-6xl px-4 py-6">
                <AdminNav pendingReportsCount={stats?.pendingReports} />
                <AuditLogViewer
                    auditLogs={auditLogs}
                    pagination={pagination}
                    actionFilter={actionFilter}
                    setActionFilter={setActionFilter}
                    loading={loading}
                    fetchPage={fetchPage}
                />
            </div>
        </AdminGuard>
    );
}
