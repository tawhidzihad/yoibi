"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { DirectMessagesView } from "@/features/messages";
import { LoadingFallback } from "@/shared/feedback/LoadingFallback";

function MessageContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const initialConversationId = searchParams.get("conversationId");

    return (
        <DirectMessagesView
            currentUserId={user?.id}
            initialConversationId={initialConversationId}
            isMobileView={false}
        />
    );
}

export default function MessagePage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-96 items-center justify-center">
                    <LoadingFallback label="Loading messages..." />
                </div>
            }
        >
            <MessageContent />
        </Suspense>
    );
}
