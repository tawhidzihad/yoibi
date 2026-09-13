"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Radio, PlusCircle } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { streamsApi } from "../api/streamsApi";
import { CANONICAL_CATEGORIES } from "../constants/categories";
import { CATEGORY_ICONS } from "../constants/categoryIcons";
import { StreamList } from "./StreamList";
import { CreateStreamComposer } from "./CreateStreamComposer";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/utils/cn";

const PAGE_SIZE = 20;

export function StreamsView() {
    const { user, status } = useAuth();
    const [activeStatus, setActiveStatus] = useState("live");
    const [activeCategory, setActiveCategory] = useState(null);
    const [streams, setStreams] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const composerRef = useRef(null);

    const fetchKeyRef = useRef(null);
    const pageRef = useRef(1);

    const fetchStreams = useCallback(async ({ statusFilter, category, pageNum, append = false }) => {
        const fetchKey = `${statusFilter || "live"}-${category || "all"}-${pageNum}`;
        fetchKeyRef.current = fetchKey;

        if (!append) setIsLoading(true);
        else setIsLoadingMore(true);
        setError(null);

        try {
            const res = await streamsApi.getStreams({
                page: pageNum,
                limit: PAGE_SIZE,
                status: statusFilter || "live",
                category: category || null
            });

            if (fetchKeyRef.current !== fetchKey) return;

            if (res.success) {
                const items = res.data?.items || [];
                setStreams((prev) => (append ? [...prev, ...items] : items));
                setPagination(res.data?.pagination || null);
            } else {
                setError(res.error?.message || "Failed to load streams.");
            }
        } catch (err) {
            if (fetchKeyRef.current !== fetchKey) return;
            setError(err.message || "Failed to load streams.");
        } finally {
            if (fetchKeyRef.current === fetchKey) {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        }
    }, []);

    // Fetch page 1 whenever filter or status changes.
    useEffect(() => {
        let isCancelled = false;
        pageRef.current = 1;

        async function load() {
            const fetchKey = `${activeStatus || "live"}-${activeCategory || "all"}-1`;
            fetchKeyRef.current = fetchKey;
            setIsLoading(true);
            setError(null);

            try {
                const res = await streamsApi.getStreams({
                    page: 1,
                    limit: PAGE_SIZE,
                    status: activeStatus || "live",
                    category: activeCategory || null
                });
                if (isCancelled || fetchKeyRef.current !== fetchKey) return;
                if (res.success) {
                    setStreams(res.data?.items || []);
                    setPagination(res.data?.pagination || null);
                } else {
                    setError(res.error?.message || "Failed to load streams.");
                }
            } catch (err) {
                if (isCancelled || fetchKeyRef.current !== fetchKey) return;
                setError(err.message || "Failed to load streams.");
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        }

        load();
        return () => { isCancelled = true; };
    }, [activeStatus, activeCategory]);

    const handleLoadMore = () => {
        if (!pagination?.hasNextPage || isLoadingMore) return;
        const nextPage = (pagination.page || 1) + 1;
        pageRef.current = nextPage;
        fetchStreams({
            statusFilter: activeStatus,
            category: activeCategory,
            pageNum: nextPage,
            append: true
        });
    };

    const handleStreamCreated = (createdData) => {
        const newStream = createdData?.stream || createdData;
        if (newStream) {
            if (activeStatus === "ready" || activeStatus === "live") {
                setStreams((prev) => [newStream, ...prev]);
            }
        }
        setIsCreateOpen(false);
    };

    return (
        <div className="flex min-h-0 flex-col">
            {/* Page Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Radio size={16} aria-hidden="true" />
                        </div>
                        <h1 className="text-lg font-bold text-foreground">Streams</h1>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Watch and share live
                    </p>
                </div>

                {status === "authenticated" && user && (
                    <Button
                        size="sm"
                        id="start-stream-toggle-btn"
                        onClick={() => setIsCreateOpen((v) => !v)}
                        className="gap-1.5 whitespace-nowrap bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-sm shadow-cyan-500/15"
                        aria-expanded={isCreateOpen}
                        aria-controls="stream-composer-region"
                    >
                        <PlusCircle size={15} aria-hidden="true" />
                        <span>Start Stream</span>
                    </Button>
                )}
            </div>

            {/* Inline Stream Creation Composer — CSS Grid row-height animated */}
            <div
                ref={composerRef}
                data-open={isCreateOpen ? "true" : "false"}
                aria-hidden={!isCreateOpen}
                {...(!isCreateOpen ? { inert: "" } : {})}
                className="stream-composer-shell"
                id="stream-composer-region"
            >
                <div className="min-h-0 overflow-hidden">
                    <CreateStreamComposer
                        isOpen={isCreateOpen}
                        onClose={() => setIsCreateOpen(false)}
                        onStreamCreated={handleStreamCreated}
                    />
                </div>
            </div>

            {/* Filters Toolbar: Status Tabs & Category Chips */}
            <div
                className="sticky top-0 z-10 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm space-y-3"
                role="toolbar"
                aria-label="Filter streams"
            >
                {/* Status Tabs: Live Now / Preparing / Concluded */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        id="status-tab-live"
                        onClick={() => setActiveStatus("live")}
                        className={cn(
                            "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                            activeStatus === "live"
                                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        )}
                        aria-pressed={activeStatus === "live"}
                    >
                        <span className={cn("h-1.5 w-1.5 rounded-full", activeStatus === "live" ? "bg-white animate-pulse" : "bg-red-500")} />
                        <span>Live Now</span>
                    </button>

                    <button
                        type="button"
                        id="status-tab-ready"
                        onClick={() => setActiveStatus("ready")}
                        className={cn(
                            "whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                            activeStatus === "ready"
                                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        )}
                        aria-pressed={activeStatus === "ready"}
                    >
                        <span>Preparing / Scheduled</span>
                    </button>

                    <button
                        type="button"
                        id="status-tab-ended"
                        onClick={() => setActiveStatus("ended")}
                        className={cn(
                            "whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                            activeStatus === "ended"
                                ? "bg-foreground text-background shadow-md"
                                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        )}
                        aria-pressed={activeStatus === "ended"}
                    >
                        <span>Concluded</span>
                    </button>
                </div>

                {/* Category Filter Chips — Wrapping buttons with icons, zero horizontal scrollbar */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <button
                        type="button"
                        id="category-pill-all"
                        onClick={() => setActiveCategory(null)}
                        className={cn(
                            "cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                            !activeCategory
                                ? "border-cyan-500/60 bg-cyan-500/15 font-semibold text-cyan-600 dark:text-cyan-400"
                                : "border-border/50 bg-secondary/40 text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                        )}
                        aria-pressed={!activeCategory}
                    >
                        <span>All</span>
                    </button>

                    {CANONICAL_CATEGORIES.map((cat) => {
                        const Icon = CATEGORY_ICONS[cat.icon];
                        const isSelected = activeCategory === cat.id;
                        return (
                            <button
                                type="button"
                                key={cat.id}
                                id={`category-pill-${cat.id}`}
                                onClick={() => setActiveCategory(isSelected ? null : cat.id)}
                                className={cn(
                                    "flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                                    isSelected
                                        ? "border-cyan-500/60 bg-cyan-500/15 font-semibold text-cyan-600 dark:text-cyan-400"
                                        : "border-border/50 bg-secondary/40 text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                )}
                                aria-pressed={isSelected}
                            >
                                {Icon && <Icon size={12} aria-hidden="true" className="shrink-0" />}
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Streams Grid with Consistent Container Rhythm */}
            <div className="p-4 sm:p-6">
                <StreamList
                    streams={streams}
                    isLoading={isLoading}
                    isLoadingMore={isLoadingMore}
                    error={error}
                    hasMore={Boolean(pagination?.hasNextPage)}
                    onLoadMore={handleLoadMore}
                    onStartStreamClick={() => setIsCreateOpen(true)}
                    emptyMessage={
                        activeStatus === "live"
                            ? "There are currently no active live streams."
                            : activeStatus === "ready"
                            ? "No streams currently in studio preparation."
                            : "No concluded broadcasts found."
                    }
                />
            </div>
        </div>
    );
}
