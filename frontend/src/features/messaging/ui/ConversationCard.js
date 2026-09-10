import Image from "next/image";

function formatRelativeTime(isoString) {
    if (!isoString) return "";
    try {
        const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
        return new Date(isoString).toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
        return "";
    }
}

function UserAvatar({ name, avatarUrl }) {
    if (avatarUrl) {
        return (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/40">
                <Image
                    src={avatarUrl}
                    alt={name || "User"}
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized
                />
            </div>
        );
    }

    const initials = (name || "U")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-xs font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            {initials}
        </div>
    );
}

/**
 * Individual conversation card item for conversation list.
 */
export function ConversationCard({
    conversation,
    currentUserId,
    isActive,
    onSelect,
}) {
    // Other participant is the one that does not match current user ID
    const otherUser =
        conversation.participants?.find((p) => p.id !== currentUserId) ||
        conversation.participants?.[0] || {
            name: "User",
            handle: "@user",
        };

    const lastMessage = conversation.lastMessage;
    const timeDisplay = formatRelativeTime(
        lastMessage?.createdAt || conversation.updatedAt
    );
    const unreadCount = conversation.unreadCount || 0;

    return (
        <button
            type="button"
            id={`conversation-card-${conversation.id}`}
            onClick={() => onSelect(conversation.id)}
            className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer border-l-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                isActive
                    ? "bg-secondary/60 border-cyan-500 shadow-sm"
                    : "border-transparent hover:bg-secondary/30"
            }`}
            aria-current={isActive ? "page" : undefined}
        >
            <UserAvatar name={otherUser.name} avatarUrl={otherUser.avatarUrl} />

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-sm font-semibold text-foreground group-hover:text-cyan-500 transition-colors">
                        {otherUser.name || otherUser.handle || "Anonymous"}
                    </span>
                    {timeDisplay && (
                        <span className="shrink-0 text-[11px] text-muted-foreground font-medium">
                            {timeDisplay}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p
                        className={`truncate text-xs ${
                            unreadCount > 0
                                ? "font-medium text-foreground"
                                : "text-muted-foreground"
                        }`}
                    >
                        {lastMessage?.content || "Started conversation"}
                    </p>

                    {unreadCount > 0 && (
                        <span
                            id={`unread-badge-${conversation.id}`}
                            className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-white shadow-xs"
                        >
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}
