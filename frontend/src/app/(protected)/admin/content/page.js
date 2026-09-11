"use client";

import {
    AdminGuard,
    AdminNav,
    ContentModerator,
    useAdminContent,
    useAdminStats
} from "@/features/admin";

export default function AdminContentPage() {
    const { stats } = useAdminStats();
    const {
        contentType,
        setContentType,
        items,
        pagination,
        search,
        setSearch,
        loading,
        actionLoading,
        fetchPage,
        deleteItem
    } = useAdminContent();

    return (
        <AdminGuard>
            <div className="mx-auto max-w-6xl px-4 py-6">
                <AdminNav pendingReportsCount={stats?.pendingReports} />
                <ContentModerator
                    contentType={contentType}
                    setContentType={setContentType}
                    items={items}
                    pagination={pagination}
                    search={search}
                    setSearch={setSearch}
                    loading={loading}
                    actionLoading={actionLoading}
                    fetchPage={fetchPage}
                    deleteItem={deleteItem}
                />
            </div>
        </AdminGuard>
    );
}
