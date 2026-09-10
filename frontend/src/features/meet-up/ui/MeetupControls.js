"use client";

import { useState } from "react";
import { Track } from "livekit-client";
import { TrackToggle, useConnectionState } from "@livekit/components-react";
import {
    Mic,
    MicOff,
    Camera,
    CameraOff,
    ScreenShare,
    LogOut,
    Power,
    Loader2,
    AlertTriangle,
    Shield
} from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/utils/cn";

export function MeetupControls({
    isOwner = false,
    onLeaveRoom,
    onEndRoom,
    isEnding = false
}) {
    const connectionState = useConnectionState();
    const [showEndConfirm, setShowEndConfirm] = useState(false);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-card/85 p-3.5 backdrop-blur-xl shadow-xl shadow-black/10">
            {/* Left: Device Controls */}
            <div className="flex items-center gap-2">
                {/* Microphone Toggle */}
                <TrackToggle
                    source={Track.Source.Microphone}
                    className="flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-secondary/60 px-3 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:border-cyan-500/40 data-[state=on]:bg-cyan-500/10 data-[state=on]:text-cyan-400 data-[state=on]:border-cyan-500/40"
                >
                    {(enabled) => (
                        <>
                            {enabled ? (
                                <Mic size={16} className="text-cyan-400" aria-hidden="true" />
                            ) : (
                                <MicOff size={16} className="text-muted-foreground" aria-hidden="true" />
                            )}
                            <span className="hidden sm:inline">{enabled ? "Mute" : "Unmute"}</span>
                        </>
                    )}
                </TrackToggle>

                {/* Camera Toggle */}
                <TrackToggle
                    source={Track.Source.Camera}
                    className="flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-secondary/60 px-3 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:border-cyan-500/40 data-[state=on]:bg-cyan-500/10 data-[state=on]:text-cyan-400 data-[state=on]:border-cyan-500/40"
                >
                    {(enabled) => (
                        <>
                            {enabled ? (
                                <Camera size={16} className="text-cyan-400" aria-hidden="true" />
                            ) : (
                                <CameraOff size={16} className="text-muted-foreground" aria-hidden="true" />
                            )}
                            <span className="hidden sm:inline">{enabled ? "Stop Video" : "Start Video"}</span>
                        </>
                    )}
                </TrackToggle>

                {/* Screen Share Toggle */}
                <TrackToggle
                    source={Track.Source.ScreenShare}
                    className="flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-secondary/60 px-3 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:border-cyan-500/40 data-[state=on]:bg-purple-500/10 data-[state=on]:text-purple-400 data-[state=on]:border-purple-500/40"
                >
                    {(enabled) => (
                        <>
                            <ScreenShare size={16} className={enabled ? "text-purple-400" : "text-muted-foreground"} aria-hidden="true" />
                            <span className="hidden sm:inline">{enabled ? "Stop Sharing" : "Share Screen"}</span>
                        </>
                    )}
                </TrackToggle>
            </div>

            {/* Right: Room Actions */}
            <div className="flex items-center gap-2">
                {/* Connection Health Indicator */}
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/40 border border-border/40 text-[11px] font-medium text-muted-foreground">
                    <span
                        className={cn(
                            "h-2 w-2 rounded-full",
                            connectionState === "connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                        )}
                        aria-hidden="true"
                    />
                    <span className="capitalize">{connectionState}</span>
                </div>

                {/* Leave Room Button */}
                <Button
                    id="leave-meetup-btn"
                    variant="outline"
                    size="sm"
                    onClick={onLeaveRoom}
                    className="gap-1.5 border-border/60 text-muted-foreground hover:text-foreground"
                >
                    <LogOut size={14} aria-hidden="true" />
                    <span>Leave</span>
                </Button>

                {/* End Room for All (Owner Only) */}
                {isOwner && !showEndConfirm && (
                    <Button
                        id="end-meetup-btn"
                        variant="danger"
                        size="sm"
                        onClick={() => setShowEndConfirm(true)}
                        className="gap-1.5 border border-red-500/30 font-semibold shadow-md shadow-red-500/10"
                    >
                        <Power size={14} aria-hidden="true" />
                        <span>End Room</span>
                    </Button>
                )}

                {/* Owner End Confirmation Inline */}
                {isOwner && showEndConfirm && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-1.5 animate-in fade-in zoom-in-95">
                        <AlertTriangle size={14} className="text-red-400 shrink-0" aria-hidden="true" />
                        <span className="text-xs font-semibold text-red-300">End for all?</span>
                        <Button
                            id="confirm-end-meetup-btn"
                            variant="danger"
                            size="sm"
                            disabled={isEnding}
                            onClick={onEndRoom}
                            className="h-7 px-2.5 text-xs font-bold"
                        >
                            {isEnding ? <Loader2 size={12} className="animate-spin" /> : "Yes, End"}
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={isEnding}
                            onClick={() => setShowEndConfirm(false)}
                            className="h-7 px-2 text-xs"
                        >
                            Cancel
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
