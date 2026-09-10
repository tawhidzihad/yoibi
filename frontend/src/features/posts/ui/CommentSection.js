"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Send, AlertCircle, MessageSquare } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { postsApi } from "../api/postsApi";
import { Button } from "@/shared/ui/Button";

const commentSchema = z.object({
    content: z.string().trim().min(1, "Comment cannot be empty").max(1000, "Comment cannot exceed 1000 characters"),
});

function formatRelative(isoString) {
    if (!isoString) return "";
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${Math.max(1, diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

function CommentAvatar({ name, avatarUrl }) {
    if (avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={avatarUrl}
                alt={name || "User"}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
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
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
            {initials}
        </div>
    );
}

export function CommentSection({ postId, postAuthorId, initialComments = [], onCommentCountChange }) {
    const router = useRouter();
    const { user, status } = useAuth();
    const [comments, setComments] = useState(initialComments);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(commentSchema),
        defaultValues: { content: "" },
    });

    useEffect(() => {
        let isCancelled = false;
        async function loadComments() {
            if (initialComments && initialComments.length > 0) return;
            setLoading(true);
            try {
                const res = await postsApi.getComments(postId);
                if (!isCancelled && res.success && res.data?.items) {
                    setComments(res.data.items);
                }
            } catch (err) {
                console.warn("[CommentSection] Failed to load comments:", err);
            } finally {
                if (!isCancelled) setLoading(false);
            }
        }
        loadComments();
        return () => {
            isCancelled = true;
        };
    }, [postId, initialComments]);

    const onAddComment = async (data) => {
        setError("");
        if (status !== "authenticated" || !user) {
            router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
            return;
        }

        try {
            const res = await postsApi.createComment(postId, { content: data.content });
            if (!res.success) {
                setError(res.error?.message || "Failed to post comment.");
                return;
            }

            reset();
            const newComment = res.data;
            setComments((prev) => [...prev, newComment]);
            if (onCommentCountChange) {
                onCommentCountChange(comments.length + 1);
            }
        } catch (err) {
            setError(err.message || "Failed to post comment.");
        }
    };

    const onDeleteComment = async (commentId) => {
        if (status !== "authenticated" || !user) {
            router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
            return;
        }

        const prevComments = [...comments];
        setComments((prev) => prev.filter((c) => (c.id || c._id) !== commentId));
        if (onCommentCountChange) {
            onCommentCountChange(Math.max(0, comments.length - 1));
        }

        try {
            const res = await postsApi.deleteComment(postId, commentId);
            if (!res.success) {
                setComments(prevComments);
                if (onCommentCountChange) {
                    onCommentCountChange(prevComments.length);
                }
                setError(res.error?.message || "Failed to delete comment.");
            }
        } catch {
            setComments(prevComments);
            if (onCommentCountChange) {
                onCommentCountChange(prevComments.length);
            }
            setError("Failed to delete comment.");
        }
    };

    return (
        <div className="mt-3 border-t border-border/40 pt-3">
            {/* New Comment Input */}
            <form onSubmit={handleSubmit(onAddComment)} className="mb-4">
                <div className="flex gap-2">
                    <CommentAvatar name={user?.name} avatarUrl={user?.avatarUrl} />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-secondary/30 px-3 py-1.5 focus-within:border-cyan-500">
                            <input
                                {...register("content")}
                                placeholder={
                                    status === "authenticated"
                                        ? "Write a reply..."
                                        : "Log in to join the conversation..."
                                }
                                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                loading={isSubmitting}
                                disabled={isSubmitting}
                                className="h-7 px-2.5 text-xs gap-1"
                            >
                                <Send size={12} aria-hidden="true" />
                                <span>Reply</span>
                            </Button>
                        </div>
                        {errors.content && (
                            <p className="mt-1 text-xs text-destructive">{errors.content.message}</p>
                        )}
                        {error && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
                                <AlertCircle size={12} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>
            </form>

            {/* Comments List */}
            {loading ? (
                <div className="py-3 text-center text-xs text-muted-foreground">Loading comments...</div>
            ) : comments.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                    <MessageSquare size={14} />
                    <span>No comments yet. Be the first to reply!</span>
                </div>
            ) : (
                <div className="space-y-3">
                    {comments.map((comment) => {
                        const commentId = comment.id || comment._id;
                        const isAuthor = user?.id && (user.id === comment.authorId || user.id === comment.author?.id);
                        const isPostOwner = user?.id && user.id === postAuthorId;
                        const isAdmin = user?.role === "admin";
                        const canDelete = isAuthor || isPostOwner || isAdmin;

                        return (
                            <div key={commentId} className="flex gap-2.5 rounded-lg p-1 text-xs">
                                <CommentAvatar name={comment.author?.name} avatarUrl={comment.author?.avatarUrl} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-semibold text-foreground">
                                                {comment.author?.name || "User"}
                                            </span>
                                            <span className="text-muted-foreground">
                                                @{comment.author?.handle?.replace(/^@/, "") || "user"}
                                            </span>
                                            <span className="text-muted-foreground">·</span>
                                            <span className="text-muted-foreground">
                                                {formatRelative(comment.createdAt)}
                                            </span>
                                        </div>
                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => onDeleteComment(commentId)}
                                                className="cursor-pointer text-muted-foreground transition-colors hover:text-destructive p-1 rounded"
                                                aria-label="Delete comment"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-1 text-foreground/90 leading-relaxed whitespace-pre-line">
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
