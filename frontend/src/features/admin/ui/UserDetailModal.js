"use client";

import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { UserCheck, UserX, ShieldAlert, Shield, Calendar, Mail, AtSign, Key } from "lucide-react";

export function UserDetailModal({
    isOpen,
    onClose,
    user,
    onOpenBlock,
    onOpenUnblock,
    onOpenBan,
}) {
    if (!user) return null;

    const isBlocked = user.isBlocked === true;
    const isAdmin = user.role === "admin";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="User Account Details"
            size="lg"
        >
            <div className="space-y-4">
                {/* Profile Header */}
                <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-secondary/30 p-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 font-bold text-lg uppercase ring-1 ring-cyan-500/30">
                        {user.avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={user.avatarUrl} alt={user.name || user.handle} className="h-14 w-14 rounded-2xl object-cover" />
                        ) : (
                            (user.name?.[0] || user.handle?.[0] || "U")
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-foreground truncate">{user.name || "Unnamed User"}</h3>
                            {isAdmin && (
                                <span className="rounded-md bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                                    <Shield size={10} /> Admin
                                </span>
                            )}
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${isBlocked ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"}`}>
                                {isBlocked ? "Blocked" : "Active"}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <AtSign size={12} /> {user.handle ? user.handle.replace(/^@/, "") : "no-handle"}
                        </p>
                    </div>
                </div>

                {/* Identity & Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-1">
                        <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                            <Key size={13} className="text-cyan-400" /> User Identity (Better Auth ID)
                        </div>
                        <div className="font-mono text-foreground break-all text-[11px] select-all bg-secondary/60 p-1.5 rounded-lg border border-border/40">
                            {user.id || user._id}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-1">
                        <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                            <Mail size={13} className="text-cyan-400" /> Email Address
                        </div>
                        <div className="text-foreground font-medium text-xs truncate">
                            {user.email || "No email on record"}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-1">
                        <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                            <Calendar size={13} className="text-cyan-400" /> Registered Since
                        </div>
                        <div className="text-foreground font-medium text-xs">
                            {user.createdAt ? new Date(user.createdAt).toLocaleString() : "Unknown"}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-1">
                        <div className="text-muted-foreground font-medium">Activity Stats</div>
                        <div className="flex gap-3 text-foreground font-semibold">
                            <span>{user.postsCount ?? 0} Posts</span>
                            <span>•</span>
                            <span>{user.followersCount ?? 0} Followers</span>
                            <span>•</span>
                            <span>{user.followingCount ?? 0} Following</span>
                        </div>
                    </div>
                </div>

                {/* Block Status Box if Blocked */}
                {isBlocked && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 space-y-1">
                        <div className="font-bold text-amber-200 flex items-center gap-1.5">
                            <UserX size={14} /> Active Suspension Reason:
                        </div>
                        <p className="text-amber-200/90 font-medium">
                            {user.blockReason || "No specific reason provided"}
                        </p>
                        {user.blockedAt && (
                            <p className="text-[10px] text-amber-400/80 pt-1">
                                Suspended on: {new Date(user.blockedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                )}

                {/* Moderation Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/40">
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        Close
                    </Button>

                    {!isAdmin && (
                        <div className="flex gap-2">
                            {isBlocked ? (
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        onClose();
                                        onOpenUnblock(user);
                                    }}
                                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                >
                                    <UserCheck size={14} /> Unblock
                                </Button>
                            ) : (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        onClose();
                                        onOpenBlock(user);
                                    }}
                                    className="gap-1.5 text-amber-400 hover:text-amber-300 text-xs border-amber-500/30 hover:bg-amber-500/10"
                                >
                                    <UserX size={14} /> Block Account
                                </Button>
                            )}

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    onClose();
                                    onOpenBan(user);
                                }}
                                className="gap-1.5 text-xs"
                            >
                                <ShieldAlert size={14} /> Permanent Ban
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
