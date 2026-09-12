"use client";

import { useState, useEffect, useCallback } from "react";
import { TweetList } from "@/features/tweets/ui/TweetList";
import { tweetsApi } from "@/features/tweets/api/tweetsApi";

export function FeedView() {
    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchTweets = useCallback(async (pageNum = 1, append = false) => {
        if (append) {
            setLoadingMore(true);
        }

        try {
            const res = await tweetsApi.getTweets({
                page: pageNum,
                limit: 20,
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
    }, []);

    const handleTweetDeleted = (deletedId) => {
        setTweets((prev) => prev.filter((t) => t.id !== deletedId));
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasNextPage) {
            fetchTweets(page + 1, true);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Feed Header */}
            <div className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur-md">
                <div className="flex items-center justify-between px-4 py-3">
                    <h1 className="text-lg font-bold text-foreground">Feed</h1>
                </div>
            </div>

            {/* Tweets Stream */}
            <TweetList
                tweets={tweets}
                loading={loading}
                error={error}
                onRetry={() => fetchTweets(1, false)}
                onTweetDeleted={handleTweetDeleted}
                hasNextPage={hasNextPage}
                onLoadMore={handleLoadMore}
                loadingMore={loadingMore}
            />
        </div>
    );
}
