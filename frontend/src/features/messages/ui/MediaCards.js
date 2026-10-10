"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Download, X, Maximize2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export function ImageMediaCard({ media, alt = "Sent image", className = "" }) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    if (!media?.url) return null;

    const handleDownload = (e) => {
        e.stopPropagation();
        const a = document.createElement("a");
        a.href = media.url;
        a.download = `yoibi-image-${Date.now()}`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <>
            <div
                className={cn(
                    "group relative overflow-hidden rounded-xl border border-border/40 bg-black/5 dark:bg-white/5 cursor-pointer max-w-sm",
                    className
                )}
                onClick={() => setIsLightboxOpen(true)}
            >
                <div className="relative aspect-4/3 w-full min-w-[200px] max-w-[320px] overflow-hidden">
                    <Image
                        src={media.url}
                        alt={alt}
                        fill
                        sizes="(max-width: 640px) 260px, 320px"
                        className={cn(
                            "object-cover transition-transform duration-200 group-hover:scale-102",
                            !imageLoaded && "blur-xs"
                        )}
                        onLoad={() => setImageLoaded(true)}
                    />
                </div>

                {/* Hover overlay with action icons */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-2">
                    <span className="p-1.5 rounded-full bg-black/50 text-white backdrop-blur-xs">
                        <Maximize2 size={16} />
                    </span>
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-xs transition-colors"
                        title="Download image"
                        aria-label="Download image"
                    >
                        <Download size={16} />
                    </button>
                </div>
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg">
                        <button
                            type="button"
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-3 right-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
                            aria-label="Close image"
                        >
                            <X size={20} />
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={media.url}
                            alt={alt}
                            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}
        </>
    );
}

export function VideoMediaCard({ media, className = "" }) {
    const [isPlaying, setIsPlaying] = useState(false);

    if (!media?.url) return null;

    return (
        <div className={cn("overflow-hidden rounded-xl border border-border/40 bg-black max-w-sm", className)}>
            <div className="relative aspect-16/9 w-full min-w-[240px] max-w-[340px]">
                {isPlaying ? (
                    <video
                        src={media.url}
                        controls
                        autoPlay
                        className="h-full w-full object-contain"
                    />
                ) : (
                    <div
                        className="relative h-full w-full cursor-pointer flex items-center justify-center group"
                        onClick={() => setIsPlaying(true)}
                    >
                        {/* Video thumbnail or poster */}
                        <video
                            src={media.url}
                            className="h-full w-full object-cover opacity-80"
                            preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

                        {/* Play button overlay */}
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg transition-transform group-hover:scale-110">
                            <Play size={22} className="ml-0.5 fill-white text-white" />
                        </div>

                        {/* Video tag badge */}
                        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white tracking-wider uppercase">
                            Video
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
