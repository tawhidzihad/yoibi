"use client";

import { useState } from "react";
import { Search, Plus, MessageSquare, ChevronLeft, ChevronRight, User } from "lucide-react";
import { ConversationCard } from "./ConversationCard";

/**
 * Sidebar conversation list supporting search, pagination, and new chat initiation.
 */
export function ConversationList({
    conversations,
    activeId,
    onSelectConversation,
    onStartNewChat,
    currentUserId,
    isLoading = false,
    pagination = null,
    onPageChange = null,
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [targetRecipientId, setTargetRecipientId] = useState("");

    const filteredConversations = (conversations || []).filter((conv) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const otherUser =
            conv.participants?.find((p) => p.id !== currentUserId) ||
            conv.participants?.[0];
        return (
            otherUser?.name?.toLowerCase().includes(q) ||
            otherUser?.handle?.toLowerCase().includes(q) ||
            conv.lastMessage?.content?.toLowerCase().includes(q)
        );
    });

    function handleCreateNewChat(e) {
        e.preventDefault();
        if (!targetRecipientId.trim()) return;
        if (onStartNewChat) {
            onStartNewChat(targetRecipientId.trim());
        }
        setTargetRecipientId("");
        setIsNewChatOpen(false);
    }

    return (
        <div className="flex h-full flex-col bg-background/50">
            {/* Header */}
            <div className="border-b border-border/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        <MessageSquare size={18} className="text-cyan-500" />
                        <span>Direct Messages</span>
                    </h2>
                    <button
                        type="button"
                        id="new-chat-btn"
                        onClick={() => setIsNewChatOpen(!isNewChatOpen)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/80 text-foreground hover:bg-cyan-500 hover:text-white transition-all cursor-pointer"
                        aria-label="New direct message"
                        title="New message"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {/* New chat modal / input dropdown */}
                {isNewChatOpen && (
                    <form
                        onSubmit={handleCreateNewChat}
                        className="rounded-xl border border-cyan-500/40 bg-secondary/40 p-2.5 space-y-2 animate-in fade-in duration-150"
                    >
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <User size={12} className="text-cyan-500" />
                            <span>Message a user you follow</span>
                        </div>
                        <input
                            type="text"
                            id="new-chat-recipient-input"
                            value={targetRecipientId}
                            onChange={(e) => setTargetRecipientId(e.target.value)}
                            placeholder="Recipient User ID (e.g. usr_123)"
                            className="w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none"
                            autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                            <button
                                type="button"
                                onClick={() => setIsNewChatOpen(false)}
                                className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                id="start-chat-submit-btn"
                                disabled={!targetRecipientId.trim()}
                                className="rounded-md bg-cyan-600 px-3 py-1 text-xs font-medium text-white hover:bg-cyan-700 disabled:opacity-50 cursor-pointer"
                            >
                                Start Chat
                            </button>
                        </div>
                    </form>
                )}

                {/* Search input */}
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                        type="text"
                        id="conversations-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations…"
                        className="w-full rounded-xl border border-border/50 bg-secondary/30 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:bg-background focus:outline-none"
                    />
                </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/30">
                {isLoading && (
                    <div className="flex items-center justify-center p-8 text-xs text-muted-foreground">
                        <div className="h-4 w-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mr-2" />
                        Loading conversations…
                    </div>
                )}

                {!isLoading && filteredConversations.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <MessageSquare size={32} className="stroke-1 text-muted-foreground/40 mb-2" />
                        <p className="text-xs font-medium">No conversations found</p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-[180px]">
                            Follow accounts to start sending direct messages.
                        </p>
                    </div>
                )}

                {!isLoading &&
                    filteredConversations.map((conv) => (
                        <ConversationCard
                            key={conv.id}
                            conversation={conv}
                            currentUserId={currentUserId}
                            isActive={activeId === conv.id}
                            onSelect={onSelectConversation}
                        />
                    ))}
            </div>

            {/* Standard page pagination footer */}
            {pagination && pagination.totalPages > 1 && (
                <div className="border-t border-border/50 p-2 flex items-center justify-between text-xs text-muted-foreground bg-background/50">
                    <span>
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            disabled={pagination.page <= 1}
                            onClick={() => onPageChange && onPageChange(pagination.page - 1)}
                            className="p-1 rounded hover:bg-secondary disabled:opacity-40 cursor-pointer"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            type="button"
                            disabled={!pagination.hasNextPage}
                            onClick={() => onPageChange && onPageChange(pagination.page + 1)}
                            className="p-1 rounded hover:bg-secondary disabled:opacity-40 cursor-pointer"
                            aria-label="Next page"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
