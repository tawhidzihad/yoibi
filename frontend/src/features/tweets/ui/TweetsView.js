"use client";

import { useState, useEffect, useCallback } from "react";
import { CreateTweetCard } from "./CreateTweetCard";
import { TweetList } from "./TweetList";
import { tweetsApi } from "../api/tweetsApi";

export function TweetsView() {
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
                setError(res.error?.message || "Failed to load tweets.");
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
                const res = await tweetsApi.getTweets({ page: 1, limit: 20 });
                if (!isCancelled) {
                    if (!res.success) {
                        setError(res.error?.message || "Failed to load tweets.");
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

    const handleTweetCreated = (newTweet) => {
        setTweets((prev) => [newTweet, ...prev]);
    };

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
            {/* Header */}
            <div className="sticky top-0 z-20 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md">
                <h1 className="text-lg font-bold text-foreground">Tweets</h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Concise thoughts · 280-character limit · Real-time conversations
                </p>
            </div>

            {/* Composer */}
            <CreateTweetCard
                onTweetCreated={handleTweetCreated}
                placeholder="What's happening? Share a thought..."
            />

            {/* Stream */}
            <TweetList
                tweets={tweets}
                loading={loading}
                error={error}
                onRetry={() => fetchTweets(1, false)}
                onTweetDeleted={handleTweetDeleted}
                hasNextPage={hasNextPage}
                onLoadMore={handleLoadMore}
                loadingMore={loadingMore}
                emptyMessage="No tweets yet. Be the first to share a thought!"
            />
        </div>
    );
}
