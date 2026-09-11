"use client";

import { useState } from "react";
import {
    Flag,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter
} from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/feedback/EmptyState";
import { ReportDetailModal } from "./ReportDetailModal";

export function ReportsQueue({
    reports,
    pagination,
    statusFilter,
    setStatusFilter,
    loading,
    actionLoading,
    fetchPage,
    resolveReport,
    dismissReport,
}) {
    const [selectedReport, setSelectedReport] = useState(null);

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Filter Status:</span>
                    <div className="flex rounded-xl border border-border/60 bg-secondary/40 p-0.5 text-xs">
                        {[
                            { value: "all", label: "All" },
                            { value: "pending", label: "Pending" },
                            { value: "resolved", label: "Resolved" },
                            { value: "dismissed", label: "Dismissed" },
                        ].map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setStatusFilter(value)}
                                className={`rounded-lg px-3 py-1 font-medium transition-all ${statusFilter === value ? "bg-cyan-500 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reports Table Card */}
            <Card className="overflow-hidden border-border/50 bg-card/60 backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-border/50 bg-secondary/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3">Report ID</th>
                                <th className="px-4 py-3">Target</th>
                                <th className="px-4 py-3">Reason</th>
                                <th className="px-4 py-3">Reporter</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {reports.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center">
                                        <EmptyState
                                            title="No reports found"
                                            description="There are currently no reports matching the selected filter."
                                        />
                                    </td>
                                </tr>
                            )}

                            {reports.map((r) => {
                                const isPending = r.status === "pending";
                                const isResolved = r.status === "resolved";
                                const isDismissed = r.status === "dismissed";

                                return (
                                    <tr key={r._id || r.id} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                                            #{(r._id || r.id).slice(-6)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-400 border border-cyan-500/30">
                                                    {r.targetType}
                                                </span>
                                                <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
                                                    {r.targetId}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-foreground truncate max-w-[180px]">
                                                {r.reason}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-foreground truncate max-w-[140px]">
                                                {r.reporter?.name || "Unknown User"}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground truncate">
                                                {r.reporter?.handle ? `@${r.reporter.handle.replace(/^@/, "")}` : r.reporterId || "—"}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {isPending && (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                                                    <AlertCircle size={10} /> Pending
                                                </span>
                                            )}
                                            {isResolved && (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                                                    <CheckCircle2 size={10} /> Resolved
                                                </span>
                                            )}
                                            {isDismissed && (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/15 px-2 py-0.5 text-[10px] font-bold text-zinc-400 border border-zinc-500/30">
                                                    <XCircle size={10} /> Dismissed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-[11px]">
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setSelectedReport(r)}
                                                className="h-7 px-2.5 text-xs gap-1"
                                            >
                                                <Eye size={13} /> Review
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
                            Showing Page <strong className="text-foreground">{pagination.page}</strong> of <strong className="text-foreground">{pagination.totalPages}</strong> ({pagination.totalItems} reports)
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

            {/* Report Review Modal */}
            <ReportDetailModal
                isOpen={Boolean(selectedReport)}
                onClose={() => setSelectedReport(null)}
                report={selectedReport}
                onResolve={resolveReport}
                onDismiss={dismissReport}
                loading={actionLoading}
            />
        </div>
    );
}
