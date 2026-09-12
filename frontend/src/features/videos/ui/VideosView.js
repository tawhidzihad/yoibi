"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { videosApi } from "../api/videosApi";
import { CANONICAL_CATEGORIES } from "../constants/categories";
import { CATEGORY_ICONS } from "../constants/categoryIcons";
import { VideoList } from "./VideoList";
import { UploadVideoComposer } from "./UploadVideoComposer";
import { VideoPlayerModal } from "./VideoPlayerModal";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/utils/cn";

const PAGE_SIZE = 20;

export function VideosView() {
    const { user, status } = useAuth();
    const [activeCategory, setActiveCategory] = useState(null);
    const [videos, setVideos] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [activeVideo, setActiveVideo] = useState(null);

    // Prevent double-fetch on category change
    const fetchKeyRef = useRef(null);
    // Track current page without triggering re-renders inside effects
    const pageRef = useRef(1);

    const fetchVideos = useCallback(async ({ category, pageNum, append = false }) => {
        const fetchKey = `${category || "all"}-${pageNum}`;
        fetchKeyRef.current = fetchKey;

        if (!append) setIsLoading(true);
        setError(null);

        try {
            const res = await videosApi.getVideos({
                page: pageNum,
                limit: PAGE_SIZE,
                category: category || null
            });

            // Guard against stale response from previous filter
            if (fetchKeyRef.current !== fetchKey) return;

            if (res.success) {
                const items = res.data?.items || [];
                setVideos((prev) => (append ? [...prev, ...items] : items));
                setPagination(res.data?.pagination || null);
            } else {
                setError(res.error?.message || "Failed to load videos.");
            }
        } catch (err) {
            if (fetchKeyRef.current !== fetchKey) return;
            setError(err.message || "Failed to load videos.");
        } finally {
            if (fetchKeyRef.current === fetchKey) {
                setIsLoading(false);
            }
        }
    }, []);

    // Fetch page 1 whenever the category changes.
    // setState calls are inside the inner async function, not the effect body directly.
    useEffect(() => {
        let isCancelled = false;
        pageRef.current = 1;

        async function load() {
            const fetchKey = `${activeCategory || "all"}-1`;
            fetchKeyRef.current = fetchKey;
            setIsLoading(true);
            setError(null);
            try {
                const res = await videosApi.getVideos({
                    page: 1,
                    limit: PAGE_SIZE,
                    category: activeCategory || null
                });
                if (isCancelled || fetchKeyRef.current !== fetchKey) return;
                if (res.success) {
                    setVideos(res.data?.items || []);
                    setPagination(res.data?.pagination || null);
                } else {
                    setError(res.error?.message || "Failed to load videos.");
                }
            } catch (err) {
                if (isCancelled || fetchKeyRef.current !== fetchKey) return;
                setError(err.message || "Failed to load videos.");
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        }

        load();
        return () => { isCancelled = true; };
    }, [activeCategory]);

    const handleCategoryChange = (categoryId) => {
        if (categoryId === activeCategory) return;
        setActiveCategory(categoryId);
    };

    const handleLoadMore = () => {
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        fetchVideos({ category: activeCategory, pageNum: nextPage, append: true });
    };

    const handleRetry = () => {
        fetchVideos({ category: activeCategory, pageNum: pageRef.current, append: false });
    };

    const handleVideoUploaded = (newVideo) => {
        setVideos((prev) => [newVideo, ...prev]);
    };

    const handleVideoDeleted = (deletedId) => {
        setVideos((prev) => prev.filter((v) => (v.id || v._id) !== deletedId));
    };

    const handleLikeChange = (videoId, liked, likesCount) => {
        setVideos((prev) =>
            prev.map((v) =>
                (v.id || v._id) === videoId ? { ...v, liked, likesCount } : v
            )
        );
    };

    return (
        <div className="flex min-h-0 flex-col">
            {/* Page Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <div>
                    <h1 className="text-lg font-bold text-foreground">Videos</h1>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Discover content across categories
                    </p>
                </div>

                {status === "authenticated" && user && (
                    <Button
                        size="sm"
                        onClick={() => setIsUploadOpen((v) => !v)}
                        id="open-upload-video-btn"
                        className="gap-1.5"
                        aria-expanded={isUploadOpen}
                    >
                        <Plus size={14} aria-hidden="true" />
                        Upload Video
                    </Button>
                )}
            </div>

            {/* Inline Upload Composer (expands in place — no modal) */}
            {isUploadOpen && (
                <UploadVideoComposer
                    onClose={() => setIsUploadOpen(false)}
                    onVideoUploaded={handleVideoUploaded}
                />
            )}

            {/* Category Filter Toolbar */}
            <div
                className="sticky top-0 z-10 border-b border-border/50 bg-background/95 px-4 py-2.5 backdrop-blur-sm"
                role="toolbar"
                aria-label="Filter videos by category"
            >
                <div className="flex flex-wrap gap-2">
                    {/* All Button */}
                    <button
                        type="button"
                        id="category-pill-all"
                        onClick={() => handleCategoryChange(null)}
                        className={cn(
                            "cursor-pointer rounded-full border px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                            !activeCategory
                                ? "border-cyan-500/60 bg-cyan-500/15 font-semibold text-cyan-600 dark:text-cyan-400"
                                : "border-border/50 bg-secondary/40 text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                        )}
                        aria-pressed={!activeCategory}
                    >
                        All
                    </button>

                    {CANONICAL_CATEGORIES.map((cat) => {
                        const Icon = CATEGORY_ICONS[cat.icon];
                        return (
                            <button
                                type="button"
                                key={cat.id}
                                id={`category-pill-${cat.id}`}
                                onClick={() => handleCategoryChange(cat.id)}
                                className={cn(
                                    "flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                                    activeCategory === cat.id
                                        ? "border-cyan-500/60 bg-cyan-500/15 font-semibold text-cyan-600 dark:text-cyan-400"
                                        : "border-border/50 bg-secondary/40 text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                )}
                                aria-pressed={activeCategory === cat.id}
                            >
                                {Icon && <Icon size={13} aria-hidden="true" className="shrink-0" />}
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Video Grid */}
            <VideoList
                videos={videos}
                isLoading={isLoading}
                error={error}
                onRetry={handleRetry}
                onPlay={setActiveVideo}
                onVideoDeleted={handleVideoDeleted}
                pagination={pagination}
                onLoadMore={handleLoadMore}
            />

            {/* Video Player Modal — keyed by video id so state resets per video */}
            <VideoPlayerModal
                key={activeVideo?.id || activeVideo?._id || "player"}
                video={activeVideo}
                isOpen={Boolean(activeVideo)}
                onClose={() => setActiveVideo(null)}
                onLikeChange={handleLikeChange}
            />
        </div>
    );
}
