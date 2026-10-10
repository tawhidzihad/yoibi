"use client";

import { useMemo } from "react";
import { Avatar } from "@/shared/ui/Avatar";
import { StatusTicks } from "./StatusTicks";
import { ImageMediaCard, VideoMediaCard } from "./MediaCards";
import { RotateCw } from "lucide-react";
import { cn } from "@/shared/utils/cn";

function formatMessageTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Parses plain text and renders URLs as safe external links.
 */
function renderFormattedText(text) {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 break-all opacity-95 hover:opacity-100 font-medium"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
}

export function MessageBubble({
    message,
    isOwn = false,
    partner = null,
    showAvatar = true,
    onRetry = null,
    className = ""
}) {
    const formattedTime = useMemo(() => formatMessageTime(message.createdAt), [message.createdAt]);
    const isFailed = message.status === "failed";
    const partnerHandle = partner?.handle ? String(partner.handle).replace(/^@/, "") : "";

    return (
        <div
            className={cn(
                "group flex items-end gap-2 px-4 py-1",
                isOwn ? "justify-end" : "justify-start",
                className
            )}
        >
            {/* Received message avatar */}
            {!isOwn && (
                <div className="shrink-0 mb-1 w-7">
                    {showAvatar && partner ? (
                        <Avatar
                            src={partner.avatarUrl || ""}
                            name={partner.name || partnerHandle}
                            handle={partnerHandle}
                            size={28}
                        />
                    ) : (
                        <div className="w-7" />
                    )}
                </div>
            )}

            {/* Bubble wrapper */}
            <div className={cn("flex flex-col gap-1 max-w-[80%] sm:max-w-[70%]", isOwn ? "items-end" : "items-start")}>
                {/* Media Attachment if present */}
                {message.media && (
                    <div className="mb-1">
                        {message.media.resourceType === "video" ? (
                            <VideoMediaCard media={message.media} />
                        ) : (
                            <ImageMediaCard media={message.media} />
                        )}
                    </div>
                )}

                {/* Text Bubble */}
                {message.text && (
                    <div
                        className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap select-text shadow-xs",
                            isOwn
                                ? "rounded-br-xs bg-gradient-to-r from-cyan-500 to-teal-600 text-white"
                                : "rounded-bl-xs bg-card border border-border/60 text-foreground"
                        )}
                    >
                        {renderFormattedText(message.text)}
                    </div>
                )}

                {/* Metadata row: time + ticks / retry */}
                <div className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground select-none">
                    {isFailed ? (
                        <div className="flex items-center gap-1 text-rose-500 font-medium">
                            <span>Failed</span>
                            {onRetry && (
                                <button
                                    type="button"
                                    onClick={() => onRetry(message)}
                                    className="flex items-center gap-0.5 text-rose-500 hover:text-rose-600 underline font-semibold cursor-pointer"
                                    aria-label="Retry sending message"
                                >
                                    <RotateCw size={11} className="mr-0.5" />
                                    Retry
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <span>{formattedTime}</span>
                            {isOwn && (
                                <StatusTicks
                                    status={message.status || "sent"}
                                    className="shrink-0"
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
