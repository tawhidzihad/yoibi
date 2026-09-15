"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Trash2, AlertCircle, Heart, CornerDownRight } from "lucide-react";
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

/**
 * Skeleton approximating the comment rows that are about to load
 * (avatar circle + author line + text lines) — same idiom as the tweet
 * skeletons in TweetList.
 */
function ReplySkeletonRow() {
    return (
        <div className="flex gap-2.5 px-2 py-1.5">
            <div className="h-8 w-8 shrink-0 rounded-full bg-secondary/80" />
            <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-20 rounded bg-secondary/80" />
                    <div className="h-2.5 w-12 rounded bg-secondary/60" />
                </div>
                <div className="h-2.5 w-full rounded bg-secondary/70" />
                <div className="h-2.5 w-2/3 rounded bg-secondary/70" />
            </div>
        </div>
    );
}

function RepliesSkeleton() {
    return (
        <div className="animate-pulse space-y-3 pb-3">
            <ReplySkeletonRow />
            <ReplySkeletonRow />
        </div>
    );
}

/** Total number of comments in a threaded list (top-level + nested). */
function countThreadComments(items) {
    return items.reduce(
        (sum, comment) => sum + 1 + (Array.isArray(comment.replies) ? comment.replies.length : 0),
        0
    );
}

/**
 * One comment row (top-level or nested): avatar, author, time, text, and the
 * comment's own actions — like (heart + count), reply, and delete when the
 * viewer owns the comment (or is an admin).
 */
function CommentRow({ comment, isNested = false, topLevelCommentId, onLike, onReply, onDelete }) {
    const { user } = useAuth();
    const [liked, setLiked] = useState(Boolean(comment.liked));
    const [likesCount, setLikesCount] = useState(comment.likesCount || 0);

    const commentAuthorId = comment.author?.id || comment.authorId;
    const isAuthor = user?.id && user.id === commentAuthorId;
    const isAdmin = user?.role === "admin";
    const canDelete = isAuthor || isAdmin;

    // "Replying to @handle" context on flattened deep replies: only replies
    // whose direct parent is NOT the top-level comment of the thread.
    const showReplyingTo =
        isNested &&
        comment.parentAuthor?.handle &&
        comment.replyToId &&
        comment.replyToId !== topLevelCommentId;

    const handleLike = () => {
        onLike(comment, { liked, likesCount }, (next) => {
            setLiked(next.liked);
            setLikesCount(next.likesCount);
        });
    };

    return (
        <div className="group relative flex gap-2.5 px-2">
            <ReplyAvatar
                name={comment.author?.name}
                avatarUrl={comment.author?.avatarUrl}
            />

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">
                            {comment.author?.name || "User"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            @{comment.author?.handle || "user"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">
                            {formatRelative(comment.createdAt)}
                        </span>
                    </div>

                    {canDelete && (
                        <button
                            type="button"
                            onClick={() => onDelete(comment.id)}
                            className="cursor-pointer text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                            aria-label="Delete comment"
                        >
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>

                {showReplyingTo && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CornerDownRight size={11} aria-hidden="true" />
                        <span>Replying to @{comment.parentAuthor.handle}</span>
                    </p>
                )}

                <p className="mt-0.5 text-xs text-foreground/90 leading-relaxed break-words">
                    {comment.content}
                </p>

                {/* Comment actions: like (heart + count) and reply */}
                <div className="mt-1 flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleLike}
                        aria-label={liked ? "Unlike comment" : "Like comment"}
                        aria-pressed={liked}
                        id={`comment-like-btn-${comment.id}`}
                        className={cn(
                            "flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded",
                            liked && "text-pink-400 font-semibold"
                        )}
                    >
                        <Heart size={12} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
                        {likesCount > 0 && <span>{likesCount}</span>}
                    </button>

                    <button
                        type="button"
                        onClick={() => onReply(comment)}
                        className="cursor-pointer text-[11px] text-muted-foreground transition-colors hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                        id={`comment-reply-btn-${comment.id}`}
                    >
                        Reply
                    </button>
                </div>
            </div>
        </div>
    );
}

export function TweetReplySection({ tweetId, initialReplies = [], onRepliesCountChange }) {
    const router = useRouter();
    const { user, status } = useAuth();
    // Threaded comments: top-level comments, each with a flat `replies` array
    // holding ALL of its descendants (depth >= 2 flattened, Facebook-style).
    const [comments, setComments] = useState(initialReplies);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    // The comment currently being replied to via the inline composer.
    const [replyTo, setReplyTo] = useState(null);

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

    // Separate form instance for the inline per-thread reply composer.
    const {
        register: registerInline,
        handleSubmit: handleSubmitInline,
        reset: resetInline,
        control: inlineControl,
        formState: { errors: inlineErrors, isSubmitting: isSubmittingInline },
    } = useForm({
        resolver: zodResolver(replySchema),
        defaultValues: { content: "" },
    });

    const contentValue = useWatch({ control, name: "content", defaultValue: "" }) || "";
    const remainingChars = 280 - contentValue.length;
    const inlineContentValue = useWatch({ control: inlineControl, name: "content", defaultValue: "" }) || "";
    const inlineRemainingChars = 280 - inlineContentValue.length;

    const requireAuthOrRedirect = useCallback(() => {
        if (status !== "authenticated" || !user) {
            router.push(`/login?redirect=${encodeURIComponent(`/tweets/${tweetId}`)}`);
            return false;
        }
        return true;
    }, [status, user, router, tweetId]);

    const fetchThread = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await tweetsApi.getReplies(tweetId);
            if (!res.success) {
                setError(res.error?.message || "Failed to load comments.");
            } else {
                const items = res.data?.items || [];
                setComments(items);
                if (onRepliesCountChange) {
                    onRepliesCountChange(countThreadComments(items));
                }
            }
        } catch (err) {
            setError(err.message || "Failed to load comments.");
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
                    const items = res.data?.items || [];
                    setComments(items);
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(err.message || "Failed to load comments.");
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
        if (!requireAuthOrRedirect()) return;

        try {
            const res = await tweetsApi.createReply(tweetId, {
                content: data.content.trim(),
            });

            if (!res.success) {
                setError(res.error?.message || "Failed to post reply.");
                return;
            }

            reset();
            // Server confirmed the comment (source of truth) — only now update
            // the visible thread and the parent tweet's comment count.
            const newComment = { ...res.data, replies: [] };
            const nextComments = [...comments, newComment];
            setComments(nextComments);
            if (onRepliesCountChange) {
                onRepliesCountChange(countThreadComments(nextComments));
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        }
    };

    const onSubmitInlineReply = async (data) => {
        if (!replyTo || !requireAuthOrRedirect()) return;

        const target = replyTo;
        try {
            const res = await tweetsApi.createReply(target.id, {
                content: data.content.trim(),
            });

            if (!res.success) {
                setError(res.error?.message || "Failed to post reply.");
                return;
            }

            resetInline();
            setReplyTo(null);
            // Append the nested reply to its top-level comment's thread group.
            const newReply = {
                ...res.data,
                parentAuthor: target.author || null,
            };
            const ownerId = target.rootCommentId || target.id;
            const nextComments = comments.map((top) => {
                if (top.id !== ownerId) return top;
                return { ...top, replies: [...(top.replies || []), newReply] };
            });
            setComments(nextComments);
            if (onRepliesCountChange) {
                onRepliesCountChange(countThreadComments(nextComments));
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        }
    };

    const handleReplyTo = (comment) => {
        if (!requireAuthOrRedirect()) return;
        resetInline({ content: "" });
        setReplyTo(comment);
    };

    /**
     * Optimistic comment like toggle. The row keeps its own liked/count state;
     * this wrapper performs the API call and rolls the row back on failure.
     */
    const handleCommentLike = async (comment, current, rollback) => {
        if (!requireAuthOrRedirect()) return;

        const nextLiked = !current.liked;
        const nextLikesCount = nextLiked ? current.likesCount + 1 : Math.max(0, current.likesCount - 1);
        rollback({ liked: nextLiked, likesCount: nextLikesCount });

        try {
            const res = nextLiked
                ? await tweetsApi.likeTweet(comment.id)
                : await tweetsApi.unlikeTweet(comment.id);

            if (!res.success) {
                rollback(current);
            } else if (res.data?.likesCount !== undefined) {
                rollback({ liked: nextLiked, likesCount: res.data.likesCount });
            }
        } catch {
            rollback(current);
        }
    };

    const confirmDeleteReply = async () => {
        if (!deleteTargetId) return;
        setIsDeleting(true);
        try {
            const res = await tweetsApi.deleteTweet(deleteTargetId);
            if (!res.success) {
                setError(res.error?.message || "Failed to delete comment.");
                setIsDeleting(false);
                return;
            }

            setDeleteTargetId(null);
            // Deletion cascades server-side (a comment takes its nested
            // replies with it) — silently refetch the authoritative thread.
            await fetchThread();
        } catch (err) {
            setError(err.message || "Failed to delete comment.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Renders the inline reply composer scoped to a comment's thread.
    const renderInlineComposer = () => (
        <form
            key={replyTo ? replyTo.id : "inline-reply"}
            onSubmit={handleSubmitInline(onSubmitInlineReply)}
            className="flex items-start gap-2 pt-1"
        >
            <ReplyAvatar name={user?.name} avatarUrl={user?.avatarUrl} />
            <div className="flex-1">
                <div className="relative flex items-center rounded-xl border border-border/70 bg-secondary/20 px-3 py-1.5 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/60">
                    <input
                        {...registerInline("content")}
                        type="text"
                        autoFocus
                        placeholder={`Reply to ${replyTo?.author?.name || "this comment"}...`}
                        className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />

                    <div className="flex items-center gap-2 pl-2">
                        <span
                            className={cn(
                                "text-[10px] font-mono",
                                inlineRemainingChars < 0
                                    ? "text-destructive font-bold"
                                    : "text-muted-foreground"
                            )}
                        >
                            {inlineRemainingChars}
                        </span>
                        <button
                            type="submit"
                            disabled={isSubmittingInline || !inlineContentValue.trim() || inlineRemainingChars < 0}
                            className="cursor-pointer text-cyan-600 hover:text-cyan-500 disabled:opacity-40 dark:text-cyan-400"
                            aria-label="Send reply"
                        >
                            <Send size={13} />
                        </button>
                    </div>
                </div>
                {inlineErrors.content && (
                    <p className="mt-1 text-[11px] text-destructive">{inlineErrors.content.message}</p>
                )}
            </div>
        </form>
    );

    return (
        <div className="mt-3 border-t border-border/40 pt-3">
            {/* Threaded comments */}
            {loading ? (
                <RepliesSkeleton />
            ) : comments.length > 0 ? (
                <div className="space-y-3 pb-3">
                    {comments.map((topLevel) => {
                        const nested = topLevel.replies || [];
                        const replyingHere = Boolean(
                            replyTo &&
                            (replyTo.id === topLevel.id || replyTo.rootCommentId === topLevel.id)
                        );

                        return (
                            <div key={topLevel.id}>
                                <CommentRow
                                    comment={topLevel}
                                    topLevelCommentId={topLevel.id}
                                    onLike={handleCommentLike}
                                    onReply={handleReplyTo}
                                    onDelete={setDeleteTargetId}
                                />

                                {/* Nested replies — flattened into ONE indented
                                    group under the top-level comment, connected
                                    by the vertical thread line (border-l). */}
                                {(nested.length > 0 || replyingHere) && (
                                    <div className="mt-2 ml-4 space-y-3 border-l-2 border-border/60 pl-3">
                                        {nested.map((reply) => (
                                            <div key={reply.id}>
                                                <CommentRow
                                                    comment={reply}
                                                    isNested
                                                    topLevelCommentId={topLevel.id}
                                                    onLike={handleCommentLike}
                                                    onReply={handleReplyTo}
                                                    onDelete={setDeleteTargetId}
                                                />
                                                {replyTo?.id === reply.id && renderInlineComposer()}
                                            </div>
                                        ))}
                                        {replyTo?.id === topLevel.id && renderInlineComposer()}
                                    </div>
                                )}
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

            {/* Top-level comment composer (direct replies to the tweet) */}
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

            {/* Delete Comment Confirmation Modal */}
            <Modal
                isOpen={Boolean(deleteTargetId)}
                onClose={() => setDeleteTargetId(null)}
                title="Delete comment?"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This cannot be undone. Deleting a comment also removes its replies.
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
