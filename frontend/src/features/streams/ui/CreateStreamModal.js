"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Radio, Loader2, AlertCircle, Info, Sparkles } from "lucide-react";
import { streamsApi } from "../api/streamsApi";
import { CANONICAL_CATEGORIES } from "../constants/categories";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";

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
        .default("conversations"),
    thumbnailUrl: z
        .string()
        .url("Must be a valid URL")
        .or(z.literal(""))
        .optional()
        .nullable()
        .transform((val) => (val === "" ? null : val))
});

export function CreateStreamModal({ isOpen, onClose, onStreamCreated }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(createStreamSchema),
        defaultValues: {
            title: "",
            description: "",
            category: "conversations",
            thumbnailUrl: ""
        }
    });

    const handleClose = () => {
        if (isSubmitting) return;
        reset();
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
                category: data.category || "conversations",
                thumbnailUrl: data.thumbnailUrl || null
            });

            if (res.success && res.data?.stream) {
                const streamId = res.data.stream.id || res.data.stream._id;
                reset();
                onClose();
                if (onStreamCreated) {
                    onStreamCreated(res.data);
                } else {
                    router.push(`/streams/${streamId}`);
                }
            } else {
                setServerError(res.error?.message || "Failed to create stream broadcast.");
            }
        } catch (err) {
            setServerError(err.message || "An unexpected error occurred while creating stream.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Start Live Broadcast"
            description="Create a live stream session with realtime audio, video, and screen sharing."
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {serverError && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{serverError}</span>
                    </div>
                )}

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 flex items-start gap-2.5 text-xs text-muted-foreground">
                    <Info size={16} className="text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                        <span className="font-semibold text-foreground">Preparation Phase:</span> Creating a stream reserves an opaque room in <code className="text-cyan-400 font-mono text-[11px]">ready</code> status so you can preview your camera, microphone, and devices before going live to viewers.
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label htmlFor="stream-title" className="block text-xs font-semibold text-foreground mb-1.5">
                        Broadcast Title <span className="text-red-400">*</span>
                    </label>
                    <input
                        id="stream-title"
                        type="text"
                        placeholder="e.g. Live Coding YOIBI Architecture & Deep Dive"
                        disabled={isSubmitting}
                        {...register("title")}
                        className="w-full rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
                    />
                    {errors.title && (
                        <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="stream-desc" className="block text-xs font-semibold text-foreground mb-1.5">
                        Description <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <textarea
                        id="stream-desc"
                        rows={3}
                        placeholder="What will you be discussing or presenting during this stream?"
                        disabled={isSubmitting}
                        {...register("description")}
                        className="w-full rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 resize-none"
                    />
                    {errors.description && (
                        <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>
                    )}
                </div>

                {/* Category */}
                <div>
                    <label htmlFor="stream-category" className="block text-xs font-semibold text-foreground mb-1.5">
                        Category
                    </label>
                    <select
                        id="stream-category"
                        disabled={isSubmitting}
                        {...register("category")}
                        className="w-full rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 capitalize"
                    >
                        {CANONICAL_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id} className="bg-card text-foreground">
                                {cat.label}
                            </option>
                        ))}
                    </select>
                    {errors.category && (
                        <p className="mt-1 text-xs text-red-400">{errors.category.message}</p>
                    )}
                </div>

                {/* Optional Thumbnail URL */}
                <div>
                    <label htmlFor="stream-thumb" className="block text-xs font-semibold text-foreground mb-1.5">
                        Thumbnail URL <span className="text-muted-foreground font-normal">(Optional preview banner)</span>
                    </label>
                    <input
                        id="stream-thumb"
                        type="url"
                        placeholder="https://example.com/banner.jpg"
                        disabled={isSubmitting}
                        {...register("thumbnailUrl")}
                        className="w-full rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
                    />
                    {errors.thumbnailUrl && (
                        <p className="mt-1 text-xs text-red-400">{errors.thumbnailUrl.message}</p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmitting}
                        className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                                Reserving Room...
                            </>
                        ) : (
                            <>
                                <Radio size={14} aria-hidden="true" />
                                Enter Broadcast Studio
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
