"use client";

import { cn } from "../utils/cn";

/**
 * GlowBorderCard — YOIBI section/card container with a subtle, modern,
 * smooth hover border effect (inspired by the legacy Signup MagicCard).
 *
 * - Default: quiet border in light/dark themes.
 * - Hover/focus-within: soft cyan glow follows a radial gradient wash.
 * - No motion library required: pure CSS transitions, responsive by default.
 * - Accessible: keeps content semantics untouched (plain section wrapper).
 */
export function GlowBorderCard({ className = "", children, ...props }) {
    return (
        <section
            {...props}
            className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition-all duration-300 ease-out",
                "hover:border-cyan-500/60 hover:shadow-[0_0_0_1px_rgba(6,182,212,0.35),0_12px_40px_-16px_rgba(6,182,212,0.35)]",
                "focus-within:border-cyan-500/60 focus-within:shadow-[0_0_0_1px_rgba(6,182,212,0.35),0_12px_40px_-16px_rgba(6,182,212,0.35)]",
                "sm:p-6",
                className
            )}
        >
            {/* Soft radial wash shown on hover — decorative only. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 bg-[radial-gradient(220px_circle_at_50%_0%,rgba(6,182,212,0.12),transparent_70%)]"
            />
            <div className="relative">{children}</div>
        </section>
    );
}
