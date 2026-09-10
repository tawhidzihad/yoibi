"use client";

import { useState } from "react";
import { MessageSquare, Send, Lock } from "lucide-react";

// Messaging uses a conversations list + chat window pattern.
// Socket.IO real-time and DM follow-rule enforcement deferred to Phase 4.

const mockConversations = [
    {
        id: "conv-1",
        participant: { id: "user-3", name: "Jordan Lee", handle: "jordanlee" },
        lastMessage: "Thanks for the stream recommendation!",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        unreadCount: 2,
    },
    {
        id: "conv-2",
        participant: { id: "user-2", name: "Priya Sharma", handle: "priyasharma" },
        lastMessage: "Did you see that last post?",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        unreadCount: 0,
    },
];

const mockMessages = {
    "conv-1": [
        { id: "msg-1", senderId: "user-3", content: "Hey! Loved your post yesterday.", sentAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
        { id: "msg-2", senderId: "current-user", content: "Thanks! Glad you enjoyed it.", sentAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
        { id: "msg-3", senderId: "user-3", content: "Thanks for the stream recommendation!", sentAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    ],
    "conv-2": [
        { id: "msg-4", senderId: "user-2", content: "Did you see that last post?", sentAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    ],
};

function formatRelative(isoString) {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

function Avatar({ name }) {
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-600">
            {initials}
        </div>
    );
}

export function ConversationsList({ activeId, onSelect }) {
    return (
        <div className="flex flex-col divide-y divide-border/50">
            {mockConversations.map((conv) => (
                <button
                    key={conv.id}
                    type="button"
                    id={`conversation-${conv.id}`}
                    onClick={() => onSelect(conv.id)}
                    className={`flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer w-full hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${activeId === conv.id ? "bg-secondary/40" : ""}`}
                    aria-current={activeId === conv.id ? "page" : undefined}
                >
                    <Avatar name={conv.participant.name} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium text-foreground">
                                {conv.participant.name}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                                {formatRelative(conv.lastMessageAt)}
                            </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-xs font-bold text-white">
                            {conv.unreadCount}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

export function ChatWindow({ conversationId }) {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState(mockMessages[conversationId] ?? []);
    const conv = mockConversations.find((c) => c.id === conversationId);

    function handleSend(e) {
        e.preventDefault();
        if (!input.trim()) return;
        // TODO Phase 4: Socket.IO dm:send event with follow-rule validation
        setMessages((prev) => [
            ...prev,
            {
                id: `msg-new-${Date.now()}`,
                senderId: "current-user",
                content: input.trim(),
                sentAt: new Date().toISOString(),
            },
        ]);
        setInput("");
    }

    if (!conv) return null;

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
                <Avatar name={conv.participant.name} />
                <div>
                    <p className="text-sm font-semibold text-foreground">{conv.participant.name}</p>
                    <p className="text-xs text-muted-foreground">@{conv.participant.handle}</p>
                </div>
            </div>

            {/* DM follow-rule notice */}
            <div className="border-b border-border/50 bg-secondary/30 px-4 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock size={10} aria-hidden="true" />
                You can only message users you follow (enforced server-side in Phase 4)
            </div>

            {/* Messages */}
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                {messages.map((msg) => {
                    const isOwn = msg.senderId === "current-user";
                    return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-xs rounded-2xl px-3.5 py-2 text-sm ${
                                    isOwn
                                        ? "bg-cyan-600 text-white rounded-br-sm"
                                        : "bg-secondary text-foreground rounded-bl-sm"
                                }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t border-border/50 p-3 flex gap-2">
                <input
                    id="chat-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message…"
                    autoComplete="off"
                    className="flex-1 rounded-xl border border-border/60 bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    aria-label="Message input"
                />
                <button
                    type="submit"
                    id="chat-send-btn"
                    disabled={!input.trim()}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-cyan-600 text-white transition-colors hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    aria-label="Send message"
                >
                    <Send size={16} aria-hidden="true" />
                </button>
            </form>
        </div>
    );
}

export function MessagingView() {
    const [activeConv, setActiveConv] = useState("conv-1");

    return (
        <div className="flex h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-0rem)]">
            {/* Sidebar */}
            <div className="w-full border-r border-border/50 sm:w-72 shrink-0">
                <div className="border-b border-border/50 px-4 py-3">
                    <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <MessageSquare size={18} aria-hidden="true" /> Messages
                    </h1>
                </div>
                <ConversationsList activeId={activeConv} onSelect={setActiveConv} />
            </div>

            {/* Chat pane */}
            <div className="hidden sm:flex flex-1 flex-col">
                <ChatWindow conversationId={activeConv} />
            </div>
        </div>
    );
}
