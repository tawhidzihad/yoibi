"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    AtSign,
    Play,
    Radio,
    Users,
    LogOut,
    Shield,
    Menu,
    User
} from "lucide-react";
import { YoibiLogo } from "../../shared/ui/YoibiLogo";
import { LoadingFallback } from "../../shared/feedback/LoadingFallback";
import { cn } from "../../shared/utils/cn";
import { useAuth } from "../../features/auth/context/AuthContext";

const baseNavItems = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/tweets", label: "Tweets", icon: AtSign },
    { href: "/videos", label: "Videos", icon: Play },
    { href: "/streams", label: "Streams", icon: Radio },
    { href: "/meetup", label: "Meet Up", icon: Users },
];

/**
 * Safely validates redirect return URLs to prevent open redirect vulnerabilities.
 */
function getSafeReturnUrl(pathname) {
    if (!pathname || typeof pathname !== "string" || !pathname.startsWith("/") || pathname.startsWith("//") || pathname.includes(":\\")) {
        return "/feed";
    }
    return pathname;
}

function LeftNav({ user, onLogout }) {
    const pathname = usePathname();
    const isAdmin = user?.role === "admin";
    const navItems = isAdmin
        ? [...baseNavItems, { href: "/admin", label: "Admin", icon: Shield }]
        : baseNavItems;

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
                            <span className="flex-1">{label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Sign Out Button */}
            <button
                type="button"
                onClick={onLogout}
                className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive rounded-lg cursor-pointer"
            >
                <LogOut size={18} aria-hidden="true" />
                Sign Out
            </button>
        </aside>
    );
}

function RightPanel({ user }) {
    const profileHandle = user?.handle ? String(user.handle).replace(/^@/, "").trim() : "";
    return (
        <aside className="sticky top-0 h-screen w-[260px] shrink-0 overflow-y-auto border-l border-border/50 bg-background px-4 py-6">
            {user ? (
                <div className="rounded-xl border border-border/50 bg-card p-4">
                    {/* Avatar */}
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-500 font-bold uppercase">
                            {user.avatarUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={user.avatarUrl} alt={user.name || user.handle} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                                (user.name?.[0] || user.handle?.[0] || "U")
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                                {user.name || user.handle || "User"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {user.handle ? (user.handle.startsWith("@") ? user.handle : `@${user.handle}`) : ""}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3">
                        {[
                            { label: "Posts", value: user.postsCount ?? 0 },
                            { label: "Followers", value: user.followersCount ?? 0 },
                            { label: "Following", value: user.followingCount ?? 0 },
                        ].map(({ label, value }) => (
                            <div key={label} className="text-center">
                                <p className="text-sm font-bold text-foreground">{value}</p>
                                <p className="text-xs text-muted-foreground">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Profile links — sign-out lives ONLY in the left sidebar */}
                    <div className="mt-3 flex flex-col gap-2">
                        {user.role === "admin" && (
                            <Link
                                href="/admin"
                                className="block rounded-lg border border-cyan-500/40 bg-cyan-500/10 py-1.5 text-center text-xs font-semibold text-cyan-500 transition-colors hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                            >
                                Admin Dashboard
                            </Link>
                        )}
                        <Link
                            href={profileHandle ? `/profile/${profileHandle}` : "/feed"}
                            className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-secondary py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        >
                            <User size={14} aria-hidden="true" />
                            My Profile
                        </Link>
                    </div>
                </div>
            ) : null}
        </aside>
    );
}

export default function ProtectedLayout({ children }) {
    const { status, user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsDrawerOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (isDrawerOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isDrawerOpen]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") setIsDrawerOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            const safeRedirect = getSafeReturnUrl(pathname);
            router.replace(`/login?redirect=${encodeURIComponent(safeRedirect)}`);
        } else if (status === "authenticated" && user?.isBlocked) {
            router.replace(`/account-blocked?reason=${encodeURIComponent(user.blockReason || "")}`);
        }
    }, [status, user, pathname, router]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <LoadingFallback label="Verifying session..." />
            </div>
        );
    }

    if (status === "unauthenticated" || (status === "authenticated" && user?.isBlocked)) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    return (
        <div className="relative min-h-screen bg-background">
            {/* ── DESKTOP: 3-column grid ── */}
            <div className="hidden lg:flex lg:max-w-[1152px] lg:mx-auto">
                <LeftNav user={user} onLogout={handleLogout} />

                <main
                    id="main-content"
                    className="flex-1 min-w-0 border-x border-border/50 pb-6 pt-6"
                    tabIndex={-1}
                >
                    {children}
                </main>

                <RightPanel user={user} />
            </div>

            {/* ── MOBILE / TABLET: header + drawer ── */}
            <div className="flex flex-col lg:hidden min-h-screen">
                {/* Mobile sticky header */}
                <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-background/95 px-4 backdrop-blur-sm">
                    <button
                        type="button"
                        onClick={() => setIsDrawerOpen(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 overflow-hidden"
                        aria-label="Open navigation menu"
                        aria-expanded={isDrawerOpen}
                        aria-controls="mobile-drawer"
                    >
                        {user?.avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={user.avatarUrl} alt={user.name || user.handle} className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-xs font-bold uppercase">{user?.name?.[0] || user?.handle?.[0] || "U"}</span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsDrawerOpen(true)}
                        className="flex items-center justify-center rounded-md p-2 text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        aria-label="Open navigation menu"
                        aria-expanded={isDrawerOpen}
                        aria-controls="mobile-drawer"
                    >
                        <Menu size={24} aria-hidden="true" />
                    </button>
                </header>

                <main id="main-content" className="flex-1 pb-6" tabIndex={-1}>
                    {children}
                </main>

                {/* Mobile Drawer Backdrop */}
                {isDrawerOpen && (
                    <div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsDrawerOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* Mobile Drawer */}
                <div
                    id="mobile-drawer"
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] transform bg-background border-r border-border/50 shadow-2xl transition-transform duration-300 ease-in-out motion-reduce:transition-none flex flex-col",
                        isDrawerOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Mobile navigation"
                >
                    <div className="flex-1 overflow-y-auto px-4 py-6">
                        <Link
                            href="/feed"
                            className="mb-8 flex items-center gap-2.5 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg"
                            onClick={() => setIsDrawerOpen(false)}
                        >
                            <YoibiLogo className="h-8 w-8 text-cyan-500" />
                            <span className="text-lg font-bold tracking-tight text-foreground">Yoibi</span>
                        </Link>

                        <nav aria-label="Mobile main navigation" className="flex flex-col gap-1">
                            {user?.role === "admin" && (
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                    onClick={() => setIsDrawerOpen(false)}
                                >
                                    <Shield size={20} aria-hidden="true" />
                                    <span>Admin</span>
                                </Link>
                            )}
                            {baseNavItems.map(({ href, label, icon: Icon }) => {
                                const active = pathname === href || pathname.startsWith(href + "/");
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                                            active
                                                ? "bg-cyan-500/10 text-cyan-600"
                                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                        )}
                                        aria-current={active ? "page" : undefined}
                                        onClick={() => setIsDrawerOpen(false)}
                                    >
                                        <Icon size={20} aria-hidden="true" />
                                        <span>{label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                        
                        <div className="mt-8 border-t border-border/50 pt-4">
                            <Link
                                href={user?.handle ? `/profile/${String(user.handle).replace(/^@/, "").trim()}` : "/feed"}
                                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                onClick={() => setIsDrawerOpen(false)}
                            >
                                <User size={20} aria-hidden="true" />
                                <span>My Profile</span>
                            </Link>
                        </div>
                    </div>

                    <div className="border-t border-border/50 p-4">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive cursor-pointer"
                        >
                            <LogOut size={20} aria-hidden="true" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

