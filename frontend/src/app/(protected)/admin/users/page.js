"use client";

import {
    AdminGuard,
    AdminNav,
    UserTable,
    useAdminUsers,
    useAdminStats
} from "@/features/admin";

export default function AdminUsersPage() {
    const { stats } = useAdminStats();
    const {
        users,
        pagination,
        search,
        setSearch,
        isBlockedFilter,
        setIsBlockedFilter,
        loading,
        actionLoading,
        fetchPage,
        blockUser,
        unblockUser,
        banUser
    } = useAdminUsers();

    return (
        <AdminGuard>
            <div className="mx-auto max-w-6xl px-4 py-6">
                <AdminNav pendingReportsCount={stats?.pendingReports} />
                <UserTable
                    users={users}
                    pagination={pagination}
                    search={search}
                    setSearch={setSearch}
                    isBlockedFilter={isBlockedFilter}
                    setIsBlockedFilter={setIsBlockedFilter}
                    loading={loading}
                    actionLoading={actionLoading}
                    fetchPage={fetchPage}
                    blockUser={blockUser}
                    unblockUser={unblockUser}
                    banUser={banUser}
                />
            </div>
        </AdminGuard>
    );
}
