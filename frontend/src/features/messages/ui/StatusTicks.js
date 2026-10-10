"use client";

import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export function StatusTicks({ status = "sent", className = "" }) {
    if (status === "sending") {
        return (
            <span title="Sending..." className={cn("inline-flex items-center text-muted-foreground/60", className)}>
                <Clock size={12} className="animate-spin text-muted-foreground/70" />
            </span>
        );
    }

    if (status === "failed") {
        return (
            <span title="Failed to send" className={cn("inline-flex items-center text-rose-500", className)}>
                <AlertCircle size={12} />
            </span>
        );
    }

    if (status === "read") {
        return (
            <span title="Read" className={cn("inline-flex items-center text-cyan-400 font-bold", className)}>
                <CheckCheck size={14} className="stroke-[2.5]" />
            </span>
        );
    }

    if (status === "delivered") {
        return (
            <span title="Delivered" className={cn("inline-flex items-center text-muted-foreground/80", className)}>
                <CheckCheck size={14} />
            </span>
        );
    }

    // Default sent
    return (
        <span title="Sent" className={cn("inline-flex items-center text-muted-foreground/70", className)}>
            <Check size={14} />
        </span>
    );
}
