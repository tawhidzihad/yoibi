"use client";

import {
    Users,
    UserCheck,
    UserX,
    ShieldAlert,
    FileText,
    Play,
    Radio,
    UsersRound,
    Flag,
    RefreshCw
} from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";

export function StatsOverview({ stats, loading, onRefresh }) {
    if (!stats && loading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                    <Card key={i} className="h-28 animate-pulse bg-secondary/40 border-border/40" />
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const userStats = [
        {
            label: "Current Accounts",
            value: stats.currentUsers ?? 0,
            icon: Users,
            color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
            description: "Currently existing registered profiles",
        },
        {
            label: "Active Users",
            value: stats.activeUsers ?? 0,
            icon: UserCheck,
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            description: "Unrestricted accounts with standard access",
        },
        {
            label: "Blocked Accounts",
            value: stats.blockedUsers ?? 0,
            icon: UserX,
            color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
            description: "Reversibly suspended accounts",
        },
        {
            label: "Banned / Purged",
            value: stats.bannedUsers ?? 0,
            icon: ShieldAlert,
            color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
            description: "Permanently erased via Ban orchestrator",
        },
    ];

    const contentStats = [
        {
            label: "Total Tweets",
            value: stats.totalTweets ?? 0,
            icon: FileText,
            color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
            description: "Published social tweets & replies",
        },
        {
            label: "Total Videos",
            value: stats.totalVideos ?? 0,
            icon: Play,
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
            description: "Uploaded media assets on Cloudinary",
        },
        {
            label: "Live Streams",
            value: stats.liveStreams ?? 0,
            icon: Radio,
            color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
            description: "Active broadcasts on LiveKit SFU",
        },
        {
            label: "Meet-Up Rooms",
            value: stats.activeMeetUpRooms ?? 0,
            icon: UsersRound,
            color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
            description: "Active multi-peer collaborative rooms",
        },
        {
            label: "Pending Reports",
            value: stats.pendingReports ?? 0,
            icon: Flag,
            color: stats.pendingReports > 0 ? "text-amber-400 bg-amber-500/15 border-amber-500/30 ring-1 ring-amber-500/40" : "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
            description: "Awaiting moderator review & action",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header with refresh button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-foreground">Platform Metrics</h2>
                    <p className="text-xs text-muted-foreground">Aggregated real-time metrics across all domain collections.</p>
                </div>
                {onRefresh && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onRefresh}
                        disabled={loading}
                        className="gap-2 text-xs"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </Button>
                )}
            </div>

            {/* Account Metrics Grid */}
            <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    User Accounts & Governance
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {userStats.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Card key={item.label} className="p-4 border-border/50 bg-card/60 backdrop-blur-md">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                                        <p className="text-2xl font-black tracking-tight text-foreground">{item.value}</p>
                                    </div>
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${item.color}`}>
                                        <Icon size={18} aria-hidden="true" />
                                    </div>
                                </div>
                                <p className="mt-2 text-[11px] text-muted-foreground/80">{item.description}</p>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Content & Realtime Metrics Grid */}
            <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Domain Content & Realtime Sessions
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {contentStats.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Card key={item.label} className="p-4 border-border/50 bg-card/60 backdrop-blur-md">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                                        <p className="text-2xl font-black tracking-tight text-foreground">{item.value}</p>
                                    </div>
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${item.color}`}>
                                        <Icon size={18} aria-hidden="true" />
                                    </div>
                                </div>
                                <p className="mt-2 text-[11px] text-muted-foreground/80">{item.description}</p>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
