"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../../shared/utils/cn";

/**
 * Lightweight scroll-reveal for the homepage (no external dependency).
 * Content is visible by default, so nothing is blocked if JS or
 * IntersectionObserver is unavailable. Users with
 * `prefers-reduced-motion: reduce` never see the transition.
 */
export function Reveal({ children, delay = 0, className = "" }) {
    const ref = useRef(null);
    const [isRevealed, setIsRevealed] = useState(true);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return undefined; // keep content fully visible, no animation
        }

        // Only animate content that starts below the fold.
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
            return undefined;
        }

        setIsRevealed(false);
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsRevealed(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={delay ? { transitionDelay: `${delay}ms` } : undefined}
            className={cn(
                "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
                isRevealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
                className
            )}
        >
            {children}
        </div>
    );
}
