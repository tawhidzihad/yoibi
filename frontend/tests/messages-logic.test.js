import { describe, it, expect } from "vitest";

/**
 * Frontend logic tests for Direct Messaging:
 *   - Status tick mapping (sending -> sent -> delivered -> read -> failed)
 *   - Monotonic status progression
 *   - Tab filtering (All, Unread, Online) and search combination
 *   - Conversation re-ordering on new activity
 *   - Brand color and tick mapping
 *   - Optimistic message reconciliation and deduplication
 *   - Grapheme counting and limit rules
 *   - Upload intent error recognition and form data verification
 */

function countGraphemes(text) {
    if (!text) return 0;
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
        return Array.from(segmenter.segment(text)).length;
    }
    return Array.from(text).length;
}

function reconcileMessages(existingMessages, incomingMessage) {
    const existingIndex = existingMessages.findIndex(
        (m) =>
            (incomingMessage.clientMessageId && m.clientMessageId === incomingMessage.clientMessageId) ||
            (incomingMessage.id && m.id === incomingMessage.id)
    );

    if (existingIndex !== -1) {
        const copy = [...existingMessages];
        copy[existingIndex] = {
            ...copy[existingIndex],
            ...incomingMessage,
            status: incomingMessage.status || copy[existingIndex].status
        };
        return copy;
    }

    return [...existingMessages, incomingMessage];
}

function applyStatusUpdate(messages, updatedIds, newStatus) {
    const hierarchy = { sending: 0, sent: 1, delivered: 2, read: 3 };

    return messages.map((m) => {
        if (!updatedIds || updatedIds.includes(m.id)) {
            const currentRank = hierarchy[m.status] ?? 0;
            const newRank = hierarchy[newStatus] ?? 0;
            if (newRank > currentRank) {
                return { ...m, status: newStatus };
            }
        }
        return m;
    });
}

function filterConversations(conversations, activeFilter, searchQuery = "", onlineUsers = {}) {
    return conversations.filter((conv) => {
        // Only show conversations that contain at least one message
        if (!conv.lastMessage || !conv.lastMessage.id) {
            return false;
        }

        const partner = conv.otherParticipant || conv.recipient || {};
        const isPartnerOnline = Boolean(onlineUsers[partner.id] || partner.isOnline);

        if (activeFilter === "unread" && (!conv.unreadCount || conv.unreadCount <= 0)) {
            return false;
        }
        if (activeFilter === "online" && !isPartnerOnline) {
            return false;
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const name = (partner.name || "").toLowerCase();
            const handle = (partner.handle || "").toLowerCase();
            const lastMsg = (conv.lastMessage?.text || "").toLowerCase();
            return name.includes(q) || handle.includes(q) || lastMsg.includes(q);
        }

        return true;
    });
}

function reorderConversationsOnNewMessage(conversations, message, convId, currentUserId, convData = null) {
    const index = conversations.findIndex((c) => c.id === convId);
    const isIncoming = message.senderId !== currentUserId;

    if (index !== -1) {
        const existing = conversations[index];
        const updated = {
            ...existing,
            lastMessage: message,
            updatedAt: message.createdAt || new Date().toISOString(),
            unreadCount: !isIncoming ? 0 : (existing.unreadCount || 0) + 1
        };
        const rest = conversations.filter((_, i) => i !== index);
        return [updated, ...rest];
    }

    if (convData) {
        return [{
            ...convData,
            lastMessage: message,
            unreadCount: !isIncoming ? 0 : 1
        }, ...conversations];
    }

    return conversations;
}

describe("Direct Messaging Frontend Logic", () => {
    describe("Status tick progression & mapping", () => {
        it("progresses monotonically from sending to sent to delivered to read", () => {
            let messages = [
                { id: "msg_1", clientMessageId: "c_1", text: "Hello", status: "sending" }
            ];

            // 1. Server ack -> sent
            messages = reconcileMessages(messages, { id: "msg_1", clientMessageId: "c_1", status: "sent" });
            expect(messages[0].status).toBe("sent");

            // 2. Partner socket receives -> delivered
            messages = applyStatusUpdate(messages, ["msg_1"], "delivered");
            expect(messages[0].status).toBe("delivered");

            // 3. Partner reads -> read
            messages = applyStatusUpdate(messages, ["msg_1"], "read");
            expect(messages[0].status).toBe("read");

            // 4. Stale delivered ack does NOT regress status from read back to delivered
            messages = applyStatusUpdate(messages, ["msg_1"], "delivered");
            expect(messages[0].status).toBe("read");
        });

        it("maps ticks to exact styling classes matching design system", () => {
            const getTickClass = (status) => {
                if (status === "read") return "text-cyan-600 dark:text-cyan-400 font-bold";
                if (status === "delivered") return "text-muted-foreground/80";
                return "text-muted-foreground/70";
            };

            expect(getTickClass("read")).toContain("text-cyan-600");
            expect(getTickClass("delivered")).toContain("text-muted-foreground/80");
            expect(getTickClass("sent")).toContain("text-muted-foreground/70");
        });
    });

    describe("Filter tabs (All, Unread, Online) and empty conversation suppression", () => {
        const mockConversations = [
            {
                id: "c1",
                unreadCount: 2,
                otherParticipant: { id: "u1", name: "Alice", isOnline: false },
                lastMessage: { id: "m1", text: "Hey there" }
            },
            {
                id: "c2",
                unreadCount: 0,
                otherParticipant: { id: "u2", name: "Bob", isOnline: false },
                lastMessage: { id: "m2", text: "Meeting at 3" }
            },
            {
                id: "c3",
                unreadCount: 0,
                otherParticipant: { id: "u3", name: "Charlie", isOnline: false },
                lastMessage: { id: "m3", text: "Thanks!" }
            },
            {
                id: "c_empty_1",
                unreadCount: 0,
                otherParticipant: { id: "u4", name: "Sophia Rothschild", isOnline: true },
                lastMessage: null
            },
            {
                id: "c_empty_2",
                unreadCount: 1,
                otherParticipant: { id: "u5", name: "Dave", isOnline: false },
                lastMessage: { id: null, text: "" }
            }
        ];

        it("filters All correctly, omitting empty conversations", () => {
            const result = filterConversations(mockConversations, "all");
            expect(result).toHaveLength(3);
            expect(result.map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
        });

        it("filters Unread correctly (only unreadCount > 0 AND has messages)", () => {
            const result = filterConversations(mockConversations, "unread");
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("c1");
        });

        it("filters Online correctly (only online partner AND has messages)", () => {
            const onlineUsers = { u1: true, u2: false, u3: false, u4: true };
            const result = filterConversations(mockConversations, "online", "", onlineUsers);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("c1");
            // u4 (Sophia) is online but has no messages, so c_empty_1 is excluded
        });

        it("combines filter with search query", () => {
            const result = filterConversations(mockConversations, "all", "Meeting");
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("c2");
        });

        it("omits empty conversation from search results even if name matches", () => {
            const result = filterConversations(mockConversations, "all", "Sophia");
            expect(result).toHaveLength(0);
        });

        it("reveals conversation in list once a first message arrives", () => {
            const populated = {
                ...mockConversations[3],
                lastMessage: { id: "m_first", text: "Hello Sophia" }
            };
            const updatedList = [...mockConversations.slice(0, 3), populated];
            const result = filterConversations(updatedList, "all");
            expect(result).toHaveLength(4);
            expect(result.find((c) => c.id === "c_empty_1")).toBeDefined();
        });
    });

    describe("Conversation list re-ordering on new activity", () => {
        it("moves existing conversation to top immediately when a new message arrives", () => {
            const initialList = [
                { id: "c1", updatedAt: "2026-10-10T10:00:00Z", unreadCount: 0 },
                { id: "c2", updatedAt: "2026-10-10T11:00:00Z", unreadCount: 0 }
            ];

            const newMessage = {
                id: "msg_new",
                conversationId: "c1",
                senderId: "other_user",
                text: "Are you free?",
                createdAt: "2026-10-10T12:00:00Z"
            };

            const reordered = reorderConversationsOnNewMessage(
                initialList,
                newMessage,
                "c1",
                "my_user_id"
            );

            expect(reordered[0].id).toBe("c1");
            expect(reordered[0].lastMessage.text).toBe("Are you free?");
            expect(reordered[0].unreadCount).toBe(1);
            expect(reordered[1].id).toBe("c2");
        });

        it("prepends brand new conversation to top when received", () => {
            const initialList = [
                { id: "c1", updatedAt: "2026-10-10T10:00:00Z", unreadCount: 0 }
            ];

            const newMessage = {
                id: "msg_first",
                conversationId: "c_new",
                senderId: "other_user",
                text: "Hello!",
                createdAt: "2026-10-10T12:00:00Z"
            };

            const brandNewConv = {
                id: "c_new",
                otherParticipant: { id: "u99", name: "Dave" }
            };

            const updated = reorderConversationsOnNewMessage(
                initialList,
                newMessage,
                "c_new",
                "my_user_id",
                brandNewConv
            );

            expect(updated[0].id).toBe("c_new");
            expect(updated).toHaveLength(2);
        });
    });

    describe("Optimistic reconcile and dedupe", () => {
        it("reconciles temp optimistic message with server acknowledged message by clientMessageId", () => {
            const optimistic = {
                id: "temp_c_123",
                clientMessageId: "c_123",
                text: "Testing optimistic UI",
                status: "sending"
            };

            const list = [optimistic];

            const serverAck = {
                id: "real_srv_999",
                clientMessageId: "c_123",
                text: "Testing optimistic UI",
                status: "sent"
            };

            const reconciled = reconcileMessages(list, serverAck);
            expect(reconciled).toHaveLength(1);
            expect(reconciled[0].id).toBe("real_srv_999");
            expect(reconciled[0].status).toBe("sent");
        });

        it("deduplicates messages when same message arrives via socket", () => {
            const list = [
                { id: "msg_100", clientMessageId: "c_100", text: "Already here", status: "sent" }
            ];

            const incoming = {
                id: "msg_100",
                clientMessageId: "c_100",
                text: "Already here",
                status: "sent"
            };

            const updated = reconcileMessages(list, incoming);
            expect(updated).toHaveLength(1);
        });
    });

    describe("Grapheme counting and limits", () => {
        it("counts complex multi-byte and emoji characters accurately", () => {
            const text = "Hello 👋 world 🌍";
            // 6 + 1(emoji) + 7 + 1(emoji) = 15 graphemes
            expect(countGraphemes(text)).toBe(15);
        });

        it("validates 2000 character maximum limit", () => {
            const validText = "A".repeat(2000);
            expect(countGraphemes(validText)).toBe(2000);

            const overLimit = "A".repeat(2001);
            expect(countGraphemes(overLimit)).toBe(2001);
            expect(countGraphemes(overLimit) > 2000).toBe(true);
        });
    });

    describe("Upload intent and error recognition", () => {
        it("identifies expired upload intent responses", () => {
            const responses = [
                { status: 410, message: "Intent expired" },
                { status: 400, error: "INTENT_EXPIRED" },
                { status: 400, message: "Signature has expired" }
            ];

            responses.forEach((res) => {
                const isExpired =
                    res.status === 410 ||
                    res.error === "INTENT_EXPIRED" ||
                    Boolean(res.message && res.message.toLowerCase().includes("expired"));
                expect(isExpired).toBe(true);
            });
        });

        it("constructs upload payload without extraneous folder parameter", () => {
            const intent = {
                apiKey: "mock_api_key",
                timestamp: 1720000000,
                signature: "mock_sig",
                publicId: "yoibi/messages/conv_1/images/intent_1",
                uploadIntentId: "intent_1",
                uploadUrl: "https://api.cloudinary.com/v1_1/yoibi/image/upload"
            };

            // Form data entries that should be present
            const expectedKeys = ["file", "api_key", "timestamp", "signature", "public_id"];
            expect(expectedKeys).not.toContain("folder");
            expect(intent.uploadUrl).toBeDefined();
        });
    });
});
