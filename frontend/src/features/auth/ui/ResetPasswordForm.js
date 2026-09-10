"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { YoibiLogo } from "../../../shared/ui/YoibiLogo";

const resetSchema = z
    .object({
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(128, "Password is too long"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export function ResetPasswordForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isSubmitSuccessful },
        setError,
    } = useForm({
        resolver: zodResolver(resetSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    async function onSubmit(data) {
        try {
            if (!token) {
                setError("root", { message: "Reset token is missing. Please use the link from your email." });
                return;
            }
            console.log("Reset password submit with token:", token);
            await new Promise((r) => setTimeout(r, 600));
            // TODO Phase 4: call Better Auth resetPassword({ token, newPassword })
        } catch (err) {
            setError("root", { message: err?.message ?? "Something went wrong. Please try again." });
        }
    }

    if (isSubmitSuccessful) {
        return (
            <div className="w-full max-w-md text-center">
                <YoibiLogo className="mx-auto mb-4 h-12 w-12 text-cyan-500" />
                <h1 className="mb-2 text-2xl font-bold text-foreground">Password reset!</h1>
                <p className="mb-6 text-sm text-muted-foreground">
                    Your password has been updated. You can now sign in with your new password.
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                    Sign In
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
                <h1 className="text-2xl font-bold text-foreground">Set a new password</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    Choose a strong password for your account.
                </p>
            </div>

            <form
                id="reset-password-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="flex flex-col gap-4"
            >
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="reset-password" className="text-sm font-medium text-foreground">
                        New Password
                    </label>
                    <div className="relative">
                        <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <Input
                            id="reset-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            className="pl-9 pr-10"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? "reset-password-error" : undefined}
                            {...register("password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p id="reset-password-error" role="alert" className="text-xs text-destructive">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="reset-confirmPassword" className="text-sm font-medium text-foreground">
                        Confirm New Password
                    </label>
                    <div className="relative">
                        <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <Input
                            id="reset-confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Repeat your new password"
                            className="pl-9 pr-10"
                            aria-invalid={!!errors.confirmPassword}
                            aria-describedby={errors.confirmPassword ? "reset-confirmPassword-error" : undefined}
                            {...register("confirmPassword")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                        >
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p id="reset-confirmPassword-error" role="alert" className="text-xs text-destructive">
                            {errors.confirmPassword.message}
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
                    Reset Password
                </Button>
            </form>
        </div>
    );
}
