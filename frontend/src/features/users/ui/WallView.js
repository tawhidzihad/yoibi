"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserCheck, Calendar, Edit3 } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { LoadingFallback } from "../../../shared/feedback/LoadingFallback";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { useAuth } from "../../auth/context/AuthContext";
import { usersApi } from "../api/usersApi";
import { EditProfileModal } from "./EditProfileModal";

function formatDate(isoString) {
    if (!isoString) return "Recently";
    return new Date(isoString).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function Avatar({ name, avatarUrl, large = false }) {
    if (avatarUrl) {
        return (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
                src={avatarUrl}
                alt={name || "User"}
                className={`rounded-full object-cover border border-border/60 ${
                    large ? "h-20 w-20" : "h-10 w-10"
                }`}
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
        <div
            className={`flex shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-semibold text-cyan-600 ${
                large ? "h-20 w-20 text-2xl" : "h-10 w-10 text-sm"
            }`}
        >
            {initials}
        </div>
    );
}

export function ProfileHeader({ user: initialUser, isOwner, onEditClick }) {
    const [user, setUser] = useState(initialUser);
    const [loading, setLoading] = useState(false);

    // Synchronize local state when initialUser changes
    const displayUser = { ...initialUser, ...user };

    async function toggleFollow() {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 400));
        setUser((u) => ({
            ...u,
            isFollowing: !u.isFollowing,
            followersCount: u.isFollowing ? Math.max(0, (u.followersCount || 0) - 1) : (u.followersCount || 0) + 1,
        }));
        setLoading(false);
    }

    const cleanHandle = displayUser.handle ? (displayUser.handle.startsWith("@") ? displayUser.handle : `@${displayUser.handle}`) : "@user";

    return (
        <div className="border-b border-border/50 p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
                <Avatar name={displayUser.name} avatarUrl={displayUser.avatarUrl} large />
                {isOwner ? (
                    <Button
                        id="edit-profile-btn"
                        size="sm"
                        variant="outline"
                        onClick={onEditClick}
                        className="mt-1"
                    >
                        <Edit3 size={14} aria-hidden="true" /> Edit Profile
                    </Button>
                ) : (
                    <Button
                        id={`follow-btn-${displayUser.id || displayUser.handle}`}
                        size="sm"
                        variant={displayUser.isFollowing ? "outline" : "primary"}
                        loading={loading}
                        onClick={toggleFollow}
                        className="mt-1"
                    >
                        {displayUser.isFollowing ? (
                            <>
                                <UserCheck size={14} aria-hidden="true" /> Following
                            </>
                        ) : (
                            <>
                                <UserPlus size={14} aria-hidden="true" /> Follow
                            </>
                        )}
                    </Button>
                )}
            </div>

            <h1 className="text-xl font-bold text-foreground">{displayUser.name || cleanHandle}</h1>
            <p className="text-sm text-muted-foreground">{cleanHandle}</p>

            {displayUser.bio && (
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">{displayUser.bio}</p>
            )}

            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Calendar size={12} aria-hidden="true" /> Joined {formatDate(displayUser.createdAt || displayUser.joinedAt)}
                </span>
            </div>

            <div className="mt-4 flex gap-6">
                {[
                    { label: "Posts",     value: displayUser.postsCount     ?? 0 },
                    { label: "Followers", value: displayUser.followersCount ?? 0 },
                    { label: "Following", value: displayUser.followingCount ?? 0 },
                ].map(({ label, value }) => (
                    <div key={label}>
                        <span className="text-sm font-bold text-foreground">{value.toLocaleString()}</span>{" "}
                        <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function WallView({ handle }) {
    const { user: currentUser, refreshUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const targetHandle = handle || currentUser?.handle;
    const isOwner = Boolean(
        currentUser &&
        (currentUser.id === profile?.id ||
         currentUser.handle === profile?.handle ||
         (!handle && currentUser))
    );

    useEffect(() => {
        let isCancelled = false;

        async function loadProfile() {
            if (!targetHandle) {
                if (currentUser) {
                    if (!isCancelled) {
                        setProfile(currentUser);
                        setLoading(false);
                    }
                    return;
                }
                if (!isCancelled) setLoading(false);
                return;
            }

            const cleanSearchHandle = targetHandle.replace(/^@/, "");
            const res = await usersApi.getUserProfile(cleanSearchHandle);

            if (isCancelled) return;

            if (res.success && res.data) {
                setProfile(res.data);
            } else if (res.status === 404) {
                setProfile(null);
                setError({ code: "NOT_FOUND", message: `User @${cleanSearchHandle} does not exist.` });
            } else {
                if (currentUser && (currentUser.handle === targetHandle || currentUser.handle === `@${cleanSearchHandle}`)) {
                    setProfile(currentUser);
                } else {
                    setError(res.error || { code: "API_ERROR", message: "Failed to load user profile." });
                }
            }
            setLoading(false);
        }

        loadProfile();

        return () => {
            isCancelled = true;
        };
    }, [targetHandle, currentUser]);

    const handleProfileSaved = async (updatedData) => {
        setProfile((prev) => ({ ...prev, ...updatedData }));
        await refreshUser();
    };

    const handleRetry = () => {
        setLoading(true);
        setError(null);
    };

    if (loading) {
        return (
            <div className="py-12 flex justify-center">
                <LoadingFallback label="Loading user profile..." />
            </div>
        );
    }

    if (error && error.code === "NOT_FOUND") {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <p className="text-xl font-bold text-foreground">User not found</p>
                <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorState message={error.message} onRetry={handleRetry} />
            </div>
        );
    }

    const displayUser = profile || currentUser;

    if (!displayUser) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-lg font-semibold text-foreground">Profile Unavailable</p>
                <p className="mt-1 text-sm text-muted-foreground">Please sign in to view your profile.</p>
            </div>
        );
    }

    return (
        <div>
            <ProfileHeader
                user={displayUser}
                isOwner={isOwner}
                onEditClick={() => setIsEditOpen(true)}
                onUserUpdated={handleProfileSaved}
            />
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <p>Posts and activity will appear here.</p>
            </div>

            {isOwner && (
                <EditProfileModal
                    user={displayUser}
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onSaveSuccess={handleProfileSaved}
                />
            )}
        </div>
    );
}
