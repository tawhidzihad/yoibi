"use client";

import { PostCard } from "./PostCard";
import { EmptyState } from "@/shared/feedback/EmptyState";
import { ErrorState } from "@/shared/feedback/ErrorState";
import { LoadingFallback } from "@/shared/feedback/LoadingFallback";
import { Button } from "@/shared/ui/Button";
import { FileText } from "lucide-react";

export function PostList({
    posts = [],
    loading = false,
    error = "",
    onRetry,
    onPostDeleted,
    hasNextPage = false,
    onLoadMore,
    loadingMore = false,
}) {
    if (loading && posts.length === 0) {
        return (
            <div className="py-12">
                <LoadingFallback message="Loading feed posts..." />
            </div>
        );
    }

    if (error && posts.length === 0) {
        return (
            <div className="p-6">
                <ErrorState
                    title="Could not load feed"
                    message={error}
                    onRetry={onRetry}
                />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="p-6">
                <EmptyState
                    icon={FileText}
                    title="No posts yet"
                    description="Be the first to share an update, thought, or media with the Yoibi community!"
                />
            </div>
        );
    }

    return (
        <div>
            <div>
                {posts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onPostDeleted={onPostDeleted}
                    />
                ))}
            </div>

            {hasNextPage && (
                <div className="flex justify-center p-4 border-b border-border/40">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onLoadMore}
                        loading={loadingMore}
                        disabled={loadingMore}
                        id="load-more-posts-btn"
                    >
                        Load more posts
                    </Button>
                </div>
            )}
        </div>
    );
}
