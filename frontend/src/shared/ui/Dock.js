"use client";

import { cn } from "../utils/cn";

export function Dock({ children, className = "" }) {
    return (
        <nav
            aria-label="Mobile navigation"
            className={cn(
                "flex items-center gap-2 rounded-2xl border border-border/70 bg-background/85 px-3 py-2 shadow-lg backdrop-blur-xl",
                className
            )}
        >
            {children}
        </nav>
    );
}

export function DockIcon({ children, active = false, onClick, className = "", label = "" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label || undefined}
            className={cn(
                "relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all duration-200",
                "hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                active
                    ? "bg-cyan-500/15 text-cyan-400 font-semibold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                className
            )}
        >
            {children}
            {active && (
                <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-cyan-400" />
            )}
        </button>
    );
}
