import { useState } from "react";
import { BlurFade, MagicCard, AvatarCircles } from "@/shared/ui";
import { meetupRooms } from "@/shared/api";
import type { MeetupRoom } from "@/shared/api";
import {
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  DoorOpen,
} from "lucide-react";

interface RoomCardProps {
  room: MeetupRoom;
  onJoin: (roomId: number) => void;
}

interface ActiveCallProps {
  room: MeetupRoom;
  onLeave: () => void;
}

function RoomCard({ room, onJoin }: RoomCardProps) {
  const avatarUrls = room.participants.map((p) => ({
    imageUrl: p.avatar,
    profileUrl: "#",
  }));

  return (
    <MagicCard className="p-5" gradientColor="#06b6d410">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{room.name}</h3>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {room.topic}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {room.participants.length}/{room.maxParticipants}
        </span>
      </div>
      <div className="mb-4">
        <AvatarCircles avatarUrls={avatarUrls} numPeople={0} />
        <div className="mt-2 flex flex-wrap gap-1">
          {room.participants.map((p) => (
            <span key={p.id} className="text-xs text-muted-foreground">
              {p.name.split(" ")[0]}
              {room.participants.indexOf(p) < room.participants.length - 1 && ","}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={() => onJoin(room.id)}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-cyan-600 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
      >
        <DoorOpen size={16} /> Join Room
      </button>
    </MagicCard>
  );
}

function ActiveCall({ room, onLeave }: ActiveCallProps) {
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{room.name}</h2>
          <p className="text-sm text-muted-foreground">
            {room.participants.length + 1} participants
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Connected
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div className="relative flex aspect-video items-center justify-center rounded-xl border-2 border-cyan-500 bg-secondary">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-600 text-lg font-bold text-white">
              You
            </div>
            <span className="text-xs text-foreground">You</span>
          </div>
          {!mic && (
            <div className="absolute bottom-2 right-2 rounded-full bg-red-600 p-1">
              <MicOff size={12} className="text-white" />
            </div>
          )}
        </div>
        {room.participants.map((p) => (
          <div
            key={p.id}
            className="relative flex aspect-video items-center justify-center rounded-xl border border-border bg-secondary"
          >
            <div className="text-center">
              <img
                src={p.avatar}
                alt={p.name}
                className="mx-auto mb-2 h-14 w-14 rounded-full"
              />
              <span className="text-xs text-foreground">
                {p.name.split(" ")[0]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setMic(!mic)}
          className={`cursor-pointer rounded-full p-3 transition-colors ${
            mic ? "bg-secondary text-foreground hover:bg-accent" : "bg-red-600 text-white"
          }`}
        >
          {mic ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button
          onClick={() => setCam(!cam)}
          className={`cursor-pointer rounded-full p-3 transition-colors ${
            cam ? "bg-secondary text-foreground hover:bg-accent" : "bg-red-600 text-white"
          }`}
        >
          {cam ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button className="cursor-pointer rounded-full bg-secondary p-3 text-foreground transition-colors hover:bg-accent">
          <Monitor size={20} />
        </button>
        <button
          onClick={onLeave}
          className="cursor-pointer rounded-full bg-red-600 p-3 text-white transition-colors hover:bg-red-700"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}

export default function MeetUp() {
  const [activeRoom, setActiveRoom] = useState<number | null>(null);

  const room = meetupRooms.find((r) => r.id === activeRoom);

  return (
    <div>
      <BlurFade delay={0.1}>
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Users size={24} className="text-cyan-400" />
            Meet Up
          </h1>
          <p className="text-sm text-muted-foreground">
            Video conferencing with other members
          </p>
        </div>
      </BlurFade>

      {activeRoom && room ? (
        <BlurFade delay={0.1}>
          <ActiveCall room={room} onLeave={() => setActiveRoom(null)} />
        </BlurFade>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meetupRooms.map((room, i) => (
            <BlurFade key={room.id} delay={0.1 + i * 0.05}>
              <RoomCard room={room} onJoin={setActiveRoom} />
            </BlurFade>
          ))}
        </div>
      )}
    </div>
  );
}
