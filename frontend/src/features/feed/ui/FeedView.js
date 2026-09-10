"use client";

import { useState, useEffect, useCallback } from "react";
import { CreatePostCard } from "@/features/posts/ui/CreatePostCard";
import { PostList } from "@/features/posts/ui/PostList";
import { postsApi } from "@/features/posts/api/postsApi";
import { cn } from "@/shared/utils/cn";

export function FeedView() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchPosts = useCallback(async (pageNum = 1, activeFilter = "all", append = false) => {
        if (append) {
            setLoadingMore(true);
        }

        try {
            const res = await postsApi.getPosts({
                page: pageNum,
                limit: 20,
                filter: activeFilter,
            });

            if (!res.success) {
                setError(res.error?.message || "Failed to load feed posts.");
            } else {
                const items = res.data?.items || [];
                const pagination = res.data?.pagination;
                if (append) {
                    setPosts((prev) => [...prev, ...items]);
                } else {
                    setPosts(items);
                }
                setHasNextPage(Boolean(pagination?.hasNextPage));
                setPage(pageNum);
            }
        } catch (err) {
            setError(err.message || "Unable to connect to the server.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        let isCancelled = false;
        async function load() {
            setLoading(true);
            setError("");
            try {
                const res = await postsApi.getPosts({
                    page: 1,
                    limit: 20,
                    filter,
                });
                if (!isCancelled) {
                    if (!res.success) {
                        setError(res.error?.message || "Failed to load feed posts.");
                    } else {
                        setPosts(res.data?.items || []);
                        setHasNextPage(Boolean(res.data?.pagination?.hasNextPage));
                        setPage(1);
                    }
                }
            } catch (err) {
                if (!isCancelled) setError(err.message || "Unable to connect to the server.");
            } finally {
                if (!isCancelled) setLoading(false);
            }
        }

        load();

        return () => {
            isCancelled = true;
        };
    }, [filter]);

    const handlePostCreated = (newPost) => {
        setPosts((prev) => [newPost, ...prev]);
    };

    const handlePostDeleted = (deletedId) => {
        setPosts((prev) => prev.filter((p) => p.id !== deletedId));
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasNextPage) {
            fetchPosts(page + 1, filter, true);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Feed Header */}
            <div className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur-md">
                <div className="flex items-center justify-between px-4 py-3">
                    <h1 className="text-lg font-bold text-foreground">Feed</h1>
                </div>

                {/* Filter Tabs */}
                <div className="flex border-t border-border/40">
                    <button
                        type="button"
                        onClick={() => setFilter("all")}
                        id="feed-filter-all"
                        className={cn(
                            "flex-1 py-2.5 text-center text-xs font-semibold transition-colors cursor-pointer border-b-2",
                            filter === "all"
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        All Posts
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter("following")}
                        id="feed-filter-following"
                        className={cn(
                            "flex-1 py-2.5 text-center text-xs font-semibold transition-colors cursor-pointer border-b-2",
                            filter === "following"
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Following
                    </button>
                </div>
            </div>

            {/* Create Post Composer */}
            <CreatePostCard onPostCreated={handlePostCreated} />

            {/* Posts Stream */}
            <PostList
                posts={posts}
                loading={loading}
                error={error}
                onRetry={() => fetchPosts(1, filter, false)}
                onPostDeleted={handlePostDeleted}
                hasNextPage={hasNextPage}
                onLoadMore={handleLoadMore}
                loadingMore={loadingMore}
            />
        </div>
    );
}
