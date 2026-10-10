"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ArrowDown, Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";

function formatDateSeparator(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";

    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
    });
}

export function ChatThread({
    messages = [],
    partner = null,
    currentUserId,
    isPartnerTyping = false,
    hasMore = false,
    isLoadingMore = false,
    onLoadMore = null,
    onRetryMessage = null,
    className = ""
}) {
    const scrollContainerRef = useRef(null);
    const bottomSentinelRef = useRef(null);
    const prevScrollHeightRef = useRef(0);
    const isNearBottomRef = useRef(true);

    const [showScrollBottomPill, setShowScrollBottomPill] = useState(false);

    // Group messages by date and sender
    const groupedMessages = useMemo(() => {
        const groups = [];
        let currentDate = null;

        messages.forEach((msg, index) => {
            const dateStr = formatDateSeparator(msg.createdAt);
            if (dateStr !== currentDate) {
                currentDate = dateStr;
                groups.push({ type: "date", date: dateStr, key: `date-${msg.createdAt || index}` });
            }

            const prevMsg = messages[index - 1];
            const isSameSender = prevMsg && prevMsg.senderId === msg.senderId;
            const timeDiffMs = prevMsg && msg.createdAt && prevMsg.createdAt
                ? Math.abs(new Date(msg.createdAt) - new Date(prevMsg.createdAt))
                : Infinity;
            const isClustered = isSameSender && timeDiffMs < 5 * 60 * 1000;

            groups.push({
                type: "message",
                message: msg,
                isOwn: msg.senderId === currentUserId,
                showAvatar: !isClustered,
                key: msg.id || msg.clientMessageId || `msg-${index}`
            });
        });

        return groups;
    }, [messages, currentUserId]);

    // Handle scroll events (check near bottom + trigger load more)
    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const { scrollTop, scrollHeight, clientHeight } = el;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const nearBottom = distanceFromBottom < 120;
        isNearBottomRef.current = nearBottom;

        setShowScrollBottomPill(!nearBottom && messages.length > 0);

        // Load more when scrolled near top
        if (scrollTop < 80 && hasMore && !isLoadingMore && onLoadMore) {
            prevScrollHeightRef.current = scrollHeight;
            onLoadMore();
        }
    }, [hasMore, isLoadingMore, onLoadMore, messages.length]);

    // Preserve scroll position after prepending older messages
    useEffect(() => {
        if (prevScrollHeightRef.current > 0 && scrollContainerRef.current) {
            const currentScrollHeight = scrollContainerRef.current.scrollHeight;
            const heightDiff = currentScrollHeight - prevScrollHeightRef.current;
            if (heightDiff > 0) {
                scrollContainerRef.current.scrollTop += heightDiff;
            }
            prevScrollHeightRef.current = 0;
        }
    }, [messages]);

    // Auto-scroll to bottom on new messages if near bottom
    useEffect(() => {
        if (isNearBottomRef.current && bottomSentinelRef.current) {
            bottomSentinelRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages.length, isPartnerTyping]);

    const scrollToBottom = () => {
        if (bottomSentinelRef.current) {
            bottomSentinelRef.current.scrollIntoView({ behavior: "smooth" });
        }
        setShowScrollBottomPill(false);
    };

    return (
        <div className={cn("relative flex flex-1 flex-col overflow-hidden bg-background", className)}>
            {/* Scrollable messages container */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 scrollbar-thin"
            >
                {/* Loading spinner for pagination */}
                {isLoadingMore && (
                    <div className="flex justify-center py-2">
                        <Loader2 size={18} className="animate-spin text-cyan-500" />
                    </div>
                )}

                {/* Empty conversation prompt */}
                {messages.length === 0 && !isLoadingMore && (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <p className="text-sm font-medium">No messages yet</p>
                        <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs">
                            Send a message below to start this conversation.
                        </p>
                    </div>
                )}

                {/* Rendered messages & date dividers */}
                {groupedMessages.map((item) => {
                    if (item.type === "date") {
                        return (
                            <div key={item.key} className="my-4 flex items-center justify-center">
                                <span className="rounded-full bg-secondary/80 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-xs">
                                    {item.date}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <MessageBubble
                            key={item.key}
                            message={item.message}
                            isOwn={item.isOwn}
                            partner={partner}
                            showAvatar={item.showAvatar}
                            onRetry={onRetryMessage}
                        />
                    );
                })}

                {/* Typing indicator at bottom */}
                {isPartnerTyping && (
                    <TypingIndicator partner={partner} />
                )}

                <div ref={bottomSentinelRef} className="h-2" />
            </div>

            {/* Scroll-to-bottom floating pill */}
            {showScrollBottomPill && (
                <button
                    type="button"
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Scroll to newest messages"
                >
                    <ArrowDown size={14} />
                    <span>New messages</span>
                </button>
            )}
        </div>
    );
}
