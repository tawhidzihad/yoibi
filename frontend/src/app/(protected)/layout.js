"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    FileText,
    AtSign,
    Play,
    Radio,
    Users,
    MessageSquare,
    User,
    Plus,
} from "lucide-react";
import { YoibiLogo } from "../../shared/ui/YoibiLogo";
import { Dock, DockIcon } from "../../shared/ui/Dock";
import { cn } from "../../shared/utils/cn";
import { useRouter } from "next/navigation";

const navItems = [
    { href: "/feed",     label: "Feed",       icon: Home },
    { href: "/posts",    label: "Posts",      icon: FileText },
    { href: "/tweets",   label: "Tweets",     icon: AtSign },
    { href: "/videos",   label: "Videos",     icon: Play },
    { href: "/streams",  label: "Streams",    icon: Radio },
    { href: "/meetup",   label: "Meet Up",    icon: Users },
    { href: "/messages", label: "Messages",   icon: MessageSquare },
    { href: "/wall",     label: "My Wall",    icon: User },
];

const dockItems = [
    { icon: Home,         label: "Feed",     href: "/feed" },
    { icon: FileText,     label: "Posts",    href: "/posts" },
    { icon: AtSign,       label: "Tweets",   href: "/tweets" },
    { icon: Play,         label: "Videos",   href: "/videos" },
    { icon: Radio,        label: "Streams",  href: "/streams" },
    { icon: Users,        label: "Meet Up",  href: "/meetup" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: User,         label: "Wall",     href: "/wall" },
];

function LeftNav() {
    const pathname = usePathname();

    return (
        <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col border-r border-border/50 bg-background px-3 py-6">
            {/* Brand */}
            <Link
                href="/feed"
                className="mb-8 flex items-center gap-2.5 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg"
                aria-label="Yoibi home"
            >
                <YoibiLogo className="h-8 w-8 text-cyan-500" />
                <span className="text-lg font-bold tracking-tight text-foreground">Yoibi</span>
            </Link>

            {/* Navigation */}
            <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                                active
                                    ? "bg-cyan-500/10 text-cyan-600"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                            aria-current={active ? "page" : undefined}
                        >
                            <Icon size={18} aria-hidden="true" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* New Post CTA */}
            <Link
                href="/posts/new"
                className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
                <Plus size={16} aria-hidden="true" />
                New Post
            </Link>
        </aside>
    );
}

function RightPanel({ user }) {
    return (
        <aside className="sticky top-0 h-screen w-[260px] shrink-0 overflow-y-auto border-l border-border/50 bg-background px-4 py-6">
            {user ? (
                <div className="rounded-xl border border-border/50 bg-card p-4">
                    {/* Avatar */}
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                            <User size={20} className="text-cyan-500" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                                {user.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                @{user.handle}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3">
                        {[
                            { label: "Posts",     value: user.postsCount     ?? 0 },
                            { label: "Followers", value: user.followersCount ?? 0 },
                            { label: "Following", value: user.followingCount ?? 0 },
                        ].map(({ label, value }) => (
                            <div key={label} className="text-center">
                                <p className="text-sm font-bold text-foreground">{value}</p>
                                <p className="text-xs text-muted-foreground">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Profile link */}
                    <Link
                        href="/wall"
                        className="mt-3 block rounded-lg border border-border/60 bg-secondary py-1.5 text-center text-xs font-medium text-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                        View My Wall
                    </Link>
                </div>
            ) : (
                <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
                    <YoibiLogo className="mx-auto mb-3 h-8 w-8 text-cyan-500" />
                    <p className="mb-3 text-sm text-muted-foreground">Sign in to see your profile</p>
                    <Link
                        href="/login"
                        className="block rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                        Sign In
                    </Link>
                </div>
            )}
        </aside>
    );
}

export default function ProtectedLayout({ children }) {
    // user will come from auth context once Better Auth is integrated.
    // For Phase 1 mock: show placeholder state.
    const mockUser = null;
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="relative min-h-screen bg-background">
            {/* ── DESKTOP: 3-column grid ── */}
            <div className="hidden lg:flex lg:max-w-[1152px] lg:mx-auto">
                <LeftNav />

                <main
                    id="main-content"
                    className="flex-1 min-w-0 border-x border-border/50 pb-6 pt-6"
                    tabIndex={-1}
                >
                    {children}
                </main>

                <RightPanel user={mockUser} />
            </div>

            {/* ── MOBILE / TABLET: header + dock ── */}
            <div className="flex flex-col lg:hidden min-h-screen">
                {/* Mobile sticky header */}
                <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-background/95 px-4 backdrop-blur-sm">
                    <Link
                        href="/feed"
                        className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg"
                        aria-label="Yoibi home"
                    >
                        <YoibiLogo className="h-7 w-7 text-cyan-500" />
                        <span className="text-base font-bold tracking-tight text-foreground">Yoibi</span>
                    </Link>
                </header>

                <main id="main-content" className="flex-1 pb-24" tabIndex={-1}>
                    {children}
                </main>

                {/* Mobile bottom dock */}
                <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4">
                    <Dock>
                        {dockItems.map(({ icon: Icon, label, href }) => {
                            const active = pathname === href || pathname.startsWith(href + "/");
                            return (
                                <DockIcon
                                    key={href}
                                    active={active}
                                    onClick={() => router.push(href)}
                                    label={label}
                                >
                                    <Icon size={20} aria-hidden="true" />
                                </DockIcon>
                            );
                        })}
                    </Dock>
                </div>
            </div>
        </div>
    );
}
