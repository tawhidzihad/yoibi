"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Radio, PlusCircle, Sparkles, Filter } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { streamsApi } from "../api/streamsApi";
import { CANONICAL_CATEGORIES } from "../constants/categories";
import { StreamList } from "./StreamList";
import { CreateStreamModal } from "./CreateStreamModal";
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

    return (
        <div className="space-y-6 pb-12">
            {/* Header with Title & Broadcast Trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Radio size={18} aria-hidden="true" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">Live Broadcasts</h1>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Ultra-low latency realtime video, audio, and screen share broadcasts powered by LiveKit SFU.
                    </p>
                </div>

                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-md shadow-cyan-500/15"
                >
                    <PlusCircle size={16} aria-hidden="true" />
                    <span>Start Stream</span>
                </Button>
            </div>

            {/* Status Tabs: Live / Preparing / Past */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                    type="button"
                    onClick={() => setActiveStatus("live")}
                    className={cn(
                        "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0",
                        activeStatus === "live"
                            ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                            : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                >
                    <span className={cn("h-1.5 w-1.5 rounded-full", activeStatus === "live" ? "bg-white animate-pulse" : "bg-red-500")} />
                    Live Now
                </button>

                <button
                    type="button"
                    onClick={() => setActiveStatus("ready")}
                    className={cn(
                        "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0",
                        activeStatus === "ready"
                            ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                            : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                >
                    Preparing / Scheduled
                </button>

                <button
                    type="button"
                    onClick={() => setActiveStatus("ended")}
                    className={cn(
                        "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0",
                        activeStatus === "ended"
                            ? "bg-foreground text-background shadow-md"
                            : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                >
                    Concluded
                </button>
            </div>

            {/* Canonical Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0 border",
                        activeCategory === null
                            ? "border-cyan-500 bg-cyan-500/15 text-cyan-400 font-semibold"
                            : "border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                >
                    All Categories
                </button>

                {CANONICAL_CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                        className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0 border",
                            activeCategory === cat.id
                                ? "border-cyan-500 bg-cyan-500/15 text-cyan-400 font-semibold"
                                : "border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Streams Grid */}
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

            {/* Create Stream Modal */}
            <CreateStreamModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            />
        </div>
    );
}
