"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { cn } from "../../../shared/utils/cn";

export function HomeHeaderNav({ focusRing }) {
    const { status } = useAuth();

    if (status === "authenticated") {
        return (
            <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
                <Link
                    href="/feed"
                    className={cn(
                        "inline-flex items-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700",
                        focusRing
                    )}
                >
                    Go to Feed
                </Link>
            </nav>
        );
    }

    if (status === "loading") {
        return (
            <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
                <div
                    className="h-9 w-24 animate-pulse rounded-xl bg-secondary"
                    aria-hidden="true"
                />
                <span className="sr-only">Checking session...</span>
            </nav>
        );
    }

    return (
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
            <Link
                href="/login"
                className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    focusRing
                )}
            >
                Sign in
            </Link>
            <Link
                href="/signup"
                className={cn(
                    "inline-flex items-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700",
                    focusRing
                )}
            >
                Join Yoibi
            </Link>
        </nav>
    );
}
