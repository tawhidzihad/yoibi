"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Users,
    Video,
    Shield,
    Radio,
    AlertCircle,
    Loader2,
    RefreshCw,
    ShieldCheck
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { meetupApi } from "../api/meetupApi";
import { MeetupRoom } from "./MeetupRoom";
import { MeetupTrackView } from "./MeetupTrackView";
import { MeetupControls } from "./MeetupControls";
import { Button } from "@/shared/ui/Button";

export function MeetupDetailView({ roomId }) {
    const router = useRouter();
    const { user, status: authStatus } = useAuth();

    const [room, setRoom] = useState(null);
    const [livekitData, setLivekitData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnding, setIsEnding] = useState(false);
    const [error, setError] = useState(null);
    const [errorCode, setErrorCode] = useState(null);

    const isOwner = Boolean(user?.id && room?.ownerId === user.id);

    useEffect(() => {
        let isCancelled = false;

        async function initJoin() {
            if (authStatus === "unauthenticated") {
                setIsLoading(false);
                setErrorCode("UNAUTHORIZED");
                setError("You must be logged in to join this Meet-Up room.");
                return;
            }

            if (authStatus !== "authenticated" || !roomId) {
                return;
            }

            setIsLoading(true);
            setError(null);
            setErrorCode(null);

            try {
                const joinRes = await meetupApi.joinMeetupRoom(roomId);
                if (isCancelled) return;
                const data = joinRes.data;

                setRoom(data.room || data);
                setLivekitData({
                    url: data.livekitUrl,
                    token: data.token,
                    participantIdentity: data.participantIdentity
                });
            } catch (err) {
                if (isCancelled) return;
                const apiError = err?.response?.data?.error;
                const code = apiError?.code || (err?.statusCode === 403 ? "ROOM_FULL" : "UNKNOWN");
                const message = apiError?.message || err?.message || "Failed to join Meet-Up room.";

                setErrorCode(code);
                setError(message);

                try {
                    const roomRes = await meetupApi.getMeetupRoomById(roomId);
                    if (isCancelled) return;
                    if (roomRes?.data) {
                        setRoom(roomRes.data);
                    }
                } catch {
                    // Ignore secondary metadata error
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        }

        initJoin();
        return () => {
            isCancelled = true;
        };
    }, [authStatus, roomId]);

    const handleRetry = async () => {
        if (!roomId) return;
        setIsLoading(true);
        setError(null);
        setErrorCode(null);
        try {
            const joinRes = await meetupApi.joinMeetupRoom(roomId);
            const data = joinRes.data;
            setRoom(data.room || data);
            setLivekitData({
                url: data.livekitUrl,
                token: data.token,
                participantIdentity: data.participantIdentity
            });
        } catch (err) {
            const apiError = err?.response?.data?.error;
            const code = apiError?.code || (err?.statusCode === 403 ? "ROOM_FULL" : "UNKNOWN");
            const message = apiError?.message || err?.message || "Failed to join Meet-Up room.";
            setErrorCode(code);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeaveRoom = () => {
        router.push("/meetup");
    };

    const handleEndRoom = async () => {
        if (!roomId || isEnding) return;
        setIsEnding(true);
        try {
            await meetupApi.endMeetupRoom(roomId);
            router.push("/meetup");
        } catch (err) {
            alert(err?.response?.data?.error?.message || "Failed to end Meet-Up room.");
            setIsEnding(false);
        }
    };

    const handleDisconnected = () => {
        // Disconnected by SFU (e.g. host ended the room)
        router.push("/meetup");
    };

    // State 1: Loading
    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={36} className="animate-spin text-cyan-400" aria-hidden="true" />
                    <h2 className="text-base font-bold text-foreground">Joining Meet-Up Room...</h2>
                    <p className="text-xs text-muted-foreground">Securing server capacity and preparing WebRTC media</p>
                </div>
            </div>
        );
    }

    // State 2: Room Full Error (403 ROOM_FULL)
    if (errorCode === "ROOM_FULL") {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
                <div className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 backdrop-blur-xl shadow-2xl">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Users size={28} aria-hidden="true" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">Room is at Maximum Capacity</h2>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        This Meet-Up room has reached its limit of {room?.maxParticipants || 12} participants. Please check back later or browse other active conversations.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <Link href="/meetup">
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <ArrowLeft size={14} aria-hidden="true" /> All Meet-Ups
                            </Button>
                        </Link>
                        <Button variant="primary" size="sm" onClick={handleRetry} className="gap-1.5">
                            <RefreshCw size={14} aria-hidden="true" /> Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // State 3: Room Ended Error (403 ROOM_ENDED)
    if (errorCode === "ROOM_ENDED" || room?.status === "ended") {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card/40 p-8 backdrop-blur-xl shadow-2xl">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                        <Radio size={28} aria-hidden="true" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">This Meet-Up Has Ended</h2>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        The host concluded this interactive room session. All live media feeds have been terminated.
                    </p>
                    <div className="mt-6 flex justify-center">
                        <Link href="/meetup">
                            <Button variant="primary" size="sm" className="gap-1.5">
                                <ArrowLeft size={14} aria-hidden="true" /> Return to Meet-Ups
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // State 4: Generic Error
    if (error || !livekitData) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
                <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 backdrop-blur-xl shadow-2xl">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                        <AlertCircle size={28} aria-hidden="true" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">Unable to Join Meet-Up</h2>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{error || "Connection failure."}</p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <Link href="/meetup">
                            <Button variant="outline" size="sm">
                                <ArrowLeft size={14} className="mr-1.5" /> Back
                            </Button>
                        </Link>
                        <Button variant="primary" size="sm" onClick={handleRetry}>
                            <RefreshCw size={14} className="mr-1.5" /> Retry
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // State 5: Active Connected Stage
    return (
        <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-3">
            {/* Top Navigation & Room Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-card/60 px-4 py-3 backdrop-blur-xl shadow-md">
                <div className="flex items-center gap-3 min-w-0">
                    <Link href="/meetup">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:text-foreground"
                            title="Back to Meet-Ups"
                        >
                            <ArrowLeft size={16} aria-hidden="true" />
                        </Button>
                    </Link>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-base font-bold text-foreground">
                                {room?.name || "Meet-Up Room"}
                            </h1>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20 shrink-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                                Active
                            </span>
                        </div>
                        {room?.topic && (
                            <p className="truncate text-xs text-muted-foreground mt-0.5">
                                Focus: <span className="text-foreground/80">{room.topic}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Host Info & Capacity Gauge */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
                        <Users size={13} className="text-cyan-400" aria-hidden="true" />
                        <span>Limit: {room?.maxParticipants || 12}</span>
                    </div>

                    <div className="flex items-center gap-2 pl-1 border-l border-white/5">
                        <div className="text-right text-xs">
                            <p className="font-semibold text-foreground flex items-center justify-end gap-1">
                                {room?.owner?.name || "Host"}
                                <ShieldCheck size={12} className="text-cyan-400" />
                            </p>
                            <p className="text-[10px] text-muted-foreground">@{room?.owner?.handle || "host"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* LiveKit Room Stage */}
            <MeetupRoom
                serverUrl={livekitData.url}
                token={livekitData.token}
                onDisconnected={handleDisconnected}
            >
                <div className="space-y-4">
                    {/* Media Tracks View (Stage & Participants) */}
                    <MeetupTrackView />

                    {/* Bottom Media & Room Controls Bar */}
                    <MeetupControls
                        isOwner={isOwner}
                        onLeaveRoom={handleLeaveRoom}
                        onEndRoom={handleEndRoom}
                        isEnding={isEnding}
                    />
                </div>
            </MeetupRoom>
        </div>
    );
}
