"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { Select } from "../../../shared/ui/Select";
import { Textarea } from "../../../shared/ui/Textarea";
import { GlowBorderCard } from "../../../shared/ui/GlowBorderCard";
import { COUNTRIES } from "../../../shared/constants/countries";
import {
    COMMUNITY_VALUES,
    COMMUNITY_VALUES_AGREEMENT_LABEL,
} from "../../../shared/constants/communityValues";
import { YoibiLogo } from "../../../shared/ui/YoibiLogo";
import { useAuth } from "../context/AuthContext";

const signupSchema = z
    .object({
        fullName: z
            .string()
            .min(2, "Full name must be at least 2 characters")
            .max(80, "Full name is too long"),
        email: z.string().email("Enter a valid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(128, "Password is too long"),
        confirmPassword: z.string().min(1, "Confirm your password"),
        age: z
            .string()
            .min(1, "Age is required")
            .refine(
                (val) => {
                    const n = Number(val);
                    return Number.isInteger(n) && n >= 16 && n <= 120;
                },
                { message: "You must be at least 16 years old to sign up" }
            ),
        bio: z
            .string()
            .max(280, "Say About You must be 280 characters or fewer")
            .optional(),
        country: z
            .string()
            .min(1, "Please select your country")
            .refine(
                (val) => COUNTRIES.some((c) => c.code === val),
                { message: "Please select a valid country" }
            ),
        communityValuesAgreed: z.literal(true, {
            errorMap: () => ({
                message: "You must agree to the community values to sign up",
            }),
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export function SignupForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [signupError, setSignupError] = useState("");
    const router = useRouter();
    const { signupEmail } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
            age: "",
            bio: "",
            country: "",
            communityValuesAgreed: false,
        },
    });

    async function onSubmit(data) {
        setSignupError("");
        try {
            await signupEmail({
                email: data.email,
                password: data.password,
                name: data.fullName,
                // The YOIBI handle is generated server-side from the verified
                // name — the client never submits it. avatarUrl stays null
                // until the user uploads one from their profile page.
                onboarding: {
                    country: data.country,
                    age: Number(data.age),
                    phone: data.phone || "",
                    bio: data.bio || "",
                },
            });
            // Signup signs the user in immediately; AuthContext
            // hydrates the canonical users profile before navigation.
            router.push("/feed");
            router.refresh();
        } catch (err) {
            setSignupError(err?.message || "Signup failed. Please try again.");
        }
    }

    return (
        <div className="w-full max-w-lg">
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
                <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-cyan-600 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                    >
                        Log in
                    </Link>
                </p>
            </div>

            <form
                id="signup-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="flex flex-col gap-6"
            >
                {/* ——— Account section (legacy-inspired hover border) ——— */}
                <GlowBorderCard>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Account
                    </h2>
                    <div className="flex flex-col gap-4">
                        <Input
                            id="signup-fullName"
                            label="Full Name"
                            required
                            autoComplete="name"
                            placeholder="John Doe"
                            error={errors.fullName?.message}
                            aria-invalid={!!errors.fullName}
                            {...register("fullName")}
                        />
                        <Input
                            id="signup-email"
                            label="Email Address"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="you@example.com"
                            error={errors.email?.message}
                            aria-invalid={!!errors.email}
                            {...register("email")}
                        />
                        <Input
                            id="signup-phone"
                            label="Telephone Number"
                            type="tel"
                            autoComplete="tel"
                            placeholder="+1 555 000 1234 (optional)"
                            error={errors.phone?.message}
                            aria-invalid={!!errors.phone}
                            {...register("phone")}
                        />
                    </div>
                </GlowBorderCard>

                {/* ——— Security section ——— */}
                <GlowBorderCard>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Security
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <Input
                                id="signup-password"
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                placeholder="At least 8 characters"
                                error={errors.password?.message}
                                aria-invalid={!!errors.password}
                                className="pr-10"
                                {...register("password")}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-[38px] cursor-pointer text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <div className="relative">
                            <Input
                                id="signup-confirmPassword"
                                label="Confirm Password"
                                type={showConfirm ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                placeholder="Re-enter your password"
                                error={errors.confirmPassword?.message}
                                aria-invalid={!!errors.confirmPassword}
                                className="pr-10"
                                {...register("confirmPassword")}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm((v) => !v)}
                                className="absolute right-3 top-[38px] cursor-pointer text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                                aria-label={showConfirm ? "Hide password" : "Show password"}
                            >
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                </GlowBorderCard>

                {/* ——— About You section ——— */}
                <GlowBorderCard>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        About You
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Input
                                id="signup-age"
                                label="Age"
                                type="number"
                                inputMode="numeric"
                                min={16}
                                max={120}
                                required
                                placeholder="16+"
                                error={errors.age?.message}
                                aria-invalid={!!errors.age}
                                {...register("age")}
                            />
                            <Select
                                id="signup-country"
                                label="Country"
                                required
                                error={errors.country?.message}
                                {...register("country")}
                            >
                                <option value="">Select a country…</option>
                                {COUNTRIES.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <Textarea
                            id="signup-bio"
                            label="Say About You"
                            rows={3}
                            maxLength={280}
                            placeholder="A few words about you (optional)"
                            error={errors.bio?.message}
                            aria-invalid={!!errors.bio}
                            {...register("bio")}
                        />
                    </div>
                </GlowBorderCard>

                {/* ——— Community Values section ——— */}
                <GlowBorderCard>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Community Values
                    </h2>
                    <ol className="mb-5 flex list-decimal flex-col gap-2.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                        {COMMUNITY_VALUES.map((value, index) => (
                            <li key={index} className="pl-1">
                                {value}
                            </li>
                        ))}
                    </ol>
                    <div className="flex flex-col gap-1.5">
                        <label className="flex cursor-pointer select-none items-start gap-3">
                            <input
                                id="signup-communityValuesAgreed"
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                aria-invalid={!!errors.communityValuesAgreed}
                                aria-describedby={
                                    errors.communityValuesAgreed
                                        ? "signup-communityValuesAgreed-error"
                                        : undefined
                                }
                                {...register("communityValuesAgreed")}
                            />
                            <span className="text-sm leading-relaxed text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    {COMMUNITY_VALUES_AGREEMENT_LABEL}
                                </span>
                            </span>
                        </label>
                        {errors.communityValuesAgreed && (
                            <p
                                id="signup-communityValuesAgreed-error"
                                role="alert"
                                className="text-xs text-destructive"
                            >
                                {errors.communityValuesAgreed.message}
                            </p>
                        )}
                    </div>
                </GlowBorderCard>

                {/* Root / Signup error */}
                {signupError && (
                    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {signupError}
                    </div>
                )}

                {/* Submit */}
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    className="mt-1 w-full"
                >
                    Create Account
                </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
                By creating an account you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                    Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                    Privacy Policy
                </Link>
                .
            </p>
        </div>
    );
}

