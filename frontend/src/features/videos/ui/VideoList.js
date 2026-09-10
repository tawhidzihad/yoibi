"use client";

import { VideoCard } from "./VideoCard";

function VideoCardSkeleton() {
    return (
        <div className="flex flex-col overflow-hidden rounded-xl border border-border/40 bg-card">
            {/* Thumbnail skeleton */}
            <div className="aspect-video w-full animate-pulse bg-secondary/40" />
            {/* Body skeleton */}
            <div className="flex flex-col gap-2 p-3">
                <div className="h-3 w-3/4 animate-pulse rounded bg-secondary/60" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-secondary/40" />
                <div className="mt-1 flex gap-3">
                    <div className="h-2.5 w-12 animate-pulse rounded bg-secondary/40" />
                    <div className="h-2.5 w-12 animate-pulse rounded bg-secondary/40" />
                </div>
            </div>
        </div>
    );
}

function EmptyState({ category }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/60">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground/50"
                    aria-hidden="true"
                >
                    <path d="m22 8-6 4 6 4V8Z" />
                    <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                </svg>
            </div>
            <p className="text-sm font-medium text-foreground">
                {category ? `No videos in "${category.replace("-", " ")}" yet` : "No videos yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
                Be the first to upload a video in this category.
            </p>
        </div>
    );
}

function ErrorState({ onRetry }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-destructive">Failed to load videos</p>
            <p className="mt-1 text-xs text-muted-foreground">
                Something went wrong. Please check your connection.
            </p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    id="video-list-retry-btn"
                    className="mt-4 cursor-pointer rounded-full border border-border/80 px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                >
                    Retry
                </button>
            )}
        </div>
    );
}

export function VideoList({
    videos,
    isLoading,
    error,
    onRetry,
    onPlay,
    onVideoDeleted,
    pagination,
    onLoadMore
}) {
    // Loading skeleton grid
    if (isLoading && (!videos || videos.length === 0)) {
        return (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <VideoCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    // Error state with retry
    if (error && (!videos || videos.length === 0)) {
        return (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                <ErrorState onRetry={onRetry} />
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div
                className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3"
                role="feed"
                aria-label="Video list"
                aria-busy={isLoading}
            >
                {videos && videos.length > 0 ? (
                    videos.map((video) => (
                        <VideoCard
                            key={video.id || video._id}
                            video={video}
                            onPlay={onPlay}
                            onDeleted={onVideoDeleted}
                        />
                    ))
                ) : (
                    <EmptyState />
                )}

                {/* Inline loading skeletons on next-page fetch */}
                {isLoading && videos && videos.length > 0 &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <VideoCardSkeleton key={`sk-${i}`} />
                    ))
                }
            </div>

            {/* Load More Button */}
            {pagination && pagination.hasNextPage && !isLoading && (
                <div className="flex justify-center px-4 pb-6">
                    <button
                        type="button"
                        onClick={onLoadMore}
                        id="video-list-load-more-btn"
                        className="cursor-pointer rounded-full border border-border/80 px-6 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                        Load more videos
                    </button>
                </div>
            )}

            {/* Error notification on incremental fetch */}
            {error && videos && videos.length > 0 && (
                <p className="px-4 pb-4 text-center text-xs text-destructive">
                    Failed to load more videos. Please try again.
                </p>
            )}
        </div>
    );
}
