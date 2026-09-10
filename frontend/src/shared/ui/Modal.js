"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "../utils/cn";

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    className = "",
    size = "md",
}) {
    const dialogRef = useRef(null);
    const previousActiveElement = useRef(null);

    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
    };

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose?.();
                return;
            }

            if (e.key === "Tab" && dialogRef.current) {
                const focusable = dialogRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement;
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";

            // Focus dialog on open
            const timer = setTimeout(() => {
                const firstFocusable = dialogRef.current?.querySelector(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (firstFocusable) {
                    firstFocusable.focus();
                } else {
                    dialogRef.current?.focus();
                }
            }, 50);

            return () => {
                clearTimeout(timer);
                document.removeEventListener("keydown", handleKeyDown);
                document.body.style.overflow = "";
                if (previousActiveElement.current) {
                    previousActiveElement.current.focus?.();
                }
            };
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            aria-modal="true"
            role="dialog"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-describedby={description ? "modal-description" : undefined}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Dialog Panel */}
            <div
                ref={dialogRef}
                tabIndex={-1}
                className={cn(
                    "relative z-10 w-full overflow-hidden rounded-2xl border border-border/80 bg-card p-6 text-card-foreground shadow-xl focus:outline-none animate-in fade-in zoom-in-95 duration-200",
                    sizeClasses[size] || sizeClasses.md,
                    className
                )}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        {title && (
                            <h2
                                id="modal-title"
                                className="text-lg font-semibold text-foreground"
                            >
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p
                                id="modal-description"
                                className="mt-1 text-sm text-muted-foreground"
                            >
                                {description}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        aria-label="Close dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-4">{children}</div>
            </div>
        </div>
    );
}
