"use client";

import { Avatar } from "@/shared/ui/Avatar";
import { cn } from "@/shared/utils/cn";

export function ActiveFriendsRow({ friends = [], onSelectFriend, currentUserId }) {
    if (!friends || friends.length === 0) {
        return null;
    }

    return (
        <div className="border-b border-border/50 py-3">
            <div className="px-4 mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Active Friends
                </span>
                <span className="text-xs text-muted-foreground/70">
                    {friends.length} online
                </span>
            </div>
            <div className="flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-none">
                {friends.map((friend) => {
                    const handle = friend.handle ? String(friend.handle).replace(/^@/, "") : "";
                    const firstName = friend.name ? friend.name.split(" ")[0] : handle || "User";

                    return (
                        <button
                            key={friend.id || friend._id}
                            type="button"
                            onClick={() => onSelectFriend && onSelectFriend(friend)}
                            className="group flex flex-col items-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg p-1 transition-transform active:scale-95"
                            aria-label={`Chat with ${friend.name || handle}`}
                        >
                            <div className="relative">
                                <Avatar
                                    src={friend.avatarUrl || ""}
                                    name={friend.name || ""}
                                    handle={handle}
                                    size={48}
                                    className="transition-transform group-hover:scale-105"
                                />
                                <span
                                    className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500"
                                    title="Online"
                                />
                            </div>
                            <span className="max-w-[56px] truncate text-center text-xs font-medium text-foreground/80 group-hover:text-cyan-500">
                                {firstName}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
