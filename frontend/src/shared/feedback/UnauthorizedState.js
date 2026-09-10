"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../utils/cn";

export function UnauthorizedState({
    title = "Sign in required",
    message = "You must be signed in to perform this action.",
    redirectPath = "/feed",
    actionName = "",
    className = "",
}) {
    const router = useRouter();

    const handleLogin = () => {
        const queryParams = new URLSearchParams();
        if (redirectPath) queryParams.set("redirect", redirectPath);
        if (actionName) queryParams.set("action", actionName);
        router.push(`/login?${queryParams.toString()}`);
    };

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-8 text-center",
                className
            )}
        >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                <Lock size={24} />
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {message && (
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {message}
                </p>
            )}
            <div className="mt-4 flex gap-3">
                <Button onClick={handleLogin} size="sm">
                    Log in
                </Button>
                <Button
                    onClick={() => router.push("/signup")}
                    variant="outline"
                    size="sm"
                >
                    Create account
                </Button>
            </div>
        </div>
    );
}
