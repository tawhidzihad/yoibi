"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Upload, X, User, Mail, Lock, Phone } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
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
        confirmPassword: z.string(),
        age: z
            .coerce.number({ invalid_type_error: "Age must be a number" })
            .int("Age must be a whole number")
            .min(16, "You must be at least 16 years old to sign up")
            .max(120, "Enter a valid age"),
        phone: z
            .string()
            .optional()
            .refine(
                (val) => !val || /^\+?[\d\s\-().]{7,20}$/.test(val),
                { message: "Enter a valid phone number" }
            ),
        rulesAgreed: z.literal(true, {
            errorMap: () => ({ message: "You must agree to the community rules" }),
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export function SignupForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
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
            password: "",
            confirmPassword: "",
            age: "",
            phone: "",
            rulesAgreed: false,
        },
    });

    function handlePhotoChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        const url = URL.createObjectURL(file);
        setPhotoPreview(url);
    }

    function clearPhoto() {
        setPhotoFile(null);
        setPhotoPreview(null);
    }

    async function onSubmit(data) {
        setSignupError("");
        try {
            const derivedHandle = `@${data.fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
            await signupEmail({
                email: data.email,
                password: data.password,
                name: data.fullName,
                handle: derivedHandle,
            });
            router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        } catch (err) {
            setSignupError(err?.message || "Signup failed. Please try again.");
        }
    }

    return (
        <div className="w-full max-w-md">
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
                        Sign in
                    </Link>
                </p>
            </div>

            <form
                id="signup-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="flex flex-col gap-4"
            >
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-fullName" className="text-sm font-medium text-foreground">
                        Full Name <span className="text-destructive" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                        <User
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            id="signup-fullName"
                            type="text"
                            autoComplete="name"
                            placeholder="Jane Doe"
                            className="pl-9"
                            aria-invalid={!!errors.fullName}
                            aria-describedby={errors.fullName ? "signup-fullName-error" : undefined}
                            {...register("fullName")}
                        />
                    </div>
                    {errors.fullName && (
                        <p id="signup-fullName-error" role="alert" className="text-xs text-destructive">
                            {errors.fullName.message}
                        </p>
                    )}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-email" className="text-sm font-medium text-foreground">
                        Email Address <span className="text-destructive" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                        <Mail
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            id="signup-email"
                            type="email"
                            autoComplete="email"
                            placeholder="jane@example.com"
                            className="pl-9"
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? "signup-email-error" : undefined}
                            {...register("email")}
                        />
                    </div>
                    {errors.email && (
                        <p id="signup-email-error" role="alert" className="text-xs text-destructive">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-password" className="text-sm font-medium text-foreground">
                        Password <span className="text-destructive" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                        <Lock
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            className="pl-9 pr-10"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? "signup-password-error" : undefined}
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
                        <p id="signup-password-error" role="alert" className="text-xs text-destructive">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-confirmPassword" className="text-sm font-medium text-foreground">
                        Confirm Password <span className="text-destructive" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                        <Lock
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            id="signup-confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Repeat your password"
                            className="pl-9 pr-10"
                            aria-invalid={!!errors.confirmPassword}
                            aria-describedby={errors.confirmPassword ? "signup-confirmPassword-error" : undefined}
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
                        <p id="signup-confirmPassword-error" role="alert" className="text-xs text-destructive">
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>

                {/* Age */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-age" className="text-sm font-medium text-foreground">
                        Age <span className="text-destructive" aria-hidden="true">*</span>
                    </label>
                    <Input
                        id="signup-age"
                        type="number"
                        min={16}
                        max={120}
                        placeholder="Must be 16 or older"
                        aria-invalid={!!errors.age}
                        aria-describedby={errors.age ? "signup-age-error" : undefined}
                        {...register("age")}
                    />
                    {errors.age && (
                        <p id="signup-age-error" role="alert" className="text-xs text-destructive">
                            {errors.age.message}
                        </p>
                    )}
                </div>

                {/* Phone (optional) */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-phone" className="text-sm font-medium text-foreground">
                        Phone Number{" "}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                        <Phone
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            id="signup-phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="+1 555 000 0000"
                            className="pl-9"
                            aria-invalid={!!errors.phone}
                            aria-describedby={errors.phone ? "signup-phone-error" : undefined}
                            {...register("phone")}
                        />
                    </div>
                    {errors.phone && (
                        <p id="signup-phone-error" role="alert" className="text-xs text-destructive">
                            {errors.phone.message}
                        </p>
                    )}
                </div>

                {/* Profile Photo (optional) */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground">
                        Profile Photo{" "}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                    </span>
                    {photoPreview ? (
                        <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={photoPreview}
                                alt="Profile photo preview"
                                className="h-14 w-14 rounded-full object-cover border border-border/60"
                            />
                            <button
                                type="button"
                                onClick={clearPhoto}
                                className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                            >
                                <X size={12} aria-hidden="true" /> Remove
                            </button>
                        </div>
                    ) : (
                        <label
                            htmlFor="signup-photo"
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border/70 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-cyan-500/50 hover:bg-secondary/60 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:ring-offset-1"
                        >
                            <Upload size={16} aria-hidden="true" />
                            <span>Click to upload a photo</span>
                            <input
                                id="signup-photo"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={handlePhotoChange}
                            />
                        </label>
                    )}
                </div>

                {/* Community Rules Agreement */}
                <div className="flex flex-col gap-1.5">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                            id="signup-rulesAgreed"
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-cyan-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                            aria-invalid={!!errors.rulesAgreed}
                            aria-describedby={errors.rulesAgreed ? "signup-rulesAgreed-error" : undefined}
                            {...register("rulesAgreed")}
                        />
                        <span className="text-sm text-muted-foreground leading-relaxed">
                            I have read and agree to the{" "}
                            <Link
                                href="/#community-rules"
                                className="font-medium text-cyan-600 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                            >
                                Yoibi Community Rules
                            </Link>
                            . I understand I must be at least 16 years old to use this platform.
                        </span>
                    </label>
                    {errors.rulesAgreed && (
                        <p id="signup-rulesAgreed-error" role="alert" className="text-xs text-destructive">
                            {errors.rulesAgreed.message}
                        </p>
                    )}
                </div>

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
                    className="mt-2 w-full"
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

