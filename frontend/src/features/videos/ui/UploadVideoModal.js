"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UploadCloud, Film, X, AlertCircle } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { videosApi } from "../api/videosApi";
import { CANONICAL_CATEGORIES } from "../constants/categories";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";

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

export function UploadVideoModal({ isOpen, onClose, onVideoUploaded }) {
    const router = useRouter();
    const { user, status } = useAuth();
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError, setFileError] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(uploadMetadataSchema),
        defaultValues: {
            title: "",
            description: "",
            category: ""
        }
    });

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
    };

    const clearSelectedFile = () => {
        setSelectedFile(null);
        setFileError("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
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
        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Step 1: Request signed upload intent from backend
            const sigRes = await videosApi.getUploadSignature();
            if (!sigRes.success) {
                setServerError(sigRes.error?.message || "Failed to authorize video upload.");
                setIsUploading(false);
                return;
            }

            const signatureData = sigRes.data;

            // Step 2: Upload directly to Cloudinary with progress tracking
            const cloudinaryResult = await videosApi.uploadToCloudinary(
                selectedFile,
                signatureData,
                (progress) => setUploadProgress(progress)
            );

            // Step 3: Register video metadata in backend
            const payload = {
                uploadIntentId: signatureData.uploadIntentId,
                title: data.title,
                description: data.description,
                category: data.category || null,
                videoUrl: cloudinaryResult.secure_url,
                thumbnailUrl:
                    cloudinaryResult.thumbnail_url ||
                    cloudinaryResult.secure_url.replace(/\.[^/.]+$/, ".jpg"),
                publicId: cloudinaryResult.public_id,
                duration: Math.round(cloudinaryResult.duration || 0),
                bytes: cloudinaryResult.bytes || selectedFile.size,
                width: cloudinaryResult.width || null,
                height: cloudinaryResult.height || null,
                format: cloudinaryResult.format || "mp4"
            };

            const createRes = await videosApi.createVideo(payload);
            if (!createRes.success) {
                setServerError(createRes.error?.message || "Failed to save video metadata.");
                setIsUploading(false);
                return;
            }

            // Success! Reset and close
            reset();
            clearSelectedFile();
            setIsUploading(false);
            if (onVideoUploaded && createRes.data) {
                onVideoUploaded(createRes.data);
            }
            onClose();
        } catch (err) {
            setServerError(err.message || "An unexpected error occurred during upload.");
            setIsUploading(false);
        }
    };

    // eslint-disable-next-line react-hooks/refs -- react-hook-form handleSubmit is not a ref access; this is a false positive
    const boundSubmit = handleSubmit(onSubmit);

    return (
        <Modal isOpen={isOpen} onClose={isUploading ? () => {} : onClose} title="Upload Video">
            <form onSubmit={boundSubmit} className="space-y-4">
                {/* File Picker */}
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                        Video File (Max 100 MB)
                    </label>

                    {!selectedFile ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-secondary/15 p-6 text-center cursor-pointer transition-colors hover:border-cyan-500/60 hover:bg-secondary/30"
                        >
                            <UploadCloud className="h-8 w-8 text-cyan-500 mb-2" aria-hidden="true" />
                            <p className="text-xs font-medium text-foreground">
                                Click to select a video file
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                MP4, WebM, or MOV up to 100 MB
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/30 p-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <Film className="h-5 w-5 text-cyan-500 shrink-0" aria-hidden="true" />
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
                                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                                    aria-label="Remove selected file"
                                >
                                    <X size={16} />
                                </button>
                            )}
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
                        <p className="mt-1 text-xs text-destructive">{fileError}</p>
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
                        className="w-full rounded-xl border border-border/80 bg-secondary/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none"
                    />
                    {errors.title && (
                        <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
                    )}
                </div>

                {/* Category (Option A: 8 canonical categories or uncategorized) */}
                <div>
                    <label htmlFor="video-category" className="block text-xs font-semibold text-foreground mb-1">
                        Category (Optional)
                    </label>
                    <select
                        {...register("category")}
                        id="video-category"
                        disabled={isUploading}
                        className="w-full rounded-xl border border-border/80 bg-secondary/20 px-3 py-2 text-xs text-foreground focus:border-cyan-500 focus:outline-none"
                    >
                        <option value="">Uncategorized</option>
                        {CANONICAL_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                    {errors.category && (
                        <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>
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
                        className="w-full resize-none rounded-xl border border-border/80 bg-secondary/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none"
                    />
                    {errors.description && (
                        <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
                    )}
                </div>

                {/* Upload Progress Bar */}
                {isUploading && (
                    <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Uploading video to Cloudinary...</span>
                            <span className="font-mono font-semibold text-cyan-500">
                                {uploadProgress}%
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                                className="h-full bg-cyan-500 transition-all duration-150"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Server Error Display */}
                {serverError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                        <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
                        <span>{serverError}</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onClose}
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
                    >
                        {isUploading ? "Uploading..." : "Upload Video"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
