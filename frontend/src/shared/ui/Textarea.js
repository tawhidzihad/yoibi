import { forwardRef } from "react";
import { cn } from "../utils/cn";

export const Textarea = forwardRef(function Textarea(
    {
        id,
        label,
        error,
        helperText,
        className = "",
        required = false,
        disabled = false,
        rows = 3,
        value,
        maxLength,
        ...props
    },
    ref
) {
    const textareaId =
        id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const errorId = textareaId ? `${textareaId}-error` : undefined;
    const helperId = textareaId ? `${textareaId}-helper` : undefined;

    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-sm font-medium text-foreground"
                >
                    {label} {required && <span className="text-destructive">*</span>}
                </label>
            )}
            <textarea
                ref={ref}
                id={textareaId}
                rows={rows}
                required={required}
                disabled={disabled}
                value={value}
                maxLength={maxLength}
                aria-invalid={Boolean(error)}
                aria-describedby={
                    error ? errorId : helperText ? helperId : undefined
                }
                className={cn(
                    "w-full resize-none rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors",
                    "focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    error
                        ? "border-destructive focus:border-destructive focus:ring-destructive"
                        : "border-border",
                    className
                )}
                {...props}
            />
            <div className="flex items-center justify-between text-xs">
                {error ? (
                    <p id={errorId} className="font-medium text-destructive">
                        {error}
                    </p>
                ) : helperText ? (
                    <p id={helperId} className="text-muted-foreground">
                        {helperText}
                    </p>
                ) : (
                    <span />
                )}
                {maxLength && typeof value === "string" && (
                    <span className="text-muted-foreground">
                        {value.length} / {maxLength}
                    </span>
                )}
            </div>
        </div>
    );
});
