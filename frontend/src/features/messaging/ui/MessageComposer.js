"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, AlertCircle } from "lucide-react";

const composerSchema = z.object({
    content: z
        .string()
        .min(1, "Message cannot be empty")
        .max(2000, "Message cannot exceed 2000 characters"),
});

function generateClientMessageId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * MessageComposer with React Hook Form + Zod, auto-generated clientMessageId,
 * debounced typing indicators, and keyboard shortcuts.
 */
export function MessageComposer({
    recipientId,
    conversationId,
    onSendMessage,
    onTypingStart,
    onTypingStop,
    disabled = false,
    errorMessage = null,
    onClearError = null,
}) {
    const [text, setText] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { isSubmitting },
    } = useForm({
        resolver: zodResolver(composerSchema),
        defaultValues: {
            content: "",
        },
    });

    // Handle typing debounce via effect
    useEffect(() => {
        if (!conversationId || !onTypingStart || !onTypingStop || !text.trim()) return;

        onTypingStart(conversationId);
        const timer = setTimeout(() => {
            onTypingStop(conversationId);
        }, 1500);

        return () => {
            clearTimeout(timer);
        };
    }, [text, conversationId, onTypingStart, onTypingStop]);

    const handleTextChange = (e) => {
        const val = e.target.value;
        setText(val);
        setValue("content", val, { shouldValidate: true });
    };

    const handleFormSubmit = async (data) => {
        if (!data.content.trim()) return;

        if (onTypingStop && conversationId) {
            onTypingStop(conversationId);
        }

        const clientMessageId = generateClientMessageId();

        const success = await onSendMessage({
            recipientId,
            content: data.content.trim(),
            clientMessageId,
        });

        if (success !== false) {
            setText("");
            reset({ content: "" });
            if (onClearError) onClearError();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(handleFormSubmit)();
        }
    };

    const { ref: formRef, ...registerProps } = register("content");

    return (
        <div className="border-t border-border/50 bg-background/80 backdrop-blur-md p-3">
            {errorMessage && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-500 animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                    {onClearError && (
                        <button
                            type="button"
                            onClick={onClearError}
                            className="font-semibold underline ml-2 hover:opacity-80 cursor-pointer"
                        >
                            Dismiss
                        </button>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex items-end gap-2">
                <div className="relative flex-1">
                    <textarea
                        {...registerProps}
                        ref={formRef}
                        id="message-content-input"
                        rows={1}
                        value={text}
                        onChange={handleTextChange}
                        placeholder="Write a message… (Enter to send, Shift+Enter for newline)"
                        onKeyDown={handleKeyDown}
                        disabled={disabled || isSubmitting}
                        className="w-full resize-none rounded-xl border border-border/60 bg-secondary/30 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:bg-background focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 min-h-[42px] max-h-32 transition-all"
                        aria-label="Direct message input"
                    />
                </div>

                <button
                    type="submit"
                    id="message-send-button"
                    disabled={disabled || isSubmitting || !text.trim()}
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-sm transition-all hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer"
                    aria-label="Send direct message"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
