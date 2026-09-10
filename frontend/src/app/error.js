"use client";

import { useEffect } from "react";
import { YoibiLogo } from "../shared/ui/YoibiLogo";

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        console.error("Global error:", error);
    }, [error]);

    return (
        <html lang="en">
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
                    <YoibiLogo className="mb-6 h-16 w-16 text-cyan-500 opacity-40" />
                    <h1 className="mb-2 text-2xl font-bold text-foreground">Something went wrong</h1>
                    <p className="mb-8 text-sm text-muted-foreground">
                        An unexpected error occurred. Please try again.
                    </p>
                    <button
                        type="button"
                        onClick={reset}
                        className="rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
