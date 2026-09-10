"use client";

import { cn } from "@/shared/utils/cn";

/**
 * Renders an unread notification count badge.
 *
 * @param {{ count: number, className?: string }} props
 */
export function NotificationBadge({ count = 0, className = "" }) {
    if (!count || count <= 0) return null;

    const displayCount = count > 99 ? "99+" : count;

    return (
        <span
            id="notification-badge"
            className={cn(
                "inline-flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-white shadow-xs transition-transform animate-in fade-in zoom-in-75",
                className
            )}
            aria-label={`${count} unread notifications`}
        >
            {displayCount}
        </span>
    );
}
