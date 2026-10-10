"use client";

import { Avatar } from "@/shared/ui/Avatar";
import { StatusTicks } from "./StatusTicks";
import { Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";

function formatRelativeTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay === 1) return "yesterday";
    if (diffDay < 7) return `${diffDay}d`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ConversationCard({
    conversation,
    isActive = false,
    isTyping = false,
    isOnline = false,
    currentUserId,
    onClick
}) {
    const partner = conversation.otherParticipant || {};
    const handle = partner.handle ? String(partner.handle).replace(/^@/, "") : "";
    const name = partner.name || handle || "User";
    const lastMessage = conversation.lastMessage;
    const unreadCount = conversation.unreadCount || 0;
    const isOwnLastMessage = lastMessage && lastMessage.senderId === currentUserId;
    const formattedTime = formatRelativeTime(lastMessage?.createdAt || conversation.updatedAt);

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full text-left flex items-start gap-3 p-3.5 rounded-xl transition-all border border-transparent select-none cursor-pointer",
                isActive
                    ? "bg-cyan-500/10 border-cyan-500/20 shadow-xs"
                    : "hover:bg-secondary/70 focus-visible:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            )}
            aria-pressed={isActive}
        >
            {/* Avatar with live online dot */}
            <div className="relative shrink-0 mt-0.5">
                <Avatar
                    src={partner.avatarUrl || ""}
                    name={name}
                    handle={handle}
                    size={46}
                />
                {isOnline && (
                    <span
                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500 ring-1 ring-background"
                        title="Online"
                    />
                )}
            </div>

            {/* Content preview */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate text-sm font-semibold text-foreground">
                            {name}
                        </span>
                        {handle && (
                            <span className="hidden sm:inline truncate text-xs text-muted-foreground">
                                @{handle}
                            </span>
                        )}
                        {partner.relationship === "mutual" && (
                            <span className="shrink-0 rounded-sm bg-cyan-500/10 px-1 py-0.2 text-[10px] font-medium text-cyan-600 dark:text-cyan-400">
                                mutual
                            </span>
                        )}
                    </div>
                    {formattedTime && (
                        <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                            {formattedTime}
                        </span>
                    )}
                </div>

                {/* Subtitle / Last Message / Typing */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 text-xs">
                        {isTyping ? (
                            <span className="text-cyan-500 font-medium italic animate-pulse">
                                typing...
                            </span>
                        ) : (
                            <>
                                {isOwnLastMessage && (
                                    <StatusTicks
                                        status={lastMessage.status || "sent"}
                                        className="shrink-0 mr-0.5"
                                    />
                                )}
                                {lastMessage?.media ? (
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        {lastMessage.media.resourceType === "video" ? (
                                            <VideoIcon size={13} className="shrink-0" />
                                        ) : (
                                            <ImageIcon size={13} className="shrink-0" />
                                        )}
                                        <span className="truncate">
                                            {lastMessage.text || (lastMessage.media.resourceType === "video" ? "Video" : "Photo")}
                                        </span>
                                    </span>
                                ) : (
                                    <span className={cn(
                                        "truncate",
                                        unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                                    )}>
                                        {lastMessage?.text || "No messages yet"}
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    {/* Unread badge */}
                    {unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[11px] font-bold text-white shadow-xs">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}
