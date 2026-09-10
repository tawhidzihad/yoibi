"use client";

/**
 * Animated typing indicator with 3 pulsing dots and participant display name.
 */
export function TypingIndicator({ username }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground animate-in fade-in duration-200">
            <div className="flex items-center gap-1 rounded-full bg-secondary/60 px-3 py-1.5 border border-border/40 backdrop-blur-sm">
                <span className="font-medium text-foreground/80">{username || "Participant"} is typing</span>
                <div className="flex items-center gap-1 ml-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-bounce" />
                </div>
            </div>
        </div>
    );
}
