"use client";

import Link from "next/link";
import { ArrowLeft, User, ExternalLink } from "lucide-react";
import { Avatar } from "@/shared/ui/Avatar";
import { cn } from "@/shared/utils/cn";

export function ChatHeader({
    partner,
    conversation,
    isOnline = false,
    onBack,
    className = ""
}) {
    if (!partner) return null;

    const handle = partner.handle ? String(partner.handle).replace(/^@/, "") : "";
    const name = partner.name || handle || "User";
    const profileUrl = handle ? `/profile/${handle}` : "#";

    return (
        <header
            className={cn(
                "sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/60 bg-background/90 px-4 backdrop-blur-md select-none",
                className
            )}
        >
            <div className="flex items-center gap-3 min-w-0">
                {/* Back button (navigates back to /message on all viewports) */}
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer"
                        aria-label="Back to conversations"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                {/* Partner avatar */}
                <Link
                    href={profileUrl}
                    className="relative shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-full"
                    aria-label={`View ${name}'s profile`}
                >
                    <Avatar
                        src={partner.avatarUrl || ""}
                        name={name}
                        handle={handle}
                        size={42}
                    />
                    {isOnline && (
                        <span
                            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500 ring-1 ring-background"
                            title="Active now"
                        />
                    )}
                </Link>

                {/* Name & status */}
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <Link
                            href={profileUrl}
                            className="truncate text-sm font-bold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                        >
                            {name}
                        </Link>
                        {partner.relationship === "mutual" && (
                            <span className="shrink-0 rounded-sm bg-cyan-500/10 px-1 py-0.2 text-[10px] font-medium text-cyan-600 dark:text-cyan-400">
                                mutual
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {isOnline ? (
                            <span className="flex items-center gap-1 text-emerald-500 font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active now
                            </span>
                        ) : (
                            <span>{handle ? `@${handle}` : "Offline"}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
                <Link
                    href={profileUrl}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    title="View Profile"
                    aria-label="View Profile"
                >
                    <User size={18} />
                </Link>
            </div>
        </header>
    );
}
