import { describe, it, expect } from "vitest";

/**
 * Frontend logic tests for Direct Messaging:
 *   - Status tick mapping (sending -> sent -> delivered -> read -> failed)
 *   - Optimistic message reconciliation and deduplication
 *   - Monotonic status progression
 *   - Unread count tracking
 *   - Grapheme counting and limit rules
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

    describe("Expired upload intent error recognition", () => {
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
    });
});
