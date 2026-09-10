"use client";

import { useState, useEffect, useCallback } from "react";
import { CreateTweetCard } from "@/features/tweets/ui/CreateTweetCard";
import { TweetList } from "@/features/tweets/ui/TweetList";
import { tweetsApi } from "@/features/tweets/api/tweetsApi";
import { cn } from "@/shared/utils/cn";

export function FeedView() {
    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchTweets = useCallback(async (pageNum = 1, activeFilter = "all", append = false) => {
        if (append) {
            setLoadingMore(true);
        }

        try {
            const res = await tweetsApi.getTweets({
                page: pageNum,
                limit: 20,
                filter: activeFilter,
            });

            if (!res.success) {
                setError(res.error?.message || "Failed to load feed tweets.");
            } else {
                const items = res.data?.items || [];
                const pagination = res.data?.pagination;
                if (append) {
                    setTweets((prev) => [...prev, ...items]);
                } else {
                    setTweets(items);
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
                const res = await tweetsApi.getTweets({
                    page: 1,
                    limit: 20,
                    filter,
                });
                if (!isCancelled) {
                    if (!res.success) {
                        setError(res.error?.message || "Failed to load feed tweets.");
                    } else {
                        setTweets(res.data?.items || []);
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

    const handleTweetCreated = (newTweet) => {
        setTweets((prev) => [newTweet, ...prev]);
    };

    const handleTweetDeleted = (deletedId) => {
        setTweets((prev) => prev.filter((t) => t.id !== deletedId));
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasNextPage) {
            fetchTweets(page + 1, filter, true);
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

            {/* Create Tweet Composer */}
            <CreateTweetCard
                onTweetCreated={handleTweetCreated}
                placeholder="What's on your mind? Share a post..."
            />

            {/* Tweets Stream */}
            <TweetList
                tweets={tweets}
                loading={loading}
                error={error}
                onRetry={() => fetchTweets(1, filter, false)}
                onTweetDeleted={handleTweetDeleted}
                hasNextPage={hasNextPage}
                onLoadMore={handleLoadMore}
                loadingMore={loadingMore}
            />
        </div>
    );
}
