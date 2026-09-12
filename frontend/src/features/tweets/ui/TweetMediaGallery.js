"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { normalizeTweetMedia, TweetMediaViewer } from "./TweetMediaViewer";

/**
 * Posted-tweet media presentation (exported for TweetCard).
 *  - 1 image: single framed preview (aspect preserved, capped height).
 *  - 2-5 images: swipeable carousel/gallery (prev/next, dots, counter).
 * Clicking the visible image opens the full-screen viewer at that index;
 * legacy video attachments render inline with native controls as before.
 */
export function TweetMediaGallery({ mediaUrls, tweetId }) {
    const media = normalizeTweetMedia(mediaUrls);
    const images = media.filter((m) => m.type !== "video");
    const videos = media.filter((m) => m.type === "video");

    const [activeImage, setActiveImage] = useState(0);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);

    const clampedActive = images.length === 0 ? 0 : Math.min(activeImage, images.length - 1);
    const current = images[clampedActive];

    // Keyboard arrows navigate the inline carousel when it is focused.
    const stageRef = useRef(null);
    useEffect(() => {
        const el = stageRef.current;
        if (!el || images.length <= 1) return;
        const onKeyDown = (e) => {
            if (e.key === "ArrowRight") {
                e.preventDefault();
                setActiveImage((i) => (i + 1) % images.length);
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                setActiveImage((i) => (i - 1 + images.length) % images.length);
            }
        };
        el.addEventListener("keydown", onKeyDown);
        return () => el.removeEventListener("keydown", onKeyDown);
    }, [images.length]);

    // Touch swipe on the inline carousel (horizontal-dominant gestures only).
    const touchRef = useRef({ startX: 0, startY: 0 });
    const handleTouchStart = (e) => {
        const t = e.touches?.[0];
        touchRef.current = { startX: t?.clientX ?? 0, startY: t?.clientY ?? 0 };
    };
    const handleTouchEnd = (e) => {
        if (images.length <= 1) return;
        const t = e.changedTouches?.[0];
        const dx = (t?.clientX ?? 0) - touchRef.current.startX;
        const dy = (t?.clientY ?? 0) - touchRef.current.startY;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            setActiveImage((i) => (i + (dx < 0 ? 1 : -1) + images.length) % images.length);
        }
    };

    if (media.length === 0) return null;

    const openViewer = (imageIndex) => {
        setViewerIndex(imageIndex);
        setViewerOpen(true);
    };

    const goTo = (next) => {
        if (images.length <= 1) return;
        setActiveImage((next + images.length) % images.length);
    };

    return (
        <>
            <div className="mt-3 space-y-2">
                {current && (
                    <div
                        ref={stageRef}
                        tabIndex={images.length > 1 ? 0 : -1}
                        role={images.length > 1 ? "region" : undefined}
                        aria-roledescription={images.length > 1 ? "carousel" : undefined}
                        aria-label={
                            images.length > 1
                                ? `Tweet images, image ${clampedActive + 1} of ${images.length}`
                                : "Tweet image"
                        }
                        className={cn(
                            "relative min-w-0 overflow-hidden rounded-xl border border-border/80 bg-secondary/20",
                            images.length > 1 && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        )}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <button
                            type="button"
                            onClick={() => openViewer(clampedActive)}
                            className="block w-full cursor-zoom-in focus-visible:outline-none"
                            aria-label={`Open image ${clampedActive + 1} of ${images.length} in full screen`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                key={current.url}
                                src={current.url}
                                alt=""
                                className="max-h-96 w-full object-cover"
                                loading="lazy"
                                draggable={false}
                            />
                        </button>

                        {images.length > 1 && (
                            <>
                                <div
                                    className="pointer-events-none absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-foreground"
                                    aria-hidden="true"
                                >
                                    {clampedActive + 1} / {images.length}
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goTo(clampedActive - 1);
                                    }}
                                    className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft size={16} aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goTo(clampedActive + 1);
                                    }}
                                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                    aria-label="Next image"
                                >
                                    <ChevronRight size={16} aria-hidden="true" />
                                </button>
                                <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5" aria-hidden="true">
                                    {images.map((img, i) => (
                                        <span
                                            key={img.publicId || img.url || i}
                                            className={cn(
                                                "h-1.5 rounded-full transition-all",
                                                i === clampedActive ? "w-5 bg-white" : "w-1.5 bg-white/60"
                                            )}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {videos.map((video, i) => (
                    <div
                        key={video.publicId || video.url || `video-${i}`}
                        className="overflow-hidden rounded-xl border border-border/80 bg-secondary/20"
                    >
                        <video
                            src={video.url}
                            controls
                            className="max-h-96 w-full object-cover"
                            preload="metadata"
                        />
                    </div>
                ))}
            </div>

            {viewerOpen && (
                <TweetMediaViewer
                    media={images}
                    index={viewerIndex}
                    onIndexChange={setViewerIndex}
                    onClose={() => setViewerOpen(false)}
                    contextLabel={`Tweet images, image ${Math.min(viewerIndex, images.length - 1) + 1} of ${images.length}`}
                />
            )}
        </>
    );
}
