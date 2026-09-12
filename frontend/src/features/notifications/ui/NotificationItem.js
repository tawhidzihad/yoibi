"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    Heart,
    Repeat2,
    MessageSquare,
    UserPlus,
    Film,
    Bell
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

function formatRelativeTime(isoString) {
    if (!isoString) return "";
    try {
        const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
        return new Date(isoString).toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
        return "";
    }
}

function getNotificationConfig(type) {
    switch (type) {
        case "like_tweet":
            return {
                icon: Heart,
                iconColor: "text-rose-500",
                bgColor: "bg-rose-500/10",
                actionText: "liked your tweet"
            };
        case "retweet":
            return {
                icon: Repeat2,
                iconColor: "text-emerald-500",
                bgColor: "bg-emerald-500/10",
                actionText: "retweeted your tweet"
            };
        case "reply":
            return {
                icon: MessageSquare,
                iconColor: "text-cyan-500",
                bgColor: "bg-cyan-500/10",
                actionText: "replied to your tweet"
            };
        case "follow":
            return {
                icon: UserPlus,
                iconColor: "text-purple-500",
                bgColor: "bg-purple-500/10",
                actionText: "started following you"
            };
        case "like_video":
            return {
                icon: Film,
                iconColor: "text-amber-500",
                bgColor: "bg-amber-500/10",
                actionText: "liked your video"
            };
        default:
            return {
                icon: Bell,
                iconColor: "text-muted-foreground",
                bgColor: "bg-secondary",
                actionText: "sent you a notification"
            };
    }
}

function getNavigationRoute(notification) {
    const { type, targetId, actor } = notification;
    switch (type) {
        case "like_tweet":
        case "retweet":
        case "reply":
            return `/tweets/${targetId}`;
        case "like_video":
            return `/videos/${targetId}`;
        case "follow": {
            const rawHandle = actor?.handle ? actor.handle.replace(/^@/, "") : "";
            return rawHandle ? `/profile/${rawHandle}` : "/notifications";
        }
        default:
            return "/feed";
    }
}

/**
 * Individual Notification Item row.
 */
export function NotificationItem({ notification, onMarkRead }) {
    const router = useRouter();
    const config = getNotificationConfig(notification.type);
    const Icon = config.icon;
    const actor = notification.actor || {
        name: "Unknown user",
        handle: null,
        avatarUrl: null
    };

    const isUnread = !notification.read;
    const timeDisplay = formatRelativeTime(notification.createdAt);

    const handleClick = (e) => {
        e.preventDefault();
        if (isUnread && onMarkRead) {
            onMarkRead(notification.id);
        }
        const route = getNavigationRoute(notification);
        router.push(route);
    };

    return (
        <div
            id={`notification-item-${notification.id}`}
            onClick={handleClick}
            className={cn(
                "group relative flex items-start gap-3.5 px-4 py-3.5 transition-colors cursor-pointer border-b border-border/40 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                isUnread ? "bg-cyan-500/[0.04]" : "bg-card/30"
            )}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    handleClick(e);
                }
            }}
        >
            {/* Unread blue dot */}
            {isUnread && (
                <div
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-cyan-500 shadow-xs"
                    aria-label="Unread notification"
                />
            )}

            {/* Type badge icon */}
            <div className={cn("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full", config.bgColor)}>
                <Icon size={18} className={config.iconColor} aria-hidden="true" />
            </div>

            {/* Content Body */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    {/* Actor Avatar */}
                    {actor.avatarUrl ? (
                        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border/40">
                            <Image
                                src={actor.avatarUrl}
                                alt={actor.name || "User"}
                                fill
                                className="object-cover"
                                sizes="24px"
                                unoptimized
                            />
                        </div>
                    ) : (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-foreground">
                            {(actor.name?.[0] || "U").toUpperCase()}
                        </div>
                    )}

                    <div className="min-w-0 flex-1 flex items-baseline justify-between gap-1">
                        <div className="truncate text-xs text-foreground">
                            <span className="font-semibold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                {actor.name || "Unknown user"}
                            </span>
                            {actor.handle && (
                                <span className="ml-1 text-muted-foreground font-normal">
                                    {actor.handle}
                                </span>
                            )}
                            <span className="ml-1 text-muted-foreground">
                                {config.actionText}
                            </span>
                        </div>

                        {timeDisplay && (
                            <span className="shrink-0 text-[11px] text-muted-foreground font-medium">
                                {timeDisplay}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
