"use client";

import { MessageDeliveryStatus } from "./MessageStatus";

function formatMessageTime(isoString) {
    if (!isoString) return "";
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "";
    }
}

/**
 * Modern chat bubble with directional styling, timestamps, and read indicators.
 */
export function MessageBubble({ message, isOwn, isPending }) {
    const formattedTime = formatMessageTime(message.createdAt);

    return (
        <div
            className={`flex w-full ${isOwn ? "justify-end" : "justify-start"} my-1 px-4 transition-all`}
        >
            <div
                className={`group relative max-w-[78%] sm:max-w-md rounded-2xl px-4 py-2.5 shadow-sm transition-all ${
                    isOwn
                        ? "bg-gradient-to-br from-cyan-600 to-cyan-700 text-white rounded-br-xs"
                        : "bg-secondary/70 backdrop-blur-md text-foreground border border-border/40 rounded-bl-xs"
                }`}
            >
                {/* Message text with word wrapping */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                </p>

                {/* Footer with time and read tick */}
                <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                        isOwn ? "text-cyan-100/80" : "text-muted-foreground"
                    }`}
                >
                    <span>{formattedTime}</span>
                    <MessageDeliveryStatus
                        isOwn={isOwn}
                        readAt={message.readAt}
                        isPending={isPending}
                    />
                </div>
            </div>
        </div>
    );
}
