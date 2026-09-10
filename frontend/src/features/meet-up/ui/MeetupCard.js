"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, Video, Radio, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/ui/Button";

function UserAvatar({ user }) {
    if (user?.avatarUrl) {
        return (
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-background shadow-sm">
                <Image
                    src={user.avatarUrl}
                    alt={user.name || "User"}
                    fill
                    className="object-cover"
                    sizes="32px"
                    unoptimized
                />
            </div>
        );
    }
    const initials = (user?.name || "Host")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    return (
        <div
            title={user?.name}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-xs font-bold text-cyan-400 shadow-sm"
        >
            {initials}
        </div>
    );
}

export function MeetupCard({ room }) {
    const roomId = room.id || room._id;
    const isEnded = room.status === "ended";
    const participantCount = room.participantCount || 0;
    const maxParticipants = room.maxParticipants || 12;
    const isFull = participantCount >= maxParticipants;
    const capacityRatio = Math.min(participantCount / maxParticipants, 1);

    return (
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-card/80 via-card/40 to-card/20 p-5 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5">
            {/* Ambient subtle glow */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-500/5 blur-2xl transition-opacity group-hover:opacity-100" />

            <div>
                {/* Header: Status and Topic */}
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {!isEnded ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                                Active
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-500/10 px-2.5 py-1 text-xs font-semibold text-zinc-400 border border-zinc-500/20">
                                <Radio size={12} aria-hidden="true" />
                                Ended
                            </span>
                        )}

                        {room.topic ? (
                            <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-0.5 text-xs text-muted-foreground border border-white/5 truncate max-w-[150px]">
                                {room.topic}
                            </span>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Users size={13} className={isFull ? "text-amber-400" : "text-muted-foreground"} aria-hidden="true" />
                        <span className={isFull ? "font-semibold text-amber-400" : ""}>
                            {participantCount}/{maxParticipants}
                        </span>
                    </div>
                </div>

                {/* Room Title */}
                <h3 className="line-clamp-2 text-base font-bold text-foreground transition-colors group-hover:text-cyan-300">
                    {room.name}
                </h3>

                {/* Capacity Progress Bar */}
                <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                        className={`h-full transition-all duration-500 rounded-full ${
                            isFull
                                ? "bg-amber-500"
                                : capacityRatio > 0.75
                                ? "bg-cyan-400"
                                : "bg-gradient-to-r from-cyan-500 to-blue-500"
                        }`}
                        style={{ width: `${Math.max(capacityRatio * 100, 4)}%` }}
                    />
                </div>

                {/* Host Info */}
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex items-center gap-2.5">
                        <UserAvatar user={room.owner} />
                        <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground flex items-center gap-1">
                                {room.owner?.name || "Host"}
                                <ShieldCheck size={12} className="text-cyan-400 shrink-0" aria-label="Room Creator" />
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                                @{room.owner?.handle || "host"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="mt-4 pt-2">
                {isEnded ? (
                    <Button
                        id={`ended-room-${roomId}`}
                        size="sm"
                        variant="outline"
                        disabled
                        className="w-full opacity-60 cursor-not-allowed"
                    >
                        Room Ended
                    </Button>
                ) : isFull ? (
                    <Button
                        id={`full-room-${roomId}`}
                        size="sm"
                        variant="outline"
                        disabled
                        className="w-full border-amber-500/30 text-amber-400 opacity-75 cursor-not-allowed"
                    >
                        Room Full ({participantCount}/{maxParticipants})
                    </Button>
                ) : (
                    <Link href={`/meetup/${roomId}`} className="block w-full">
                        <Button
                            id={`join-room-${roomId}`}
                            size="sm"
                            variant="primary"
                            className="w-full group-hover:shadow-md group-hover:shadow-cyan-500/20"
                        >
                            <Video size={14} className="mr-1.5" aria-hidden="true" />
                            Join Room
                            <ArrowRight size={13} className="ml-1.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}
