"use client";

import { useState } from "react";
import {
    FileText,
    Shield,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    Calendar,
    Layers,
    User
} from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { EmptyState } from "@/shared/feedback/EmptyState";

export function AuditLogViewer({
    auditLogs,
    pagination,
    actionFilter,
    setActionFilter,
    loading,
    fetchPage,
}) {
    const [selectedLog, setSelectedLog] = useState(null);

    const actionTypes = [
        { value: "all",            label: "All Actions" },
        { value: "BAN_USER",       label: "Ban User" },
        { value: "BLOCK_USER",     label: "Block User" },
        { value: "UNBLOCK_USER",   label: "Unblock User" },
        { value: "DELETE_CONTENT", label: "Delete Content" },
        { value: "RESOLVE_REPORT", label: "Resolve Report" },
    ];

    const getStatusBadge = (status) => {
        switch (status) {
            case "COMPLETED":
                return (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={10} /> COMPLETED
                    </span>
                );
            case "PARTIAL":
                return (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                        <AlertTriangle size={10} /> PARTIAL
                    </span>
                );
            case "FAILED":
                return (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                        <XCircle size={10} /> FAILED
                    </span>
                );
            case "IN_PROGRESS":
                return (
                    <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/30 animate-pulse">
                        IN PROGRESS
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {status || "REQUESTED"}
                    </span>
                );
        }
    };

    const getActionColor = (action) => {
        if (action === "BAN_USER") return "text-rose-400 bg-rose-500/15 border-rose-500/30";
        if (action === "BLOCK_USER") return "text-amber-400 bg-amber-500/15 border-amber-500/30";
        if (action === "UNBLOCK_USER") return "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
        if (action === "DELETE_CONTENT") return "text-sky-400 bg-sky-500/15 border-sky-500/30";
        if (action === "RESOLVE_REPORT") return "text-purple-400 bg-purple-500/15 border-purple-500/30";
        return "text-cyan-400 bg-cyan-500/15 border-cyan-500/30";
    };

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Action Type:</span>
                    <div className="flex flex-wrap rounded-xl border border-border/60 bg-secondary/40 p-0.5 text-xs">
                        {actionTypes.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setActionFilter(value)}
                                className={`rounded-lg px-2.5 py-1 font-medium transition-all ${actionFilter === value ? "bg-cyan-500 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Audit Logs Table */}
            <Card className="overflow-hidden border-border/50 bg-card/60 backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-border/50 bg-secondary/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3">Timestamp</th>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Admin</th>
                                <th className="px-4 py-3">Target</th>
                                <th className="px-4 py-3">Reason</th>
                                <th className="px-4 py-3 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {auditLogs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center">
                                        <EmptyState
                                            title="No audit logs found"
                                            description="No moderation actions have been recorded matching the selected filter."
                                        />
                                    </td>
                                </tr>
                            )}

                            {auditLogs.map((log) => {
                                const id = log._id || log.id;

                                return (
                                    <tr key={id} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                                            {new Date(log.createdAt || log.startedAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(log.status)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {log.admin?.name || log.admin?.handle ? `@${(log.admin?.handle || "").replace(/^@/, "")}` : log.adminId || "Admin"}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
                                            {log.targetUserId || log.targetId || "—"}
                                        </td>
                                        <td className="px-4 py-3 max-w-[180px]">
                                            <p className="text-foreground truncate font-medium">
                                                {log.reason || "—"}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setSelectedLog(log)}
                                                className="h-7 px-2 text-xs"
                                                title="View Log Payload"
                                            >
                                                <Eye size={13} />
                                            </Button>
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
                            Showing Page <strong className="text-foreground">{pagination.page}</strong> of <strong className="text-foreground">{pagination.totalPages}</strong> ({pagination.totalItems} entries)
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

            {/* Audit Log Detail Modal */}
            <Modal
                isOpen={Boolean(selectedLog)}
                onClose={() => setSelectedLog(null)}
                title={`Audit Record: ${selectedLog?.action || "Log"} #${(selectedLog?._id || selectedLog?.id || "").slice(-8)}`}
                size="lg"
            >
                {selectedLog && (
                    <div className="space-y-4 text-xs">
                        {/* Summary Header */}
                        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-3.5">
                            <div className="flex items-center gap-2">
                                <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase border ${getActionColor(selectedLog.action)}`}>
                                    {selectedLog.action}
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                                {getStatusBadge(selectedLog.status)}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                                <Calendar size={12} /> {new Date(selectedLog.createdAt || selectedLog.startedAt).toLocaleString()}
                            </div>
                        </div>

                        {/* Actors & Targets */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-1">
                                <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                                    <Shield size={13} className="text-cyan-400" /> Executing Admin
                                </div>
                                <p className="font-semibold text-foreground">
                                    {selectedLog.admin?.name || "Admin"}
                                </p>
                                <p className="font-mono text-[10px] text-muted-foreground break-all">
                                    ID: {selectedLog.adminId}
                                </p>
                            </div>

                            <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-1">
                                <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                                    <User size={13} className="text-cyan-400" /> Target Resource / User
                                </div>
                                <p className="font-semibold text-foreground truncate">
                                    {selectedLog.targetUser?.name || selectedLog.targetId || "User Purged"}
                                </p>
                                <p className="font-mono text-[10px] text-muted-foreground break-all">
                                    Target ID: {selectedLog.targetUserId || selectedLog.targetId || "—"}
                                </p>
                            </div>
                        </div>

                        {/* Reason Box */}
                        <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-1">
                            <span className="font-semibold text-muted-foreground">Stated Moderation Reason:</span>
                            <p className="text-foreground font-medium text-sm">{selectedLog.reason || "No reason recorded"}</p>
                        </div>

                        {/* Ban Deletion Counts if Ban Record */}
                        {selectedLog.action === "BAN_USER" && selectedLog.deletedCounts && (
                            <div className="rounded-xl border border-border/50 bg-secondary/20 p-3.5 space-y-2">
                                <span className="font-bold text-foreground flex items-center gap-1.5">
                                    <Layers size={13} className="text-cyan-400" /> Data Purge Statistics
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center pt-1">
                                    <div className="rounded-lg bg-secondary/60 p-2 border border-border/40">
                                        <p className="text-sm font-bold text-foreground">{selectedLog.deletedCounts.tweets ?? 0}</p>
                                        <p className="text-[10px] text-muted-foreground">Tweets Purged</p>
                                    </div>
                                    <div className="rounded-lg bg-secondary/60 p-2 border border-border/40">
                                        <p className="text-sm font-bold text-foreground">{selectedLog.deletedCounts.videos ?? 0}</p>
                                        <p className="text-[10px] text-muted-foreground">Videos Purged</p>
                                    </div>
                                    <div className="rounded-lg bg-secondary/60 p-2 border border-border/40">
                                        <p className="text-sm font-bold text-foreground">{selectedLog.deletedCounts.follows ?? 0}</p>
                                        <p className="text-[10px] text-muted-foreground">Follows Cleared</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* External Snapshots (Cloudinary & LiveKit) */}
                        {selectedLog.externalSnapshots && (
                            <div className="rounded-xl border border-border/50 bg-secondary/20 p-3.5 space-y-2">
                                <span className="font-bold text-foreground flex items-center gap-1.5">
                                    <FileText size={13} className="text-cyan-400" /> External Provider Snapshots
                                </span>
                                <pre className="max-h-40 overflow-y-auto rounded-lg bg-background/80 p-2.5 font-mono text-[10px] text-muted-foreground border border-border/40 select-all">
                                    {JSON.stringify(selectedLog.externalSnapshots, null, 2)}
                                </pre>
                            </div>
                        )}

                        {/* Failed Cleanups if any */}
                        {selectedLog.failedCleanups && selectedLog.failedCleanups.length > 0 && (
                            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 space-y-1.5 text-rose-300">
                                <span className="font-bold text-rose-200 flex items-center gap-1.5">
                                    <AlertTriangle size={13} /> Unresolved Cleanup Items (Resumable)
                                </span>
                                <pre className="max-h-32 overflow-y-auto rounded-lg bg-background/80 p-2 font-mono text-[10px] text-rose-300 border border-rose-500/30">
                                    {JSON.stringify(selectedLog.failedCleanups, null, 2)}
                                </pre>
                            </div>
                        )}

                        <div className="flex justify-end pt-2 border-t border-border/40">
                            <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
