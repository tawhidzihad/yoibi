import { Button } from "../ui/Button";
import { cn } from "../utils/cn";

export function EmptyState({
    icon: Icon,
    title = "No items found",
    description = "There is nothing to display here yet.",
    actionLabel,
    onAction,
    className = "",
}) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center text-card-foreground",
                className
            )}
        >
            {Icon && (
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Icon size={24} />
                </div>
            )}
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {description && (
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction} size="sm" className="mt-4">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
