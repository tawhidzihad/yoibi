import { forwardRef } from "react";
import { cn } from "../utils/cn";

export const Input = forwardRef(function Input(
    {
        id,
        label,
        error,
        helperText,
        type = "text",
        className = "",
        required = false,
        disabled = false,
        ...props
    },
    ref
) {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;

    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-foreground"
                >
                    {label} {required && <span className="text-destructive">*</span>}
                </label>
            )}
            <input
                ref={ref}
                id={inputId}
                type={type}
                required={required}
                disabled={disabled}
                aria-invalid={Boolean(error)}
                aria-describedby={
                    error ? errorId : helperText ? helperId : undefined
                }
                className={cn(
                    "w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors",
                    "focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    error
                        ? "border-destructive focus:border-destructive focus:ring-destructive"
                        : "border-border",
                    className
                )}
                {...props}
            />
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
