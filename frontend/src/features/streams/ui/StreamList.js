"use client";

import { Radio, PlusCircle, AlertCircle, Loader2 } from "lucide-react";
import { StreamCard } from "./StreamCard";
import { Button } from "@/shared/ui/Button";

function StreamCardSkeleton() {
    return (
        <div className="rounded-2xl border border-border/40 bg-card/50 overflow-hidden animate-pulse">
            <div className="aspect-video w-full bg-secondary/60" />
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-secondary/80" />
                    <div className="space-y-1.5 flex-1">
                        <div className="h-3 w-24 bg-secondary/80 rounded" />
                        <div className="h-2.5 w-16 bg-secondary/60 rounded" />
                    </div>
                </div>
                <div className="h-4 w-5/6 bg-secondary/80 rounded" />
                <div className="h-3 w-4/6 bg-secondary/60 rounded" />
            </div>
        </div>
    );
}

export function StreamList({
    streams = [],
    isLoading = false,
    isLoadingMore = false,
    error = null,
    hasMore = false,
    onLoadMore,
    onStartStreamClick,
    emptyMessage = "No active broadcasts right now."
}) {
    if (isLoading && streams.length === 0) {
        return (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                    <StreamCardSkeleton key={idx} />
                ))}
            </div>
        );
    }

    if (error && streams.length === 0) {
        return (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center backdrop-blur-sm">
                <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-foreground">Failed to Load Streams</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">{error}</p>
                {onLoadMore && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onLoadMore}
                        className="mt-4"
                    >
                        Try Again
                    </Button>
                )}
            </div>
        );
    }

    if (!isLoading && streams.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center backdrop-blur-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mb-4 border border-cyan-500/20">
                    <Radio size={28} aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No Live Broadcasts</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    {emptyMessage} Start your own realtime stream or explore other categories.
                </p>
                {onStartStreamClick && (
                    <Button
                        onClick={onStartStreamClick}
                        className="mt-5 gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium"
                    >
                        <PlusCircle size={16} aria-hidden="true" />
                        Start Streaming
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {streams.map((stream) => (
                    <StreamCard key={stream.id || stream._id} stream={stream} />
                ))}
            </div>

            {hasMore && (
                <div className="pt-4 text-center">
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={isLoadingMore}
                        onClick={onLoadMore}
                        className="gap-2 px-6"
                    >
                        {isLoadingMore && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                        {isLoadingMore ? "Loading more..." : "Load More Streams"}
                    </Button>
                </div>
            )}
        </div>
    );
}
