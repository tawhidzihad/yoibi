"use client";

import { useState } from "react";
import {
    Search,
    UserCheck,
    UserX,
    ShieldAlert,
    Shield,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter
} from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/feedback/EmptyState";
import { BlockUserModal } from "./BlockUserModal";
import { UnblockUserModal } from "./UnblockUserModal";
import { BanUserModal } from "./BanUserModal";
import { UserDetailModal } from "./UserDetailModal";

export function UserTable({
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
    banUser,
}) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailUser, setDetailUser] = useState(null);
    const [modalMode, setModalMode] = useState(null); // "block" | "unblock" | "ban" | null

    const handleOpenBlock = (u) => {
        setSelectedUser(u);
        setModalMode("block");
    };

    const handleOpenUnblock = (u) => {
        setSelectedUser(u);
        setModalMode("unblock");
    };

    const handleOpenBan = (u) => {
        setSelectedUser(u);
        setModalMode("ban");
    };

    const handleOpenDetail = (u) => {
        setDetailUser(u);
    };

    const handleCloseModal = () => {
        setSelectedUser(null);
        setModalMode(null);
    };

    return (
        <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by handle, name, email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-secondary/50 pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Filter size={14} className="text-muted-foreground shrink-0" />
                    <div className="flex rounded-xl border border-border/60 bg-secondary/40 p-0.5 text-xs">
                        {[
                            { value: "all", label: "All Users" },
                            { value: "active", label: "Active" },
                            { value: "blocked", label: "Blocked" },
                        ].map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setIsBlockedFilter(value)}
                                className={`rounded-lg px-2.5 py-1 font-medium transition-all ${isBlockedFilter === value ? "bg-cyan-500 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <Card className="overflow-hidden border-border/50 bg-card/60 backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-border/50 bg-secondary/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Followers</th>
                                <th className="px-4 py-3">Joined</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center">
                                        <EmptyState
                                            title="No users found"
                                            description="No registered user accounts match your search or filter criteria."
                                        />
                                    </td>
                                </tr>
                            )}

                            {users.map((u) => {
                                const isBlocked = u.isBlocked === true;
                                const isAdmin = u.role === "admin";

                                return (
                                    <tr key={u.id || u._id} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 font-bold uppercase ring-1 ring-cyan-500/30">
                                                    {u.avatarUrl ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={u.avatarUrl} alt={u.name || u.handle} className="h-9 w-9 rounded-xl object-cover" />
                                                    ) : (
                                                        (u.name?.[0] || u.handle?.[0] || "U")
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground truncate">{u.name || "Unnamed"}</p>
                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                        {u.handle ? (u.handle.startsWith("@") ? u.handle : `@${u.handle}`) : u.email || "No handle"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {isAdmin ? (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/30">
                                                    <Shield size={11} /> Admin
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground font-medium">User</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isBlocked ? (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                                                    <UserX size={11} /> Blocked
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                                                    <UserCheck size={11} /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground font-medium">
                                            {u.followersCount ?? 0}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleOpenDetail(u)}
                                                    className="h-7 px-2 text-xs"
                                                    title="View Details"
                                                >
                                                    <Eye size={13} />
                                                </Button>

                                                {!isAdmin && (
                                                    <>
                                                        {isBlocked ? (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleOpenUnblock(u)}
                                                                className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                title="Unblock User"
                                                            >
                                                                <UserCheck size={13} />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => handleOpenBlock(u)}
                                                                className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                                                                title="Block User"
                                                            >
                                                                <UserX size={13} />
                                                            </Button>
                                                        )}

                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleOpenBan(u)}
                                                            className="h-7 px-2 text-xs"
                                                            title="Permanent Ban"
                                                        >
                                                            <ShieldAlert size={13} />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border/50 px-4 py-3 text-xs text-muted-foreground">
                        <span>
                            Showing Page <strong className="text-foreground">{pagination.page}</strong> of <strong className="text-foreground">{pagination.totalPages}</strong> ({pagination.totalItems} users total)
                        </span>
                        <div className="flex gap-1.5">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => fetchPage(pagination.page - 1)}
                                disabled={!pagination.hasPrevPage || loading}
                                className="h-7 w-7 p-0"
                            >
                                <ChevronLeft size={14} />
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => fetchPage(pagination.page + 1)}
                                disabled={!pagination.hasNextPage || loading}
                                className="h-7 w-7 p-0"
                            >
                                <ChevronRight size={14} />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Modals */}
            <UserDetailModal
                isOpen={Boolean(detailUser)}
                onClose={() => setDetailUser(null)}
                user={detailUser}
                onOpenBlock={handleOpenBlock}
                onOpenUnblock={handleOpenUnblock}
                onOpenBan={handleOpenBan}
            />

            <BlockUserModal
                isOpen={modalMode === "block"}
                onClose={handleCloseModal}
                user={selectedUser}
                onConfirm={(reason) => blockUser(selectedUser.id || selectedUser._id, reason)}
                loading={actionLoading}
            />

            <UnblockUserModal
                isOpen={modalMode === "unblock"}
                onClose={handleCloseModal}
                user={selectedUser}
                onConfirm={(reason) => unblockUser(selectedUser.id || selectedUser._id, reason)}
                loading={actionLoading}
            />

            <BanUserModal
                isOpen={modalMode === "ban"}
                onClose={handleCloseModal}
                user={selectedUser}
                onConfirm={({ reason, confirmationHandle }) =>
                    banUser(selectedUser.id || selectedUser._id, { reason, confirmationHandle })
                }
                loading={actionLoading}
            />
        </div>
    );
}
