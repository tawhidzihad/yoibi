"use client";

import { Users, Plus } from "lucide-react";
import { mockRooms } from "../api/mock-meetup";
import { Button } from "../../../shared/ui/Button";

function Avatar({ name }) {
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
    return (
        <div
            title={name}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-background bg-cyan-500/20 text-xs font-semibold text-cyan-600"
        >
            {initials}
        </div>
    );
}

function RoomCard({ room }) {
    const spotsLeft = room.maxParticipants - room.participants.length;
    const isFull = spotsLeft <= 0;

    return (
        <div className="rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-cyan-500/30">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm leading-snug">{room.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                        {room.topic}
                    </p>
                </div>
                {room.isLive && (
                    <span className="shrink-0 flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
                        Live
                    </span>
                )}
            </div>

            {/* Participant avatars */}
            <div className="mb-3 flex items-center gap-1">
                <div className="flex -space-x-2">
                    {room.participants.slice(0, 4).map((p) => (
                        <Avatar key={p.id} name={p.name} />
                    ))}
                </div>
                <span className="ml-2 text-xs text-muted-foreground">
                    {room.participants.length}/{room.maxParticipants}{" "}
                    <Users size={10} className="inline" aria-hidden="true" />
                </span>
            </div>

            <Button
                id={`join-room-${room.id}`}
                size="sm"
                variant={isFull ? "outline" : "primary"}
                disabled={isFull}
                className="w-full"
                onClick={() => {
                    // TODO Phase 4: LiveKit token fetch + room join
                    alert(`Join room "${room.name}" — LiveKit integration coming in Phase 4.`);
                }}
            >
                {isFull ? "Room Full" : "Join Room"}
            </Button>
        </div>
    );
}

export function MeetupView() {
    return (
        <div>
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <div>
                    <h1 className="text-lg font-bold text-foreground">Meet Up</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Video rooms for real conversations
                    </p>
                </div>
                <Button
                    id="create-room-btn"
                    size="sm"
                    variant="primary"
                    onClick={() => alert("Create Room — LiveKit integration coming in Phase 4.")}
                >
                    <Plus size={14} aria-hidden="true" /> New Room
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                {mockRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                ))}
            </div>
        </div>
    );
}
