import { YoibiLogo } from "../ui/YoibiLogo";
import { cn } from "../utils/cn";

export function LoadingFallback({ message = "Loading...", className = "", fullPage = false }) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "flex flex-col items-center justify-center gap-3 p-6 text-center select-none",
                fullPage ? "min-h-[60vh] w-full" : "py-12",
                className
            )}
        >
            <div className="relative flex items-center justify-center">
                <YoibiLogo className="h-10 w-10 text-cyan-500 animate-pulse" />
                <div className="absolute -inset-2 rounded-full border border-cyan-500/30 border-t-cyan-500 animate-spin" />
            </div>
            {message && (
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                    {message}
                </p>
            )}
            <span className="sr-only">Loading, please wait...</span>
        </div>
    );
}
