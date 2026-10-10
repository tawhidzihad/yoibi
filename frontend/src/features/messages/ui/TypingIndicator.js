"use client";

import { Avatar } from "@/shared/ui/Avatar";
import { cn } from "@/shared/utils/cn";

export function TypingIndicator({ partner, className = "" }) {
    const handle = partner?.handle ? String(partner.handle).replace(/^@/, "") : "";
    const name = partner?.name || handle || "Someone";

    return (
        <div className={cn("flex items-end gap-2 px-4 py-2", className)}>
            {partner && (
                <div className="shrink-0 mb-1">
                    <Avatar
                        src={partner.avatarUrl || ""}
                        name={name}
                        handle={handle}
                        size={28}
                    />
                </div>
            )}
            <div className="flex flex-col gap-1 max-w-[75%]">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border/50 bg-secondary/80 px-4 py-2.5 shadow-xs">
                    <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" />
                    </div>
                </div>
                <span className="text-[11px] text-muted-foreground ml-1">
                    {name} is typing...
                </span>
            </div>
        </div>
    );
}
