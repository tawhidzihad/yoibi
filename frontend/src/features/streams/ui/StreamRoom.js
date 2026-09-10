"use client";

import { useCallback, useRef } from "react";
import { LiveKitRoom, RoomAudioRenderer, StartAudio } from "@livekit/components-react";
import { DisconnectReason } from "livekit-client";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/shared/ui/Button";

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
                    <p className="text-sm font-semibold text-foreground">Connecting to LiveKit Room...</p>
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
