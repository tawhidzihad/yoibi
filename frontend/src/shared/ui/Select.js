import { forwardRef } from "react";
import { cn } from "../utils/cn";

export const Select = forwardRef(function Select(
    {
        id,
        label,
        error,
        helperText,
        className = "",
        required = false,
        disabled = false,
        children,
        ...props
    },
    ref
) {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const errorId = selectId ? `${selectId}-error` : undefined;
    const helperId = selectId ? `${selectId}-helper` : undefined;

    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-foreground"
                >
                    {label} {required && <span className="text-destructive">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    ref={ref}
                    id={selectId}
                    required={required}
                    disabled={disabled}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : helperText ? helperId : undefined}
                    className={cn(
                        "w-full appearance-none rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground transition-colors",
                        "focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error
                            ? "border-destructive focus:border-destructive focus:ring-destructive"
                            : "border-border",
                        className
                    )}
                    {...props}
                >
                    {children}
                </select>
                {/* Chevron indicator */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </div>
            {error && (
                <p id={errorId} className="text-xs font-medium text-destructive">
                    {error}
                </p>
            )}
            {!error && helperText && (
                <p id={helperId} className="text-xs text-muted-foreground">
                    {helperText}
                </p>
            )}
        </div>
    );
});
