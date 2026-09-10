"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Heart, Share2, Check, X, Eye } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { VideoPlayer } from "@/shared/media/VideoPlayer";
import { videosApi } from "../api/videosApi";
import { cn } from "@/shared/utils/cn";

function formatCount(n) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n || 0);
}

function AuthorAvatar({ name, avatarUrl }) {
    if (avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={avatarUrl}
                alt={name || "Author"}
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border"
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
            {initials}
        </div>
    );
}

export function VideoPlayerModal({ video, isOpen, onClose, onLikeChange }) {
    const router = useRouter();
    const { user, status } = useAuth();
    const hasRecordedViewRef = useRef(false);

    const [liked, setLiked] = useState(Boolean(video?.liked));
    const [likesCount, setLikesCount] = useState(video?.likesCount || 0);
    const [viewsCount, setViewsCount] = useState(video?.viewsCount || 0);
    const [copied, setCopied] = useState(false);

    // Record playback initiation event when modal opens
    useEffect(() => {
        if (isOpen && video?.id && !hasRecordedViewRef.current) {
            hasRecordedViewRef.current = true;
            videosApi.recordVideoView(video.id).then((res) => {
                if (res.success && res.data?.viewsCount !== undefined) {
                    setViewsCount(res.data.viewsCount);
                }
            }).catch(() => {
                // Ignore view counter network error gracefully
            });
        }
    }, [isOpen, video?.id]);

    if (!isOpen || !video) return null;

    const handleLikeToggle = async () => {
        if (status !== "authenticated" || !user) {
            router.push(`/login?redirect=${encodeURIComponent("/videos")}`);
            return;
        }

        const nextLiked = !liked;
        const nextLikesCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

        setLiked(nextLiked);
        setLikesCount(nextLikesCount);

        try {
            const res = nextLiked
                ? await videosApi.likeVideo(video.id)
                : await videosApi.unlikeVideo(video.id);

            if (!res.success) {
                setLiked(!nextLiked);
                setLikesCount(likesCount);
            } else {
                if (onLikeChange) {
                    onLikeChange(video.id, nextLiked, nextLikesCount);
                }
            }
        } catch {
            setLiked(!nextLiked);
            setLikesCount(likesCount);
        }
    };

    const handleShare = async () => {
        try {
            if (typeof window !== "undefined") {
                const shareUrl = `${window.location.origin}/videos#${video.id}`;
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            }
        } catch (err) {
            console.warn("[VideoPlayerModal] Share failed:", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Dialog */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="player-modal-title"
                className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Close Button Header */}
                <div className="absolute right-3 top-3 z-30">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors focus:outline-none"
                        aria-label="Close video player"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Custom Video Player */}
                <div className="w-full bg-black">
                    <VideoPlayer
                        src={video.videoUrl}
                        poster={video.thumbnailUrl}
                        title={video.title}
                        autoPlay
                    />
                </div>

                {/* Video Info Body */}
                <div className="max-h-[30vh] overflow-y-auto p-4 sm:p-5">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <h2
                                    id="player-modal-title"
                                    className="text-base sm:text-lg font-bold text-foreground leading-snug"
                                >
                                    {video.title}
                                </h2>

                                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Eye size={13} aria-hidden="true" />
                                        <span>{formatCount(viewsCount)} views</span>
                                    </span>
                                    {video.category && (
                                        <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-600 dark:text-cyan-400 capitalize">
                                            {video.category.replace("-", " ")}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions (Like & Share) */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleLikeToggle}
                                    id="player-like-btn"
                                    className={cn(
                                        "flex cursor-pointer items-center gap-1.5 rounded-full border border-border/80 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary",
                                        liked ? "text-pink-500 border-pink-500/30 bg-pink-500/10" : "text-muted-foreground"
                                    )}
                                    aria-label={liked ? "Unlike video" : "Like video"}
                                >
                                    <Heart size={14} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
                                    <span>{likesCount}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleShare}
                                    id="player-share-btn"
                                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                                    aria-label="Share video"
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
                        </div>

                        {/* Author Info */}
                        <div className="flex items-center gap-3 border-t border-border/40 pt-3">
                            <AuthorAvatar name={video.author?.name} avatarUrl={video.author?.avatarUrl} />
                            <div>
                                <p className="text-xs font-semibold text-foreground">
                                    {video.author?.name || "Yoibi Member"}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    @{video.author?.handle || "member"}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        {video.description && (
                            <p className="whitespace-pre-line text-xs leading-relaxed text-foreground/85 border-t border-border/30 pt-2">
                                {video.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
