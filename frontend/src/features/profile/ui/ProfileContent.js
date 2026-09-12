"use client";

import { useState, useEffect, useRef } from "react";
import { AtSign, Play, Radio } from "lucide-react";
import { TweetList } from "@/features/tweets/ui/TweetList";
import { tweetsApi } from "@/features/tweets/api/tweetsApi";
import { VideoList } from "@/features/videos/ui/VideoList";
import { VideoPlayerModal } from "@/features/videos/ui/VideoPlayerModal";
import { videosApi } from "@/features/videos/api/videosApi";
import { StreamCard } from "@/features/streams/ui/StreamCard";
import { streamsApi } from "@/features/streams/api/streamsApi";
import { EmptyState } from "@/shared/feedback/EmptyState";
import { cn } from "@/shared/utils/cn";

const PAGE_LIMIT = 20;

function StreamsSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border/40 bg-card">
                    <div className="aspect-video w-full animate-pulse bg-secondary/40" />
                    <div className="flex flex-col gap-2 p-4">
                        <div className="h-3 w-2/3 animate-pulse rounded bg-secondary/60" />
                        <div className="h-3 w-1/3 animate-pulse rounded bg-secondary/40" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function TabError({ onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-destructive">Failed to load content</p>
            <p className="mt-1 text-xs text-muted-foreground">Something went wrong. Please try again.</p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-4 cursor-pointer rounded-full border border-border/80 px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
                Retry
            </button>
        </div>
    );
}

/**
 * Profile content tabs: Tweets | Videos | Streams.
 * Every tab fetches ONLY the profile owner's content via server-side
 * authorship filters (authorHandle for tweets, canonical authorId for
 * videos/streams) — never the full platform feed filtered in the browser.
 */
export function ProfileContent({ profile, isOwner }) {
    const [activeTab, setActiveTab] = useState("tweets");

    const tabs = [
        { id: "tweets", label: "Tweets", count: profile?.tweetsCount ?? 0, icon: AtSign },
        { id: "videos", label: "Videos", count: profile?.videosCount ?? 0, icon: Play },
        { id: "streams", label: "Streams", count: profile?.streamsCount ?? 0, icon: Radio },
    ];

    return (
        <section aria-label={`${profile?.name || "user"}'s content`}>
            {/* Tab bar — horizontally scrollable on tiny screens without page overflow */}
            <div role="tablist" aria-label="Profile content" className="overflow-x-auto border-b border-border/50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max px-2 sm:px-4">
                    {tabs.map(({ id, label, count, icon: Icon }) => {
                        const active = activeTab === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                id={`profile-tab-${id}`}
                                aria-controls={`profile-panel-${id}`}
                                onClick={() => setActiveTab(id)}
                                className={cn(
                                    "flex min-h-[48px] cursor-pointer items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                                    active
                                        ? "border-cyan-500 text-foreground"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon size={15} aria-hidden="true" />
                                {label}
                                <span
                                    className={cn(
                                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                        active ? "bg-cyan-500/15 text-cyan-600" : "bg-secondary text-muted-foreground"
                                    )}
                                >
                                    {Number(count) || 0}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div role="tabpanel" id={`profile-panel-${activeTab}`} aria-labelledby={`profile-tab-${activeTab}`} tabIndex={-1}>
                {activeTab === "tweets" && <ProfileTweets profile={profile} isOwner={isOwner} />}
                {activeTab === "videos" && <ProfileVideos profile={profile} />}
                {activeTab === "streams" && <ProfileStreams profile={profile} />}
            </div>
        </section>
    );
}

/* ------------------------------ Tweets tab ------------------------------ */

function ProfileTweets({ profile, isOwner }) {
    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);

    // Current page tracked in a ref so the load-more handler never races with
    // a stale closure; fetch keys guard against out-of-order responses.
    const pageRef = useRef(1);
    const fetchKeyRef = useRef("");

    useEffect(() => {
        if (!profile?.handle) return;
        let isCancelled = false;
        pageRef.current = 1;

        async function load() {
            const fetchKey = `${profile.handle}-1`;
            fetchKeyRef.current = fetchKey;
            setLoading(true);
            setError(null);
            try {
                const res = await tweetsApi.getTweets({
                    page: 1,
                    limit: PAGE_LIMIT,
                    authorHandle: profile.handle,
                });
                if (isCancelled || fetchKeyRef.current !== fetchKey) return;
                if (res.success) {
                    setTweets(res.data?.items || []);
                    setHasNextPage(Boolean(res.data?.pagination?.hasNextPage));
                } else {
                    setError(res.error?.message || "Failed to load tweets.");
                }
            } catch (err) {
                if (isCancelled || fetchKeyRef.current !== fetchKey) return;
                setError(err.message || "Unable to connect to the server.");
            } finally {
                if (fetchKeyRef.current === fetchKey) setLoading(false);
            }
        }

        load();
        return () => {
            isCancelled = true;
        };
    }, [profile?.handle, reloadToken]);

    const handleLoadMore = async () => {
        if (loadingMore || !hasNextPage) return;
        const nextPage = pageRef.current + 1;
        const fetchKey = `${profile?.handle || ""}-${nextPage}`;
        setLoadingMore(true);
        fetchKeyRef.current = fetchKey;
        try {
            const res = await tweetsApi.getTweets({
                page: nextPage,
                limit: PAGE_LIMIT,
                authorHandle: profile?.handle,
            });
            if (fetchKeyRef.current !== fetchKey) return;
            if (res.success) {
                setTweets((prev) => [...prev, ...(res.data?.items || [])]);
                setHasNextPage(Boolean(res.data?.pagination?.hasNextPage));
                pageRef.current = nextPage;
            }
        } finally {
            if (fetchKeyRef.current === fetchKey) setLoadingMore(false);
        }
    };

    if (!profile?.handle) return null;

    if (loading && tweets.length === 0) {
        return <TweetList tweets={[]} loading error={null} onRetry={() => setReloadToken((n) => n + 1)} hasNextPage={false} emptyMessage="" />;
    }

    if (error && tweets.length === 0) {
        return <TabError onRetry={() => setReloadToken((n) => n + 1)} />;
    }

    if (!loading && tweets.length === 0) {
        return (
            <div className="p-4">
                <EmptyState
                    icon={AtSign}
                    title="No tweets yet"
                    description={
                        isOwner
                            ? "You haven't shared any tweets yet. Start the conversation!"
                            : "This user hasn't shared any tweets yet."
                    }
                />
            </div>
        );
    }

    return (
        <TweetList
            tweets={tweets}
            loading={false}
            error={null}
            onRetry={() => setReloadToken((n) => n + 1)}
            onTweetDeleted={(id) => setTweets((prev) => prev.filter((t) => t.id !== id))}
            hasNextPage={hasNextPage}
            onLoadMore={handleLoadMore}
            loadingMore={loadingMore}
            emptyMessage="No tweets yet"
        />
    );
}

/* ------------------------------ Videos tab ------------------------------ */

function ProfileVideos({ profile }) {
    const [videos, setVideos] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);
    const [activeVideo, setActiveVideo] = useState(null);

    const pageRef = useRef(1);
    const fetchKeyRef = useRef("");

    useEffect(() => {
        if (!profile?.id) return;
        let isCancelled = false;
        pageRef.current = 1;

        async function load() {
            const fetchKey = `${profile.id}-1`;
            fetchKeyRef.current = fetchKey;
            setLoading(true);
            setError(null);
            try {
                const res = await videosApi.getVideos({
                    page: 1,
                    limit: PAGE_LIMIT,
                    authorId: profile.id,
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
                setError(err.message || "Unable to connect to the server.");
            } finally {
                if (fetchKeyRef.current === fetchKey) setLoading(false);
            }
        }

        load();
        return () => {
            isCancelled = true;
        };
    }, [profile?.id, reloadToken]);

    const handleLoadMore = async () => {
        if (loadingMore || !pagination?.hasNextPage) return;
        const nextPage = pageRef.current + 1;
        const fetchKey = `${profile?.id || ""}-${nextPage}`;
        setLoadingMore(true);
        fetchKeyRef.current = fetchKey;
        try {
            const res = await videosApi.getVideos({
                page: nextPage,
                limit: PAGE_LIMIT,
                authorId: profile?.id,
            });
            if (fetchKeyRef.current !== fetchKey) return;
            if (res.success) {
                setVideos((prev) => [...prev, ...(res.data?.items || [])]);
                setPagination(res.data?.pagination || null);
                pageRef.current = nextPage;
            }
        } finally {
            if (fetchKeyRef.current === fetchKey) setLoadingMore(false);
        }
    };

    if (!profile?.id) return null;

    if (loading && videos.length === 0) {
        return <VideoList videos={[]} isLoading error={null} />;
    }

    if (error && videos.length === 0) {
        return <TabError onRetry={() => setReloadToken((n) => n + 1)} />;
    }

    return (
        <>
            <VideoList
                videos={videos}
                isLoading={loadingMore}
                error={null}
                onRetry={() => setReloadToken((n) => n + 1)}
                onPlay={setActiveVideo}
                onVideoDeleted={(id) => setVideos((prev) => prev.filter((v) => (v.id || v._id) !== id))}
                pagination={pagination}
                onLoadMore={handleLoadMore}
            />
            <VideoPlayerModal
                key={activeVideo?.id || activeVideo?._id || "player"}
                video={activeVideo}
                isOpen={Boolean(activeVideo)}
                onClose={() => setActiveVideo(null)}
            />
        </>
    );
}

/* ------------------------------ Streams tab ------------------------------ */

function ProfileStreams({ profile }) {
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);

    const pageRef = useRef(1);
    const fetchKeyRef = useRef("");

    useEffect(() => {
        if (!profile?.id) return;
        let isCancelled = false;
        pageRef.current = 1;

        async function load() {
            const fetchKey = `${profile.id}-1`;
            fetchKeyRef.current = fetchKey;
            setLoading(true);
            setError(null);
            try {
                const res = await streamsApi.getStreams({
                    page: 1,
                    limit: PAGE_LIMIT,
                    status: "all",
                    authorId: profile.id,
                });
                if (isCancelled || fetchKeyRef.current !== fetchKey) return;
                if (res.success) {
                    setStreams(res.data?.items || []);
                    setHasNextPage(Boolean(res.data?.pagination?.hasNextPage));
                } else {
                    setError(res.error?.message || "Failed to load streams.");
                }
            } catch (err) {
                if (isCancelled || fetchKeyRef.current !== fetchKey) return;
                setError(err.message || "Unable to connect to the server.");
            } finally {
                if (fetchKeyRef.current === fetchKey) setLoading(false);
            }
        }

        load();
        return () => {
            isCancelled = true;
        };
    }, [profile?.id, reloadToken]);

    const handleLoadMore = async () => {
        if (loadingMore || !hasNextPage) return;
        const nextPage = pageRef.current + 1;
        const fetchKey = `${profile?.id || ""}-${nextPage}`;
        setLoadingMore(true);
        fetchKeyRef.current = fetchKey;
        try {
            const res = await streamsApi.getStreams({
                page: nextPage,
                limit: PAGE_LIMIT,
                status: "all",
                authorId: profile?.id,
            });
            if (fetchKeyRef.current !== fetchKey) return;
            if (res.success) {
                setStreams((prev) => [...prev, ...(res.data?.items || [])]);
                setHasNextPage(Boolean(res.data?.pagination?.hasNextPage));
                pageRef.current = nextPage;
            }
        } finally {
            if (fetchKeyRef.current === fetchKey) setLoadingMore(false);
        }
    };

    if (!profile?.id) return null;

    if (loading && streams.length === 0) {
        return <StreamsSkeleton />;
    }

    if (error && streams.length === 0) {
        return <TabError onRetry={() => setReloadToken((n) => n + 1)} />;
    }

    if (streams.length === 0) {
        return (
            <div className="p-4">
                <EmptyState
                    icon={Radio}
                    title="No streams yet"
                    description="This user hasn't created any streams yet."
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {streams.map((stream) => (
                    <StreamCard key={stream.id || stream._id} stream={stream} />
                ))}
            </div>
            {hasNextPage && (
                <div className="flex justify-center px-4 pb-6">
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="cursor-pointer rounded-full border border-border/80 px-5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                        {loadingMore ? "Loading..." : "Load More"}
                    </button>
                </div>
            )}
        </div>
    );
}
