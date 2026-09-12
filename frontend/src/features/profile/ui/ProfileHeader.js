"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, CalendarDays, Camera } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Avatar } from "@/shared/ui/Avatar";
import { followUser, unfollowUser } from "@/lib/api/follows";
import { COUNTRIES } from "@/shared/constants/countries";

/** Maps an ISO 3166-1 alpha-2 code to a clean display name ("BD" -> "Bangladesh"). */
function countryName(code) {
    if (!code) return "";
    return COUNTRIES.find((c) => c.code === code.toUpperCase())?.name || code;
}

function formatJoined(isoString) {
    if (!isoString) return null;
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatCount(n) {
    const value = Number(n) || 0;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 10000) return `${(value / 1000).toFixed(1)}K`;
    return String(value);
}

function Banner({ bannerUrl, name }) {
    if (bannerUrl) {
        return (
            <div className="relative h-36 w-full overflow-hidden bg-secondary sm:h-44 md:h-52">
                <Image
                    src={bannerUrl}
                    alt={`${name}'s profile banner`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1200px) 700px, 900px"
                    className="object-cover"
                    priority
                />
            </div>
        );
    }
    // Intentional empty banner state — a deliberate YOIBI gradient, not a broken image.
    return (
        <div
            className="relative flex h-36 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-500/15 via-secondary to-background sm:h-44 md:h-52"
            aria-hidden="true"
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.12),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.08),transparent_45%)]" />
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                <Camera size={13} aria-hidden="true" />
                No banner yet
            </span>
        </div>
    );
}

export function ProfileHeader({ profile, isOwner, currentUser, onEditClick }) {
    // NOTE: initialized from props once per profile. The parent remounts this
    // component with key={profile.id} whenever the viewed user changes, so no
    // effect-based re-sync is required (stale follow state cannot leak across
    // profile switches).
    const [isFollowing, setIsFollowing] = useState(Boolean(profile?.isFollowing));
    const [followBusy, setFollowBusy] = useState(false);

    const handle = profile?.handle ? String(profile.handle).replace(/^@/, "") : "";
    const isSelf = Boolean(isOwner || (currentUser?.id && currentUser.id === profile?.id));

    const toggleFollow = async () => {
        if (!profile?.id || followBusy) return;
        setFollowBusy(true);
        const next = !isFollowing;
        setIsFollowing(next);
        try {
            const res = next ? await followUser(profile.id) : await unfollowUser(profile.id);
            if (!res.success) {
                setIsFollowing(!next);
            }
        } catch {
            setIsFollowing(!next);
        } finally {
            setFollowBusy(false);
        }
    };

    const joined = formatJoined(profile?.createdAt);

    const stats = [
        { label: "Posts", value: profile?.postsCount ?? 0 },
        { label: "Followers", value: profile?.followersCount ?? 0 },
        { label: "Following", value: profile?.followingCount ?? 0 },
    ];

    return (
        <article aria-label={`${profile?.name || handle}'s profile`}>
            <Banner bannerUrl={profile?.bannerUrl} name={profile?.name || handle} />
            <ProfileBody
                profile={profile}
                handle={handle}
                isSelf={isSelf}
                isFollowing={isFollowing}
                followBusy={followBusy}
                toggleFollow={toggleFollow}
                joined={joined}
                stats={stats}
                onEditClick={onEditClick}
            />
        </article>
    );
}

function ProfileBody({ profile, handle, isSelf, isFollowing, followBusy, toggleFollow, joined, stats, onEditClick }) {
    return (
        <div className="px-4 pb-4 sm:px-6">
            {/* Avatar + actions row — avatar overlaps the banner naturally */}
            <div className="relative -mt-10 mb-3 flex items-end justify-between gap-3 sm:-mt-12">
                <div className="rounded-full border-4 border-background">
                    <Avatar
                        src={profile?.avatarUrl || ""}
                        name={profile?.name || ""}
                        handle={handle}
                        size={88}
                    />
                </div>
                <div className="pb-1">
                    {isSelf ? (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onEditClick}
                            id="edit-profile-btn"
                            aria-label="Edit profile"
                        >
                            Edit Profile
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant={isFollowing ? "outline" : "primary"}
                            loading={followBusy}
                            onClick={toggleFollow}
                            id={`follow-btn-${profile?.id || handle}`}
                        >
                            {isFollowing ? "Following" : "Follow"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Identity */}
            <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
                {profile?.name || handle}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground" aria-label="Username">
                @{handle}
            </p>

            {profile?.bio ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">
                    {profile.bio}
                </p>
            ) : null}

            {/* Meta row (country + joined month/year) */}
            {(profile?.country || joined) && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    {profile?.country ? (
                        <span className="flex items-center gap-1">
                            <MapPin size={13} aria-hidden="true" />
                            {countryName(profile.country)}
                        </span>
                    ) : null}
                    {joined ? (
                        <span className="flex items-center gap-1">
                            <CalendarDays size={13} aria-hidden="true" />
                            Joined {joined}
                        </span>
                    ) : null}
                </div>
            )}

            {/* Stats */}
            <div className="mt-4 flex items-center gap-5 border-t border-border/50 pt-3 text-sm">
                {stats.map(({ label, value }) => (
                    <div key={label} className="flex items-baseline gap-1.5">
                        <span className="font-bold text-foreground">{formatCount(value)}</span>
                        <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

