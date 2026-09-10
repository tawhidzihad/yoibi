"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Track } from "livekit-client";
import {
    useTracks,
    useParticipants,
    VideoTrack
} from "@livekit/components-react";
import {
    Mic,
    MicOff,
    ScreenShare,
    Users,
    Volume2
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

function parseParticipantMetadata(metadataStr) {
    if (!metadataStr) return { name: "Participant", handle: "member", avatarUrl: null };
    try {
        const parsed = JSON.parse(metadataStr);
        return {
            name: parsed.name || "Participant",
            handle: parsed.handle || "member",
            avatarUrl: parsed.avatarUrl || null
        };
    } catch {
        return { name: "Participant", handle: "member", avatarUrl: null };
    }
}

function ParticipantTile({ trackRef, participant, isPrimary = false }) {
    const meta = useMemo(() => parseParticipantMetadata(participant.metadata), [participant.metadata]);
    const isSpeaking = participant.isSpeaking;
    const isMuted = !participant.isMicrophoneEnabled;
    const isVideoEnabled = trackRef?.publication?.isSubscribed && !trackRef?.publication?.isMuted && trackRef?.publication?.track;
    const isScreenShare = trackRef?.source === Track.Source.ScreenShare;

    const initials = meta.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    return (
        <div
            className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card/90 transition-all duration-300",
                isSpeaking ? "border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400" : "border-white/10",
                isPrimary ? "h-full min-h-[360px] w-full" : "aspect-video min-h-[160px] w-full"
            )}
        >
            {/* Video Track or Placeholder */}
            {isVideoEnabled ? (
                <div className="relative h-full w-full overflow-hidden bg-black">
                    <VideoTrack
                        trackRef={trackRef}
                        className={cn(
                            "h-full w-full",
                            isScreenShare ? "object-contain bg-black" : "object-cover"
                        )}
                    />
                </div>
            ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-card/80 via-card/50 to-card/30 p-4 text-center">
                    {meta.avatarUrl ? (
                        <div
                            className={cn(
                                "relative overflow-hidden rounded-full ring-4 shadow-xl",
                                isSpeaking ? "ring-cyan-400 animate-pulse" : "ring-white/10",
                                isPrimary ? "h-24 w-24" : "h-14 w-14"
                            )}
                        >
                            <Image
                                src={meta.avatarUrl}
                                alt={meta.name}
                                fill
                                sizes={isPrimary ? "96px" : "56px"}
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    ) : (
                        <div
                            className={cn(
                                "flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 font-bold text-cyan-300 ring-4 shadow-xl",
                                isSpeaking ? "ring-cyan-400 animate-pulse" : "ring-white/10",
                                isPrimary ? "h-24 w-24 text-2xl" : "h-14 w-14 text-base"
                            )}
                        >
                            {initials}
                        </div>
                    )}
                    <p className="mt-2 text-xs font-semibold text-foreground truncate max-w-[140px]">
                        {meta.name}
                    </p>
                </div>
            )}

            {/* Top Badges */}
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 z-10">
                {isScreenShare && (
                    <span className="flex items-center gap-1 rounded-md bg-purple-600/90 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md shadow">
                        <ScreenShare size={12} aria-hidden="true" />
                        Screen Share
                    </span>
                )}
                {isSpeaking && (
                    <span className="flex items-center gap-1 rounded-md bg-cyan-500/90 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md shadow">
                        <Volume2 size={12} className="animate-pulse" aria-hidden="true" />
                        Speaking
                    </span>
                )}
            </div>

            {/* Bottom Overlay: Name tag & Mic state */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate text-xs font-semibold text-white drop-shadow-sm">
                        {meta.name}
                    </span>
                    <span className="text-[11px] text-zinc-300 drop-shadow-sm">
                        @{meta.handle}
                    </span>
                </div>

                <div className="shrink-0 pl-2">
                    {isMuted ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 text-white backdrop-blur-md shadow" title="Microphone muted">
                            <MicOff size={12} aria-hidden="true" />
                        </div>
                    ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/80 text-white backdrop-blur-md shadow" title="Microphone active">
                            <Mic size={12} aria-hidden="true" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function MeetupTrackView() {
    const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
        onlySubscribed: false
    });
    const participants = useParticipants();

    // Strategy: One active primary screen share at a time
    const screenShareTracks = useMemo(() => {
        return tracks.filter((t) => t.source === Track.Source.ScreenShare);
    }, [tracks]);

    const primaryScreenShare = screenShareTracks.length > 0 ? screenShareTracks[screenShareTracks.length - 1] : null;

    // Remaining camera/audio tracks for participant grid
    const secondaryTracks = useMemo(() => {
        if (!primaryScreenShare) return tracks;
        return tracks.filter((t) => t !== primaryScreenShare);
    }, [tracks, primaryScreenShare]);

    if (tracks.length === 0 && participants.length === 0) {
        return (
            <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-card/40 p-8 text-center backdrop-blur-xl">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Users size={28} aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-foreground">Waiting for participants...</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
                    Connecting to room. Turn on your microphone or camera below to start conversing.
                </p>
            </div>
        );
    }

    // Layout 1: Primary Screen Share Active (Dominant Stage + Grid)
    if (primaryScreenShare) {
        return (
            <div className="space-y-4">
                {/* Primary Screen Share Stage */}
                <div className="w-full">
                    <ParticipantTile
                        trackRef={primaryScreenShare}
                        participant={primaryScreenShare.participant}
                        isPrimary={true}
                    />
                </div>

                {/* Secondary Participant Tiles */}
                {secondaryTracks.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {secondaryTracks.map((trackRef) => (
                            <ParticipantTile
                                key={trackRef.publication?.trackSid || `${trackRef.participant.identity}_${trackRef.source}`}
                                trackRef={trackRef}
                                participant={trackRef.participant}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Layout 2: Multi-Peer Dynamic Grid (No screen share)
    const gridCols =
        tracks.length <= 1
            ? "grid-cols-1 max-w-2xl mx-auto"
            : tracks.length <= 2
            ? "grid-cols-1 sm:grid-cols-2"
            : tracks.length <= 4
            ? "grid-cols-1 sm:grid-cols-2"
            : tracks.length <= 6
            ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";

    return (
        <div className={cn("grid gap-4 w-full", gridCols)}>
            {tracks.map((trackRef) => (
                <ParticipantTile
                    key={trackRef.publication?.trackSid || `${trackRef.participant.identity}_${trackRef.source}`}
                    trackRef={trackRef}
                    participant={trackRef.participant}
                />
            ))}
        </div>
    );
}
