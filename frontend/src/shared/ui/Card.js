"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "../utils/cn";

export function Card({
    children,
    className = "",
    interactive = false,
    gradientColor = "rgba(6, 182, 212, 0.08)",
    gradientSize = 250,
    ...props
}) {
    const cardRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: -gradientSize, y: -gradientSize });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    }, []);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    return (
        <div
            ref={cardRef}
            onMouseMove={interactive ? handleMouseMove : undefined}
            onMouseEnter={interactive ? handleMouseEnter : undefined}
            onMouseLeave={interactive ? handleMouseLeave : undefined}
            className={cn(
                "relative overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xs transition-colors",
                className
            )}
            {...props}
        >
            {interactive && isHovered && (
                <div
                    className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(${gradientSize}px circle at ${mousePos.x}px ${mousePos.y}px, ${gradientColor}, transparent 80%)`,
                    }}
                    aria-hidden="true"
                />
            )}
            <div className="relative z-10">{children}</div>
        </div>
    );
}
