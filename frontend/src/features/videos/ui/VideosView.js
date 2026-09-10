"use client";

import { useState } from "react";
import { Play, Eye, Heart, Clock } from "lucide-react";
import { mockVideos, videoCategories } from "../api/mock-videos";
import { cn } from "../../../shared/utils/cn";

function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatCount(n) {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

function VideoCard({ video }) {
    return (
        <div className="group rounded-xl border border-border/50 bg-card overflow-hidden transition-colors hover:border-cyan-500/30">
            {/* Thumbnail placeholder */}
            <div className="relative aspect-video bg-secondary/50 flex items-center justify-center">
                <Play size={32} className="text-muted-foreground/40 group-hover:text-cyan-500/60 transition-colors" aria-hidden="true" />
                <span className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
                    {formatDuration(video.duration)}
                </span>
            </div>

            <div className="p-3">
                <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-foreground leading-snug">
                    {video.title}
                </h3>
                <p className="mb-2 text-xs text-muted-foreground">@{video.author.handle}</p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Eye size={12} aria-hidden="true" /> {formatCount(video.viewsCount)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Heart size={12} aria-hidden="true" /> {formatCount(video.likesCount)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function CategoryFilter({ activeCategory, onCategoryChange }) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="toolbar" aria-label="Video categories">
            <button
                type="button"
                id="category-all"
                onClick={() => onCategoryChange(null)}
                className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                    !activeCategory
                        ? "bg-cyan-500/15 text-cyan-600"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
                aria-pressed={!activeCategory}
            >
                All
            </button>
            {videoCategories.map((cat) => (
                <button
                    type="button"
                    key={cat.id}
                    id={`category-${cat.id}`}
                    onClick={() => onCategoryChange(cat.id)}
                    className={cn(
                        "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                        activeCategory === cat.id
                            ? "bg-cyan-500/15 text-cyan-600"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    )}
                    aria-pressed={activeCategory === cat.id}
                >
                    {cat.label}
                </button>
            ))}
        </div>
    );
}

export function VideosView() {
    const [activeCategory, setActiveCategory] = useState(null);

    const filtered = activeCategory
        ? mockVideos.filter((v) => v.category === activeCategory)
        : mockVideos;

    return (
        <div>
            <div className="border-b border-border/50 px-4 py-3">
                <h1 className="text-lg font-bold text-foreground">Videos</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                    8 categories · No algorithm · Real content
                </p>
            </div>

            <div className="px-4 py-3 border-b border-border/50">
                <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                {filtered.length > 0 ? (
                    filtered.map((video) => <VideoCard key={video.id} video={video} />)
                ) : (
                    <p className="col-span-2 py-12 text-center text-sm text-muted-foreground">
                        No videos in this category yet.
                    </p>
                )}
            </div>
        </div>
    );
}
