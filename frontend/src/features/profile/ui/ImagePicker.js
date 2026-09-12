"use client";

import { useState, useRef } from "react";
import { ImagePlus, Loader2, Camera, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Avatar } from "@/shared/ui/Avatar";
import { profileApi } from "../api/profileApi";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB — profile images only

/**
 * Validates a selected image file before any upload starts.
 */
function validateImageFile(file) {
    if (!file) return "No file selected.";
    if (!file.type.startsWith("image/")) return "Only image files are allowed.";
    if (file.size > MAX_IMAGE_BYTES) return "Image must be 5 MB or smaller.";
    return null;
}

/**
 * One profile-image picker row (avatar / banner). Fully controlled: the
 * uploaded Cloudinary URL comes in via `currentUrl` and is lifted to the
 * parent form through `onChange`.
 * Upload uses the server-issued Cloudinary signature — the URL is persisted
 * via PATCH /users/me together with the rest of the profile fields.
 */
function ImagePicker({ kind, currentUrl, onChange, disabled }) {
    const inputRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");

    const url = currentUrl || "";

    const applyUrl = (nextUrl) => {
        setError("");
        onChange?.(nextUrl);
    };

    const handleSelect = async (event) => {
        const file = event.target?.files?.[0];
        event.target.value = "";
        const validationError = validateImageFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError("");
        setBusy(true);
        setProgress(0);
        try {
            const sigRes = await profileApi.getProfileMediaSignature(kind);
            if (!sigRes.success || !sigRes.data) {
                throw new Error(sigRes.error?.message || "Could not start the upload.");
            }
            const uploaded = await profileApi.uploadProfileImage(file, sigRes.data, setProgress);
            applyUrl(uploaded.secure_url);
        } catch (err) {
            setError(err?.message || "Upload failed. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            {kind === "avatar" ? (
                <div className="relative">
                    <Avatar src={url} name={kind} size={64} />
                    {busy && <UploadOverlay progress={progress} round />}
                </div>
            ) : (
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/40">
                    {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="Banner preview" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                            <ImagePlus size={20} aria-hidden="true" />
                        </div>
                    )}
                    {busy && <UploadOverlay progress={progress} />}
                </div>
            )}

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled || busy}
                        onClick={() => inputRef.current?.click()}
                        aria-label={`${url ? "Change" : "Add"} ${kind}`}
                    >
                        <Camera size={14} aria-hidden="true" />
                        {url ? `Change ${kind}` : `Add ${kind}`}
                    </Button>
                    {url && !busy && (
                        <button
                            type="button"
                            onClick={() => applyUrl("")}
                            disabled={disabled}
                            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                            aria-label={`Remove ${kind}`}
                        >
                            <Trash2 size={14} aria-hidden="true" />
                        </button>
                    )}
                </div>
                {error && (
                    <p role="alert" className="mt-1 text-xs text-destructive">
                        {error}
                    </p>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSelect}
                tabIndex={-1}
                aria-hidden="true"
            />
        </div>
    );
}

function UploadOverlay({ progress, round = false }) {
    return (
        <div
            className={`absolute inset-0 flex items-center justify-center bg-background/70 ${round ? "rounded-full" : "rounded-lg"}`}
        >
            <span className="flex items-center gap-1 text-[10px] font-semibold text-foreground">
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                {progress}%
            </span>
        </div>
    );
}

export { ImagePicker };
