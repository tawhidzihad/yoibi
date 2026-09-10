"use client";

import { useState } from "react";
import { Maximize2, Minimize2, LogOut, Radio, Users } from "lucide-react";
import { useConnectionState } from "@livekit/components-react";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/utils/cn";

export function ViewerControls({
    viewerCount = 0,
    onLeave,
    containerRef
}) {
    const connectionState = useConnectionState();
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!containerRef?.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen?.().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.().catch(() => {});
            setIsFullscreen(false);
        }
    };

    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-3 backdrop-blur-md">
            {/* Live Indicator & Viewers */}
            <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                    LIVE
                </span>

                <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <Users size={13} className="text-cyan-400" aria-hidden="true" />
                    <span>{viewerCount} watching</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/40 text-[11px] font-medium text-muted-foreground">
                    <span
                        className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            connectionState === "connected" ? "bg-emerald-500" : "bg-amber-500"
                        )}
                        aria-hidden="true"
                    />
                    <span className="capitalize">{connectionState}</span>
                </div>

                <Button
                    variant="secondary"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="h-8 px-2.5 text-xs"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                    {isFullscreen ? (
                        <Minimize2 size={14} aria-hidden="true" />
                    ) : (
                        <Maximize2 size={14} aria-hidden="true" />
                    )}
                </Button>

                {onLeave && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onLeave}
                        className="h-8 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <LogOut size={13} aria-hidden="true" />
                        <span>Leave</span>
                    </Button>
                )}
            </div>
        </div>
    );
}
