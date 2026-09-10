"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Track } from "livekit-client";
import { useTracks, VideoTrack } from "@livekit/components-react";
import { Radio, Mic, Monitor, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";

function AudioOnlyView({ author, title }) {
    const initials = (author?.name || "Broadcaster")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    return (
        <div className="relative flex flex-col items-center justify-center h-full w-full bg-gradient-to-b from-card/90 via-background to-secondary/30 p-8 text-center overflow-hidden">
            {/* Ambient pulsating audio rings */}
            <div className="absolute h-64 w-64 rounded-full bg-cyan-500/10 animate-ping opacity-30" />
            <div className="absolute h-48 w-48 rounded-full bg-cyan-500/15 animate-pulse" />

            <div className="relative z-10 flex flex-col items-center">
                {author?.avatarUrl ? (
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-cyan-400/60 shadow-xl shadow-cyan-500/10 mb-4">
                        <Image
                            src={author.avatarUrl}
                            alt={author.name || "Broadcaster"}
                            fill
                            className="object-cover"
                            sizes="96px"
                        />
                    </div>
                ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-cyan-500/20 text-2xl font-bold text-cyan-400 border-2 border-cyan-400/40 shadow-xl shadow-cyan-500/10 mb-4">
                        {initials}
                    </div>
                )}

                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/30 mb-2">
                    <Mic size={13} className="animate-pulse" aria-hidden="true" />
                    <span>Live Audio Broadcast</span>
                </div>

                <h2 className="text-lg font-bold text-foreground max-w-md line-clamp-1">{title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {author?.name ? `${author.name} (@${author.handle})` : "Broadcaster"}
                </p>

                {/* Animated sound wave bars */}
                <div className="mt-6 flex items-center gap-1">
                    <span className="h-4 w-1 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="h-7 w-1 rounded-full bg-cyan-400 animate-pulse [animation-delay:150ms]" />
                    <span className="h-10 w-1 rounded-full bg-cyan-400 animate-pulse [animation-delay:300ms]" />
                    <span className="h-6 w-1 rounded-full bg-cyan-400 animate-pulse [animation-delay:450ms]" />
                    <span className="h-8 w-1 rounded-full bg-cyan-400 animate-pulse [animation-delay:200ms]" />
                    <span className="h-4 w-1 rounded-full bg-cyan-400 animate-pulse [animation-delay:100ms]" />
                </div>
            </div>
        </div>
    );
}

export function StreamTrackView({ author, title, isHost = false }) {
    // Subscribe to camera and screen share video tracks
    const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

    const screenTrackRef = useMemo(
        () => tracks.find((t) => t.source === Track.Source.ScreenShare),
        [tracks]
    );

    const cameraTrackRef = useMemo(
        () => tracks.find((t) => t.source === Track.Source.Camera),
        [tracks]
    );

    const hasVideo = Boolean(screenTrackRef || cameraTrackRef);

    // If no video or screen share is active, display audio-only mode
    if (!hasVideo) {
        return <AudioOnlyView author={author} title={title} />;
    }

    // Screen Share Active: Render Screen Share Dominant + Camera PiP
    if (screenTrackRef) {
        return (
            <div className="relative h-full w-full bg-black flex items-center justify-center overflow-hidden">
                <VideoTrack
                    trackRef={screenTrackRef}
                    className="h-full w-full object-contain"
                />

                {/* Screen Share Indicator */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-medium text-purple-300 backdrop-blur-md border border-purple-500/30">
                    <Monitor size={13} aria-hidden="true" />
                    <span>Screen Share</span>
                </div>

                {/* Picture-in-Picture Camera Tile */}
                {cameraTrackRef && (
                    <div className="absolute bottom-4 right-4 h-32 w-48 overflow-hidden rounded-xl border-2 border-cyan-500/50 bg-black/80 shadow-2xl backdrop-blur-md">
                        <VideoTrack
                            trackRef={cameraTrackRef}
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}
            </div>
        );
    }

    // Camera Active: Render Full Video Frame
    return (
        <div className="relative h-full w-full bg-black flex items-center justify-center overflow-hidden">
            <VideoTrack
                trackRef={cameraTrackRef}
                className="h-full w-full object-contain"
            />
        </div>
    );
}
