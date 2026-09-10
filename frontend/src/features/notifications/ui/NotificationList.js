"use client";

import { useState } from "react";
import { Bell, CheckCheck, Loader2, RefreshCw } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import { NotificationBadge } from "./NotificationBadge";
import { cn } from "@/shared/utils/cn";

/**
 * Notifications feed view component.
 */
export function NotificationList() {
    const [activeTab, setActiveTab] = useState("all"); // "all" | "unread"

    const filterRead = activeTab === "unread" ? false : undefined;

    const {
        notifications,
        unreadCount,
        pagination,
        isLoading,
        isLoadingMore,
        error,
        fetchNotifications,
        loadMore,
        markRead,
        markAllRead
    } = useNotifications({ filterRead, autoFetch: true });

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
            {/* Header */}
            <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-background/95 backdrop-blur-sm border-b border-border/50">
                <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            Notifications
                        </h1>
                        <NotificationBadge count={unreadCount} />
                    </div>

                    {unreadCount > 0 && (
                        <button
                            type="button"
                            id="mark-all-read-btn"
                            onClick={markAllRead}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer"
                        >
                            <CheckCheck size={14} aria-hidden="true" />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border/40">
                    <button
                        type="button"
                        id="tab-all-notifications"
                        onClick={() => handleTabChange("all")}
                        className={cn(
                            "relative pb-2.5 px-4 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none",
                            activeTab === "all"
                                ? "text-cyan-600 dark:text-cyan-400"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        All
                        {activeTab === "all" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-full" />
                        )}
                    </button>

                    <button
                        type="button"
                        id="tab-unread-notifications"
                        onClick={() => handleTabChange("unread")}
                        className={cn(
                            "relative pb-2.5 px-4 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none flex items-center gap-1.5",
                            activeTab === "unread"
                                ? "text-cyan-600 dark:text-cyan-400"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Unread
                        {unreadCount > 0 && (
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                        )}
                        {activeTab === "unread" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="my-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
                    <p className="text-xs text-destructive">{error}</p>
                    <button
                        type="button"
                        onClick={() => fetchNotifications(1, false)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-destructive underline"
                    >
                        <RefreshCw size={12} /> Retry
                    </button>
                </div>
            )}

            {/* Loading state */}
            {isLoading ? (
                <div className="flex flex-col gap-2 py-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/30 animate-pulse"
                        >
                            <div className="h-10 w-10 rounded-full bg-secondary shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/3 bg-secondary rounded" />
                                <div className="h-2.5 w-1/2 bg-secondary rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/80 text-muted-foreground mb-4">
                        <Bell size={26} aria-hidden="true" />
                    </div>
                    <h2 className="text-base font-semibold text-foreground">
                        {activeTab === "unread" ? "No unread notifications" : "No notifications yet"}
                    </h2>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1">
                        {activeTab === "unread"
                            ? "You're all caught up! Check back later for new activity."
                            : "When someone likes your tweets, retweets, replies, or follows you, you'll see it here."}
                    </p>
                </div>
            ) : (
                /* Notification List */
                <div className="divide-y divide-border/40 rounded-xl border border-border/40 overflow-hidden bg-card/10 my-4 shadow-xs">
                    {notifications.map((notif) => (
                        <NotificationItem
                            key={notif.id}
                            notification={notif}
                            onMarkRead={markRead}
                        />
                    ))}
                </div>
            )}

            {/* Load more button */}
            {pagination.hasNextPage && !isLoading && (
                <div className="py-6 text-center">
                    <button
                        type="button"
                        id="load-more-notifications-btn"
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-secondary/60 px-5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer disabled:opacity-50"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Load More"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
