"use client";

import { Video, RefreshCw, AlertCircle, Plus } from "lucide-react";
import { MeetupCard } from "./MeetupCard";
import { Button } from "@/shared/ui/Button";

function MeetupSkeletonCard() {
    return (
        <div className="flex flex-col justify-between rounded-2xl border border-white/5 bg-card/40 p-5 backdrop-blur-md animate-pulse">
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <div className="h-5 w-16 rounded-full bg-white/10" />
                    <div className="h-4 w-12 rounded bg-white/10" />
                </div>
                <div className="h-5 w-3/4 rounded bg-white/10 mb-2" />
                <div className="h-4 w-1/2 rounded bg-white/10" />
                <div className="mt-4 h-1.5 w-full rounded-full bg-white/10" />
                <div className="mt-4 flex items-center gap-2.5 border-t border-white/5 pt-3">
                    <div className="h-8 w-8 rounded-full bg-white/10" />
                    <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-24 rounded bg-white/10" />
                        <div className="h-3 w-16 rounded bg-white/10" />
                    </div>
                </div>
            </div>
            <div className="mt-4 pt-2">
                <div className="h-9 w-full rounded-xl bg-white/10" />
            </div>
        </div>
    );
}

export function MeetupList({
    rooms = [],
    isLoading = false,
    error = null,
    onRetry,
    onCreateClick,
    hasNextPage = false,
    onLoadMore,
    isLoadingMore = false
}) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <MeetupSkeletonCard key={i} />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center backdrop-blur-md">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                    <AlertCircle size={24} aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Failed to load Meet-Up rooms</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">{error}</p>
                {onRetry && (
                    <Button
                        id="retry-meetup-btn"
                        size="sm"
                        variant="outline"
                        onClick={onRetry}
                        className="mt-4 gap-2"
                    >
                        <RefreshCw size={14} aria-hidden="true" /> Retry
                    </Button>
                )}
            </div>
        );
    }

    if (!rooms || rooms.length === 0) {
        return (
            <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-card/20 p-8 text-center backdrop-blur-md">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/20 shadow-inner">
                    <Video size={28} aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-foreground">No active Meet-Up rooms</h3>
                <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
                    Be the first to start a conversation! Create an interactive room for audio, video, and screen sharing.
                </p>
                {onCreateClick && (
                    <Button
                        id="empty-create-meetup-btn"
                        size="sm"
                        variant="primary"
                        onClick={onCreateClick}
                        className="mt-5 shadow-lg shadow-cyan-500/20"
                    >
                        <Plus size={14} className="mr-1.5" aria-hidden="true" /> Start a Meet-Up
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.map((room) => (
                    <MeetupCard key={room.id || room._id} room={room} />
                ))}
            </div>

            {hasNextPage && (
                <div className="flex justify-center pt-2">
                    <Button
                        id="load-more-meetups-btn"
                        size="sm"
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="min-w-[140px]"
                    >
                        {isLoadingMore ? (
                            <>
                                <RefreshCw size={14} className="mr-2 animate-spin" aria-hidden="true" />
                                Loading...
                            </>
                        ) : (
                            "Load More Rooms"
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
