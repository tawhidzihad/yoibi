"use client";

import { Radio, Users } from "lucide-react";
import { mockStreams } from "../api/mock-streams";

function Avatar({ name }) {
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-600">
            {initials}
        </div>
    );
}

function StreamCard({ stream }) {
    return (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden transition-colors hover:border-cyan-500/30">
            {/* Thumbnail placeholder */}
            <div className="relative aspect-video bg-secondary/50 flex items-center justify-center">
                <Radio size={28} className="text-muted-foreground/40" aria-hidden="true" />
                {stream.isLive && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                        LIVE
                    </span>
                )}
                <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-background/80 px-1.5 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
                    <Users size={10} aria-hidden="true" /> {stream.viewerCount}
                </span>
            </div>

            <div className="p-3">
                <div className="mb-2 flex items-center gap-2">
                    <Avatar name={stream.author.name} />
                    <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">@{stream.author.handle}</p>
                    </div>
                </div>
                <h3 className="line-clamp-2 text-sm font-semibold text-foreground leading-snug">
                    {stream.title}
                </h3>
            </div>
        </div>
    );
}

export function StreamsView() {
    return (
        <div>
            <div className="border-b border-border/50 px-4 py-3">
                <h1 className="text-lg font-bold text-foreground">Live Streams</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Go live in seconds · Build your audience in real-time
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                {mockStreams.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} />
                ))}
            </div>
        </div>
    );
}
