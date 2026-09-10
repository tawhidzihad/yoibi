"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2, FileText, AtSign } from "lucide-react";
import { mockFeed } from "../api/mock-feed";
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

function FeedCard({ item }) {
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(item.likesCount);

    function toggleLike() {
        setLiked((v) => !v);
        setLikes((n) => (liked ? n - 1 : n + 1));
    }

    return (
        <article className="border-b border-border/50 px-4 py-4 transition-colors hover:bg-secondary/20">
            <div className="flex gap-3">
                <Avatar name={item.author.name} />
                <div className="min-w-0 flex-1">
                    {/* Author + type badge */}
                    <div className="mb-1 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{item.author.name}</span>
                        <span className="text-xs text-muted-foreground">@{item.author.handle}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{formatRelative(item.createdAt)}</span>
                        <span
                            className={cn(
                                "ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                item.type === "post"
                                    ? "bg-blue-500/10 text-blue-500"
                                    : "bg-cyan-500/10 text-cyan-500"
                            )}
                        >
                            {item.type === "post" ? (
                                <FileText size={10} aria-hidden="true" />
                            ) : (
                                <AtSign size={10} aria-hidden="true" />
                            )}
                            {item.type}
                        </span>
                    </div>

                    {/* Content */}
                    <p className="mb-3 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                        {item.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-5 text-muted-foreground">
                        <button
                            type="button"
                            id={`feed-like-${item.id}`}
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
                            id={`feed-comment-${item.id}`}
                            aria-label="View comments"
                            className="flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                        >
                            <MessageCircle size={14} aria-hidden="true" />
                            {item.commentsCount}
                        </button>

                        <button
                            type="button"
                            id={`feed-share-${item.id}`}
                            aria-label="Share"
                            className="flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                        >
                            <Share2 size={14} aria-hidden="true" />
                            {item.sharesCount}
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

export function FeedView() {
    return (
        <div>
            <div className="border-b border-border/50 px-4 py-3">
                <h1 className="text-lg font-bold text-foreground">Feed</h1>
            </div>
            <div>
                {mockFeed.map((item) => (
                    <FeedCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}
