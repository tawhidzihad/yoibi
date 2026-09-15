"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
    User,
    Search,
    MoreHorizontal
} from "lucide-react";
import { YoibiLogo } from "../../shared/ui/YoibiLogo";
import { Avatar } from "../../shared/ui/Avatar";
import { Modal } from "../../shared/ui/Modal";
import { LoadingFallback } from "../../shared/feedback/LoadingFallback";
import { cn } from "../../shared/utils/cn";
import { useAuth } from "../../features/auth/context/AuthContext";
import { UserSearch } from "../../features/users/ui/UserSearch";

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

/** Canonical link to a user's own profile page (handle without the "@" prefix). */
function profilePathFor(user) {
    return user?.handle ? `/profile/${String(user.handle).replace(/^@/, "").trim()}` : "/feed";
}

function LeftNav({ user, onLogout }) {
    const pathname = usePathname();
    const isAdmin = user?.role === "admin";
    const profilePath = profilePathFor(user);
    const navItems = [
        { href: profilePath, label: "Profile", icon: User, exact: true },
        ...baseNavItems,
        ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
    ];

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
                {navItems.map(({ href, label, icon: Icon, exact }) => {
                    const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={label}
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

            {/* Logged-in account row + sign-out menu */}
            <AccountSwitcher user={user} onLogout={onLogout} />
        </aside>
    );
}

/**
 * Twitter-style account row for the bottom of the left sidebar: shows the
 * logged-in user (avatar, name, handle) with a kebab menu whose only action
 * is Sign Out.
 */
function AccountSwitcher({ user, onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const containerRef = useRef(null);
    const handle = user?.handle ? String(user.handle).replace(/^@/, "").trim() : "";

    useEffect(() => {
        if (!menuOpen) return undefined;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        const handleEsc = (e) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, [menuOpen]);

    const handleSignOut = () => {
        setMenuOpen(false);
        onLogout();
    };

    return (
        <div ref={containerRef} className="relative mt-2">
            {menuOpen && (
                <div
                    role="menu"
                    aria-label="Account options"
                    className="absolute bottom-full left-0 z-10 mb-2 w-48 overflow-hidden rounded-xl border border-border/60 bg-card py-1 shadow-lg"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-destructive"
                    >
                        <LogOut size={16} aria-hidden="true" />
                        Sign Out
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-secondary">
                <Avatar
                    src={user?.avatarUrl || ""}
                    name={user?.name || ""}
                    handle={handle}
                    size={36}
                />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                        {user?.name || user?.handle || "User"}
                    </p>
                    {handle && (
                        <p className="truncate text-xs text-muted-foreground">@{handle}</p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    className="cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    aria-label="Account options"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                >
                    <MoreHorizontal size={18} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

/**
 * Compact logged-in user card shown in the right sidebar while no search is
 * active — a lightweight "you" indicator with live counts (synced through
 * /auth/me via the profile-changed event, like before).
 */
function ProfileMiniCard({ user }) {
    const handle = user?.handle ? String(user.handle).replace(/^@/, "").trim() : "";
    return (
        <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="mb-3 flex items-center gap-3">
                <Avatar
                    src={user?.avatarUrl || ""}
                    name={user?.name || ""}
                    handle={handle}
                    size={40}
                />
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                        {user?.name || user?.handle || "User"}
                    </p>
                    {handle && (
                        <p className="truncate text-xs text-muted-foreground">@{handle}</p>
                    )}
                </div>
            </div>

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
        </div>
    );
}

function RightPanel({ user }) {
    return (
        <aside className="sticky top-0 h-screen w-[260px] shrink-0 overflow-y-auto border-l border-border/50 bg-background px-4 py-6">
            {/* People search — inline results, no modal on desktop */}
            <UserSearch
                idleContent={user ? <ProfileMiniCard user={user} /> : null}
            />
        </aside>
    );
}

/**
 * Compact profile-preview section at the top of the mobile drawer: banner,
 * avatar, name and handle — a glimpse of the profile page. The entire
 * section is one tappable area linking to the user's own profile.
 */
function DrawerProfilePreview({ user, onNavigate }) {
    const handle = user?.handle ? String(user.handle).replace(/^@/, "").trim() : "";
    return (
        <Link
            href={profilePathFor(user)}
            onClick={onNavigate}
            className="mb-6 block overflow-hidden rounded-xl border border-border/50 bg-card transition-colors hover:border-cyan-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            aria-label="View my profile"
        >
            {/* Banner (same deliberate gradient as the profile page when empty) */}
            <div className="relative h-16 w-full overflow-hidden bg-gradient-to-br from-cyan-500/15 via-secondary to-background">
                {user?.bannerUrl ? (
                    <Image
                        src={user.bannerUrl}
                        alt=""
                        fill
                        sizes="280px"
                        className="object-cover"
                    />
                ) : null}
            </div>
            <div className="px-3 pb-3">
                <div className="-mt-6 mb-1.5 w-fit rounded-full border-2 border-card">
                    <Avatar
                        src={user?.avatarUrl || ""}
                        name={user?.name || ""}
                        handle={handle}
                        size={48}
                    />
                </div>
                <p className="truncate text-sm font-bold text-foreground">
                    {user?.name || user?.handle || "User"}
                </p>
                {handle && (
                    <p className="truncate text-xs text-muted-foreground">@{handle}</p>
                )}
            </div>
        </Link>
    );
}

export default function ProtectedLayout({ children }) {
    const { status, user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsDrawerOpen(false);
        setIsSearchOpen(false);
    }, [pathname]);

    useEffect(() => {
        const overflowHidden = isDrawerOpen || isSearchOpen;
        document.body.style.overflow = overflowHidden ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isDrawerOpen, isSearchOpen]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                setIsDrawerOpen(false);
                setIsSearchOpen(false);
            }
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
                {/* Mobile sticky header — logo (left), search (middle), menu (right) */}
                <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-background/95 px-4 backdrop-blur-sm">
                    <Link
                        href="/feed"
                        className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        aria-label="Yoibi home"
                    >
                        <YoibiLogo className="h-7 w-7 text-cyan-500" />
                        <span className="text-lg font-bold tracking-tight text-foreground">Yoibi</span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center justify-center rounded-md p-2 text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        aria-label="Search people"
                    >
                        <Search size={22} aria-hidden="true" />
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

                {/* Mobile Search Modal — visually elevated above a dimmed/blurred page */}
                <Modal
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    title="Search people"
                    description="Find people by name or username."
                >
                    <UserSearch
                        autoFocus
                        onNavigate={() => setIsSearchOpen(false)}
                    />
                </Modal>

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
                        {/* Profile preview — replaces the old logo header; the
                            whole section links to the user's own profile */}
                        <DrawerProfilePreview
                            user={user}
                            onNavigate={() => setIsDrawerOpen(false)}
                        />

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
