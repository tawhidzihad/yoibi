"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { YoibiLogo } from "../../../shared/ui/YoibiLogo";
import { Button } from "../../../shared/ui/Button";
import { verifyEmail, sendVerificationEmail } from "@/lib/auth-client";

export function VerifyEmailView() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [isVerifying, setIsVerifying] = useState(Boolean(token));
    const [verifySuccess, setVerifySuccess] = useState(false);
    const [verifyError, setVerifyError] = useState(null);

    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendError, setResendError] = useState(null);

    useEffect(() => {
        if (!token) return;
        let isMounted = true;

        async function doVerify() {
            setIsVerifying(true);
            setVerifyError(null);
            try {
                const res = await verifyEmail({
                    query: { token },
                });
                if (res.error) {
                    if (isMounted) setVerifyError(res.error.message || "Invalid or expired verification token.");
                } else {
                    if (isMounted) setVerifySuccess(true);
                }
            } catch (err) {
                if (isMounted) setVerifyError(err?.message || "Email verification failed.");
            } finally {
                if (isMounted) setIsVerifying(false);
            }
        }

        doVerify();

        return () => {
            isMounted = false;
        };
    }, [token]);

    async function handleResend() {
        if (!email) {
            setResendError("Please enter your email to resend verification.");
            return;
        }
        setIsResending(true);
        setResendError(null);
        try {
            const res = await sendVerificationEmail({
                email,
                callbackURL: "/login",
            });
            if (res.error) {
                setResendError(res.error.message || "Failed to resend verification email.");
            } else {
                setResendSuccess(true);
            }
        } catch (err) {
            setResendError(err?.message || "Failed to resend. Please try again.");
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

            {isVerifying ? (
                <div className="my-6 text-sm text-cyan-600 font-medium animate-pulse">
                    Verifying your email token with server...
                </div>
            ) : verifySuccess ? (
                <div className="mb-6 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-4 text-sm text-cyan-600">
                    <p className="font-semibold text-base mb-1">Email verified successfully!</p>
                    <p className="text-xs text-muted-foreground mb-4">You can now sign in to your account.</p>
                    <Link
                        href="/login"
                        className="inline-block rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                        Sign In Now
                    </Link>
                </div>
            ) : verifyError ? (
                <div role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-4 text-sm text-destructive">
                    <p className="font-semibold mb-1">Verification Failed</p>
                    <p className="text-xs">{verifyError}</p>
                </div>
            ) : (
                <p className="mb-2 text-sm leading-relaxed text-muted-foreground">
                    We{"'"}ve sent a verification link to your email address {email ? <span className="font-semibold text-foreground">({email})</span> : ""}. Click the link in that email to activate your account.
                </p>
            )}

            {!verifySuccess && (
                <p className="mb-8 text-sm text-muted-foreground">
                    Didn{"'"}t receive it? Check your spam folder or resend below.
                </p>
            )}

            {!verifySuccess && resendSuccess ? (
                <div
                    role="status"
                    className="mb-6 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-600"
                >
                    Verification email resent! Check your inbox.
                </div>
            ) : !verifySuccess ? (
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
            ) : null}

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

