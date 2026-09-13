"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Radio, Loader2, AlertCircle, Info, X } from "lucide-react";
import { streamsApi } from "../api/streamsApi";
import { CANONICAL_CATEGORIES } from "../constants/categories";
import { CATEGORY_ICONS } from "../constants/categoryIcons";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/utils/cn";

const createStreamSchema = z.object({
    title: z
        .string()
        .trim()
        .min(3, "Title must be at least 3 characters")
        .max(120, "Title cannot exceed 120 characters"),
    description: z
        .string()
        .trim()
        .max(2000, "Description cannot exceed 2000 characters")
        .optional()
        .default(""),
    category: z
        .string()
        .optional()
        .default("conversations")
});

export function CreateStreamComposer({ isOpen, onClose, onStreamCreated }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(createStreamSchema),
        defaultValues: {
            title: "",
            description: "",
            category: "conversations"
        }
    });

    const currentCategory = watch("category");

    const handleCancel = () => {
        if (isSubmitting) return;
        setServerError("");
        onClose();
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setServerError("");

        try {
            const res = await streamsApi.createStream({
                title: data.title.trim(),
                description: data.description ? data.description.trim() : "",
                category: data.category || "conversations"
            });

            if (res.success) {
                const streamData = res.data?.stream || res.data;
                const streamId = streamData?.id || streamData?._id;

                reset();
                onClose();

                if (onStreamCreated) {
                    onStreamCreated(res.data);
                }

                if (streamId) {
                    router.push(`/streams/${streamId}`);
                }
            } else {
                setServerError(res.error?.message || "Failed to create stream broadcast. Please check inputs and try again.");
            }
        } catch (err) {
            setServerError(err?.message || "An unexpected error occurred while starting stream.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="border-b border-border/50 bg-card/40 px-4 py-5 sm:px-6">
            <div className="mx-auto max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Radio size={16} aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-foreground sm:text-base">Start a New Stream</h2>
                            <p className="text-[11px] text-muted-foreground sm:text-xs">
                                Set up your broadcast and preview camera/microphone in the studio before going live.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        aria-label="Close stream composer"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                    {serverError && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label htmlFor="inline-stream-title" className="block text-xs font-semibold text-foreground mb-1.5">
                            Stream Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="inline-stream-title"
                            type="text"
                            placeholder="What are you streaming about today?"
                            disabled={isSubmitting}
                            {...register("title")}
                            className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 transition-colors"
                        />
                        {errors.title && (
                            <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">
                            Category
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {CANONICAL_CATEGORIES.map((cat) => {
                                const Icon = CATEGORY_ICONS[cat.icon];
                                const isSelected = currentCategory === cat.id;
                                return (
                                    <button
                                        type="button"
                                        key={cat.id}
                                        onClick={() => setValue("category", cat.id)}
                                        disabled={isSubmitting}
                                        className={cn(
                                            "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                                            isSelected
                                                ? "border-cyan-500/60 bg-cyan-500/15 font-semibold text-cyan-600 dark:text-cyan-400"
                                                : "border-border/50 bg-secondary/40 text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                        )}
                                        aria-pressed={isSelected}
                                    >
                                        {Icon && <Icon size={12} aria-hidden="true" className="shrink-0" />}
                                        <span>{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {errors.category && (
                            <p className="mt-1 text-xs text-red-400">{errors.category.message}</p>
                        )}
                    </div>

                    {/* Description (Optional) */}
                    <div>
                        <label htmlFor="inline-stream-desc" className="block text-xs font-semibold text-foreground mb-1.5">
                            Description <span className="text-muted-foreground font-normal">(Optional)</span>
                        </label>
                        <textarea
                            id="inline-stream-desc"
                            rows={2}
                            placeholder="Add details, topics, or what viewers can expect..."
                            disabled={isSubmitting}
                            {...register("description")}
                            className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 resize-none transition-colors"
                        />
                        {errors.description && (
                            <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/30">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={handleCancel}
                            className="whitespace-nowrap"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting}
                            id="submit-create-stream-btn"
                            className="gap-2 whitespace-nowrap bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-sm shadow-cyan-500/15"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                                    <span>Preparing your stream...</span>
                                </>
                            ) : (
                                <>
                                    <Radio size={14} aria-hidden="true" />
                                    <span>Enter Studio</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
