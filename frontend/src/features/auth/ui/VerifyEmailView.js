"use client";

import { useState } from "react";
import Link from "next/link";
import { YoibiLogo } from "../../../shared/ui/YoibiLogo";
import { Button } from "../../../shared/ui/Button";

export function VerifyEmailView() {
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendError, setResendError] = useState(null);

    async function handleResend() {
        setIsResending(true);
        setResendError(null);
        try {
            await new Promise((r) => setTimeout(r, 800));
            // TODO Phase 4: call Better Auth resendVerificationEmail()
            setResendSuccess(true);
        } catch (err) {
            setResendError(err?.message ?? "Failed to resend. Please try again.");
        } finally {
            setIsResending(false);
        }
    }

    return (
        <div className="w-full max-w-md text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10">
                    <YoibiLogo className="h-10 w-10 text-cyan-500" />
                </div>
            </div>

            <h1 className="mb-3 text-2xl font-bold text-foreground">Verify your email</h1>

            <p className="mb-2 text-sm leading-relaxed text-muted-foreground">
                We{"'"}ve sent a verification link to your email address. Click the link in that email to
                activate your account.
            </p>

            <p className="mb-8 text-sm text-muted-foreground">
                Didn{"'"}t receive it? Check your spam folder or resend below.
            </p>

            {resendSuccess ? (
                <div
                    role="status"
                    className="mb-6 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-600"
                >
                    Verification email resent! Check your inbox.
                </div>
            ) : (
                <>
                    {resendError && (
                        <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {resendError}
                        </div>
                    )}
                    <Button
                        id="resend-verification-btn"
                        variant="outline"
                        onClick={handleResend}
                        loading={isResending}
                        className="mb-4 w-full"
                    >
                        Resend Verification Email
                    </Button>
                </>
            )}

            <div className="border-t border-border/50 pt-6">
                <p className="text-sm text-muted-foreground">
                    Already verified?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-cyan-600 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                    >
                        Sign in to your account
                    </Link>
                </p>
            </div>
        </div>
    );
}
