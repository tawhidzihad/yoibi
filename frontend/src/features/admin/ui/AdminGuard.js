"use client";

import { useAuth } from "@/features/auth/context/AuthContext";
import { LoadingFallback } from "@/shared/feedback/LoadingFallback";
import { UnauthorizedState } from "@/shared/feedback/UnauthorizedState";

export function AdminGuard({ children }) {
    const { user, status } = useAuth();

    if (status === "loading") {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoadingFallback label="Verifying administrator privileges..." />
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return (
            <div className="p-6">
                <UnauthorizedState
                    title="Administrator Access Required"
                    description="You do not have permission to view or manage the Yoibi moderation dashboard. Please sign in with an administrator account."
                />
            </div>
        );
    }

    return <>{children}</>;
}
