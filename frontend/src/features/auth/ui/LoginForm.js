"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { YoibiLogo } from "../../../shared/ui/YoibiLogo";
import { useAuth } from "../context/AuthContext";

const loginSchema = z.object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

function getSafeReturnUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.startsWith("/") || rawUrl.startsWith("//") || rawUrl.includes(":\\")) {
        return "/feed";
    }
    return rawUrl;
}

export function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [authError, setAuthError] = useState("");
    const searchParams = useSearchParams();
    const router = useRouter();
    const { loginEmail, loginGoogle } = useAuth();
    const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect") || "/feed";
    const safeReturnUrl = getSafeReturnUrl(returnUrl);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    async function onSubmit(data) {
        setAuthError("");
        try {
            await loginEmail({ email: data.email, password: data.password });
            router.push(safeReturnUrl);
        } catch (err) {
            setAuthError(err?.message || "Invalid email or password.");
        }
    }

    async function handleGoogleSignIn() {
        setAuthError("");
        try {
            await loginGoogle();
        } catch (err) {
            setAuthError(err?.message || "Google sign-in failed.");
        }
    }

    return (
        <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8 text-center">
                <Link href="/" aria-label="Back to home">
                    <YoibiLogo className="mx-auto mb-4 h-12 w-12 text-cyan-500" />
                </Link>
                <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    {"Don't have an account? "}
                    <Link
                        href="/signup"
                        className="font-medium text-cyan-600 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                    >
                        Sign up free
                    </Link>
                </p>
            </div>

            <form
                id="login-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="flex flex-col gap-4"
            >
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="login-email" className="text-sm font-medium text-foreground">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            placeholder="jane@example.com"
                            className="pl-9"
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? "login-email-error" : undefined}
                            {...register("email")}
                        />
                    </div>
                    {errors.email && (
                        <p id="login-email-error" role="alert" className="text-xs text-destructive">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                        Password
                    </label>
                    <div className="relative">
                        <Lock
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Your password"
                            className="pl-9 pr-10"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? "login-password-error" : undefined}
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
                        <p id="login-password-error" role="alert" className="text-xs text-destructive">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                {/* Root / Auth error */}
                {authError && (
                    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {authError}
                    </div>
                )}

                {/* Submit */}
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    className="mt-2 w-full"
                >
                    Sign In
                </Button>

                {/* Divider */}
                <div className="relative flex items-center gap-3 py-1">
                    <div className="flex-1 border-t border-border/60" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 border-t border-border/60" />
                </div>

                {/* Google OAuth button */}
                <button
                    type="button"
                    id="login-google-btn"
                    onClick={handleGoogleSignIn}
                    className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border/70 bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                    {/* Google SVG icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>
            </form>
        </div>
    );
}

