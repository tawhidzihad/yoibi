import { forwardRef } from "react";
import { cn } from "../utils/cn";

export const Button = forwardRef(function Button(
    {
        className = "",
        variant = "primary",
        size = "md",
        disabled = false,
        loading = false,
        children,
        type = "button",
        ...props
    },
    ref
) {
    const baseStyles =
        "inline-flex cursor-pointer items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50 select-none";

    const variantStyles = {
        primary: "bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm",
        secondary:
            "border border-border/60 bg-secondary text-foreground hover:bg-secondary/80",
        outline:
            "border border-border bg-transparent text-foreground hover:bg-secondary",
        ghost: "bg-transparent text-foreground hover:bg-secondary",
        destructive: "bg-destructive text-white hover:opacity-90 shadow-sm",
        shimmer:
            "relative overflow-hidden bg-cyan-600 text-white shadow-sm hover:bg-cyan-700",
    };

    const sizeStyles = {
        sm: "h-8 rounded-lg px-3 text-xs",
        md: "h-10 rounded-xl px-4 text-sm",
        lg: "h-12 rounded-xl px-6 text-base",
    };

    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || loading}
            className={cn(
                baseStyles,
                variantStyles[variant] || variantStyles.primary,
                sizeStyles[size] || sizeStyles.md,
                className
            )}
            {...props}
        >
            {loading && (
                <svg
                    className="h-4 w-4 animate-spin text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
});
