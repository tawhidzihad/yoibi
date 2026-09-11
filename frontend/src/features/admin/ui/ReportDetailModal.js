"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flag, CheckCircle2, XCircle, AlertCircle, Loader2, Calendar, User, Layers } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";

const reportActionSchema = z.object({
    resolutionNotes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
});

export function ReportDetailModal({
    isOpen,
    onClose,
    report,
    onResolve,
    onDismiss,
    loading,
}) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(reportActionSchema),
        defaultValues: {
            resolutionNotes: "",
        },
    });

    if (!report) return null;

    const isPending = report.status === "pending";
    const isResolved = report.status === "resolved";
    const isDismissed = report.status === "dismissed";

    const handleResolve = async (data) => {
        const res = await onResolve(report._id || report.id, data.resolutionNotes);
        if (res?.success) {
            reset();
            onClose();
        }
    };

    const handleDismiss = async (data) => {
        const res = await onDismiss(report._id || report.id, data.resolutionNotes);
        if (res?.success) {
            reset();
            onClose();
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Report #${(report._id || report.id).slice(-8)}`}
            size="lg"
        >
            <div className="space-y-4">
                {/* Header Status Banner */}
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-3">
                    <div className="flex items-center gap-2">
                        <Flag size={16} className="text-cyan-400" />
                        <span className="text-xs font-semibold text-foreground">Target Type:</span>
                        <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[11px] font-bold uppercase text-cyan-400 border border-cyan-500/30">
                            {report.targetType}
                        </span>
                    </div>

                    <div>
                        {isPending && (
                            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <AlertCircle size={12} /> Pending Review
                            </span>
                        )}
                        {isResolved && (
                            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Resolved
                            </span>
                        )}
                        {isDismissed && (
                            <span className="rounded-md bg-zinc-500/15 px-2 py-0.5 text-[11px] font-bold text-zinc-400 border border-zinc-500/30 flex items-center gap-1">
                                <XCircle size={12} /> Dismissed
                            </span>
                        )}
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Reporter Box */}
                    <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-1">
                        <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                            <User size={13} className="text-cyan-400" /> Reporter
                        </div>
                        <p className="font-semibold text-foreground truncate">
                            {report.reporter?.name || "Unknown User"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            {report.reporter?.handle ? `@${report.reporter.handle.replace(/^@/, "")}` : `ID: ${report.reporterId || "—"}`}
                        </p>
                    </div>

                    {/* Target Identifier */}
                    <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-1">
                        <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                            <Layers size={13} className="text-cyan-400" /> Target ID
                        </div>
                        <p className="font-mono text-foreground break-all text-[11px] select-all bg-secondary/60 p-1.5 rounded-lg border border-border/40">
                            {report.targetId}
                        </p>
                    </div>
                </div>

                {/* Reported Reason & Description */}
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3.5 space-y-2 text-xs">
                    <div>
                        <span className="font-semibold text-muted-foreground">Reported Reason:</span>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">{report.reason}</p>
                    </div>
                    {report.description && (
                        <div className="pt-2 border-t border-border/30">
                            <span className="font-semibold text-muted-foreground">Additional Details:</span>
                            <p className="mt-0.5 text-xs text-foreground/90 leading-relaxed">{report.description}</p>
                        </div>
                    )}
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                        <Calendar size={11} /> Filed on: {new Date(report.createdAt).toLocaleString()}
                    </div>
                </div>

                {/* Existing Resolution Notes if already resolved/dismissed */}
                {!isPending && report.resolutionNotes && (
                    <div className="rounded-xl border border-border/50 bg-secondary/30 p-3 text-xs space-y-1">
                        <span className="font-semibold text-muted-foreground">Resolution Notes:</span>
                        <p className="text-foreground">{report.resolutionNotes}</p>
                        {report.resolvedAt && (
                            <p className="text-[10px] text-muted-foreground">
                                Resolved on: {new Date(report.resolvedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                )}

                {/* Moderation Actions for Pending Reports */}
                {isPending && (
                    <div className="space-y-3 pt-2 border-t border-border/40">
                        <div className="space-y-1.5">
                            <label htmlFor="res-notes" className="text-xs font-semibold text-foreground">
                                Admin Resolution Note (Optional)
                            </label>
                            <textarea
                                id="res-notes"
                                rows={2}
                                placeholder="Explain resolution or reason for dismissal..."
                                {...register("resolutionNotes")}
                                className="w-full rounded-xl border border-border/60 bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            {errors.resolutionNotes && (
                                <p className="text-xs text-destructive">{errors.resolutionNotes.message}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleSubmit(handleDismiss)}
                                disabled={loading}
                                className="gap-1.5 text-zinc-400 hover:text-zinc-300"
                            >
                                {loading ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                                Dismiss Report
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSubmit(handleResolve)}
                                disabled={loading}
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            >
                                {loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                Resolve & Close
                            </Button>
                        </div>
                    </div>
                )}

                {!isPending && (
                    <div className="flex justify-end pt-2 border-t border-border/40">
                        <Button variant="secondary" size="sm" onClick={handleClose}>
                            Close
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
