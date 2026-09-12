"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";
import { Select } from "@/shared/ui/Select";
import { COUNTRIES } from "@/shared/constants/countries";
import { profileApi } from "../api/profileApi";
import { ImagePicker } from "./ImagePicker";

const editProfileSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name cannot exceed 50 characters"),
    handle: z
        .string()
        .transform((value) => value.trim().toLowerCase().replace(/^@+/, "").replace(/[^a-z0-9]/g, ""))
        .refine((value) => value.length >= 3, "Username must be at least 3 characters (letters/numbers only)")
        .refine((value) => value.length <= 24, "Username cannot exceed 24 characters"),
    bio: z.string().max(280, "Bio cannot exceed 280 characters"),
    country: z.string(),
});

/**
 * Edit Profile modal (own profile only).
 * Edits: avatar, banner, name, username/handle, bio, country.
 * Server-controlled/security fields (role, IDs, block state, timestamps) are
 * never part of this form — the backend allowlist rejects them regardless.
 */
export function EditProfileModal({ profile, isOpen, onClose, onSaveSuccess }) {
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
    const [bannerUrl, setBannerUrl] = useState(profile?.bannerUrl || "");
    const [saveError, setSaveError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(editProfileSchema),
        defaultValues: {
            name: profile?.name || "",
            handle: profile?.handle ? String(profile.handle).replace(/^@/, "") : "",
            bio: profile?.bio || "",
            country: profile?.country || "",
        },
    });
    // NOTE: The parent remounts this modal (keyed) every time it opens/for a
    // given profile, so defaultValues are always fresh — no effect re-seeding.

    async function onSubmit(data) {
        setSaveError("");
        setSaveSuccess(false);
        const res = await profileApi.updateProfile({
            name: data.name,
            handle: data.handle,
            bio: data.bio,
            country: data.country,
            avatarUrl,
            bannerUrl,
        });

        if (!res.success) {
            if (res.error?.code === "HANDLE_TAKEN") {
                setSaveError("That username is already taken. Please choose another one.");
            } else {
                setSaveError(res.error?.message || "Failed to update the profile.");
            }
            return;
        }

        setSaveSuccess(true);
        await onSaveSuccess?.(res.data);
        setTimeout(() => {
            onClose?.();
        }, 600);
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Profile"
            description="Update your public profile information."
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {/* Profile images */}
                <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
                    <ImagePicker kind="avatar" currentUrl={avatarUrl} onChange={setAvatarUrl} disabled={isSubmitting} />
                    <ImagePicker kind="banner" currentUrl={bannerUrl} onChange={setBannerUrl} disabled={isSubmitting} />
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-name" className="text-sm font-medium text-foreground">
                        Display Name
                    </label>
                    <Input
                        id="edit-name"
                        type="text"
                        placeholder="Your name"
                        maxLength={50}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "edit-name-error" : undefined}
                        {...register("name")}
                    />
                    {errors.name && (
                        <p id="edit-name-error" role="alert" className="text-xs text-destructive">
                            {errors.name.message}
                        </p>
                    )}
                </div>

                {/* Username / handle */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-handle" className="text-sm font-medium text-foreground">
                        Username
                    </label>
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            @
                        </span>
                        <Input
                            id="edit-handle"
                            type="text"
                            className="pl-8"
                            placeholder="username"
                            maxLength={30}
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            aria-invalid={!!errors.handle}
                            aria-describedby={errors.handle ? "edit-handle-error" : "edit-handle-hint"}
                            {...register("handle")}
                        />
                    </div>
                    {errors.handle ? (
                        <p id="edit-handle-error" role="alert" className="text-xs text-destructive">
                            {errors.handle.message}
                        </p>
                    ) : (
                        <p id="edit-handle-hint" className="text-xs text-muted-foreground">
                            3–24 characters, letters and numbers. Changing it updates your profile link.
                        </p>
                    )}
                </div>

{/* Bio */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-bio" className="text-sm font-medium text-foreground">
                        Bio
                    </label>
                    <Textarea
                        id="edit-bio"
                        rows={3}
                        maxLength={280}
                        placeholder="Tell the community about yourself..."
                        aria-invalid={!!errors.bio}
                        aria-describedby={errors.bio ? "edit-bio-error" : undefined}
                        {...register("bio")}
                    />
                    {errors.bio && (
                        <p id="edit-bio-error" role="alert" className="text-xs text-destructive">
                            {errors.bio.message}
                        </p>
                    )}
                </div>

                {/* Country */}
                <Select id="edit-country" label="Country" {...register("country")}>
                    <option value="">Not specified</option>
                    {COUNTRIES.map(({ code, name }) => (
                        <option key={code} value={code}>
                            {name}
                        </option>
                    ))}
                </Select>

                {/* Server error */}
                {saveError && (
                    <div
                        role="alert"
                        className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive"
                    >
                        {saveError}
                    </div>
                )}

                {/* Success feedback */}
                {saveSuccess && (
                    <div
                        role="status"
                        className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs text-cyan-600"
                    >
                        Profile updated successfully!
                    </div>
                )}

                {/* Actions */}
                <div className="mt-1 flex justify-end gap-3 border-t border-border/50 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
