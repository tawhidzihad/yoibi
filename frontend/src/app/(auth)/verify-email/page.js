"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Mail, RefreshCw, Copy } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { YoibiLogo } from "@/shared/ui/YoibiLogo";
import { useAuth } from "@/features/auth/context/AuthContext";
import { authApi } from "@/lib/api/authApi";

const verifySchema = z.object({
    code: z
        .string()
        .length(6, "Verification code must be 6 digits")
        .regex(/^\d{6}$/, "Verification code must contain only numbers"),
});

export default function VerifyEmailPage() {
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResendCooldown, setShowResendCooldown] = useState(false);
    const [copied, setCopied] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting: isFormSubmitting },
    } = useForm({
        resolver: zodResolver(verifySchema),
        defaultValues: { code: "" },
    });

    const formatCode = (value) => {
        return value.replace(/\D/g, "").slice(0, 6);
    };

    const onSubmit = async (data) => {
        setError("");
        setIsSubmitting(true);

        try {
            const res = await authApi.verifyCode(data.code);
            if (res.success) {
                // Refresh user to get updated emailVerified status
                await authApi.getMe();
                router.push("/feed");
                router.refresh();
            } else {
                setError(res.error?.message || "Invalid verification code. Please try again.");
            }
        } catch (err) {
            setError(err?.message || "Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Auto-send a verification code on first mount (right after signup or
    // redirect from a blocked login) so the user never has to click anything.
    // The backend enforces the 60-second resend cooldown — a 429 means a recent
    // code is already in flight and the user just needs to wait.
    useEffect(() => {
        let isCancelled = false;
        async function sendOnMount() {
            try {
                const res = await authApi.sendVerificationCode();
                if (isCancelled) return;
                if (!res.success && res.error?.code !== "RATE_LIMITED") {
                    setError(res.error?.message || "Failed to send verification email.");
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(err?.message || "Failed to send verification email.");
                }
            }
        }
        sendOnMount();
        return () => { isCancelled = true; };
    }, []);

    const handleResend = async () => {
        setError("");
        setIsSubmitting(true);

        try {
            const res = await authApi.sendVerificationCode();
            if (res.success) {
                setShowResendCooldown(true);
                setTimeout(() => setShowResendCooldown(false), 60000); // 60 second cooldown
            } else {
                setError(res.error?.message || "Failed to send verification email.");
            }
        } catch (err) {
            setError(err?.message || "Failed to send verification email.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyEmail = () => {
        if (user?.email) {
            navigator.clipboard.writeText(user.email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="w-full max-w-md">
            {/* Back to Home */}
            <div className="mb-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Back to Home
                </Link>
            </div>

            {/* Header */}
            <div className="mb-8 text-center">
                <Link href="/" aria-label="Back to home">
                    <YoibiLogo className="mx-auto mb-4 h-12 w-12 text-cyan-500" />
                </Link>
                <h1 className="text-2xl font-bold text-foreground">Verify Your Email</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    We need to verify your email address before you can continue.
                </p>
            </div>

            {/* Email address display */}
            <div className="mb-6 rounded-lg border border-border/60 bg-secondary/20 px-4 py-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sending to:</span>
                    <span className="flex items-center gap-2 font-mono text-foreground">
                        {user?.email || "••••••@••••👁"}
                        <button
                            onClick={handleCopyEmail}
                            className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                            aria-label="Copy email address"
                        >
                            <Copy size={14} />
                        </button>
                    </span>
                </div>
            </div>

            {/* Verification form */}
            <form
                id="verify-email-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="flex flex-col gap-4"
            >
                {/* Verification Code */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="verify-code" className="text-sm font-medium text-foreground">
                        Verification Code
                    </label>
                    <div className="relative">
                        <Mail
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            id="verify-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="6-digit code"
                            className="pl-9 text-center text-lg font-mono tracking-wider"
                            maxLength={6}
                            aria-invalid={!!errors.code}
                            aria-describedby={errors.code ? "verify-code-error" : undefined}
                            {...register("code")}
                        />
                    </div>
                    {errors.code && (
                        <p id="verify-code-error" role="alert" className="text-xs text-destructive">
                            {errors.code.message}
                        </p>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Submit button */}
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSubmitting || isFormSubmitting}
                    className="mt-2 w-full"
                >
                    Verify Email
                </Button>
            </form>

            {/* Resend section */}
            <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Did&#39;t receive the email?{" "}
                    {showResendCooldown ? (
                        <span className="text-muted-foreground">
                            Resend available in 60 seconds
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={isSubmitting}
                            className="font-medium text-cyan-600 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded disabled:opacity-50"
                        >
                            Resend verification email
                        </button>
                    )}
                </p>
            </div>

            {/* Sign in link */}
            <div className="mt-8 text-center">
                <Link
                    href="/login"
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    Need help? Contact support@yoibi.com
                </Link>
            </div>
        </div>
    );
}