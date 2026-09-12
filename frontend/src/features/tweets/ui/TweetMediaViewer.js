"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

function ChevronLeftIcon(props) {
    return <ChevronLeft size={20} {...props} />;
}

function ChevronRightIcon(props) {
    return <ChevronRight size={20} {...props} />;
}

/**
 * Normalizes the legacy/loose tweet media representations into the canonical
 * shape used by the gallery + viewer:
 *   { url, type: "image" | "video", publicId }
 * Accepts plain URL strings, { url, ... } objects (new contract) and skips
 * entries without a usable URL.
 */
export function normalizeTweetMedia(mediaUrls) {
    if (!Array.isArray(mediaUrls)) return [];
    const out = [];
    for (const item of mediaUrls) {
        if (typeof item === "string" && item.trim().length > 0) {
            const url = item.trim();
            out.push({
                url,
                type: /\.mp4($|\?)/i.test(url) || /\.webm($|\?)/i.test(url) || /\.mov($|\?)/i.test(url)
                    ? "video"
                    : "image",
                publicId: "",
            });
            continue;
        }
        if (item && typeof item.url === "string" && item.url.trim().length > 0) {
            out.push({
                url: item.url.trim(),
                type: item.type === "video" ? "video" : "image",
                publicId: typeof item.publicId === "string" ? item.publicId : "",
            });
        }
    }
    return out;
}

/**
 * Viewer chrome shared by the full-screen lightbox: top bar (counter +
 * close) and bottom dot navigation shared across the collection.
 */
export function ViewerTopBar({ index, count, onClose }) {
    return (
        <div className="flex items-center justify-between px-3 py-2 sm:px-4">
            <span
                className="rounded-full bg-secondary/70 px-2.5 py-1 text-xs font-medium text-foreground"
                aria-live="polite"
            >
                Image {index + 1} of {count}
            </span>
            <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-secondary/70 text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                aria-label="Close image viewer"
                autoFocus
            >
                <X size={18} aria-hidden="true" />
            </button>
        </div>
    );
}

export function ViewerDots({ images, activeIndex, onSelect }) {
    return (
        <div className="flex items-center justify-center gap-1.5 pb-4" role="tablist" aria-label="Image selector">
            {images.map((img, i) => (
                <button
                    key={img.publicId || img.url || i}
                    type="button"
                    role="tab"
                    aria-selected={i === activeIndex}
                    aria-label={`View image ${i + 1}`}
                    onClick={() => onSelect?.(i)}
                    className={cn(
                        "h-2 cursor-pointer rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                        i === activeIndex ? "w-6 bg-cyan-400" : "w-2 bg-muted-foreground/50 hover:bg-muted-foreground"
                    )}
                />
            ))}
        </div>
    );
}

/**
 * useViewerKeyboard wires Escape-to-close + arrow navigation and locks body
 * scroll while the viewer is open.
 */
export function useViewerKeyboard({ open, count, index, onIndexChange, onClose }) {
    const goTo = useCallback(
        (next) => {
            if (count <= 1) return;
            onIndexChange?.((next + count) % count);
        },
        [count, onIndexChange]
    );

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose?.();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                goTo(index + 1);
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                goTo(index - 1);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, goTo, onClose, index]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open ]);

    // Touch swipe: returns handlers to spread onto the stage element.
    const touchRef = useRef({ startX: 0 });
    const handlers = {
        onTouchStart: (e) => {
            touchRef.current = { startX: e.touches?.[0]?.clientX ?? 0 };
        },
        onTouchEnd: (e) => {
            const startX = touchRef.current.startX;
            const endX = e.changedTouches?.[0]?.clientX ?? startX;
            const delta = endX - startX;
            if (Math.abs(delta) > 48) {
                goTo(index + (delta < 0 ? 1 : -1));
            }
        },
    };

    return { goTo, handlers };
}

/**
 * Full-screen image viewer / lightbox for a tweet's media collection.
 * Covers the viewport, shows the full image, preserves collection context
 * ("Image n of m") with previous/next navigation across the whole set,
 * close button, Escape/backdrop close, and scroll lock. Responsive.
 */
export function TweetMediaViewer({ media, index, onIndexChange, onClose, contextLabel }) {
    const images = Array.isArray(media) ? media.filter((m) => m && m.type !== "video") : [];
    const count = images.length;
    const safeIndex = count === 0 ? 0 : Math.min(Math.max(0, index), count - 1);
    const current = images[safeIndex];

    const { handlers } = useViewerKeyboard({
        open: true,
        count,
        index: safeIndex,
        onIndexChange,
        onClose,
    });

    if (count === 0 || !current) return null;

    const goTo = (next) => {
        if (count <= 1) return;
        onIndexChange?.((next + count) % count);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={contextLabel || `Image ${safeIndex + 1} of ${count}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <ViewerTopBar index={safeIndex} count={count} onClose={onClose} />

            <div
                className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-2 sm:px-12"
                {...handlers}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    key={current.url}
                    src={current.url}
                    alt={`Tweet image ${safeIndex + 1} of ${count}`}
                    className="max-h-full max-w-full rounded-lg object-contain shadow-xl"
                    draggable={false}
                />

                {count > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                goTo(safeIndex - 1);
                            }}
                            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/80 text-foreground shadow-md transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:left-4"
                            aria-label="Previous image"
                        >
                            <ChevronLeftIcon aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                goTo(safeIndex + 1);
                            }}
                            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/80 text-foreground shadow-md transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:right-4"
                            aria-label="Next image"
                        >
                            <ChevronRightIcon aria-hidden="true" />
                        </button>
                    </>
                )}
            </div>

            {count > 1 && <ViewerDots images={images} activeIndex={safeIndex} onSelect={onIndexChange} />}
        </div>
    );
}

