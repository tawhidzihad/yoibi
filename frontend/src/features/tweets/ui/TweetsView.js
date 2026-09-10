"use client";

import { useState } from "react";
import { Heart, Repeat2, MessageCircle } from "lucide-react";
import { mockTweets } from "../api/mock-tweets";
import { cn } from "../../../shared/utils/cn";

function formatRelative(isoString) {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

function Avatar({ name }) {
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-semibold text-cyan-600">
            {initials}
        </div>
    );
}

export function TweetCard({ tweet }) {
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(tweet.likesCount);
    const [retweeted, setRetweeted] = useState(false);
    const [retweets, setRetweets] = useState(tweet.retweetCount);

    function toggleLike() {
        setLiked((v) => !v);
        setLikes((n) => (liked ? n - 1 : n + 1));
    }

    function toggleRetweet() {
        setRetweeted((v) => !v);
        setRetweets((n) => (retweeted ? n - 1 : n + 1));
    }

    return (
        <article className="border-b border-border/50 px-4 py-4 transition-colors hover:bg-secondary/20">
            <div className="flex gap-3">
                <Avatar name={tweet.author.name} />
                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{tweet.author.name}</span>
                        <span className="text-xs text-muted-foreground">@{tweet.author.handle}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{formatRelative(tweet.createdAt)}</span>
                    </div>

                    <p className="mb-3 text-sm leading-relaxed text-foreground/90">{tweet.content}</p>

                    <div className="flex items-center gap-5 text-muted-foreground">
                        <button
                            type="button"
                            id={`tweet-like-${tweet.id}`}
                            onClick={toggleLike}
                            aria-label={liked ? "Unlike" : "Like"}
                            aria-pressed={liked}
                            className={cn(
                                "flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded",
                                liked && "text-pink-400"
                            )}
                        >
                            <Heart size={14} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
                            {likes}
                        </button>

                        <button
                            type="button"
                            id={`tweet-retweet-${tweet.id}`}
                            onClick={toggleRetweet}
                            aria-label={retweeted ? "Undo retweet" : "Retweet"}
                            aria-pressed={retweeted}
                            className={cn(
                                "flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded",
                                retweeted && "text-green-400"
                            )}
                        >
                            <Repeat2 size={14} aria-hidden="true" />
                            {retweets}
                        </button>

                        <button
                            type="button"
                            id={`tweet-reply-${tweet.id}`}
                            aria-label="Reply"
                            className="flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                        >
                            <MessageCircle size={14} aria-hidden="true" />
                            {tweet.repliesCount}
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

export function TweetsView() {
    return (
        <div>
            <div className="border-b border-border/50 px-4 py-3">
                <h1 className="text-lg font-bold text-foreground">Tweets</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Concise thoughts · Character-limited · Real conversations
                </p>
            </div>
            <div>
                {mockTweets.map((tweet) => (
                    <TweetCard key={tweet.id} tweet={tweet} />
                ))}
            </div>
        </div>
    );
}
