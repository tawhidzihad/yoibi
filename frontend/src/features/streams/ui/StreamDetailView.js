"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    Radio,
    Clock,
    Users,
    ArrowLeft,
    AlertCircle,
    Loader2,
    Trash2,
    Share2,
    Calendar,
    Sparkles
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { streamsApi } from "../api/streamsApi";
import { StreamRoom } from "./StreamRoom";
import { StreamTrackView } from "./StreamTrackView";
import { HostControls } from "./HostControls";
import { ViewerControls } from "./ViewerControls";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/utils/cn";

function BroadcasterCard({ author, isOwner = false }) {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                {author?.avatarUrl ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-cyan-500/30 shadow-md">
                        <Image
                            src={author.avatarUrl}
                            alt={author.name || "Broadcaster"}
                            fill
                            className="object-cover"
                            sizes="48px"
                        />
                    </div>
                ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-400 border border-cyan-500/30">
                        {(author?.name || "Broadcaster").slice(0, 2).toUpperCase()}
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">{author?.name || "Broadcaster"}</h3>
                        {isOwner && (
                            <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/30">
                                You (Host)
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">@{author?.handle || "broadcaster"}</p>
                </div>
            </div>
        </div>
    );
}

export function StreamDetailView({ streamId }) {
    const router = useRouter();
    const { user, status: authStatus } = useAuth();
    const playerContainerRef = useRef(null);

    const [stream, setStream] = useState(null);
    const [livekitData, setLivekitData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [connectionError, setConnectionError] = useState(null);
    const [hasEndedLocally, setHasEndedLocally] = useState(false);

    const isOwner = Boolean(
        user &&
            stream &&
            (user.id === stream.authorId ||
                user.id === stream.author?.id ||
                user.id === stream.author?._id ||
                user._id === stream.authorId ||
                user._id === stream.author?.id ||
                user._id === stream.author?._id)
    );
    const isAdmin = user?.role === "admin";
    const isLive = stream?.status === "live" && !hasEndedLocally;
    const isReady = stream?.status === "ready" && !hasEndedLocally;
    const isEnded = stream?.status === "ended" || hasEndedLocally;

    // Stable references to prevent stale closures across asynchronous lifecycles
    const streamRef = useRef(null);
    const ownerRef = useRef(false);
    const authRef = useRef("loading");
    const livekitRef = useRef(null);
    const connectToRoomRef = useRef(null);
    const fetchStreamSnapshotRef = useRef(null);

    // Initial stream metadata fetch
    async function fetchStreamSnapshot() {
        try {
            const res = await streamsApi.getStreamById(streamId);
            if (res.success && res.data) {
                setStream(res.data);
                return res.data;
            } else {
                setError(res.error?.message || "Stream not found.");
                return null;
            }
        } catch (err) {
            setError(err?.message || "Failed to load stream details.");
            return null;
        }
    }

    // Connect to LiveKit Room (Host in ready/live or Viewer in live)
    async function connectToRoom(targetStream) {
        const target = targetStream || streamRef.current;
        if (!target) return;

        // Viewers cannot join ready streams (server enforces STREAM_NOT_LIVE)
        if (!ownerRef.current && target.status === "ready") {
            return;
        }

        // Do not connect if stream is ended
        if (target.status === "ended" || hasEndedLocally) {
            return;
        }

        // Avoid duplicate concurrent join requests
        if (livekitRef.current) {
            return;
        }

        setIsJoining(true);
        setConnectionError(null);

        try {
            const res = await streamsApi.joinStream(streamId);
            if (res.success && res.data?.livekit) {
                setLivekitData(res.data.livekit);
            } else {
                setConnectionError(res.error?.message || "Unable to connect to this stream.");
            }
        } catch (err) {
            if (err?.code === "STREAM_NOT_LIVE" || err?.message?.includes("STREAM_NOT_LIVE")) {
                // Stream is still in preparation
                return;
            }
            setConnectionError(err?.message || "Unable to connect to this stream.");
        } finally {
            setIsJoining(false);
        }
    }

    useEffect(() => {
        streamRef.current = stream;
        ownerRef.current = isOwner;
        authRef.current = authStatus;
        livekitRef.current = livekitData;
        connectToRoomRef.current = connectToRoom;
        fetchStreamSnapshotRef.current = fetchStreamSnapshot;
    });

    useEffect(() => {
        let cancelled = false;

        async function init() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await streamsApi.getStreamById(streamId);
                if (cancelled) return;
                if (res.success && res.data) {
                    setStream(res.data);
                } else {
                    setError(res.error?.message || "Stream not found.");
                }
            } catch (err) {
                if (cancelled) return;
                setError(err?.message || "Failed to load stream details.");
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        init();
        return () => {
            cancelled = true;
        };
    }, [streamId]);

    // Room connection lifecycle trigger
    useEffect(() => {
        if (!stream || authStatus === "loading" || hasEndedLocally) return;

        if (isOwner) {
            // Host joins in ready or live state to preview devices & broadcast
            if ((stream.status === "ready" || stream.status === "live") && !livekitData && !isJoining) {
                connectToRoomRef.current?.(stream);
            }
        } else {
            // Viewer joins only when stream is live
            if (stream.status === "live" && !livekitData && !isJoining) {
                connectToRoomRef.current?.(stream);
            }
        }
    }, [stream, isOwner, authStatus, livekitData, isJoining, hasEndedLocally]);

    // Automatic polling for viewers waiting on a ready stream
    useEffect(() => {
        if (!stream || isOwner || stream.status !== "ready" || hasEndedLocally) {
            return;
        }

        const interval = setInterval(async () => {
            try {
                const res = await streamsApi.getStreamById(streamId);
                if (res.success && res.data) {
                    if (res.data.status === "live" || res.data.status === "ended") {
                        setStream(res.data);
                    }
                }
            } catch (err) {
                // Silently keep polling
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [stream, isOwner, streamId, hasEndedLocally]);

    // Host Action: Go Live
    const handleStartBroadcast = async () => {
        setIsStarting(true);
        try {
            const res = await streamsApi.startStream(streamId);
            if (res.success && res.data) {
                setStream(res.data.stream);
                if (res.data.livekit) {
                    setLivekitData(res.data.livekit);
                }
            } else {
                setError(res.error?.message || "Failed to start broadcast.");
            }
        } catch (err) {
            setError(err?.message || "Error going live.");
        } finally {
            setIsStarting(false);
        }
    };

    // Host Action: End Stream
    const handleEndBroadcast = async () => {
        setIsEnding(true);
        try {
            const res = await streamsApi.endStream(streamId);
            if (res.success) {
                setHasEndedLocally(true);
                setLivekitData(null);
                setStream((prev) => (prev ? { ...prev, status: "ended", endedAt: new Date() } : null));
            } else {
                setError(res.error?.message || "Failed to end broadcast.");
            }
        } catch (err) {
            setError(err?.message || "Error ending stream.");
        } finally {
            setIsEnding(false);
        }
    };

    // Owner / Admin Action: Delete Stream
    const handleDeleteStream = async () => {
        if (!confirm("Are you sure you want to delete this stream record?")) return;
        setIsDeleting(true);
        try {
            const res = await streamsApi.deleteStream(streamId);
            if (res.success) {
                router.push("/streams");
            } else {
                setError(res.error?.message || "Failed to delete stream.");
            }
        } catch (err) {
            setError(err?.message || "Error deleting stream.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Manual Refresh for Viewer in Ready State
    const handleRefreshStream = async () => {
        setIsRefreshing(true);
        try {
            const res = await streamsApi.getStreamById(streamId);
            if (res.success && res.data) {
                setStream(res.data);
            } else {
                setError(res.error?.message || "Stream not found.");
            }
        } catch (err) {
            setError(err?.message || "Failed to load stream details.");
        } finally {
            setIsRefreshing(false);
        }
    };

    // LiveKit Room Disconnect Handler
    const handleRoomDisconnected = (reason) => {
        console.log("[Stream Room Disconnected]:", reason);
        setHasEndedLocally(true);
        setLivekitData(null);
        setStream((prev) => (prev ? { ...prev, status: "ended", endedAt: new Date() } : null));
    };

    // LiveKit Room Error Handler
    const handleRoomError = (err) => {
        console.error("[Stream Room Error]:", err);
        setConnectionError("Unable to connect to this stream.");
    };

    if (isLoading || authStatus === "loading") {
        return (
            <div className="flex h-[70vh] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 size={36} className="animate-spin text-cyan-400" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground">Loading Stream Studio...</p>
                </div>
            </div>
        );
    }

    if (error && !stream) {
        return (
            <div className="mx-auto max-w-2xl py-12 px-4 text-center">
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 backdrop-blur-sm">
                    <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-400" aria-hidden="true" />
                    <h2 className="text-lg font-bold text-foreground">Stream Unavailable</h2>
                    <p className="mt-2 text-xs text-muted-foreground">{error}</p>
                    <Link href="/streams" className="mt-5 inline-block">
                        <Button variant="secondary" size="sm" className="gap-2">
                            <ArrowLeft size={14} aria-hidden="true" />
                            Back to Streams
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 space-y-6 pb-12">
            {/* Top Navigation */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <Link
                    href="/streams"
                    className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={14} aria-hidden="true" />
                    <span>Back to Live Streams</span>
                </Link>

                {(isOwner || isAdmin) && (isReady || isEnded) && (
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={isDeleting}
                        onClick={handleDeleteStream}
                        className="gap-1.5 text-xs text-red-400 hover:text-red-300 hover:border-red-500/40"
                    >
                        <Trash2 size={13} aria-hidden="true" />
                        <span>Delete Stream</span>
                    </Button>
                )}
            </div>

            {/* Error Notification Banner */}
            {error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
                    <span>{error}</span>
                </div>
            )}

            {/* Connection Error Banner with Retry */}
            {connectionError && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0 text-amber-400" aria-hidden="true" />
                        <span>Unable to connect to this stream.</span>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            setConnectionError(null);
                            setLivekitData(null);
                            connectToRoomRef.current?.(stream);
                        }}
                        className="h-7 px-3 text-xs border border-amber-500/30 text-amber-300 hover:text-amber-200"
                    >
                        Try again
                    </Button>
                </div>
            )}

            {/* Broadcast Stage Area */}
            {isEnded ? (
                /* 1. Ended State */
                <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border/60 bg-black shadow-2xl">
                    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-card/80 via-background to-secondary/30">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/80 text-muted-foreground border border-border/60">
                            <Radio size={32} aria-hidden="true" />
                        </div>
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground mb-2">
                            BROADCAST CONCLUDED
                        </span>
                        <h2 className="text-xl font-bold text-foreground max-w-md">{stream.title}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            This live broadcast session has ended.
                        </p>
                        <Link href="/streams" className="mt-6">
                            <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                                Discover Other Live Streams
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : isReady && !isOwner ? (
                /* 2. Ready State (Viewer Perspective — Waiting for Host) */
                <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border/60 bg-black shadow-2xl">
                    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-card/90 via-background to-secondary/40">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                            <Clock size={32} aria-hidden="true" />
                        </div>
                        <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 mb-2 border border-amber-500/30">
                            HOST IS PREPARING
                        </span>
                        <h2 className="text-xl font-bold text-foreground max-w-md">{stream.title}</h2>
                        <p className="mt-2 text-xs text-muted-foreground max-w-sm">
                            The broadcaster is currently setting up audio and video devices. Viewer joins will be enabled once the stream goes live!
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRefreshStream}
                            disabled={isRefreshing}
                            className="mt-6 gap-2 text-xs"
                        >
                            {isRefreshing ? (
                                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                            ) : (
                                <Radio size={13} aria-hidden="true" />
                            )}
                            Check If Live
                        </Button>
                    </div>
                </div>
            ) : livekitData ? (
                /* 3. LiveKit Room Stage: Provider wraps BOTH player and controls bar */
                <StreamRoom
                    serverUrl={livekitData.url}
                    token={livekitData.token}
                    isHost={isOwner}
                    onDisconnected={handleRoomDisconnected}
                    onError={handleRoomError}
                >
                    <div className="space-y-4">
                        {/* Player Container */}
                        <div
                            ref={playerContainerRef}
                            className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border/60 bg-black shadow-2xl"
                        >
                            <StreamTrackView
                                author={stream.author}
                                title={stream.title}
                                isHost={isOwner}
                            />
                        </div>

                        {/* Controls Bar (Guaranteed Inside LiveKit Room Context) */}
                        {isOwner ? (
                            <HostControls
                                streamStatus={stream.status}
                                onStartBroadcast={handleStartBroadcast}
                                onEndBroadcast={handleEndBroadcast}
                                isStarting={isStarting}
                                isEnding={isEnding}
                            />
                        ) : isLive && !isOwner ? (
                            <ViewerControls
                                viewerCount={stream.viewerCount || 0}
                                onLeave={() => router.push("/streams")}
                                containerRef={playerContainerRef}
                            />
                        ) : null}
                    </div>
                </StreamRoom>
            ) : (
                /* 4. Connecting State */
                <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border/60 bg-black shadow-2xl flex flex-col items-center justify-center p-8 text-center bg-card/40">
                    <Loader2 size={36} className="animate-spin text-cyan-400 mb-3" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground">Connecting to stream...</p>
                    <p className="text-xs text-muted-foreground mt-1">Establishing secure connection</p>
                </div>
            )}

            {/* Stream Info & Metadata Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            {isLive && (
                                <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                                    LIVE
                                </span>
                            )}
                            {isReady && (
                                <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-400 px-2.5 py-0.5 text-xs font-bold border border-amber-500/30">
                                    <Clock size={12} aria-hidden="true" />
                                    STUDIO PREPARATION
                                </span>
                            )}
                            {stream.category && (
                                <span className="rounded-lg bg-secondary/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                                    {stream.category.replace("-", " ")}
                                </span>
                            )}
                        </div>

                        <h1 className="text-xl font-bold text-foreground leading-tight">{stream.title}</h1>

                        {stream.description && (
                            <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                                {stream.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <BroadcasterCard author={stream.author} isOwner={isOwner} />

                    <div className="rounded-2xl border border-border/50 bg-card/40 p-4 text-xs text-muted-foreground space-y-2">
                        <div className="flex items-center justify-between">
                            <span>Status:</span>
                            <span className="font-semibold text-foreground capitalize">{stream.status}</span>
                        </div>
                        {stream.startedAt && (
                            <div className="flex items-center justify-between">
                                <span>Started:</span>
                                <span>{new Date(stream.startedAt).toLocaleTimeString()}</span>
                            </div>
                        )}
                        {stream.category && (
                            <div className="flex items-center justify-between">
                                <span>Category:</span>
                                <span className="font-semibold text-foreground capitalize">{stream.category.replace("-", " ")}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StreamDetailView;
