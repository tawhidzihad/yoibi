"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, User, Image as ImageIcon, FileText } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { Textarea } from "../../../shared/ui/Textarea";
import { usersApi } from "../api/usersApi";

const editProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
    bio: z.string().max(200, "Bio must be under 200 characters").optional(),
    avatarUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
});

export function EditProfileModal({ user, isOpen, onClose, onSaveSuccess }) {
    const [saveError, setSaveError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(editProfileSchema),
        defaultValues: {
            name: user?.name || "",
            bio: user?.bio || "",
            avatarUrl: user?.avatarUrl || "",
        },
    });

    if (!isOpen) return null;

    async function onSubmit(data) {
        setSaveError("");
        setSaveSuccess(false);
        try {
            const res = await usersApi.updateUserProfile({
                name: data.name,
                bio: data.bio,
                avatarUrl: data.avatarUrl,
            });

            if (!res.success) {
                setSaveError(res.error?.message || "Failed to update profile.");
                return;
            }

            setSaveSuccess(true);
            if (onSaveSuccess) {
                await onSaveSuccess(res.data);
            }
            setTimeout(() => {
                onClose();
            }, 600);
        } catch (err) {
            setSaveError(err?.message || "An unexpected error occurred.");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                    <h2 className="text-xl font-bold text-foreground">Edit Profile</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="edit-name" className="text-sm font-medium text-foreground">
                            Display Name
                        </label>
                        <div className="relative">
                            <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="edit-name"
                                type="text"
                                placeholder="Your display name"
                                className="pl-9"
                                aria-invalid={!!errors.name}
                                {...register("name")}
                            />
                        </div>
                        {errors.name && (
                            <p className="text-xs text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Bio */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="edit-bio" className="text-sm font-medium text-foreground">
                            Bio
                        </label>
                        <div className="relative">
                            <FileText size={16} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" />
                            <Textarea
                                id="edit-bio"
                                rows={3}
                                placeholder="Tell us about yourself..."
                                className="pl-9"
                                aria-invalid={!!errors.bio}
                                {...register("bio")}
                            />
                        </div>
                        {errors.bio && (
                            <p className="text-xs text-destructive">{errors.bio.message}</p>
                        )}
                    </div>

                    {/* Avatar URL */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="edit-avatarUrl" className="text-sm font-medium text-foreground">
                            Avatar Image URL
                        </label>
                        <div className="relative">
                            <ImageIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="edit-avatarUrl"
                                type="url"
                                placeholder="https://example.com/avatar.jpg"
                                className="pl-9"
                                aria-invalid={!!errors.avatarUrl}
                                {...register("avatarUrl")}
                            />
                        </div>
                        {errors.avatarUrl && (
                            <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>
                        )}
                    </div>

                    {/* Error message */}
                    {saveError && (
                        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
                            {saveError}
                        </div>
                    )}

                    {/* Success message */}
                    {saveSuccess && (
                        <div role="status" className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs text-cyan-600">
                            Profile updated successfully!
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-2 flex justify-end gap-3 border-t border-border/50 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" loading={isSubmitting}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
