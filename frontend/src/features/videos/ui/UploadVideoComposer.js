"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UploadCloud, Film, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { videosApi } from "../api/videosApi";
import { CANONICAL_CATEGORIES } from "../constants/categories";
import { CATEGORY_ICONS } from "../constants/categoryIcons";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/utils/cn";

// Application limit: 100 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const uploadMetadataSchema = z.object({
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
        .nullable()
        .transform((val) => (val === "" ? null : val))
});

/**
 * Map backend/API failure reasons to user-friendly copy.
 * Internal infrastructure details (upload intents, signatures, storage providers)
 * are never surfaced to users; the raw reason is only written to the console.
 */
function toUserMessage(rawMessage) {
    const msg = String(rawMessage || "");
    if (/intent|signature|authorized|provenance/i.test(msg)) {
        return "We couldn't save your video. Your upload session may have expired — please try again.";
    }
    return msg || "We couldn't save your video. Please try again.";
}

export function UploadVideoComposer({ onClose, onVideoUploaded, isOpen }) {
    const router = useRouter();
    const { user, status } = useAuth();
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError, setFileError] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadPhase, setUploadPhase] = useState(null); // null | "uploading" | "processing"
    const [serverError, setServerError] = useState("");
    const [success, setSuccess] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        control,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(uploadMetadataSchema),
        defaultValues: {
            title: "",
            description: "",
            category: ""
        }
    });

    const selectedCategory = useWatch({ control, name: "category", defaultValue: "" }) || "";
    const isUploading = uploadPhase !== null;

    // Local preview URL lifecycle (revoked on replacement/unmount)
    const previewUrlRef = useRef(null);

    useEffect(() => () => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
    }, []);

    const swapPreviewFile = (file) => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
        if (file) {
            const url = URL.createObjectURL(file);
            previewUrlRef.current = url;
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleFileChange = (e) => {
        setFileError("");
        setServerError("");
        const file = e.target.files?.[0];
        if (!file) {
            setSelectedFile(null);
            return;
        }

        // File format validation
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            setFileError("Please select an MP4, WebM, or QuickTime (.mov) video.");
            setSelectedFile(null);
            return;
        }

        // 100 MB size validation
        if (file.size > MAX_VIDEO_BYTES) {
            setFileError("Video size exceeds the 100 MB application limit.");
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
        swapPreviewFile(file);
    };

    const clearSelectedFile = () => {
        setSelectedFile(null);
        setFileError("");
        swapPreviewFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const resetAll = () => {
        reset();
        clearSelectedFile();
        setServerError("");
        setUploadProgress(0);
        setUploadPhase(null);
        setSuccess(false);
    };

    const handleClose = () => {
        if (isUploading) return;
        resetAll();
        onClose?.();
    };

    const onSubmit = async (data) => {
        if (status !== "authenticated" || !user) {
            router.push(`/login?redirect=${encodeURIComponent("/videos")}`);
            return;
        }

        if (!selectedFile) {
            setFileError("Please choose a video file to upload.");
            return;
        }

        setServerError("");
        setSuccess(false);
        setUploadPhase("uploading");
        setUploadProgress(0);

        try {
            // Step 1: Request a server-issued upload authorization
            const sigRes = await videosApi.getUploadSignature();
            if (!sigRes.success) {
                setServerError(toUserMessage(sigRes.error?.message));
                setUploadPhase(null);
                return;
            }

            const signatureData = sigRes.data;

            // Step 2: Upload the video with live progress tracking
            const uploadResult = await videosApi.uploadToCloudinary(
                selectedFile,
                signatureData,
                (progress) => setUploadProgress(progress)
            );

            // Step 3: Register the video so it appears in the community feed
            setUploadPhase("processing");
            const payload = {
                uploadIntentId: signatureData.uploadIntentId,
                title: data.title,
                description: data.description,
                category: data.category || null,
                videoUrl: uploadResult.secure_url,
                thumbnailUrl:
                    uploadResult.thumbnail_url ||
                    uploadResult.secure_url.replace(/\.[^/.]+$/, ".jpg"),
                publicId: uploadResult.public_id,
                duration: Math.round(uploadResult.duration || 0),
                bytes: uploadResult.bytes || selectedFile.size,
                width: uploadResult.width || null,
                height: uploadResult.height || null,
                format: uploadResult.format || "mp4"
            };

            const createRes = await videosApi.createVideo(payload);
            if (!createRes.success) {
                // Debugging context stays in the console only (never secrets).
                console.warn("[Videos] Video registration failed:", createRes.error?.message);
                setServerError(toUserMessage(createRes.error?.message));
                setUploadPhase(null);
                return;
            }

            setSuccess(true);
            setUploadPhase(null);
            if (onVideoUploaded && createRes.data) {
                onVideoUploaded(createRes.data);
            }
            resetAll();
            // Collapse the form automatically after a successful upload
            onClose?.();
        } catch (err) {
            console.warn("[Videos] Upload failed:", err.message);
            setServerError(toUserMessage(err.message));
            setUploadPhase(null);
        }
    };

    // eslint-disable-next-line react-hooks/refs -- react-hook-form handleSubmit is not a ref access; the rule flags the transitive ref use inside onSubmit as a false positive
    const boundSubmit = handleSubmit(onSubmit);

    return (
        <section
            id="upload-video-composer"
            aria-label="Upload a video"
            className="mx-4 mt-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 sm:mx-6"
        >
            {success ? (
                <div className="flex items-center gap-2 rounded-xl bg-cyan-500/10 p-3 text-sm text-cyan-600 dark:text-cyan-400">
                    <CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />
                    <span className="font-medium">Your video has been published.</span>
                </div>
            ) : (
            <form onSubmit={boundSubmit} className="space-y-4">
                {/* File Picker / Selected Video Preview */}
                <div>
                    {!selectedFile ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    fileInputRef.current?.click();
                                }
                            }}
                            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-secondary/15 p-6 text-center cursor-pointer transition-colors hover:border-cyan-500/60 hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        >
                            <UploadCloud className="h-8 w-8 text-cyan-500 mb-2" aria-hidden="true" />
                            <p className="text-xs font-medium text-foreground">
                                Click to select a video file
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                MP4, WebM or MOV — up to 100 MB
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-secondary/15 p-3 sm:flex-row">
                            <video
                                src={previewUrl}
                                controls
                                className="aspect-video w-full rounded-lg bg-black/80 sm:w-48"
                            />
                            <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                                <div className="flex min-w-0 items-start gap-2">
                                    <Film className="mt-0.5 h-5 w-5 shrink-0 text-cyan-500" aria-hidden="true" />
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-medium text-foreground">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                                        </p>
                                    </div>
                                </div>
                                {!isUploading && (
                                    <button
                                        type="button"
                                        onClick={clearSelectedFile}
                                        className="cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                        aria-label="Remove selected file"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="hidden"
                        id="video-file-input"
                    />

                    {fileError && (
                        <p className="mt-1 text-xs text-destructive" role="alert">{fileError}</p>
                    )}
                </div>

                {/* Title */}
                <div>
                    <label htmlFor="video-title" className="block text-xs font-semibold text-foreground mb-1">
                        Title *
                    </label>
                    <input
                        {...register("title")}
                        id="video-title"
                        type="text"
                        placeholder="Give your video a descriptive title..."
                        disabled={isUploading}
                        className="w-full rounded-xl border border-border/80 bg-secondary/20 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-60"
                    />
                    {errors.title && (
                        <p className="mt-1 text-xs text-destructive" role="alert">{errors.title.message}</p>
                    )}
                </div>

                {/* Category (compact chips) */}
                <div>
                    <span className="mb-1 block text-xs font-semibold text-foreground">Category (Optional)</span>
                    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Video category">
                        {CANONICAL_CATEGORIES.map((cat) => {
                            const Icon = CATEGORY_ICONS[cat.icon];
                            const isActive = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={isActive}
                                    disabled={isUploading}
                                    onClick={() => setValue("category", isActive ? "" : cat.id, { shouldValidate: true })}
                                    className={cn(
                                        "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-60",
                                        isActive
                                            ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
                                            : "border-border/50 bg-secondary/40 text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                    )}
                                >
                                    {Icon && <Icon size={12} aria-hidden="true" />}
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                    {errors.category && (
                        <p className="mt-1 text-xs text-destructive" role="alert">{errors.category.message}</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="video-description" className="block text-xs font-semibold text-foreground mb-1">
                        Description (Optional)
                    </label>
                    <textarea
                        {...register("description")}
                        id="video-description"
                        rows={3}
                        placeholder="Add details, notes, or links..."
                        disabled={isUploading}
                        className="w-full resize-none rounded-xl border border-border/80 bg-secondary/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-60"
                    />
                    {errors.description && (
                        <p className="mt-1 text-xs text-destructive" role="alert">{errors.description.message}</p>
                    )}
                </div>

                {/* Upload Progress */}
                {isUploading && (
                    <div className="space-y-1.5 pt-1" aria-live="polite">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Loader2 size={13} className="animate-spin text-cyan-500" aria-hidden="true" />
                                {uploadPhase === "processing" ? "Processing video..." : "Uploading video..."}
                            </span>
                            <span className="font-mono font-semibold text-cyan-500">
                                {uploadProgress}%
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                                className="h-full bg-cyan-500 transition-all duration-150"
                                style={{ width: `${uploadPhase === "processing" ? 100 : uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Server Error Display */}
                {serverError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive" role="alert">
                        <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
                        <span>{serverError}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClose}
                        disabled={isUploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        loading={isUploading}
                        disabled={isUploading || !selectedFile}
                        id="submit-video-upload-btn"
                        className="gap-1.5"
                    >
                        {isUploading
                            ? uploadPhase === "processing"
                                ? "Processing..."
                                : "Uploading..."
                            : "Upload Video"}
                    </Button>
                </div>
            </form>
            )}
        </section>
    );
}





