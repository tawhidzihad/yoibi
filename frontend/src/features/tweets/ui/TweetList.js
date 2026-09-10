"use client";

import { MessageSquare, AlertCircle, RefreshCw } from "lucide-react";
import { TweetCard } from "./TweetCard";
import { Button } from "@/shared/ui/Button";

function TweetSkeleton() {
    return (
        <div className="animate-pulse border-b border-border/50 p-4">
            <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/80" />
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="h-3.5 w-28 rounded bg-secondary/80" />
                        <div className="h-3 w-16 rounded bg-secondary/60" />
                    </div>
                    <div className="h-3 w-full rounded bg-secondary/70" />
                    <div className="h-3 w-3/4 rounded bg-secondary/70" />
                    <div className="flex gap-6 pt-2">
                        <div className="h-3 w-8 rounded bg-secondary/60" />
                        <div className="h-3 w-8 rounded bg-secondary/60" />
                        <div className="h-3 w-8 rounded bg-secondary/60" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TweetList({
    tweets = [],
    loading = false,
    error = "",
    onRetry,
    onTweetDeleted,
    hasNextPage = false,
    onLoadMore,
    loadingMore = false,
    emptyMessage = "No tweets yet. Be the first to share your thoughts!",
}) {
    if (loading && tweets.length === 0) {
        return (
            <div className="divide-y divide-border/50">
                <TweetSkeleton />
                <TweetSkeleton />
                <TweetSkeleton />
            </div>
        );
    }

    if (error && tweets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="mb-2 h-8 w-8 text-destructive" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">{error}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Something went wrong loading tweets. Please try again.
                </p>
                {onRetry && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="mt-4 gap-1.5"
                    >
                        <RefreshCw size={14} aria-hidden="true" />
                        <span>Retry</span>
                    </Button>
                )}
            </div>
        );
    }

    if (!loading && tweets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground">
                    <MessageSquare size={22} aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">No conversations yet</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div>
            <div className="divide-y divide-border/50">
                {tweets.map((tweet) => (
                    <TweetCard
                        key={tweet.id}
                        tweet={tweet}
                        onTweetDeleted={onTweetDeleted}
                    />
                ))}
            </div>

            {hasNextPage && (
                <div className="flex justify-center p-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onLoadMore}
                        loading={loadingMore}
                        disabled={loadingMore}
                        className="w-full max-w-xs"
                    >
                        Load more tweets
                    </Button>
                </div>
            )}
        </div>
    );
}
