import { useState, useRef, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { BlurFade, MagicCard, BorderBeam } from "@/shared/ui";
import { videos, userMap, videoCategories } from "@/shared/api";
import type { Video } from "@/shared/api";
import {
  Play,
  Pause,
  Eye,
  Volume2,
  VolumeX,
  Maximize,
  Landmark,
  Newspaper,
  BookOpen,
  Building2,
  PartyPopper,
  MessageSquare,
  Mic,
  Tv,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = { Landmark, Newspaper, BookOpen, Building2, PartyPopper, MessageSquare, Mic, Tv };

function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface VideoCardProps {
  video: Video;
}

function VideoCard({ video }: VideoCardProps) {
  const user = userMap.get(video.userId)!;
  const [hovered, setHovered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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

  function handleTimeUpdate() {
    const vid = videoRef.current;
    if (!vid || !vid.duration) return;
    setProgress((vid.currentTime / vid.duration) * 100);
    setCurrentTime(vid.currentTime);
  }

  function handleLoadedMetadata() {
    const vid = videoRef.current;
    if (vid) setDuration(vid.duration);
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const vid = videoRef.current;
    if (!vid) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    vid.currentTime = pos * vid.duration;
  }

  function handleFullscreen() {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.requestFullscreen) vid.requestFullscreen();
  }

  function handleMouseMove() {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 2500);
  }

  function handleEnded() {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowControls(false); }}
    >
      <MagicCard className="overflow-hidden p-0" gradientColor="#06b6d410">
        <div
          className="relative"
          onMouseMove={playing ? handleMouseMove : undefined}
        >
          {!playing && (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="aspect-video w-full object-cover"
            />
          )}

          {playing && (
            <video
              ref={videoRef}
              src={video.videoUrl}
              className="aspect-video w-full object-cover"
              muted={muted}
              autoPlay
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
            />
          )}

          {!playing && (
            <div
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100"
              onClick={handlePlay}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-600/90 shadow-lg backdrop-blur-sm transition-transform hover:scale-110">
                <Play size={24} className="ml-1 text-white" fill="white" />
              </div>
            </div>
          )}

          {playing && (showControls || !playing) && (
            <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/10 transition-opacity" onClick={handlePlay}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform hover:scale-110">
                <Pause size={24} className="text-white" fill="white" />
              </div>
            </div>
          )}

          {playing && (
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 transition-opacity ${showControls ? "opacity-100" : "opacity-0"}`}>
              <div
                className="group mb-2 h-1 cursor-pointer rounded-full bg-white/30"
                onClick={handleProgressClick}
              >
                <div
                  className="relative h-full rounded-full bg-cyan-500 transition-all"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute -right-1.5 -top-1 h-3 w-3 rounded-full bg-white opacity-0 shadow group-hover:opacity-100" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); handlePlay(); }} className="text-white hover:text-cyan-400">
                    {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="text-white hover:text-cyan-400">
                    {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <span className="text-xs text-white/80">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleFullscreen(); }} className="text-white hover:text-cyan-400">
                  <Maximize size={16} />
                </button>
              </div>
            </div>
          )}

          {!playing && (
            <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
              {video.duration}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-foreground">
            {video.title}
          </h3>
          <div className="flex items-center gap-2">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-6 w-6 rounded-full"
            />
            <span className="text-xs text-muted-foreground">{user.name}</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye size={12} /> {formatViews(video.views)}
            </span>
          </div>
        </div>
        {hovered && !playing && <BorderBeam size={200} duration={8} />}
      </MagicCard>
    </div>
  );
}

export default function Videos() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? videos
      : videos.filter((v) => v.category === activeCategory);

  return (
    <div>
      <BlurFade delay={0.1}>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Exciting Videos
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Discover content across categories
        </p>
      </BlurFade>

      <BlurFade delay={0.2}>
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors ${
              activeCategory === "all"
                ? "bg-cyan-600 text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {videoCategories.map((cat) => {
            const Icon = iconMap[cat.icon];
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-colors ${
                  activeCategory === cat.id
                    ? "bg-cyan-600 text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {Icon && <Icon size={14} />} {cat.label}
              </button>
            );
          })}
        </div>
      </BlurFade>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((video, i) => (
          <BlurFade key={video.id} delay={0.1 + i * 0.05}>
            <VideoCard video={video} />
          </BlurFade>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          No videos in this category yet.
        </div>
      )}
    </div>
  );
}
