"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Image as ImageIcon, Send, X, AlertCircle } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { tweetsApi } from "../api/tweetsApi";
import { emitProfileChanged } from "@/lib/profileSync";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/utils/cn";

const createTweetSchema = z.object({
    content: z
        .string()
        .min(1, "Tweet content cannot be empty")
        .max(280, "Tweet cannot exceed 280 characters"),
    mediaUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

function UserAvatar({ name, avatarUrl }) {
    if (avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={avatarUrl}
                alt={name || "User avatar"}
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-cyan-500/20"
            />
        );
    }
    const initials = (name || "U")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
            {initials}
        </div>
    );
}

export function CreateTweetCard({ onTweetCreated, placeholder = "What's happening?" }) {
    const router = useRouter();
    const { user, status } = useAuth();
    const [showMediaInput, setShowMediaInput] = useState(false);
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        control,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(createTweetSchema),
        defaultValues: {
            content: "",
            mediaUrl: "",
        },
    });

    const contentValue = useWatch({ control, name: "content", defaultValue: "" }) || "";
    const mediaUrlValue = useWatch({ control, name: "mediaUrl", defaultValue: "" }) || "";
    const remainingChars = 280 - contentValue.length;
    const isOverLimit = remainingChars < 0;
    const isNearLimit = remainingChars <= 20 && remainingChars >= 0;

    const onSubmit = async (data) => {
        setServerError("");

        if (status !== "authenticated" || !user) {
            router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
            return;
        }

        const mediaUrls = [];
        if (data.mediaUrl && data.mediaUrl.trim().length > 0) {
            mediaUrls.push(data.mediaUrl.trim());
        }

        try {
            const res = await tweetsApi.createTweet({
                content: data.content.trim(),
                mediaUrls,
            });

            if (!res.success) {
                setServerError(res.error?.message || "Failed to publish tweet.");
                return;
            }

            reset();
            setShowMediaInput(false);
            // Keep the sidebar/right-side user card tweet count in sync.
            emitProfileChanged();
            if (onTweetCreated && res.data) {
                onTweetCreated(res.data);
            }
        } catch (err) {
            setServerError(err.message || "An unexpected error occurred.");
        }
    };

    return (
        <div className="border-b border-border/60 bg-card p-4">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex gap-3">
                    <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} />
                    <div className="flex-1">
                        <textarea
                            {...register("content")}
                            id="create-tweet-content"
                            rows={3}
                            placeholder={
                                status === "authenticated"
                                    ? placeholder
                                    : "Log in to share a tweet with the community..."
                            }
                            className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />

                        {errors.content && (
                            <p className="mt-1 text-xs text-destructive">{errors.content.message}</p>
                        )}

                        {showMediaInput && (
                            <div className="mt-2 flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/30 p-2">
                                <ImageIcon size={16} className="text-cyan-500 shrink-0" aria-hidden="true" />
                                <input
                                    {...register("mediaUrl")}
                                    type="url"
                                    id="create-tweet-media-url"
                                    placeholder="Enter image or media URL (e.g. https://...)"
                                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                                />
                                {mediaUrlValue && (
                                    <button
                                        type="button"
                                        onClick={() => setValue("mediaUrl", "")}
                                        className="cursor-pointer text-muted-foreground hover:text-foreground"
                                        aria-label="Clear media URL"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        )}

                        {errors.mediaUrl && (
                            <p className="mt-1 text-xs text-destructive">{errors.mediaUrl.message}</p>
                        )}

                        {serverError && (
                            <div className="mt-2 flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                                <AlertCircle size={14} aria-hidden="true" />
                                <span>{serverError}</span>
                            </div>
                        )}

                        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowMediaInput((v) => !v)}
                                    className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cyan-600 transition-colors hover:bg-cyan-500/10 dark:text-cyan-400"
                                    aria-label="Toggle media attachment"
                                >
                                    <ImageIcon size={16} aria-hidden="true" />
                                    <span>{showMediaInput ? "Hide media" : "Add media"}</span>
                                </button>
                                <span
                                    className={cn(
                                        "text-xs transition-colors font-mono",
                                        isOverLimit
                                            ? "font-bold text-destructive"
                                            : isNearLimit
                                                ? "text-amber-500 font-semibold"
                                                : "text-muted-foreground"
                                    )}
                                    aria-live="polite"
                                    id="create-tweet-countdown"
                                >
                                    {remainingChars}
                                </span>
                            </div>

                            <Button
                                type="submit"
                                size="sm"
                                loading={isSubmitting}
                                disabled={isSubmitting || !contentValue.trim() || isOverLimit}
                                id="create-tweet-submit-btn"
                                className="gap-1.5"
                            >
                                <Send size={14} aria-hidden="true" />
                                <span>Tweet</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
