"use client";

import { useCallback } from "react";
import { LiveKitRoom, RoomAudioRenderer, StartAudio } from "@livekit/components-react";
import { setLogLevel } from "livekit-client";
import { Loader2 } from "lucide-react";

// Suppress verbose internal WebRTC diagnostic logs in user-facing client while preserving warnings/errors
try {
    setLogLevel("warn");
} catch {
    // Ignore if running outside browser
}

export function StreamRoom({
    serverUrl,
    token,
    isHost = false,
    onDisconnected,
    onError,
    children
}) {
    const handleDisconnected = useCallback(
        (reason) => {
            if (onDisconnected) {
                onDisconnected(reason);
            }
        },
        [onDisconnected]
    );

    const handleError = useCallback(
        (error) => {
            console.error("[LiveKit Room Error]:", error);
            if (onError) {
                onError(error);
            }
        },
        [onError]
    );

    if (!serverUrl || !token) {
        return (
            <div className="flex h-96 w-full items-center justify-center rounded-2xl border border-border/50 bg-card/40 p-8 text-center backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 size={32} className="animate-spin text-cyan-400" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground">Connecting to stream...</p>
                </div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            serverUrl={serverUrl}
            token={token}
            connect={true}
            audio={true}
            video={isHost}
            onDisconnected={handleDisconnected}
            onError={handleError}
            className="flex flex-col h-full w-full relative"
        >
            {/* Automatic WebRTC Audio Playback */}
            <RoomAudioRenderer />

            {/* Browser Autoplay Unmute Overlay */}
            <StartAudio
                label="Click anywhere to enable stream audio"
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-xl shadow-cyan-500/20 hover:bg-cyan-400 transition-all"
            />

            {children}
        </LiveKitRoom>
    );
}
