"use client";

import { useAuth } from "@/features/auth/context/AuthContext";
import { DirectMessagesView } from "@/features/messages";

export default function MessagePage() {
    const { user } = useAuth();

    return (
        <DirectMessagesView currentUserId={user?.id} />
    );
}
