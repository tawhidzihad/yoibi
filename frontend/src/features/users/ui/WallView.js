"use client";

import { useState } from "react";
import { UserPlus, UserCheck, MapPin, Calendar } from "lucide-react";
import { mockUsers, getMockUserByHandle } from "../api/mock-users";
import { Button } from "../../../shared/ui/Button";

function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function Avatar({ name, large = false }) {
    const initials = name
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

export function ProfileHeader({ user: initialUser }) {
    const [user, setUser] = useState(initialUser);
    const [loading, setLoading] = useState(false);

    async function toggleFollow() {
        setLoading(true);
        // TODO Phase 4: POST /api/v1/users/:id/follow or DELETE unfollow
        await new Promise((r) => setTimeout(r, 400));
        setUser((u) => ({
            ...u,
            isFollowing: !u.isFollowing,
            followersCount: u.isFollowing ? u.followersCount - 1 : u.followersCount + 1,
        }));
        setLoading(false);
    }

    return (
        <div className="border-b border-border/50 p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
                <Avatar name={user.name} large />
                <Button
                    id={`follow-btn-${user.id}`}
                    size="sm"
                    variant={user.isFollowing ? "outline" : "primary"}
                    loading={loading}
                    onClick={toggleFollow}
                    className="mt-1"
                >
                    {user.isFollowing ? (
                        <>
                            <UserCheck size={14} aria-hidden="true" /> Following
                        </>
                    ) : (
                        <>
                            <UserPlus size={14} aria-hidden="true" /> Follow
                        </>
                    )}
                </Button>
            </div>

            <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
            <p className="text-sm text-muted-foreground">@{user.handle}</p>

            {user.bio && (
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">{user.bio}</p>
            )}

            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Calendar size={12} aria-hidden="true" /> Joined {formatDate(user.joinedAt)}
                </span>
            </div>

            <div className="mt-4 flex gap-6">
                {[
                    { label: "Posts",     value: user.postsCount     },
                    { label: "Followers", value: user.followersCount  },
                    { label: "Following", value: user.followingCount  },
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
    const user = handle ? getMockUserByHandle(handle) : mockUsers[0];

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-lg font-semibold text-foreground">User not found</p>
                <p className="mt-1 text-sm text-muted-foreground">@{handle} does not exist.</p>
            </div>
        );
    }

    return (
        <div>
            <ProfileHeader user={user} />
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <p>Posts and activity will appear here.</p>
                <p className="mt-1 text-xs">Phase 4: Real posts from /api/v1/users/{"{handle}"}/posts</p>
            </div>
        </div>
    );
}
