"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { YoibiLogo } from "../../../shared/ui/YoibiLogo";
import { forgetPassword } from "@/lib/auth-client";

const forgotSchema = z.object({
    email: z.string().email("Enter a valid email address"),
});

export function ForgotPasswordForm() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isSubmitSuccessful },
        setError,
        getValues,
    } = useForm({
        resolver: zodResolver(forgotSchema),
        defaultValues: { email: "" },
    });

    async function onSubmit(data) {
        try {
            const res = await forgetPassword({
                email: data.email,
                redirectTo: "/reset-password",
            });
            if (res?.error) {
                setError("root", { message: res.error.message || "Failed to send reset link." });
            }
        } catch (err) {
            setError("root", { message: err?.message ?? "Something went wrong. Please try again." });
        }
    }

    if (isSubmitSuccessful && !errors.root) {
        return (
            <div className="w-full max-w-md text-center">
                <YoibiLogo className="mx-auto mb-4 h-12 w-12 text-cyan-500" />
                <h1 className="mb-2 text-2xl font-bold text-foreground">Check your inbox</h1>
                <p className="mb-6 text-sm text-muted-foreground">
                    If an account exists for{" "}
                    <strong className="text-foreground">{getValues("email")}</strong>, you will receive a
                    password reset link shortly.
                </p>
                <Link
                    href="/login"
                    className="text-sm font-medium text-cyan-600 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                >
                    Back to Sign In
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md">
            <div className="mb-8 text-center">
                <Link href="/" aria-label="Back to home">
                    <YoibiLogo className="mx-auto mb-4 h-12 w-12 text-cyan-500" />
                </Link>
                <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    Enter your email and we{"'"}ll send you a reset link.
                </p>
            </div>

            <form
                id="forgot-password-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="flex flex-col gap-4"
            >
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="forgot-email" className="text-sm font-medium text-foreground">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            id="forgot-email"
                            type="email"
                            autoComplete="email"
                            placeholder="jane@example.com"
                            className="pl-9"
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? "forgot-email-error" : undefined}
                            {...register("email")}
                        />
                    </div>
                    {errors.email && (
                        <p id="forgot-email-error" role="alert" className="text-xs text-destructive">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                {errors.root && (
                    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {errors.root.message}
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    className="mt-2 w-full"
                >
                    Send Reset Link
                </Button>

                <p className="text-center text-sm">
                    <Link
                        href="/login"
                        className="font-medium text-cyan-600 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                    >
                        Back to Sign In
                    </Link>
                </p>
            </form>
        </div>
    );
}

