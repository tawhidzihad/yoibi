"use client";

import { useState } from "react";
import { Play, Eye, Heart, Trash2, AlertCircle } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { videosApi } from "../api/videosApi";
import { cn } from "@/shared/utils/cn";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";

function formatCount(n) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n || 0);
}

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return "";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function AuthorAvatar({ name, avatarUrl }) {
    if (avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={avatarUrl}
                alt={name || "Author"}
                className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-border"
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
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">
            {initials}
        </div>
    );
}

export function VideoCard({ video, onPlay, onDeleted }) {
    const { user } = useAuth();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const isAuthor = user && video.authorId && user.id === video.authorId;
    const isAdmin = user && user.role === "admin";
    const canDelete = isAuthor || isAdmin;
    const durationLabel = formatDuration(video.duration);

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        setDeleteError("");
        try {
            const res = await videosApi.deleteVideo(video.id || video._id);
            if (res.success) {
                setConfirmDelete(false);
                if (onDeleted) onDeleted(video.id || video._id);
            } else {
                setDeleteError(res.error?.message || "Failed to delete video.");
            }
        } catch (err) {
            setDeleteError(err.message || "Unexpected error.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <article
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-200 hover:border-cyan-500/40 hover:shadow-md hover:shadow-cyan-500/5"
                aria-label={`Video: ${video.title}`}
            >
                {/* Thumbnail */}
                <button
                    type="button"
                    onClick={() => onPlay && onPlay(video)}
                    className="relative aspect-video w-full cursor-pointer overflow-hidden bg-secondary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-inset"
                    aria-label={`Play ${video.title}`}
                    id={`video-card-play-${video.id || video._id}`}
                >
                    {video.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/60 to-secondary/30">
                            <Play
                                size={36}
                                className="text-muted-foreground/30 transition-colors group-hover:text-cyan-500/50"
                                aria-hidden="true"
                            />
                        </div>
                    )}

                    {/* Play Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
                        <div className="flex h-11 w-11 scale-0 items-center justify-center rounded-full bg-cyan-600/90 text-white shadow-lg transition-transform duration-200 group-hover:scale-100">
                            <Play size={20} className="ml-0.5" aria-hidden="true" />
                        </div>
                    </div>

                    {/* Duration Badge */}
                    {durationLabel && (
                        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                            {durationLabel}
                        </span>
                    )}

                    {/* Category Badge */}
                    {video.category && (
                        <span className="absolute left-2 top-2 rounded-full bg-cyan-500/85 px-2 py-0.5 text-[10px] font-semibold text-white capitalize backdrop-blur-sm">
                            {video.category.replace("-", " ")}
                        </span>
                    )}
                </button>

                {/* Card Body */}
                <div className="flex flex-1 flex-col gap-2 p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                        {video.title}
                    </h3>

                    {/* Author Row */}
                    <div className="flex items-center gap-2">
                        <AuthorAvatar
                            name={video.author?.name}
                            avatarUrl={video.author?.avatarUrl}
                        />
                        <span className="truncate text-[11px] text-muted-foreground">
                            @{video.author?.handle || "member"}
                        </span>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Eye size={12} aria-hidden="true" />
                                {formatCount(video.viewsCount)}
                            </span>
                            <span className={cn(
                                "flex items-center gap-1",
                                video.liked && "text-pink-500"
                            )}>
                                <Heart size={12} fill={video.liked ? "currentColor" : "none"} aria-hidden="true" />
                                {formatCount(video.likesCount)}
                            </span>
                        </div>

                        {/* Delete Button (author/admin only) */}
                        {canDelete && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDelete(true);
                                }}
                                id={`video-card-delete-${video.id || video._id}`}
                                className="cursor-pointer rounded-full p-1 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none"
                                aria-label="Delete video"
                            >
                                <Trash2 size={13} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </div>
            </article>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={confirmDelete}
                onClose={() => {
                    if (!isDeleting) {
                        setConfirmDelete(false);
                        setDeleteError("");
                    }
                }}
                title="Delete Video"
            >
                <div className="space-y-4">
                    <p className="text-sm text-foreground">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold">&ldquo;{video.title}&rdquo;</span>?
                        This action cannot be undone and will also remove the video from Cloudinary.
                    </p>

                    {deleteError && (
                        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                            <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
                            <span>{deleteError}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setConfirmDelete(false);
                                setDeleteError("");
                            }}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            loading={isDeleting}
                            disabled={isDeleting}
                            onClick={handleDeleteConfirm}
                            id={`confirm-delete-video-btn-${video.id || video._id}`}
                        >
                            {isDeleting ? "Deleting..." : "Delete Video"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
