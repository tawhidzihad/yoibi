import { useState, useRef, useEffect } from "react";
import { BlurFade, MagicCard, NumberTicker  } from "@/shared/ui";
import { streams, userMap } from "@/shared/api";
import type { Stream } from "@/shared/api";
import { Eye, Radio, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

interface StreamCardProps {
  stream: Stream;
}

function StreamCard({ stream }: StreamCardProps) {
  const user = userMap.get(stream.userId)!;
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (playing && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [playing]);

  function handlePlay() {
    if (playing) {
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      setPlaying(true);
    }
  }

  function handleMouseMove() {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 2500);
  }

  function handleFullscreen() {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.requestFullscreen) vid.requestFullscreen();
  }

  return (
    <MagicCard className="overflow-hidden p-0" gradientColor="#06b6d410">
      <div
        className="relative"
        onMouseMove={playing ? handleMouseMove : undefined}
        onMouseLeave={() => setShowControls(false)}
      >
        {!playing && (
          <img
            src={stream.thumbnail}
            alt={stream.title}
            className="aspect-video w-full object-cover"
          />
        )}

        {playing && (
          <video
            ref={videoRef}
            src={stream.videoUrl}
            className="aspect-video w-full object-cover"
            muted={muted}
            autoPlay
            loop
          />
        )}

        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          <span className="text-xs font-bold text-white">LIVE</span>
        </div>

        {!playing && (
          <div
            className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100"
            onClick={handlePlay}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/90 shadow-lg backdrop-blur-sm transition-transform hover:scale-110">
              <Play size={24} className="ml-1 text-white" fill="white" />
            </div>
          </div>
        )}

        {playing && showControls && (
          <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/10 transition-opacity" onClick={handlePlay}>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform hover:scale-110">
              <Pause size={24} className="text-white" fill="white" />
            </div>
          </div>
        )}

        {playing && (
          <div className={`absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 transition-opacity ${showControls ? "opacity-100" : "opacity-0"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={(e) => { e.stopPropagation(); handlePlay(); }} className="text-white hover:text-red-400">
                  <Pause size={16} fill="currentColor" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="text-white hover:text-red-400">
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <span className="text-xs text-white/80">LIVE</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleFullscreen(); }} className="text-white hover:text-red-400">
                <Maximize size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 backdrop-blur-sm">
          <Eye size={12} className="text-white" />
          <span className="text-xs text-white">
            <NumberTicker value={stream.viewers} />
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-foreground">
          {stream.title}
        </h3>
        <div className="flex items-center gap-2">
          <img
            src={user.avatar}
            alt={user.name}
            className="h-6 w-6 rounded-full"
          />
          <span className="text-xs text-muted-foreground">{user.name}</span>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {stream.category}
          </span>
        </div>
      </div>
    </MagicCard>
  );
}

export default function Streams() {
  const totalViewers = streams.reduce((sum, s) => sum + s.viewers, 0);

  return (
    <div className="relative">
      <BlurFade delay={0.1}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Radio size={24} className="text-red-400" />
              Livestreams
            </h1>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                <NumberTicker value={totalViewers} />
              </span>{" "}
              viewers right now
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-red-600/10 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-sm font-medium text-red-400">
              {streams.length} Live
            </span>
          </div>
        </div>
      </BlurFade>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {streams.map((stream, i) => (
          <BlurFade key={stream.id} delay={0.1 + i * 0.05}>
            <StreamCard stream={stream} />
          </BlurFade>
        ))}
      </div>
    </div>
  );
}
