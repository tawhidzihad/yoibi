"use client";

import { useState, useMemo } from "react";
import { ConversationCard } from "./ConversationCard";
import { ActiveFriendsRow } from "./ActiveFriendsRow";
import { Search, CheckCircle2, MessageSquare, Users2, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export function InboxView({
    conversations = [],
    selectedConversationId = null,
    onSelectConversation,
    onSelectFriend,
    activeFriends = [],
    onlineUsers = {},
    typingUsers = {},
    connectionStatus = "connected",
    currentUserId,
    isLoading = false,
    className = ""
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all"); // "all" | "unread" | "online"

    const filters = [
        { id: "all", label: "All" },
        { id: "unread", label: "Unread" },
        { id: "online", label: "Online" }
    ];

    // Filter conversations
    const filteredConversations = useMemo(() => {
        return conversations.filter((conv) => {
            const partner = conv.otherParticipant || conv.recipient || {};
            const isPartnerOnline = Boolean(onlineUsers[partner.id] || partner.isOnline);

            // Tab filter
            if (activeFilter === "unread" && (!conv.unreadCount || conv.unreadCount <= 0)) {
                return false;
            }
            if (activeFilter === "online" && !isPartnerOnline) {
                return false;
            }

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const name = (partner.name || "").toLowerCase();
                const handle = (partner.handle || "").toLowerCase();
                const lastMsg = (conv.lastMessage?.text || "").toLowerCase();
                return name.includes(q) || handle.includes(q) || lastMsg.includes(q);
            }

            return true;
        });
    }, [conversations, activeFilter, searchQuery, onlineUsers]);

    return (
        <div className={cn("flex flex-col h-full bg-background select-none", className)}>
            {/* Header: flush with top, matching Feed / Tweets header style */}
            <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/60 bg-background/90 px-4 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                    <h1 className="text-lg font-bold tracking-tight text-foreground">
                        Messages
                    </h1>
                    {/* Connection status dot */}
                    <div className="flex items-center gap-1.5" title={`Status: ${connectionStatus}`}>
                        <span
                            className={cn(
                                "h-2 w-2 rounded-full",
                                connectionStatus === "connected" && "bg-emerald-500",
                                (connectionStatus === "connecting" || connectionStatus === "reconnecting") && "bg-amber-500 animate-pulse",
                                connectionStatus === "disconnected" && "bg-muted-foreground/50"
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-2.5">
                <div className="relative flex items-center">
                    <Search size={16} className="absolute left-3 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full rounded-xl border border-border/60 bg-secondary/50 py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:bg-background focus:outline-none"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 rounded-full p-1 text-muted-foreground hover:text-foreground"
                            aria-label="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs: exactly All, Unread, Online */}
            <div className="flex gap-1.5 px-4 pb-2 border-b border-border/40 overflow-x-auto scrollbar-none">
                {filters.map(({ id, label }) => {
                    const active = activeFilter === id;
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setActiveFilter(id)}
                            className={cn(
                                "rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer shrink-0",
                                active
                                    ? "bg-cyan-600 text-white shadow-xs"
                                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Active Friends Row */}
            {activeFilter === "all" && !searchQuery && activeFriends.length > 0 && (
                <ActiveFriendsRow
                    friends={activeFriends}
                    onSelectFriend={onSelectFriend}
                    currentUserId={currentUserId}
                />
            )}

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin">
                {isLoading && conversations.length === 0 ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                                <div className="h-11 w-11 rounded-full bg-secondary" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 rounded bg-secondary" />
                                    <div className="h-3 w-2/3 rounded bg-secondary/70" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredConversations.length > 0 ? (
                    filteredConversations.map((conv) => {
                        const partner = conv.otherParticipant || conv.recipient || {};
                        const isOnline = Boolean(onlineUsers[partner.id] || partner.isOnline);
                        const isTyping = Boolean(typingUsers[conv.id]?.size > 0);

                        return (
                            <ConversationCard
                                key={conv.id}
                                conversation={conv}
                                isActive={selectedConversationId === conv.id}
                                isTyping={isTyping}
                                isOnline={isOnline}
                                currentUserId={currentUserId}
                                onClick={() => onSelectConversation(conv)}
                            />
                        );
                    })
                ) : (
                    /* Specific empty states per tab */
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground my-auto">
                        {searchQuery ? (
                            <>
                                <Search size={28} className="text-muted-foreground/40 mb-2" />
                                <p className="text-sm font-medium">No results found</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    No conversations matching &ldquo;{searchQuery}&rdquo;
                                </p>
                            </>
                        ) : activeFilter === "unread" ? (
                            <>
                                <CheckCircle2 size={32} className="text-emerald-500/80 mb-2" />
                                <p className="text-sm font-semibold text-foreground">No unread messages</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    You don&apos;t have any unread messages.
                                </p>
                            </>
                        ) : activeFilter === "online" ? (
                            <>
                                <Users2 size={32} className="text-muted-foreground/40 mb-2" />
                                <p className="text-sm font-semibold text-foreground">No one is online</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    None of your conversation partners are currently online.
                                </p>
                            </>
                        ) : (
                            <>
                                <MessageSquare size={32} className="text-muted-foreground/40 mb-2" />
                                <p className="text-sm font-medium text-foreground">No conversations yet</p>
                                <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs leading-relaxed">
                                    Follow users and start a chat from their profile page.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
