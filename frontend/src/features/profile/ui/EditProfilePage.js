"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";
import { Select } from "@/shared/ui/Select";
import { LoadingFallback } from "@/shared/feedback/LoadingFallback";
import { ErrorState } from "@/shared/feedback/ErrorState";
import { COUNTRIES } from "@/shared/constants/countries";
import { emitProfileChanged } from "@/lib/profileSync";
import { profileApi } from "../api/profileApi";
import { ImagePicker } from "./ImagePicker";

const editProfileSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name cannot exceed 50 characters"),
    bio: z.string().max(280, "Bio cannot exceed 280 characters"),
    country: z.string(),
});

function toBareHandle(value) {
    return value ? String(value).replace(/^@/, "").trim() : "";
}

/**
 * Dedicated, responsive Edit Profile page (/settings/profile).
 * Full-page settings editor — replaces the former modal experience.
 *
 * Editable: avatar, banner, display name, bio, country.
 * Username is displayed but intentionally NOT editable (read-only).
 * Server-controlled/security fields (role, IDs, block state) are never part
 * of this form — the backend allowlist rejects them regardless.
 */
export function EditProfilePage() {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [bannerUrl, setBannerUrl] = useState("");
    const [saveError, setSaveError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        reset,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(editProfileSchema),
        defaultValues: { name: "", bio: "", country: "" },
    });

    const handle = profile?.handle ? toBareHandle(profile.handle) : toBareHandle(currentUser?.handle);

    // The backend is the authoritative profile source — load the real profile
    // (never just the local AuthContext object) before editing.
    useEffect(() => {
        const authHandle = toBareHandle(currentUser?.handle);
        if (!authHandle) return;
        let isCancelled = false;

        async function load() {
            setLoading(true);
            setLoadError(null);
            const res = await profileApi.getProfile(authHandle);
            if (isCancelled) return;
            if (res.success && res.data) {
                setProfile(res.data);
                setAvatarUrl(res.data.avatarUrl || "");
                setBannerUrl(res.data.bannerUrl || "");
                reset({
                    name: res.data.name || "",
                    bio: res.data.bio || "",
                    country: res.data.country || "",
                });
            } else {
                setLoadError(res.error || { message: "Failed to load your profile." });
            }
            setLoading(false);
        }

        load();
        return () => {
            isCancelled = true;
        };
    }, [currentUser?.handle, reloadToken, reset]);

    async function onSubmit(data) {
        setSaveError("");
        setSaveSuccess(false);
        setIsSaving(true);
        // Username/handle is intentionally NOT sent — usernames are immutable.
        const res = await profileApi.updateProfile({
            name: data.name,
            bio: data.bio,
            country: data.country,
            avatarUrl,
            bannerUrl,
        });
        setIsSaving(false);

        if (!res.success) {
            setSaveError(res.error?.message || "Failed to update the profile.");
            return;
        }

        setSaveSuccess(true);
        // Keep the sidebar / right-side user card in sync (avatar/name changed).
        emitProfileChanged();
        // Return to the profile so the user sees the saved result in place.
        setTimeout(() => {
            router.replace(handle ? `/profile/${handle}` : "/feed");
        }, 900);
    }

    const handleCancel = () => {
        if (handle) {
            router.push(`/profile/${handle}`);
        } else {
            router.back();
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <LoadingFallback message="Loading your profile…" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="p-4 sm:p-6">
                <ErrorState
                    message={loadError.message || "Failed to load your profile."}
                    onRetry={() => setReloadToken((n) => n + 1)}
                />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-2xl px-4 pt-4 sm:pt-6 lg:pt-0 pb-10 sm:px-6">
            {/* Page header */}
            <header className="mb-6 flex items-center gap-3">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    aria-label="Back to profile"
                >
                    <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-lg font-bold leading-tight text-foreground sm:text-xl">Edit profile</h1>
                    <p className="truncate text-xs text-muted-foreground">Update how you appear on YOIBI.</p>
                </div>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
                {/* Photos */}
                <section
                    aria-labelledby="edit-photos-heading"
                    className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5"
                >
                    <h2 id="edit-photos-heading" className="mb-4 text-sm font-semibold text-foreground">
                        Photos
                    </h2>
                    <div className="flex flex-col gap-4">
                        <ImagePicker kind="banner" currentUrl={bannerUrl} onChange={setBannerUrl} disabled={isSaving} />
                        <div className="border-t border-border/40 pt-4">
                            <ImagePicker kind="avatar" currentUrl={avatarUrl} onChange={setAvatarUrl} disabled={isSaving} />
                        </div>
                    </div>
                </section>

                {/* Details */}
                <section
                    aria-labelledby="edit-details-heading"
                    className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5"
                >
                    <h2 id="edit-details-heading" className="mb-4 text-sm font-semibold text-foreground">
                        Details
                    </h2>
                    <div className="flex flex-col gap-5">
                        {/* Display name */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="edit-name" className="text-sm font-medium text-foreground">
                                Display Name
                            </label>
                            <Input
                                id="edit-name"
                                type="text"
                                placeholder="Your name"
                                maxLength={50}
                                autoComplete="name"
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

                        {/* Username — visible but intentionally NOT editable */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="edit-username" className="text-sm font-medium text-foreground">
                                Username
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    @
                                </span>
                                <Input
                                    id="edit-username"
                                    type="text"
                                    className="cursor-not-allowed pl-8 pr-9 opacity-70"
                                    value={handle}
                                    readOnly
                                    disabled
                                    autoCorrect="off"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    aria-describedby="edit-username-hint"
                                    aria-readonly="true"
                                />
                                <Lock
                                    size={14}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden="true"
                                />
                            </div>
                            <p id="edit-username-hint" className="text-xs text-muted-foreground">
                                Your username cannot be changed.
                            </p>
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
                    </div>
                </section>

                {/* Server error */}
                {saveError && (
                    <div
                        role="alert"
                        className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive"
                    >
                        {saveError}
                    </div>
                )}

                {/* Success feedback */}
                {saveSuccess && (
                    <div
                        role="status"
                        className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs text-cyan-600"
                    >
                        <CheckCircle2 size={14} aria-hidden="true" />
                        Profile updated successfully! Taking you back to your profile…
                    </div>
                )}

                {/* Actions — thumb-friendly on mobile, right-aligned on desktop */}
                <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={isSaving} disabled={isSaving} className="w-full sm:w-auto">
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
