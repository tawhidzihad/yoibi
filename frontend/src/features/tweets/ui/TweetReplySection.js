"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Trash2, AlertCircle } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { tweetsApi } from "../api/tweetsApi";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { cn } from "@/shared/utils/cn";

const replySchema = z.object({
    content: z
        .string()
        .min(1, "Reply cannot be empty")
        .max(280, "Reply cannot exceed 280 characters"),
});

function formatRelative(isoString) {
    if (!isoString) return "";
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${Math.max(1, diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

function ReplyAvatar({ name, avatarUrl }) {
    if (avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={avatarUrl}
                alt={name || "User avatar"}
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border"
            />
        );
    }
    const initials = (name || "U")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
            {initials}
        </div>
    );
}

export function TweetReplySection({ tweetId, initialReplies = [], onRepliesCountChange }) {
    const router = useRouter();
    const { user, status } = useAuth();
    const [replies, setReplies] = useState(initialReplies);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(replySchema),
        defaultValues: { content: "" },
    });

    const contentValue = useWatch({ control, name: "content", defaultValue: "" }) || "";
    const remainingChars = 280 - contentValue.length;

    const fetchReplies = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await tweetsApi.getReplies(tweetId);
            if (!res.success) {
                setError(res.error?.message || "Failed to load replies.");
            } else {
                const items = res.data?.items || res.data || [];
                setReplies(items);
                if (onRepliesCountChange) {
                    onRepliesCountChange(items.length);
                }
            }
        } catch (err) {
            setError(err.message || "Failed to load replies.");
        } finally {
            setLoading(false);
        }
    }, [tweetId, onRepliesCountChange]);

    useEffect(() => {
        let isCancelled = false;
        async function load() {
            if (initialReplies && initialReplies.length > 0) return;
            setLoading(true);
            try {
                const res = await tweetsApi.getReplies(tweetId);
                if (!isCancelled && res.success) {
                    const items = res.data?.items || res.data || [];
                    setReplies(items);
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(err.message || "Failed to load replies.");
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            isCancelled = true;
        };
    }, [tweetId, initialReplies]);

    const onSubmitReply = async (data) => {
        if (status !== "authenticated" || !user) {
            router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
            return;
        }

        try {
            const res = await tweetsApi.createReply(tweetId, {
                content: data.content.trim(),
            });

            if (!res.success) {
                setError(res.error?.message || "Failed to post reply.");
                return;
            }

            reset();
            // Server confirmed the reply (source of truth) — only now update
            // the visible reply list and the parent tweet's reply count.
            const newReply = res.data;
            const nextReplies = [...replies, newReply];
            setReplies(nextReplies);
            if (onRepliesCountChange) {
                onRepliesCountChange(nextReplies.length);
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        }
    };

    const confirmDeleteReply = async () => {
        if (!deleteTargetId) return;
        setIsDeleting(true);
        try {
            const res = await tweetsApi.deleteTweet(deleteTargetId);
            if (!res.success) {
                setError(res.error?.message || "Failed to delete reply.");
                setIsDeleting(false);
                return;
            }

            const nextReplies = replies.filter((r) => r.id !== deleteTargetId);
            setReplies(nextReplies);
            if (onRepliesCountChange) {
                onRepliesCountChange(Math.max(0, nextReplies.length));
            }
            setDeleteTargetId(null);
        } catch (err) {
            setError(err.message || "Failed to delete reply.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="mt-3 border-t border-border/40 pt-3">
            {/* Thread of Replies */}
            {loading ? (
                <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
                    Loading replies...
                </div>
            ) : replies.length > 0 ? (
                <div className="space-y-3 pb-3">
                    {replies.map((reply, idx) => {
                        const replyAuthorId = reply.author?.id || reply.authorId;
                        const isAuthor = user?.id && user.id === replyAuthorId;
                        const isAdmin = user?.role === "admin";
                        const canDelete = isAuthor || isAdmin;
                        const hasThreadBelow = idx < replies.length - 1;

                        return (
                            <div key={reply.id} className="group relative flex gap-2.5 px-2">
                                {/* Thread Connector Line */}
                                <div className="flex flex-col items-center">
                                    <ReplyAvatar
                                        name={reply.author?.name}
                                        avatarUrl={reply.author?.avatarUrl}
                                    />
                                    {hasThreadBelow && (
                                        <div className="mt-1 w-0.5 flex-1 min-h-3 bg-border/60" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-xs font-semibold text-foreground">
                                                {reply.author?.name || "User"}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">
                                                @{reply.author?.handle || "user"}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">·</span>
                                            <span className="text-[11px] text-muted-foreground">
                                                {formatRelative(reply.createdAt)}
                                            </span>
                                        </div>

                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTargetId(reply.id)}
                                                className="cursor-pointer text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                                                aria-label="Delete reply"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>

                                    <p className="mt-0.5 text-xs text-foreground/90 leading-relaxed break-words">
                                        {reply.content}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : null}

            {/* Error Message */}
            {error && (
                <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                    <AlertCircle size={13} />
                    <span>{error}</span>
                </div>
            )}

            {/* Reply Input Form */}
            <form onSubmit={handleSubmit(onSubmitReply)} className="flex items-start gap-2 pt-1">
                <ReplyAvatar name={user?.name} avatarUrl={user?.avatarUrl} />
                <div className="flex-1">
                    <div className="relative flex items-center rounded-xl border border-border/70 bg-secondary/20 px-3 py-1.5 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/60">
                        <input
                            {...register("content")}
                            type="text"
                            placeholder={
                                status === "authenticated"
                                    ? "Post your reply..."
                                    : "Log in to reply..."
                            }
                            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />

                        <div className="flex items-center gap-2 pl-2">
                            <span
                                className={cn(
                                    "text-[10px] font-mono",
                                    remainingChars < 0
                                        ? "text-destructive font-bold"
                                        : "text-muted-foreground"
                                )}
                            >
                                {remainingChars}
                            </span>
                            <button
                                type="submit"
                                disabled={isSubmitting || !contentValue.trim() || remainingChars < 0}
                                className="cursor-pointer text-cyan-600 hover:text-cyan-500 disabled:opacity-40 dark:text-cyan-400"
                                aria-label="Send reply"
                            >
                                <Send size={13} />
                            </button>
                        </div>
                    </div>
                    {errors.content && (
                        <p className="mt-1 text-[11px] text-destructive">{errors.content.message}</p>
                    )}
                </div>
            </form>

            {/* Delete Reply Confirmation Modal */}
            <Modal
                isOpen={Boolean(deleteTargetId)}
                onClose={() => setDeleteTargetId(null)}
                title="Delete reply?"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This cannot be undone and will permanently remove your reply.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTargetId(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={confirmDeleteReply}
                            loading={isDeleting}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
