"use client";

import Link from "next/link";
import Image from "next/image";
import { Radio, Users, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";

function Avatar({ author }) {
    if (author?.avatarUrl) {
        return (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border/40">
                <Image
                    src={author.avatarUrl}
                    alt={author.name || "Broadcaster"}
                    fill
                    className="object-cover"
                    sizes="36px"
                />
            </div>
        );
    }

    const initials = (author?.name || "Broadcaster")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400 border border-cyan-500/30">
            {initials}
        </div>
    );
}

export function StreamCard({ stream }) {
    const isLive = stream.status === "live";
    const isReady = stream.status === "ready";
    const isEnded = stream.status === "ended";
    const streamId = stream.id || stream._id;

    return (
        <Link
            href={`/streams/${streamId}`}
            className="group block rounded-2xl border border-border/50 bg-card/70 overflow-hidden backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-0.5"
        >
            {/* Thumbnail Canvas */}
            <div className="relative aspect-video w-full bg-gradient-to-br from-secondary/80 via-card to-background flex items-center justify-center overflow-hidden">
                {stream.thumbnailUrl ? (
                    <Image
                        src={stream.thumbnailUrl}
                        alt={stream.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
                        <Radio size={36} className="transition-transform duration-300 group-hover:scale-110 text-cyan-500/50" aria-hidden="true" />
                        <span className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground/60">
                            {isLive ? "Live Broadcast" : isReady ? "Preparing Broadcast" : "Recorded Stream"}
                        </span>
                    </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {isLive && (
                        <span className="flex items-center gap-1.5 rounded-full bg-red-600/90 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-white shadow-md backdrop-blur-md">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                            LIVE
                        </span>
                    )}
                    {isReady && (
                        <span className="flex items-center gap-1.5 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-md backdrop-blur-md">
                            <Clock size={11} aria-hidden="true" />
                            PREPARING
                        </span>
                    )}
                    {isEnded && (
                        <span className="rounded-full bg-secondary/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-md">
                            ENDED
                        </span>
                    )}
                </div>

                {/* Viewers Badge */}
                {isLive && (
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-lg bg-background/85 px-2 py-1 text-xs font-semibold text-foreground backdrop-blur-md border border-border/30">
                        <Users size={12} className="text-cyan-400" aria-hidden="true" />
                        <span>{stream.viewerCount || 0}</span>
                    </div>
                )}

                {/* Category Pill */}
                {stream.category && (
                    <div className="absolute top-2.5 right-2.5 rounded-lg bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur-md border border-border/30 capitalize">
                        {stream.category.replace("-", " ")}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-4 flex flex-col justify-between">
                <div>
                    <div className="mb-2.5 flex items-center gap-2.5">
                        <Avatar author={stream.author} />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-foreground">
                                {stream.author?.name || "Broadcaster"}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                                @{stream.author?.handle || "broadcaster"}
                            </p>
                        </div>
                    </div>

                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground leading-snug group-hover:text-cyan-400 transition-colors">
                        {stream.title}
                    </h3>

                    {stream.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {stream.description}
                        </p>
                    )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
                    <span className="text-[11px]">
                        {isLive ? "Active now" : isReady ? "Host preparing" : "Concluded"}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-cyan-500 group-hover:translate-x-0.5 transition-transform text-[11px]">
                        {isLive ? "Watch Stream" : isReady ? "View Details" : "Stream Summary"}
                        <ArrowRight size={12} aria-hidden="true" />
                    </span>
                </div>
            </div>
        </Link>
    );
}
