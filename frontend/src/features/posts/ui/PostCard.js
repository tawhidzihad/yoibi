"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Share2, Trash2, Check, FileText } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { postsApi } from "../api/postsApi";
import { CommentSection } from "./CommentSection";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/utils/cn";

function formatRelative(isoString) {
    if (!isoString) return "";
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${Math.max(1, diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

function AuthorAvatar({ name, avatarUrl }) {
    if (avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={avatarUrl}
                alt={name || "Author"}
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-border"
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
            {initials}
        </div>
    );
}

export function PostCard({ post, onPostDeleted }) {
    const router = useRouter();
    const { user, status } = useAuth();
    const [liked, setLiked] = useState(Boolean(post.liked));
    const [likesCount, setLikesCount] = useState(post.likesCount || 0);
    const [commentsCount, setCommentsCount] = useState(post.commentsCount || (post.comments ? post.comments.length : 0));
    const [showComments, setShowComments] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const authorId = post.author?.id || post.authorId;
    const isAuthor = user?.id && user.id === authorId;
    const isAdmin = user?.role === "admin";
    const canDelete = isAuthor || isAdmin;

    const handleLikeToggle = async () => {
        if (status !== "authenticated" || !user) {
            router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
            return;
        }

        const nextLiked = !liked;
        const nextLikesCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

        // Optimistic UI update
        setLiked(nextLiked);
        setLikesCount(nextLikesCount);

        try {
            const res = nextLiked
                ? await postsApi.likePost(post.id)
                : await postsApi.unlikePost(post.id);

            if (!res.success) {
                // Rollback on failure
                setLiked(!nextLiked);
                setLikesCount(likesCount);
            } else if (res.data?.likesCount !== undefined) {
                setLikesCount(res.data.likesCount);
            }
        } catch {
            // Rollback on exception
            setLiked(!nextLiked);
            setLikesCount(likesCount);
        }
    };

    const handleShare = async () => {
        try {
            if (typeof window !== "undefined") {
                const shareUrl = `${window.location.origin}/feed#${post.id}`;
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            }
        } catch (err) {
            console.warn("[PostCard] Share failed:", err);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setDeleteError("");
        try {
            const res = await postsApi.deletePost(post.id);
            if (!res.success) {
                setDeleteError(res.error?.message || "Failed to delete post.");
                setIsDeleting(false);
                return;
            }
            setShowDeleteModal(false);
            if (onPostDeleted) {
                onPostDeleted(post.id);
            }
        } catch (err) {
            setDeleteError(err.message || "Failed to delete post.");
            setIsDeleting(false);
        }
    };

    return (
        <article
            id={`post-${post.id}`}
            className="border-b border-border/50 px-4 py-4 transition-colors hover:bg-secondary/15"
        >
            <div className="flex gap-3">
                <AuthorAvatar name={post.author?.name} avatarUrl={post.author?.avatarUrl} />
                <div className="min-w-0 flex-1">
                    {/* Header */}
                    <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">
                                {post.author?.name || "Yoibi Member"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                @{post.author?.handle?.replace(/^@/, "") || "user"}
                            </span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                                {formatRelative(post.createdAt)}
                            </span>
                            <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                                <FileText size={10} aria-hidden="true" />
                                post
                            </span>
                        </div>

                        {canDelete && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="cursor-pointer rounded-lg p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                aria-label="Delete post"
                                id={`post-delete-btn-${post.id}`}
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <p className="mb-3 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                        {post.content}
                    </p>

                    {/* Media Attachments */}
                    {Array.isArray(post.media) && post.media.length > 0 && (
                        <div className="mb-3 space-y-2">
                            {post.media.map((media, idx) => (
                                <div key={idx} className="overflow-hidden rounded-xl border border-border/60 bg-black/5">
                                    {media.type === "video" ? (
                                        <video
                                            src={media.url}
                                            controls
                                            className="max-h-96 w-full rounded-xl object-contain bg-black"
                                        />
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={media.url}
                                            alt="Post attachment"
                                            className="max-h-96 w-full rounded-xl object-cover"
                                            loading="lazy"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions bar */}
                    <div className="flex items-center gap-6 text-muted-foreground">
                        <button
                            type="button"
                            id={`post-like-btn-${post.id}`}
                            onClick={handleLikeToggle}
                            aria-label={liked ? "Unlike post" : "Like post"}
                            aria-pressed={liked}
                            className={cn(
                                "flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-pink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded py-0.5",
                                liked && "text-pink-500 font-medium"
                            )}
                        >
                            <Heart size={15} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
                            <span>{likesCount}</span>
                        </button>

                        <button
                            type="button"
                            id={`post-comments-btn-${post.id}`}
                            onClick={() => setShowComments((v) => !v)}
                            aria-label="View and post comments"
                            aria-expanded={showComments}
                            className={cn(
                                "flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded py-0.5",
                                showComments && "text-cyan-500 font-medium"
                            )}
                        >
                            <MessageCircle size={15} aria-hidden="true" />
                            <span>{commentsCount}</span>
                        </button>

                        <button
                            type="button"
                            id={`post-share-btn-${post.id}`}
                            onClick={handleShare}
                            aria-label="Share post"
                            className="flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded py-0.5"
                        >
                            {copied ? (
                                <>
                                    <Check size={15} className="text-green-500" aria-hidden="true" />
                                    <span className="text-green-500">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Share2 size={15} aria-hidden="true" />
                                    <span>Share</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Comments section */}
                    {showComments && (
                        <CommentSection
                            postId={post.id}
                            postAuthorId={authorId}
                            initialComments={post.comments || []}
                            onCommentCountChange={(count) => setCommentsCount(count)}
                        />
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Post"
                description="Are you sure you want to delete this post? This action cannot be undone."
                size="sm"
            >
                {deleteError && (
                    <p className="mb-3 text-xs text-destructive">{deleteError}</p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        loading={isDeleting}
                        id={`confirm-delete-post-${post.id}`}
                    >
                        Delete
                    </Button>
                </div>
            </Modal>
        </article>
    );
}
