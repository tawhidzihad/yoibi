"use client";

import { memo } from "react";
import { cn } from "../utils/cn";

export const AuroraText = memo(function AuroraText({
    children,
    className = "",
    colors = ["#06b6d4", "#22d3ee", "#0891b2", "#67e8f9"],
    speed = 1.5,
}) {
    const gradientStyle = {
        backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${colors[0]})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animationDuration: `${10 / speed}s`,
    };

    return (
        <span className={cn("relative inline-block", className)}>
            <span className="sr-only">{children}</span>
            <span
                className="animate-aurora relative bg-[length:200%_auto] bg-clip-text text-transparent"
                style={gradientStyle}
                aria-hidden="true"
            >
                {children}
            </span>
        </span>
    );
});

AuroraText.displayName = "AuroraText";
