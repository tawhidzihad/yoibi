"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AutoGrowTextarea } from "@/shared/ui/AutoGrowTextarea";
import { Paperclip, SendHorizontal, X, AlertCircle, Loader2, RotateCw } from "lucide-react";
import Image from "next/image";
import { messagesApi } from "../api/messagesApi";
import { getSocket } from "../socket/socketClient";
import { cn } from "@/shared/utils/cn";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

function countGraphemes(text) {
    if (!text) return 0;
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
        return Array.from(segmenter.segment(text)).length;
    }
    return Array.from(text).length;
}

export function MessageComposer({
    conversationId,
    onSendMessage,
    disabled = false,
    placeholder = "Type a message..."
}) {
    const [text, setText] = useState("");
    const [stagedMedia, setStagedMedia] = useState(null); // { file, previewUrl, resourceType, uploadPromise, uploadedData, error }
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");

    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const xhrRef = useRef(null);

    const graphemeCount = countGraphemes(text);
    const isOverLimit = graphemeCount > MAX_MESSAGE_LENGTH;
    const canSend = (text.trim().length > 0 || stagedMedia?.uploadedData) && !isOverLimit && !isUploading && !disabled;

    // Typing emission helpers
    const emitTyping = useCallback((typing) => {
        if (!conversationId) return;
        try {
            const socket = getSocket();
            if (socket.connected) {
                socket.emit(typing ? "typing:start" : "typing:stop", { conversationId });
            }
        } catch {}
    }, [conversationId]);

    const handleTextChange = (e) => {
        const newText = e.target.value;
        setText(newText);
        setErrorMessage("");

        // Emit typing:start (throttled)
        if (!isTypingRef.current && newText.trim().length > 0) {
            isTypingRef.current = true;
            emitTyping(true);
        }

        // Reset inactivity timer
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            emitTyping(false);
        }, 3000);
    };

    // Cleanup typing on unmount or conversation change
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTypingRef.current) {
                isTypingRef.current = false;
                emitTyping(false);
            }
        };
    }, [conversationId, emitTyping]);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input value so same file can be re-selected if cancelled
        e.target.value = "";
        setErrorMessage("");

        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
            setErrorMessage("Only image and video files are supported.");
            return;
        }

        const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
        if (file.size > maxBytes) {
            setErrorMessage(`File exceeds max size (${isVideo ? "50MB" : "10MB"}).`);
            return;
        }

        const resourceType = isVideo ? "video" : "image";
        const previewUrl = URL.createObjectURL(file);

        setStagedMedia({
            file,
            previewUrl,
            resourceType,
            uploadedData: null,
            error: null
        });

        uploadFile(file, resourceType);
    };

    const uploadFile = async (file, resourceType) => {
        setIsUploading(true);
        setUploadProgress(0);
        setErrorMessage("");

        try {
            // 1. Get signed intent
            const intentRes = await messagesApi.getUploadIntent(conversationId, resourceType);
            if (!intentRes.success || !intentRes.data) {
                const isExpired = intentRes.status === 410 || intentRes.error === "INTENT_EXPIRED" || (intentRes.message && intentRes.message.toLowerCase().includes("expired"));
                throw new Error(isExpired ? "Upload expired, please try again." : (intentRes.message || "Failed to get upload authorization"));
            }

            const intent = intentRes.data;
            const uploadUrl = intent.uploadUrl || `https://api.cloudinary.com/v1_1/${intent.cloudName}/${resourceType}/upload`;

            // 2. Direct upload to Cloudinary via XHR with progress tracking
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", intent.apiKey);
            formData.append("timestamp", String(intent.timestamp));
            formData.append("signature", intent.signature);
            formData.append("public_id", intent.publicId);

            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhrRef.current = xhr;

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
                        setUploadProgress(percent);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const uploadResult = JSON.parse(xhr.responseText);
                            setStagedMedia((prev) => prev ? {
                                ...prev,
                                error: null,
                                uploadedData: {
                                    url: uploadResult.secure_url || uploadResult.url,
                                    publicId: uploadResult.public_id,
                                    resourceType,
                                    bytes: uploadResult.bytes || file.size,
                                    width: uploadResult.width,
                                    height: uploadResult.height,
                                    duration: uploadResult.duration,
                                    uploadIntentId: intent.uploadIntentId
                                }
                            } : null);
                            resolve();
                        } catch {
                            reject(new Error("Failed to parse upload response."));
                        }
                    } else {
                        let parsedErr = {};
                        try {
                            parsedErr = JSON.parse(xhr.responseText);
                        } catch {}
                        const isExpired = xhr.status === 410 || (parsedErr.error?.message && parsedErr.error.message.toLowerCase().includes("expired"));
                        if (isExpired) {
                            reject(new Error("Upload expired, please try again."));
                        } else if (xhr.status === 404) {
                            reject(new Error("Upload service endpoint not found (status 404)."));
                        } else if (xhr.status === 413) {
                            reject(new Error(`File exceeds maximum upload size (${resourceType === "video" ? "50MB" : "10MB"}).`));
                        } else if (parsedErr.error?.message) {
                            reject(new Error(parsedErr.error.message));
                        } else {
                            reject(new Error(`Upload failed with status ${xhr.status}.`));
                        }
                    }
                };

                xhr.onerror = () => {
                    reject(new Error("Network connection error during upload. Please check your internet."));
                };

                xhr.onabort = () => {
                    const abortErr = new Error("Upload aborted");
                    abortErr.name = "AbortError";
                    reject(abortErr);
                };

                xhr.open("POST", uploadUrl);
                xhr.send(formData);
            });
        } catch (err) {
            if (err.name !== "AbortError") {
                const msg = err.message || "Upload failed. Please try again.";
                setErrorMessage(msg);
                setStagedMedia((prev) => prev ? { ...prev, error: msg } : null);
            }
        } finally {
            setIsUploading(false);
            xhrRef.current = null;
        }
    };

    const handleCancelMedia = () => {
        if (xhrRef.current) {
            xhrRef.current.abort();
            xhrRef.current = null;
        }
        if (stagedMedia?.previewUrl) {
            URL.revokeObjectURL(stagedMedia.previewUrl);
        }
        setStagedMedia(null);
        setIsUploading(false);
        setUploadProgress(0);
        setErrorMessage("");
    };

    const handleSend = () => {
        if (!canSend) return;

        // Clear typing
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        if (isTypingRef.current) {
            isTypingRef.current = false;
            emitTyping(false);
        }

        const payload = {
            text: text.trim(),
            media: stagedMedia?.uploadedData ? {
                ...stagedMedia.uploadedData,
                uploadIntentId: stagedMedia.uploadedData.uploadIntentId
            } : null,
            uploadIntentId: stagedMedia?.uploadedData?.uploadIntentId || null
        };

        onSendMessage(payload);

        // Reset
        setText("");
        setStagedMedia(null);
        setUploadProgress(0);
        setErrorMessage("");

        // Focus back
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-border/50 bg-background/95 p-3 backdrop-blur-sm">
            {/* Error banner */}
            {errorMessage && (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-500">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <AlertCircle size={14} className="shrink-0" />
                        <span className="truncate">{errorMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMessage("")}
                        className="rounded p-0.5 hover:bg-rose-500/20"
                    >
                        <X size={12} />
                    </button>
                </div>
            )}

            {/* Staged media preview */}
            {stagedMedia && (
                <div className="relative mb-3 inline-block">
                    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-secondary/50">
                        {stagedMedia.resourceType === "video" ? (
                            <div className="relative h-24 w-32 bg-black flex items-center justify-center">
                                <video
                                    src={stagedMedia.previewUrl}
                                    className="h-full w-full object-cover"
                                />
                                <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.2 text-[9px] font-semibold text-white">
                                    VIDEO
                                </span>
                            </div>
                        ) : (
                            <div className="relative h-24 w-24">
                                <Image
                                    src={stagedMedia.previewUrl}
                                    alt="Upload preview"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}

                        {/* Uploading overlay */}
                        {isUploading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 text-white gap-1.5 p-2 backdrop-blur-xs">
                                <Loader2 size={16} className="animate-spin text-cyan-400" />
                                <span className="text-[10px] font-semibold tracking-wide">
                                    {uploadProgress > 0 ? `${uploadProgress}%` : "Uploading..."}
                                </span>
                                <div className="w-4/5 h-1 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-cyan-500 transition-all duration-150 rounded-full"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error with retry overlay */}
                        {stagedMedia.error && !isUploading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 text-white gap-1 p-2 text-center backdrop-blur-xs">
                                <span className="text-[10px] text-rose-300 font-medium leading-tight">
                                    {stagedMedia.error}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => uploadFile(stagedMedia.file, stagedMedia.resourceType)}
                                    className="mt-1 flex items-center gap-1 rounded bg-cyan-500 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-cyan-600 cursor-pointer"
                                    aria-label="Retry upload"
                                >
                                    <RotateCw size={10} />
                                    <span>Retry</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Cancel media button */}
                    <button
                        type="button"
                        onClick={handleCancelMedia}
                        className="absolute -top-1.5 -right-1.5 rounded-full bg-background border border-border shadow-xs p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Remove attachment"
                        aria-label="Remove attachment"
                    >
                        <X size={12} />
                    </button>
                </div>
            )}

            {/* Input row */}
            <div className="flex items-end gap-2">
                {/* Media attachment button */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50 cursor-pointer mb-0.5"
                    title="Attach image or video"
                    aria-label="Attach media"
                >
                    <Paperclip size={19} />
                </button>

                {/* Textarea */}
                <div className="relative flex-1 min-w-0">
                    <AutoGrowTextarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                        minRows={1}
                        maxHeight={160}
                        className="rounded-2xl border border-border/60 bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:bg-background focus:outline-none"
                    />

                    {/* Grapheme counter (visible when approaching limit) */}
                    {graphemeCount > 1800 && (
                        <div
                            className={cn(
                                "absolute right-3 bottom-2 text-[10px] font-mono",
                                isOverLimit ? "text-rose-500 font-bold" : "text-muted-foreground"
                            )}
                        >
                            {MAX_MESSAGE_LENGTH - graphemeCount}
                        </div>
                    )}
                </div>

                {/* Send button */}
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all mb-0.5",
                        canSend
                            ? "bg-cyan-600 text-white shadow-xs hover:bg-cyan-700 active:scale-95 cursor-pointer"
                            : "bg-secondary text-muted-foreground/50 cursor-not-allowed"
                    )}
                    aria-label="Send message"
                >
                    <SendHorizontal size={18} />
                </button>
            </div>
        </div>
    );
}
