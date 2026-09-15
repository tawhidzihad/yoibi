"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, RefreshCw, MessageSquare } from "lucide-react";
import { tweetsApi } from "../api/tweetsApi";
import { TweetCard } from "./TweetCard";
import { Button } from "@/shared/ui/Button";

/** Tweet-shaped skeleton (same idiom as TweetList's TweetSkeleton). */
function TweetDetailSkeleton() {
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

/**
 * Individual tweet page (/tweets/[tweetId]) — reuses the canonical TweetCard
 * and hosts the tweet's full threaded comment section (auto-expanded).
 */
export function TweetDetailView({ tweetId }) {
    const router = useRouter();
    const [tweet, setTweet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState(false);

    const fetchTweet = useCallback(async () => {
        setLoading(true);
        setError("");
        setNotFound(false);
        try {
            const res = await tweetsApi.getTweetById(tweetId);
            if (!res.success) {
                if (res.error?.code === "NOT_FOUND") {
                    setNotFound(true);
                } else {
                    setError(res.error?.message || "Failed to load this tweet.");
                }
            } else {
                setTweet(res.data);
            }
        } catch (err) {
            setError(err.message || "Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    }, [tweetId]);

    useEffect(() => {
        let isCancelled = false;
        async function load() {
            setLoading(true);
            setError("");
            setNotFound(false);
            try {
                const res = await tweetsApi.getTweetById(tweetId);
                if (!isCancelled) {
                    if (!res.success) {
                        if (res.error?.code === "NOT_FOUND") {
                            setNotFound(true);
                        } else {
                            setError(res.error?.message || "Failed to load this tweet.");
                        }
                    } else {
                        setTweet(res.data);
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
    }, [tweetId]);

    const handleTweetDeleted = () => {
        // The tweet itself is gone — return to the feed.
        router.push("/feed");
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-20 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={18} aria-hidden="true" />
                    </button>
                    <h1 className="text-lg font-bold text-foreground">Tweet</h1>
                </div>
            </div>

            {loading ? (
                <TweetDetailSkeleton />
            ) : notFound ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground">
                        <MessageSquare size={22} aria-hidden="true" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-foreground">This tweet doesn&apos;t exist</h3>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        It may have been deleted, or the link is incorrect.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/feed")}
                        className="mt-4"
                    >
                        Back to feed
                    </Button>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle className="mb-2 h-8 w-8 text-destructive" aria-hidden="true" />
                    <p className="text-sm font-medium text-foreground">{error}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Something went wrong loading this tweet. Please try again.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchTweet}
                        className="mt-4 gap-1.5"
                    >
                        <RefreshCw size={14} aria-hidden="true" />
                        <span>Retry</span>
                    </Button>
                </div>
            ) : tweet ? (
                <div className="divide-y divide-border/50">
                    <TweetCard
                        tweet={tweet}
                        defaultShowReplies
                        onTweetDeleted={handleTweetDeleted}
                    />
                </div>
            ) : null}
        </div>
    );
}
