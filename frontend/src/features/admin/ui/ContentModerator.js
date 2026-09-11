"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    FileText,
    Play,
    Radio,
    UsersRound,
    Search,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Eye
} from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { EmptyState } from "@/shared/feedback/EmptyState";

const deleteContentSchema = z.object({
    reason: z
        .string()
        .min(3, "Please provide a reason (minimum 3 characters).")
        .max(500, "Reason cannot exceed 500 characters."),
});

export function ContentModerator({
    contentType,
    setContentType,
    items,
    pagination,
    search,
    setSearch,
    loading,
    actionLoading,
    fetchPage,
    deleteItem,
}) {
    const [selectedItem, setSelectedItem] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(deleteContentSchema),
        defaultValues: {
            reason: "",
        },
    });

    const contentTypes = [
        { type: "tweet",  label: "Tweets",  icon: FileText },
        { type: "video",  label: "Videos",  icon: Play },
        { type: "stream", label: "Streams", icon: Radio },
        { type: "meetup", label: "Meet-Up", icon: UsersRound },
    ];

    const handleDeleteSubmit = async (data) => {
        const id = selectedItem?._id || selectedItem?.id;
        const res = await deleteItem(id, data.reason);
        if (res?.success) {
            reset();
            setSelectedItem(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Type Selector Tabs & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Content Type Tabs */}
                <div className="flex rounded-xl border border-border/60 bg-secondary/40 p-0.5 text-xs w-full sm:w-auto">
                    {contentTypes.map(({ type, label, icon: Icon }) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setContentType(type)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${contentType === type ? "bg-cyan-500 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Icon size={14} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={`Search ${contentType}s...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-secondary/50 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>
            </div>

            {/* Content Table Card */}
            <Card className="overflow-hidden border-border/50 bg-card/60 backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-border/50 bg-secondary/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3">Item Details</th>
                                <th className="px-4 py-3">Author / Owner</th>
                                <th className="px-4 py-3">Metrics / Status</th>
                                <th className="px-4 py-3">Created</th>
                                <th className="px-4 py-3 text-right">Moderation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {items.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">
                                        <EmptyState
                                            title={`No ${contentType}s found`}
                                            description={`No content items match your search in the ${contentType} domain.`}
                                        />
                                    </td>
                                </tr>
                            )}

                            {items.map((item) => {
                                const id = item._id || item.id;
                                const author = item.author || item.owner;

                                return (
                                    <tr key={id} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-3 max-w-[280px]">
                                            <p className="font-semibold text-foreground truncate">
                                                {item.content || item.title || item.name || "Untitled"}
                                            </p>
                                            <p className="font-mono text-[10px] text-muted-foreground truncate">
                                                ID: {id}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-foreground truncate max-w-[140px]">
                                                {author?.name || "Unknown Author"}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground truncate">
                                                {author?.handle ? `@${author.handle.replace(/^@/, "")}` : (item.authorId || item.ownerId || "—")}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {contentType === "tweet" && (
                                                <span className="text-muted-foreground">
                                                    {item.likesCount ?? 0} likes • {item.repliesCount ?? 0} replies
                                                </span>
                                            )}
                                            {contentType === "video" && (
                                                <span className="text-muted-foreground">
                                                    {item.likesCount ?? 0} likes • {item.viewsCount ?? 0} views
                                                </span>
                                            )}
                                            {contentType === "stream" && (
                                                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase border ${item.status === "live" ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"}`}>
                                                    {item.status || "ended"}
                                                </span>
                                            )}
                                            {contentType === "meetup" && (
                                                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase border ${item.status === "active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"}`}>
                                                    {item.status || "ended"} ({item.currentParticipants?.length ?? 0}/{item.maxParticipants ?? 10})
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-[11px]">
                                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setPreviewItem(item)}
                                                    className="h-7 px-2 text-xs"
                                                    title="Preview Content"
                                                >
                                                    <Eye size={13} />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setSelectedItem(item)}
                                                    className="h-7 px-2 text-xs"
                                                    title="Delete Item"
                                                >
                                                    <Trash2 size={13} />
                                                </Button>
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
                            Showing Page <strong className="text-foreground">{pagination.page}</strong> of <strong className="text-foreground">{pagination.totalPages}</strong> ({pagination.totalItems} {contentType}s)
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

            {/* Content Preview Modal */}
            <Modal
                isOpen={Boolean(previewItem)}
                onClose={() => setPreviewItem(null)}
                title={`Preview: ${contentType.toUpperCase()} #${(previewItem?._id || previewItem?.id || "").slice(-6)}`}
                size="md"
            >
                {previewItem && (
                    <div className="space-y-4 text-xs">
                        <div className="rounded-xl border border-border/50 bg-secondary/30 p-3.5 space-y-2">
                            <p className="font-semibold text-foreground text-sm">
                                {previewItem.content || previewItem.title || previewItem.name || "No Title"}
                            </p>
                            {previewItem.description && (
                                <p className="text-muted-foreground">{previewItem.description}</p>
                            )}
                        </div>

                        <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-1 font-mono text-[11px]">
                            <div><strong>ID:</strong> {previewItem._id || previewItem.id}</div>
                            <div><strong>Author ID:</strong> {previewItem.authorId || previewItem.ownerId || "—"}</div>
                            <div><strong>Created:</strong> {new Date(previewItem.createdAt).toLocaleString()}</div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-border/40">
                            <Button variant="secondary" size="sm" onClick={() => setPreviewItem(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Content Modal */}
            <Modal
                isOpen={Boolean(selectedItem)}
                onClose={() => setSelectedItem(null)}
                title={`Delete ${contentType}: #${(selectedItem?._id || selectedItem?.id || "").slice(-6)}`}
                size="md"
            >
                <form onSubmit={handleSubmit(handleDeleteSubmit)} className="space-y-4">
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                        <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-destructive" />
                            <div>
                                <p className="font-semibold">Moderate & Remove Content</p>
                                <p className="mt-0.5 text-destructive/80">
                                    Deleting this {contentType} will permanently remove the record and clean up associated media/realtime sessions. An audit log entry will be created.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="del-reason" className="text-xs font-semibold text-foreground">
                            Moderation Reason <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            id="del-reason"
                            rows={3}
                            placeholder="e.g. Violation of community guidelines regarding harassment or copyright..."
                            {...register("reason")}
                            className="w-full rounded-xl border border-border/60 bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
                        />
                        {errors.reason && (
                            <p className="text-xs text-destructive">{errors.reason.message}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedItem(null)}
                            disabled={actionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            disabled={actionLoading}
                            className="gap-2"
                        >
                            {actionLoading ? (
                                <Loader2 size={13} className="animate-spin" />
                            ) : (
                                <Trash2 size={13} />
                            )}
                            Confirm Delete
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
