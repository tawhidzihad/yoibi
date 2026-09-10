import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../utils/cn";

export function ErrorState({
    title = "Something went wrong",
    message = "An unexpected error occurred. Please try again.",
    onRetry,
    fullPage = false,
    className = "",
}) {
    return (
        <div
            role="alert"
            className={cn(
                "flex flex-col items-center justify-center text-center",
                fullPage ? "min-h-[60vh] w-full p-6" : "rounded-2xl border border-destructive/30 bg-destructive/10 p-6",
                className
            )}
        >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20 text-destructive">
                <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {message && (
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {message}
                </p>
            )}
            {onRetry && (
                <Button
                    onClick={onRetry}
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                >
                    <RotateCcw size={14} /> Try again
                </Button>
            )}
        </div>
    );
}
