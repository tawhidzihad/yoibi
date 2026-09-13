"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, Video, Radio, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/ui/Button";

function UserAvatar({ user }) {
    const avatarUrl = user?.avatarUrl;
    const name = user?.name || "YOIBI Host";

    if (avatarUrl) {
        return (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border/50 shadow-sm ring-1 ring-background">
                <Image
                    src={avatarUrl}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="36px"
                    unoptimized
                />
            </div>
        );
    }

    const initials = (name || "Host")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "H";

    return (
        <div
            title={name}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-xs font-bold text-cyan-400 shadow-sm"
        >
            {initials}
        </div>
    );
}

export function MeetupCard({ room }) {
    const roomId = room.id || room._id;
    const isEnded = room.status === "ended";
    const participantCount = Number(room.participantCount) || 0;
    const maxParticipants = Number(room.maxParticipants) || 12;
    const isFull = !isEnded && participantCount >= maxParticipants;
    const capacityRatio = Math.min(participantCount / maxParticipants, 1);

    const ownerName = room.owner?.name || "YOIBI Host";
    const rawHandle = room.owner?.handle || "host";
    const ownerHandle = rawHandle.replace(/^@/, "");

    return (
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-0.5">
            {/* Ambient subtle glow */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-500/5 blur-2xl transition-opacity group-hover:opacity-100" />

            <div>
                {/* Header: Status & Capacity Badges */}
                <div className="mb-3.5 flex items-center justify-between gap-2">
                    {!isEnded ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 whitespace-nowrap shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                            Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border/40 whitespace-nowrap shrink-0">
                            <Radio size={11} aria-hidden="true" />
                            Ended
                        </span>
                    )}

                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap shrink-0">
                        <Users
                            size={13}
                            className={isEnded ? "text-muted-foreground/60" : isFull ? "text-amber-400" : "text-cyan-400"}
                            aria-hidden="true"
                        />
                        {!isEnded ? (
                            <span className={isFull ? "font-semibold text-amber-400" : ""}>
                                {participantCount}/{maxParticipants}
                            </span>
                        ) : (
                            <span>{maxParticipants} max</span>
                        )}
                    </div>
                </div>

                {/* Room Title & Topic Hierarchy */}
                <div className="flex flex-col gap-1.5 min-w-0">
                    <h3 className="line-clamp-2 text-base font-bold text-foreground transition-colors group-hover:text-cyan-400 leading-snug">
                        {room.name}
                    </h3>
                    {room.topic ? (
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/40 truncate max-w-full">
                                {room.topic}
                            </span>
                        </div>
                    ) : null}
                </div>

                {/* Active Capacity Progress Bar (Active rooms only) */}
                {!isEnded && (
                    <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary/80 border border-border/20">
                        <div
                            className={`h-full transition-all duration-500 rounded-full ${
                                isFull
                                    ? "bg-amber-500"
                                    : capacityRatio > 0.75
                                    ? "bg-cyan-400"
                                    : "bg-gradient-to-r from-cyan-500 to-blue-500"
                            }`}
                            style={{ width: `${Math.max(capacityRatio * 100, 5)}%` }}
                        />
                    </div>
                )}

                {/* Host Info */}
                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                    <Link
                        href={`/profile/${ownerHandle}`}
                        className="flex items-center gap-2.5 min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 transition-opacity hover:opacity-90"
                        aria-label={`View ${ownerName}'s profile`}
                    >
                        <UserAvatar user={room.owner} />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-foreground flex items-center gap-1">
                                <span className="truncate">{ownerName}</span>
                                <ShieldCheck size={13} className="text-cyan-400 shrink-0" aria-label="Room Creator" />
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                                @{ownerHandle}
                            </p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Action Button */}
            <div className="mt-4 pt-2 border-t border-border/20">
                {isEnded ? (
                    <Button
                        id={`ended-room-${roomId}`}
                        size="sm"
                        variant="outline"
                        disabled
                        className="w-full opacity-60 cursor-not-allowed whitespace-nowrap gap-1.5"
                    >
                        <Radio size={14} aria-hidden="true" />
                        <span>Room Ended</span>
                    </Button>
                ) : isFull ? (
                    <Button
                        id={`full-room-${roomId}`}
                        size="sm"
                        variant="outline"
                        disabled
                        className="w-full border-amber-500/30 text-amber-400 opacity-80 cursor-not-allowed whitespace-nowrap gap-1.5"
                    >
                        <Users size={14} aria-hidden="true" />
                        <span>Room Full ({participantCount}/{maxParticipants})</span>
                    </Button>
                ) : (
                    <Link href={`/meetup/${roomId}`} className="block w-full">
                        <Button
                            id={`join-room-${roomId}`}
                            size="sm"
                            variant="primary"
                            className="w-full shadow-sm hover:shadow-md hover:shadow-cyan-500/20 whitespace-nowrap gap-1.5"
                        >
                            <Video size={14} aria-hidden="true" />
                            <span>Join Room</span>
                            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}
