"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { DirectMessagesView } from "@/features/messages";

export default function DirectMessageConversationPage() {
    const { user } = useAuth();
    const params = useParams();
    const conversationId = params?.conversationId;

    return (
        <DirectMessagesView
            currentUserId={user?.id}
            initialConversationId={conversationId}
            isMobileView={true}
        />
    );
}
