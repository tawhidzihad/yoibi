"use client";

import { forwardRef, useRef, useEffect, useCallback, useId } from "react";
import { cn } from "../utils/cn";

/**
 * Reusable auto-growing multi-line text input component.
 * Expands in height as content grows (typing, pressing Enter, pasting)
 * and shrinks back down when text is deleted (down to a sensible minHeight/rows).
 *
 * Supports controlled & uncontrolled usages, React Hook Form ref registration,
 * mobile & desktop keyboard inputs, and responsive window resizes.
 */
export const AutoGrowTextarea = forwardRef(function AutoGrowTextarea(
    {
        id,
        value,
        defaultValue,
        onChange,
        onInput,
        placeholder,
        disabled = false,
        rows = 2,
        minRows,
        maxHeight,
        className = "",
        style,
        ...props
    },
    forwardedRef
) {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const internalRef = useRef(null);
    const minHeightRef = useRef(0);

    const adjustHeight = useCallback(() => {
        const textarea = internalRef.current;
        if (!textarea) return;

        // Reset to auto so scrollHeight shrinks accurately when text is deleted
        textarea.style.height = "auto";

        const scrollHeight = textarea.scrollHeight;
        const minHeight = minHeightRef.current || 0;
        let targetHeight = Math.max(scrollHeight, minHeight);

        if (maxHeight && targetHeight > maxHeight) {
            targetHeight = maxHeight;
            textarea.style.overflowY = "auto";
        } else {
            textarea.style.overflowY = "hidden";
        }

        textarea.style.height = `${targetHeight}px`;
    }, [maxHeight]);

    // Measure initial base height based on rows / computed styles
    useEffect(() => {
        const textarea = internalRef.current;
        if (!textarea) return;

        const effectiveRows = minRows || rows || 2;
        const computed = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computed.lineHeight) || 20;
        const paddingTop = parseFloat(computed.paddingTop) || 0;
        const paddingBottom = parseFloat(computed.paddingBottom) || 0;
        const borderTop = parseFloat(computed.borderTopWidth) || 0;
        const borderBottom = parseFloat(computed.borderBottomWidth) || 0;

        minHeightRef.current =
            lineHeight * effectiveRows +
            paddingTop +
            paddingBottom +
            borderTop +
            borderBottom;

        adjustHeight();
    }, [rows, minRows, adjustHeight]);

    // Adjust whenever controlled value or defaultValue changes
    useEffect(() => {
        adjustHeight();
    }, [value, defaultValue, adjustHeight]);

    // Window resize listener so line wrapping recalculates height correctly
    useEffect(() => {
        const handleResize = () => {
            adjustHeight();
        };
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [adjustHeight]);

    // Combine forwarded ref and internal ref
    const setRefs = useCallback(
        (node) => {
            internalRef.current = node;
            if (typeof forwardedRef === "function") {
                forwardedRef(node);
            } else if (forwardedRef && "current" in forwardedRef) {
                forwardedRef.current = node;
            }
        },
        [forwardedRef]
    );

    const handleInput = (e) => {
        adjustHeight();
        onInput?.(e);
    };

    const handleChange = (e) => {
        adjustHeight();
        onChange?.(e);
    };

    return (
        <textarea
            {...props}
            ref={setRefs}
            id={textareaId}
            value={value}
            defaultValue={defaultValue}
            rows={rows}
            disabled={disabled}
            placeholder={placeholder}
            onInput={handleInput}
            onChange={handleChange}
            style={{
                ...style,
                boxSizing: "border-box",
            }}
            className={cn(
                "w-full resize-none overflow-hidden break-words whitespace-pre-wrap transition-none scrollbar-none",
                className
            )}
        />
    );
});
