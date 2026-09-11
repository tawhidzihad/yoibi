"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Layers,
    Flag,
    FileText,
    Shield,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

const navTabs = [
    { href: "/admin",            label: "Overview",   icon: LayoutDashboard, exact: true },
    { href: "/admin/users",      label: "Users",      icon: Users },
    { href: "/admin/content",    label: "Content",    icon: Layers },
    { href: "/admin/reports",    label: "Reports",    icon: Flag },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
];

export function AdminNav({ pendingReportsCount }) {
    const pathname = usePathname();

    return (
        <header className="mb-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 ring-1 ring-cyan-500/30">
                        <Shield size={22} aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            Admin & Moderation
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Platform governance, user account controls, content moderation, and audit trails.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <nav aria-label="Admin tabs" className="flex overflow-x-auto border-b border-border/40 pb-px">
                <div className="flex gap-2">
                    {navTabs.map(({ href, label, icon: Icon, exact }) => {
                        const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
                        const isReports = href === "/admin/reports";

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                                    active
                                        ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-xs"
                                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground border border-transparent"
                                )}
                            >
                                <Icon size={16} aria-hidden="true" />
                                <span>{label}</span>
                                {isReports && typeof pendingReportsCount === "number" && pendingReportsCount > 0 && (
                                    <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                                        {pendingReportsCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </header>
    );
}
