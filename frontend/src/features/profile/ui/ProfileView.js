"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { profileApi } from "../api/profileApi";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileContent } from "./ProfileContent";
import { ErrorState } from "@/shared/feedback/ErrorState";

function ProfileSkeleton() {
    return (
        <div aria-busy="true" aria-label="Loading profile">
            {/* Banner skeleton */}
            <div className="h-36 w-full animate-pulse bg-secondary/50 sm:h-44 md:h-52" />
            <div className="px-4 pb-6 sm:px-6">
                <div className="relative -mt-10 mb-4 flex items-end justify-between sm:-mt-12">
                    <div className="h-[88px] w-[88px] animate-pulse rounded-full border-4 border-background bg-secondary/60" />
                    <div className="h-8 w-28 animate-pulse rounded-lg bg-secondary/60" />
                </div>
                <div className="h-5 w-40 animate-pulse rounded bg-secondary/60" />
                <div className="mt-2 h-3.5 w-24 animate-pulse rounded bg-secondary/40" />
                <div className="mt-4 h-3 w-3/4 animate-pulse rounded bg-secondary/40" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-secondary/40" />
                <div className="mt-5 flex gap-6">
                    <div className="h-4 w-16 animate-pulse rounded bg-secondary/40" />
                    <div className="h-4 w-16 animate-pulse rounded bg-secondary/40" />
                    <div className="h-4 w-16 animate-pulse rounded bg-secondary/40" />
                </div>
                {/* Tabs skeleton */}
                <div className="mt-6 flex gap-6 border-b border-border/50 pb-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-secondary/40" />
                    <div className="h-4 w-20 animate-pulse rounded bg-secondary/40" />
                    <div className="h-4 w-20 animate-pulse rounded bg-secondary/40" />
                </div>
            </div>
        </div>
    );
}

function ProfileNotFound({ username }) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
            <p className="text-2xl font-bold text-foreground">Profile not found</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                @{username} doesn&rsquo;t exist, or the account is no longer available on YOIBI.
            </p>
        </div>
    );
}

/**
 * Dynamic profile view for /profile/[username].
 * The backend is the authoritative profile source — the local AuthContext
 * object is only used for identity comparisons (owner detection), never as
 * profile data.
 */
export function ProfileView() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const username = params?.username ? String(Array.isArray(params.username) ? params.username[0] : params.username).replace(/^@/, "").trim() : "";

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        if (!username) return;
        let isCancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            setNotFound(false);
            const res = await profileApi.getProfile(username);
            if (isCancelled) return;
            if (res.success && res.data) {
                setProfile(res.data);
            } else if (res.status === 404) {
                setProfile(null);
                setNotFound(true);
            } else {
                setError(res.error || { message: "Failed to load the profile." });
            }
            setLoading(false);
        }

        load();
        return () => {
            isCancelled = true;
        };
    }, [username, reloadToken]);

    const isOwner = Boolean(
        profile?.isOwner ||
        (currentUser?.id && profile?.id && currentUser.id === profile.id) ||
        (currentUser?.handle && currentUser.handle.replace(/^@/, "") === username)
    );

    // Editing lives on its own dedicated, responsive route — no modal.
    const handleEditClick = () => {
        router.push("/settings/profile");
    };

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (notFound) {
        return <ProfileNotFound username={username} />;
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorState message={error.message || "Failed to load the profile."} onRetry={() => setReloadToken((n) => n + 1)} />
            </div>
        );
    }

    if (!profile) {
        return <ProfileNotFound username={username} />;
    }

    return (
        <div>
            <ProfileHeader
                key={profile.id}
                profile={profile}
                isOwner={isOwner}
                currentUser={currentUser}
                onEditClick={handleEditClick}
            />
            <ProfileContent key={profile.id} profile={profile} isOwner={isOwner} />
        </div>
    );
}
