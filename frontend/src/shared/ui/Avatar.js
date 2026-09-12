"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "../utils/cn";

/**
 * Shared YOIBI avatar with intentional fallback:
 *   - renders the user's image (Cloudinary / Google avatar / any remote URL)
 *     via next/image (optimized, remotePatterns-gated)
 *   - falls back to deterministic initials when missing or failed to load
 *   - never renders a broken image
 */
export function Avatar({ src, name = "", handle = "", size = 40, className = "" }) {
    const [failed, setFailed] = useState(false);
    const label = name || handle || "User";
    const initials = label
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "U";

    if (!src || failed) {
        return (
            <span
                role="img"
                aria-label={`${label}'s avatar`}
                style={{ width: size, height: size }}
                className={cn(
                    "flex shrink-0 select-none items-center justify-center rounded-full bg-cyan-500/20 font-semibold text-cyan-600 dark:text-cyan-400",
                    className
                )}
            >
                <span style={{ fontSize: Math.max(11, Math.round(size / 2.8)) }}>{initials}</span>
            </span>
        );
    }

    return (
        <span
            style={{ width: size, height: size }}
            className={cn("relative block shrink-0 overflow-hidden rounded-full ring-1 ring-border", className)}
        >
            <Image
                src={src}
                alt={`${label}'s avatar`}
                fill
                sizes={`${size}px`}
                className="object-cover"
                onError={() => setFailed(true)}
            />
        </span>
    );
}
