import { Outlet, useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { YoibiLogo } from "@/shared/ui";
import { MagicCard } from "@/shared/ui/magic-card";
import { Dock, DockIcon } from "@/shared/ui/dock";
import {
  Home,
  Video,
  MessageCircle,
  Radio,
  Users,
  PenSquare,
  Settings,
  User,
} from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface CurrentUser {
  name: string;
  handle: string;
  avatar: string;
  posts: number;
  followers: number;
  following: number;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Feed", path: "/feed" },
  { icon: Video, label: "Videos", path: "/videos" },
  { icon: MessageCircle, label: "Tweets", path: "/tweets" },
  { icon: Radio, label: "Streams", path: "/streams" },
  { icon: Users, label: "Meet Up", path: "/meetup" },
];

const currentUser: CurrentUser = {
  name: "Alex Rivera",
  handle: "@alexr",
  avatar: "https://i.pravatar.cc/150?img=11",
  posts: 128,
  followers: 1420,
  following: 384,
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            onClick={() => navigate("/")}
            className="flex cursor-pointer items-center gap-2"
          >
            <YoibiLogo className="h-11 w-11 text-cyan-500" />
            <span className="text-2xl font-bold text-cyan-500">YOIBI</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[220px_1fr_260px] lg:gap-6 lg:px-4">
        {/* Left sidebar — desktop only */}
        <aside className="hidden lg:block">
          <div className="sticky top-0 flex h-screen flex-col py-6">
            <button
              onClick={() => navigate("/")}
              className="mb-8 flex cursor-pointer items-center gap-2.5 px-3"
            >
              <YoibiLogo className="h-8 w-8 text-cyan-500" />
              <span className="text-xl font-bold text-cyan-500">YOIBI</span>
            </button>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${
                      active
                        ? "bg-secondary font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => navigate("/feed")}
              className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
            >
              <PenSquare size={18} />
              New Post
            </button>

          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 px-4 pb-24 pt-6 lg:px-0 lg:pb-6">
          <Outlet />
        </main>

        {/* Right sidebar — desktop only */}
        <aside className="hidden lg:block">
          <div className="sticky top-0 flex flex-col gap-4 py-6">
            <MagicCard className="p-5" gradientColor="#06b6d410">
              <button
                onClick={() => navigate("/wall")}
                className="flex w-full cursor-pointer items-center gap-3 text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-12 w-12 rounded-full bg-secondary transition-opacity hover:opacity-80"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-foreground truncate hover:underline">{currentUser.name}</div>
                  <div className="text-sm text-muted-foreground">{currentUser.handle}</div>
                </div>
              </button>
              <div className="mt-4 flex justify-between text-center">
                <div>
                  <div className="text-sm font-semibold text-foreground">{currentUser.posts}</div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{currentUser.followers.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{currentUser.following}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
              </div>
            </MagicCard>

            <MagicCard className="p-2" gradientColor="#06b6d410">
              <button
                onClick={() => navigate("/wall")}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary/60 hover:text-foreground ${
                  location.pathname === "/wall"
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <User size={18} />
                My Wall
              </button>
              <button className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground">
                <Settings size={18} />
                Settings
              </button>
            </MagicCard>
          </div>
        </aside>
      </div>

      {/* Mobile dock */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 lg:hidden">
        <Dock
          iconSize={40}
          iconMagnification={60}
          className="border-border/50 bg-background/80 backdrop-blur-xl"
        >
          {navItems.map((item) => (
            <DockIcon key={item.path} onClick={() => navigate(item.path)}>
              <item.icon
                size={20}
                className={
                  location.pathname === item.path
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              />
            </DockIcon>
          ))}
        </Dock>
      </div>
    </div>
  );
}
