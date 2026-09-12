"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Repeat2, MessageCircle, Share2, Trash2, Check, FileText } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { tweetsApi } from "../api/tweetsApi";
import { TweetReplySection } from "./TweetReplySection";
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

export function TweetCard({ tweet, onTweetDeleted, showThreadLine = false }) {
    const router = useRouter();
    const { user, status } = useAuth();
    const [liked, setLiked] = useState(Boolean(tweet.liked));
    const [likesCount, setLikesCount] = useState(tweet.likesCount || 0);
    const [retweeted, setRetweeted] = useState(Boolean(tweet.retweeted));
    const [retweetCount, setRetweetCount] = useState(tweet.retweetCount || 0);
    const [repliesCount, setRepliesCount] = useState(tweet.repliesCount || 0);
    const [showReplies, setShowReplies] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const authorId = tweet.author?.id || tweet.authorId;
    const isAuthor = user?.id && user.id === authorId;
    const isAdmin = user?.role === "admin";
    const canDelete = isAuthor || isAdmin;

    const handleNavigateToProfile = (e) => {
        e.stopPropagation();
        const rawHandle = tweet.author?.handle || "user";
        const cleanHandle = rawHandle.startsWith("@") ? rawHandle.slice(1) : rawHandle;
        router.push(`/profile/${cleanHandle}`);
    };

    const handleLikeToggle = async () => {
        if (status !== "authenticated" || !user) {
            router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
            return;
        }

        const nextLiked = !liked;
        const nextLikesCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

        setLiked(nextLiked);
        setLikesCount(nextLikesCount);

        try {
            const res = nextLiked
                ? await tweetsApi.likeTweet(tweet.id)
                : await tweetsApi.unlikeTweet(tweet.id);

            if (!res.success) {
                setLiked(!nextLiked);
                setLikesCount(likesCount);
            } else if (res.data?.likesCount !== undefined) {
                setLikesCount(res.data.likesCount);
            }
        } catch {
            setLiked(!nextLiked);
            setLikesCount(likesCount);
        }
    };

    const handleRetweetToggle = async () => {
        if (status !== "authenticated" || !user) {
            router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
            return;
        }

        const nextRetweeted = !retweeted;
        const nextRetweetCount = nextRetweeted ? retweetCount + 1 : Math.max(0, retweetCount - 1);

        setRetweeted(nextRetweeted);
        setRetweetCount(nextRetweetCount);

        try {
            const res = nextRetweeted
                ? await tweetsApi.retweetTweet(tweet.id)
                : await tweetsApi.undoRetweet(tweet.id);

            if (!res.success) {
                setRetweeted(!nextRetweeted);
                setRetweetCount(retweetCount);
            } else if (res.data?.retweetCount !== undefined) {
                setRetweetCount(res.data.retweetCount);
            }
        } catch {
            setRetweeted(!nextRetweeted);
            setRetweetCount(retweetCount);
        }
    };

    const handleShare = async () => {
        try {
            if (typeof window !== "undefined") {
                const shareUrl = `${window.location.origin}/feed#${tweet.id}`;
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            }
        } catch (err) {
            console.warn("[TweetCard] Share failed:", err);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setDeleteError("");
        try {
            const res = await tweetsApi.deleteTweet(tweet.id);
            if (!res.success) {
                setDeleteError(res.error?.message || "Failed to delete tweet.");
                setIsDeleting(false);
                return;
            }
            setShowDeleteModal(false);
            if (onTweetDeleted) {
                onTweetDeleted(tweet.id);
            }
        } catch (err) {
            setDeleteError(err.message || "Failed to delete tweet.");
            setIsDeleting(false);
        }
    };

    // Normalize media URLs (could be string URLs or objects)
    const mediaItems = Array.isArray(tweet.mediaUrls) ? tweet.mediaUrls : [];

    return (
        <article
            id={`tweet-${tweet.id}`}
            className="border-b border-border/50 px-4 py-4 transition-colors hover:bg-secondary/15"
        >
            <div className="flex gap-3">
                {/* Avatar and Thread Line */}
                <div className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={handleNavigateToProfile}
                        className="cursor-pointer transition-opacity hover:opacity-85 focus:outline-none"
                        aria-label={`View ${tweet.author?.name || "user"}'s profile`}
                    >
                        <AuthorAvatar name={tweet.author?.name} avatarUrl={tweet.author?.avatarUrl} />
                    </button>
                    {showThreadLine && (
                        <div className="mt-1 w-0.5 flex-1 min-h-4 bg-border/60" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    {/* Header */}
                    <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                                type="button"
                                onClick={handleNavigateToProfile}
                                className="cursor-pointer text-sm font-semibold text-foreground hover:underline focus:outline-none"
                            >
                                {tweet.author?.name || "Yoibi Member"}
                            </button>
                            <span className="text-xs text-muted-foreground">
                                {tweet.author?.handle ? (
                                    tweet.author.handle.startsWith("@") ? tweet.author.handle : `@${tweet.author.handle}`
                                ) : "@member"}
                            </span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{formatRelative(tweet.createdAt)}</span>
                        </div>

                        {canDelete && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="cursor-pointer text-muted-foreground transition-colors hover:text-destructive"
                                aria-label="Delete tweet"
                                id={`tweet-delete-btn-${tweet.id}`}
                            >
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/95 break-words">
                        {tweet.content}
                    </p>

                    {/* Media Attachments */}
                    {mediaItems.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {mediaItems.map((item, index) => {
                                const url = typeof item === "string" ? item : item.url;
                                const isVideo = url && url.match(/\.(mp4|webm|mov)$/i);

                                return (
                                    <div
                                        key={index}
                                        className="overflow-hidden rounded-xl border border-border/80 bg-secondary/20"
                                    >
                                        {isVideo ? (
                                            <video
                                                src={url}
                                                controls
                                                className="max-h-96 w-full object-cover"
                                                preload="metadata"
                                            />
                                        ) : (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={url}
                                                alt="Tweet media attachment"
                                                className="max-h-96 w-full object-cover"
                                                loading="lazy"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="mt-3 flex items-center gap-6 text-muted-foreground">
                        {/* Like Button */}
                        <button
                            type="button"
                            onClick={handleLikeToggle}
                            aria-label={liked ? "Unlike tweet" : "Like tweet"}
                            aria-pressed={liked}
                            id={`tweet-like-btn-${tweet.id}`}
                            className={cn(
                                "flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded",
                                liked && "text-pink-400 font-semibold"
                            )}
                        >
                            <Heart size={15} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
                            <span>{likesCount}</span>
                        </button>

                        {/* Retweet Button */}
                        <button
                            type="button"
                            onClick={handleRetweetToggle}
                            aria-label={retweeted ? "Undo retweet" : "Retweet"}
                            aria-pressed={retweeted}
                            id={`tweet-retweet-btn-${tweet.id}`}
                            className={cn(
                                "flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded",
                                retweeted && "text-green-400 font-semibold"
                            )}
                        >
                            <Repeat2 size={15} aria-hidden="true" />
                            <span>{retweetCount}</span>
                        </button>

                        {/* Replies Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setShowReplies((v) => !v)}
                            aria-label="Toggle replies"
                            aria-expanded={showReplies}
                            id={`tweet-replies-btn-${tweet.id}`}
                            className={cn(
                                "flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded",
                                showReplies && "text-cyan-400"
                            )}
                        >
                            <MessageCircle size={15} aria-hidden="true" />
                            <span>{repliesCount}</span>
                        </button>

                        {/* Share Button */}
                        <button
                            type="button"
                            onClick={handleShare}
                            aria-label="Share tweet"
                            id={`tweet-share-btn-${tweet.id}`}
                            className="flex cursor-pointer items-center gap-1 text-xs transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                        >
                            {copied ? (
                                <>
                                    <Check size={14} className="text-emerald-400" aria-hidden="true" />
                                    <span className="text-emerald-400">Copied</span>
                                </>
                            ) : (
                                <>
                                    <Share2 size={14} aria-hidden="true" />
                                    <span>Share</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Replies Thread Section */}
                    {showReplies && (
                        <TweetReplySection
                            tweetId={tweet.id}
                            initialReplies={tweet.replies || []}
                            onRepliesCountChange={(count) => setRepliesCount(count)}
                        />
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete tweet?"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This cannot be undone and will permanently remove your tweet from the feed.
                    </p>
                    {deleteError && (
                        <p className="text-xs text-destructive">{deleteError}</p>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteModal(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            loading={isDeleting}
                            id={`confirm-delete-tweet-${tweet.id}`}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </article>
    );
}
