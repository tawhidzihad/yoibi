"use client";

import { Check, CheckCheck, Wifi, WifiOff, RefreshCw } from "lucide-react";

/**
 * Visual indicator for message delivery and read status.
 */
export function MessageDeliveryStatus({ isOwn, readAt, isPending }) {
    if (!isOwn) return null;

    if (isPending) {
        return <RefreshCw size={12} className="text-muted-foreground animate-spin inline-block ml-1" aria-label="Sending" />;
    }

    if (readAt) {
        return <CheckCheck size={14} className="text-cyan-400 inline-block ml-1" aria-label="Read" />;
    }

    return <Check size={14} className="text-muted-foreground/70 inline-block ml-1" aria-label="Sent" />;
}

/**
 * Socket.IO connection status badge.
 */
export function ConnectionBadge({ isConnected, isReconnecting }) {
    if (isReconnecting) {
        return (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500 border border-amber-500/20">
                <RefreshCw size={11} className="animate-spin" />
                <span>Reconnecting…</span>
            </div>
        );
    }

    if (isConnected) {
        return (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
                <Wifi size={11} />
                <span>Live</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-500 border border-rose-500/20">
            <WifiOff size={11} />
            <span>Offline</span>
        </div>
    );
}
