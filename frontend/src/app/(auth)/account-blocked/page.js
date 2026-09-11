"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldAlert, LogOut } from "lucide-react";
import { YoibiLogo } from "@/shared/ui/YoibiLogo";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { LoadingFallback } from "@/shared/feedback/LoadingFallback";
import { useAuth } from "@/features/auth/context/AuthContext";

function AccountBlockedContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { logout, user } = useAuth();
    const reason = searchParams.get("reason") || user?.blockReason || "Your account has been suspended for violating Yoibi Community Guidelines.";

    const handleSignOut = async () => {
        try {
            await logout();
        } catch (err) {
            console.error("Sign out error:", err);
        } finally {
            router.push("/login");
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center p-4">
            <Card className="w-full max-w-md border-destructive/30 bg-card/90 p-6 shadow-2xl backdrop-blur-xl">
                <div className="text-center space-y-3 pb-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 text-destructive ring-8 ring-destructive/10">
                        <ShieldAlert size={36} aria-hidden="true" />
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <YoibiLogo className="h-6 w-6 text-cyan-500" />
                        <span className="text-lg font-bold tracking-tight text-foreground">Yoibi Safety</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Account Suspended
                    </h1>
                </div>

                <div className="space-y-4 pt-2 text-center">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Access to your account has been temporarily restricted by a platform administrator.
                    </p>

                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-left">
                        <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
                            Reason for Suspension
                        </span>
                        <p className="mt-1 text-sm font-medium text-foreground">
                            {reason}
                        </p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        If you believe this is an error or wish to appeal, please contact Yoibi Support at support@yoibi.com.
                    </p>
                </div>

                <div className="pt-6">
                    <Button
                        variant="destructive"
                        className="w-full gap-2 rounded-xl py-2.5 font-semibold cursor-pointer"
                        onClick={handleSignOut}
                    >
                        <LogOut size={16} aria-hidden="true" />
                        Sign Out of Yoibi
                    </Button>
                </div>
            </Card>
        </div>
    );
}

export default function AccountBlockedPage() {
    return (
        <Suspense fallback={<LoadingFallback label="Loading account status..." />}>
            <AccountBlockedContent />
        </Suspense>
    );
}
