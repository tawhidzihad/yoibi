"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Image as ImageIcon, Send, X, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
    TWEET_IMAGE_MAX_COUNT,
    TWEET_IMAGE_MAX_BYTES,
    TWEET_IMAGE_ACCEPT,
    TWEET_IMAGE_ALLOWED_TYPES,
    tweetsApi,
} from "../api/tweetsApi";
import { emitProfileChanged } from "@/lib/profileSync";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/utils/cn";

const createTweetSchema = z.object({
    content: z
        .string()
        .min(1, "Tweet content cannot be empty")
        .max(280, "Tweet cannot exceed 280 characters"),
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

/**
 * Preview grid for selected images inside the composer (no modal).
 * Layout adapts to the number of selected images so every count looks balanced:
 * 1 → large single preview · 2 → balanced pair · 3 → balanced trio
 * 4 → 2×2 grid · 5 → balanced 5-image layout. Each tile has a remove control.
 */
function TweetMediaPreviewGrid({ items, onRemove, disabled }) {
    const count = items.length;

    const gridClass =
        count === 1
            ? "grid-cols-1"
            : count === 2
                ? "grid-cols-2"
                : count === 3
                    ? "grid-cols-3"
                    : count === 4
                        ? "grid-cols-2"
                        : "grid-cols-6";

    const tileAspect =
        count === 1 ? "aspect-[16/9]" : count === 5 ? "aspect-square" : "aspect-[4/3]";

    // 5-image layout: 2 large on top + 3 balanced below.
    const tileSpan = (index) =>
        count === 5 ? (index < 2 ? "col-span-3" : "col-span-2") : "";

    return (
        <div
            className={cn("mt-2 grid gap-1.5 overflow-hidden rounded-xl", gridClass)}
            aria-label={`${count} of ${TWEET_IMAGE_MAX_COUNT} images selected`}
        >
            {items.map((item, index) => (
                <div
                    key={item.id}
                    className={cn("group relative min-w-0 overflow-hidden rounded-lg border border-border/70 bg-secondary/20", tileAspect, tileSpan(index))}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={item.previewUrl}
                        alt={`Selected image ${index + 1} of ${count}`}
                        className="h-full w-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        disabled={disabled}
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Remove image ${index + 1}`}
                    >
                        <X size={14} aria-hidden="true" />
                    </button>
                </div>
            ))}
        </div>
    );
}

export function CreateTweetCard({ onTweetCreated, placeholder = "What's happening?" }) {
    const router = useRouter();
    const { user, status } = useAuth();
    const fileInputRef = useRef(null);
    // Selected media: [{ id, file, previewUrl }]
    const [selectedMedia, setSelectedMedia] = useState([]);
    const [mediaError, setMediaError] = useState("");
    const [serverError, setServerError] = useState("");
    // "preparing" | "uploading" | "posting" | null
    const [postPhase, setPostPhase] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0, percent: 0 });
    const cancelRef = useRef(false);
    // Mutable selection snapshot for the async submit flow: kept in sync from
    // the state setter paths (never assigned during render).
    const selectionRef = useRef([]);

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(createTweetSchema),
        defaultValues: {
            content: "",
        },
    });

    const contentValue = useWatch({ control, name: "content", defaultValue: "" }) || "";
    const remainingChars = 280 - contentValue.length;
    const isOverLimit = remainingChars < 0;
    const isNearLimit = remainingChars <= 20 && remainingChars >= 0;
    const isPosting = postPhase !== null || isSubmitting;
    const remainingSlots = TWEET_IMAGE_MAX_COUNT - selectedMedia.length;

    // Revoke local preview URLs on replacement / removal / unmount so the
    // composer never leaks object URLs.
    const revokeAllPreviews = (items) => {
        for (const item of items) {
            if (item?.previewUrl) {
                URL.revokeObjectURL(item.previewUrl);
            }
        }
    };

    useEffect(
        () => () => {
            revokeAllPreviews(selectionRef.current);
        },
        []
    );

    /**
     * Validates one candidate file against the product image contract and
     * rejects duplicates (same name + size + lastModified already selected).
     * Returns a user-facing error string, or null when the file is accepted.
     */
    const validateImageFile = (file, currentCount) => {
        if (!file) return "No file selected.";
        if (currentCount >= TWEET_IMAGE_MAX_COUNT) {
            return `You can attach up to ${TWEET_IMAGE_MAX_COUNT} images per tweet.`;
        }
        const mime = file.type || "";
        if (!TWEET_IMAGE_ALLOWED_TYPES.includes(mime)) {
            return "Only JPG, PNG, WEBP, AVIF or GIF images are supported.";
        }
        if (file.size > TWEET_IMAGE_MAX_BYTES) {
            return "Each image must be 10 MB or smaller.";
        }
        return null;
    };

    const handleFilesSelected = (event) => {
        const files = Array.from(event.target?.files || []);
        // Reset the input so the same file can be re-picked after removal.
        event.target.value = "";
        if (files.length === 0 || isPosting) return;
        setMediaError("");

        const accepted = [];
        const seen = new Set(
            selectedMedia.map((m) => `${m.file.name}|${m.file.size}|${m.file.lastModified}`)
        );
        let rejected = null;

        for (const file of files) {
            const key = `${file.name}|${file.size}|${file.lastModified}`;
            if (seen.has(key)) {
                // Duplicate selection — skip silently (idempotent add).
                continue;
            }
            const error = validateImageFile(file, selectedMedia.length + accepted.length);
            if (error) {
                rejected = error;
                break;
            }
            seen.add(key);
            accepted.push({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                file,
                previewUrl: URL.createObjectURL(file),
            });
            if (selectedMedia.length + accepted.length >= TWEET_IMAGE_MAX_COUNT) break;
        }

        if (accepted.length > 0) {
            setSelectedMedia((prev) => {
                const next = [...prev, ...accepted];
                selectionRef.current = next;
                return next;
            });
        }
        if (rejected) {
            setMediaError(rejected);
        } else if (files.length > accepted.length && selectedMedia.length + accepted.length >= TWEET_IMAGE_MAX_COUNT) {
            setMediaError(`You can attach up to ${TWEET_IMAGE_MAX_COUNT} images per tweet.`);
        }
    };

    const handleRemoveMedia = (id) => {
        if (isPosting) return;
        setSelectedMedia((prev) => {
            const next = prev.filter((m) => m.id !== id);
            const removed = prev.filter((m) => m.id === id);
            revokeAllPreviews(removed);
            selectionRef.current = next;
            return next;
        });
        setMediaError("");
    };

    const clearComposer = () => {
        revokeAllPreviews(selectionRef.current);
        selectionRef.current = [];
        setSelectedMedia([]);
        setMediaError("");
        setServerError("");
        setPostPhase(null);
        setUploadProgress({ done: 0, total: 0, percent: 0 });
        reset();
    };

    const onSubmit = async (data, queuedItems = []) => {
        setServerError("");
        setMediaError("");

        if (status !== "authenticated" || !user) {
            router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
            return;
        }

        // Snapshot the selection at submit time (passed in by the submit
        // handler — never a render-time ref read).
        const items = Array.isArray(queuedItems) ? queuedItems : [];
        cancelRef.current = false;

        try {
            // Upload every selected image first (signature → direct upload),
            // then register the tweet. The tweet is never submitted with
            // invalid or unresolved media.
            const media = [];
            if (items.length > 0) {
                setPostPhase("preparing");
                setUploadProgress({ done: 0, total: items.length, percent: 0 });

                for (let i = 0; i < items.length; i += 1) {
                    if (cancelRef.current) return;
                    setPostPhase("uploading");
                    const item = items[i];

                    const sigRes = await tweetsApi.getTweetImageSignature();
                    if (!sigRes.success || !sigRes.data) {
                        throw new Error(
                            sigRes.error?.message ||
                                `Could not prepare image ${i + 1} of ${items.length} for upload.`
                        );
                    }

                    const uploaded = await tweetsApi.uploadTweetImage(
                        item.file,
                        sigRes.data,
                        (percent) => {
                            setUploadProgress({
                                done: i,
                                total: items.length,
                                percent,
                            });
                        }
                    );

                    if (cancelRef.current) return;

                    if (!uploaded?.secure_url || !uploaded?.public_id) {
                        throw new Error(`Image ${i + 1} of ${items.length} failed to upload. Please try again.`);
                    }

                    media.push({
                        // No URL input anywhere: images come only from the
                        // device file picker; this handle is the server's
                        // authorization for the exact uploaded asset.
                        uploadIntentId: sigRes.data.uploadIntentId,
                        publicId: uploaded.public_id,
                        url: uploaded.secure_url,
                        ...(Number.isInteger(uploaded.width) ? { width: uploaded.width } : {}),
                        ...(Number.isInteger(uploaded.height) ? { height: uploaded.height } : {}),
                        ...(Number.isInteger(uploaded.bytes) ? { bytes: uploaded.bytes } : {}),
                        ...(typeof uploaded.format === "string" ? { format: uploaded.format } : {}),
                    });

                    setUploadProgress({ done: i + 1, total: items.length, percent: 100 });
                }
            }

            setPostPhase("posting");
            const res = await tweetsApi.createTweet({
                content: data.content.trim(),
                media,
            });

            if (!res.success) {
                setServerError(res.error?.message || "Failed to publish tweet.");
                setPostPhase(null);
                return;
            }

            clearComposer();
            // Keep the sidebar/right-side user card tweet count in sync.
            emitProfileChanged();
            if (onTweetCreated && res.data) {
                onTweetCreated(res.data);
            }
        } catch (err) {
            setServerError(err.message || "An unexpected error occurred.");
            setPostPhase(null);
        }
    };

    return (
        <div className="border-b border-border/60 bg-card p-4">
            <form
                onSubmit={(e) => {
                    // Snapshot the selection inside the event handler so no
                    // ref value is ever read during render.
                    e.persist?.();
                    return handleSubmit((data) =>
                        onSubmit(data, selectionRef.current.slice(0, TWEET_IMAGE_MAX_COUNT))
                    )(e);
                }}
            >
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

                        {selectedMedia.length > 0 && (
                            <TweetMediaPreviewGrid
                                items={selectedMedia}
                                onRemove={handleRemoveMedia}
                                disabled={isPosting}
                            />
                        )}

                        {mediaError && (
                            <p className="mt-1 text-xs text-destructive" role="alert">{mediaError}</p>
                        )}

                        {serverError && (
                            <div className="mt-2 flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                                <AlertCircle size={14} aria-hidden="true" />
                                <span>{serverError}</span>
                            </div>
                        )}

                        {isPosting && (
                            <div className="mt-2 space-y-1.5" aria-live="polite">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Loader2 size={13} className="animate-spin text-cyan-500" aria-hidden="true" />
                                        {postPhase === "posting"
                                            ? "Posting..."
                                            : postPhase === "preparing"
                                                ? "Preparing images..."
                                                : `Uploading images... (${Math.min(uploadProgress.done + 1, uploadProgress.total)} of ${uploadProgress.total})`}
                                    </span>
                                    {postPhase === "uploading" && (
                                        <span className="font-mono font-semibold text-cyan-500">
                                            {uploadProgress.total > 1
                                                ? `${Math.round((uploadProgress.done * 100 + uploadProgress.percent) / uploadProgress.total)}%`
                                                : `${uploadProgress.percent}%`}
                                        </span>
                                    )}
                                </div>
                                {postPhase === "uploading" && (
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                        <div
                                            className="h-full bg-cyan-500 transition-all duration-150"
                                            style={{
                                                width: `${uploadProgress.total > 1
                                                    ? Math.round((uploadProgress.done * 100 + uploadProgress.percent) / uploadProgress.total)
                                                    : uploadProgress.percent}%`,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isPosting || remainingSlots <= 0}
                                    className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cyan-600 transition-colors hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-cyan-400"
                                    aria-label={
                                        selectedMedia.length === 0
                                            ? "Add media"
                                            : remainingSlots > 0
                                                ? `Add more media (${remainingSlots} remaining)`
                                                : `Maximum of ${TWEET_IMAGE_MAX_COUNT} images reached`
                                    }
                                >
                                    <ImageIcon size={16} aria-hidden="true" />
                                    <span>
                                        {selectedMedia.length === 0
                                            ? "Add media"
                                            : remainingSlots > 0
                                                ? `Add media (${selectedMedia.length}/${TWEET_IMAGE_MAX_COUNT})`
                                                : `Max ${TWEET_IMAGE_MAX_COUNT} images`}
                                    </span>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={TWEET_IMAGE_ACCEPT}
                                    multiple
                                    className="hidden"
                                    tabIndex={-1}
                                    aria-hidden="true"
                                    onChange={handleFilesSelected}
                                />
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
                                loading={isPosting}
                                disabled={isPosting || !contentValue.trim() || isOverLimit}
                                id="create-tweet-submit-btn"
                                className="gap-1.5"
                            >
                                <Send size={14} aria-hidden="true" />
                                <span>{postPhase === "posting" ? "Posting..." : postPhase ? "Uploading..." : "Tweet"}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
