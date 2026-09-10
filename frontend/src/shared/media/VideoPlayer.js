"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
import { cn } from "../utils/cn";

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === null) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
    src,
    poster,
    title,
    className = "",
    autoPlay = false,
}) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const hideTimerRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [isEnded, setIsEnded] = useState(false);

    const resetControlTimer = useCallback(() => {
        setShowControls(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (isPlaying) {
            hideTimerRef.current = setTimeout(() => {
                setShowControls(false);
            }, 2500);
        }
    }, [isPlaying]);

    useEffect(() => {
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (videoRef.current.paused || videoRef.current.ended) {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
            setIsEnded(false);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
        resetControlTimer();
    }, [resetControlTimer]);

    const toggleMute = useCallback((e) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
    }, []);

    const handleTimeUpdate = useCallback(() => {
        const vid = videoRef.current;
        if (!vid || !vid.duration) return;
        setCurrentTime(vid.currentTime);
        setProgress((vid.currentTime / vid.duration) * 100);
    }, []);

    const handleLoadedMetadata = useCallback(() => {
        const vid = videoRef.current;
        if (vid) {
            setDuration(vid.duration);
            setIsLoading(false);
        }
    }, []);

    const handleSeek = useCallback((e) => {
        e.stopPropagation();
        const vid = videoRef.current;
        if (!vid || !vid.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickPos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        vid.currentTime = clickPos * vid.duration;
        setProgress(clickPos * 100);
    }, []);

    const toggleFullscreen = useCallback((e) => {
        e.stopPropagation();
        const el = containerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen?.().catch(() => {});
        } else {
            document.exitFullscreen?.().catch(() => {});
        }
    }, []);

    return (
        <div
            ref={containerRef}
            onMouseMove={resetControlTimer}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onClick={togglePlay}
            className={cn(
                "group relative overflow-hidden rounded-2xl bg-black select-none aspect-video cursor-pointer",
                className
            )}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                autoPlay={autoPlay}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => {
                    setIsLoading(false);
                    setIsPlaying(true);
                }}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                    setIsPlaying(false);
                    setIsEnded(true);
                    setShowControls(true);
                }}
                className="h-full w-full object-cover"
            />

            {/* Loading Spinner */}
            {isLoading && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                </div>
            )}

            {/* Big Center Play/Replay Button */}
            {(!isPlaying || isEnded) && !isLoading && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-600/90 text-white shadow-lg transition-transform group-hover:scale-110">
                        {isEnded ? <RotateCcw size={24} /> : <Play size={24} className="ml-1" />}
                    </div>
                </div>
            )}

            {/* Bottom Controls Bar */}
            <div
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    "absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 transition-opacity duration-200",
                    showControls ? "opacity-100" : "pointer-events-none opacity-0"
                )}
            >
                {/* Seek Bar */}
                <div
                    onClick={handleSeek}
                    className="relative mb-2 h-1.5 w-full cursor-pointer rounded-full bg-white/20 hover:h-2.5 transition-all"
                >
                    <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={togglePlay}
                            className="cursor-pointer text-white hover:text-cyan-300 transition-colors"
                            aria-label={isPlaying ? "Pause video" : "Play video"}
                        >
                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </button>

                        <button
                            type="button"
                            onClick={toggleMute}
                            className="cursor-pointer text-white hover:text-cyan-300 transition-colors"
                            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                        >
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>

                        <span className="font-mono text-[11px] text-white/80">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {title && (
                            <span className="hidden sm:inline-block truncate max-w-[200px] text-white/70 text-[11px]">
                                {title}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="cursor-pointer text-white hover:text-cyan-300 transition-colors"
                            aria-label="Toggle fullscreen"
                        >
                            <Maximize size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
