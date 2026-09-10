import Image from "next/image";
import { ArrowLeft, Lock, UserCheck } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { TypingIndicator } from "./TypingIndicator";
import { ConnectionBadge } from "./MessageStatus";

function ParticipantAvatar({ name, avatarUrl }) {
    if (avatarUrl) {
        return (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border/50">
                <Image
                    src={avatarUrl}
                    alt={name || "Participant"}
                    fill
                    className="object-cover"
                    sizes="36px"
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            {initials}
        </div>
    );
}

/**
 * MessageThread view for active conversation displaying message history,
 * participant header, follow notice, typing indicators, and composer.
 */
export function MessageThread({
    conversation,
    messages = [],
    currentUserId,
    onSendMessage,
    onTypingStart,
    onTypingStop,
    isTyping = false,
    typingUser = null,
    isConnected = true,
    isReconnecting = false,
    onBack = null,
    errorMessage = null,
    onClearError = null,
    pendingClientMessageIds = new Set(),
}) {
    const messagesEndRef = useRef(null);

    const otherParticipant =
        conversation?.participants?.find((p) => p.id !== currentUserId) ||
        conversation?.participants?.[0] || {
            id: "",
            name: "Direct Message",
            handle: "@user",
        };

    const recipientId = otherParticipant.id;

    // Smoothly auto-scroll to the newest message at the bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    if (!conversation) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground bg-background/30">
                <div className="rounded-full bg-secondary/60 p-4 mb-3 border border-border/40">
                    <UserCheck size={32} className="text-cyan-500 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Select a conversation</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Choose an existing conversation from the list or start a new direct message.
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-background/30">
            {/* Thread Header */}
            <div className="flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md px-4 py-3 z-10">
                <div className="flex items-center gap-3 min-w-0">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="mr-1 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground sm:hidden cursor-pointer"
                            aria-label="Back to conversations"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <ParticipantAvatar
                        name={otherParticipant.name}
                        avatarUrl={otherParticipant.avatarUrl}
                    />
                    <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold text-foreground">
                            {otherParticipant.name || otherParticipant.handle}
                        </h2>
                        <p className="truncate text-xs text-muted-foreground">
                            {otherParticipant.handle ? `@${otherParticipant.handle.replace(/^@/, "")}` : ""}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ConnectionBadge isConnected={isConnected} isReconnecting={isReconnecting} />
                </div>
            </div>

            {/* Follow-Gated Rule Notice */}
            <div className="flex items-center gap-1.5 border-b border-cyan-500/10 bg-gradient-to-r from-cyan-500/5 to-transparent px-4 py-2 text-[11px] text-cyan-600 dark:text-cyan-400/90">
                <Lock size={12} className="shrink-0" />
                <span>
                    Follow-gated direct messaging active: you can message this user because you follow them.
                </span>
            </div>

            {/* Message History Scroll Container */}
            <div className="flex-1 overflow-y-auto py-3 space-y-1">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">No messages yet</p>
                        <p className="mt-1 text-[11px]">Send a greeting to start chatting!</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isOwn = msg.senderId === currentUserId;
                    const isPending = msg.clientMessageId
                        ? pendingClientMessageIds.has(msg.clientMessageId)
                        : false;

                    return (
                        <MessageBubble
                            key={msg.id || msg.clientMessageId || `msg_${msg.createdAt}`}
                            message={msg}
                            isOwn={isOwn}
                            isPending={isPending}
                        />
                    );
                })}

                {/* Ephemeral Typing Indicator */}
                {isTyping && <TypingIndicator username={typingUser || otherParticipant.name} />}

                {/* Auto-scroll target */}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <MessageComposer
                recipientId={recipientId}
                conversationId={conversation.id}
                onSendMessage={onSendMessage}
                onTypingStart={onTypingStart}
                onTypingStop={onTypingStop}
                errorMessage={errorMessage}
                onClearError={onClearError}
            />
        </div>
    );
}
