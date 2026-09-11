import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Authentication simplification regression tests.
 *
 * YOIBI uses ONLY email + password (no confirmation step) and Google OAuth.
 * Account-confirmation emails and password reset are removed:
 *   - `/verify-email` -> 404 (no page file)
 *   - `/forgot-password` -> 404 (no page file)
 *   - `/reset-password` -> 404 (no page file)
 *   - login UI has no "forgot password" entry point
 *   - signup UI has no confirmation-step instructions
 *   - Better Auth config has no email-sending or reset hooks
 */

const ROOT = path.resolve(import.meta.dirname, "..");

function readSrc(relativePath) {
    return readFileSync(path.join(ROOT, "src", relativePath), "utf8");
}

describe("removed auth routes (404 by file absence)", () => {
    const removedPages = [
        "app/(auth)/verify-email/page.js",
        "app/(auth)/forgot-password/page.js",
        "app/(auth)/reset-password/page.js",
    ];

    for (const page of removedPages) {
        it(`${page} does not exist`, () => {
            expect(existsSync(path.join(ROOT, "src", page))).toBe(false);
        });
    }

    it("removed auth UI components do not exist", () => {
        expect(existsSync(path.join(ROOT, "src/features/auth/ui/VerifyEmailView.js"))).toBe(false);
        expect(existsSync(path.join(ROOT, "src/features/auth/ui/ForgotPasswordForm.js"))).toBe(false);
        expect(existsSync(path.join(ROOT, "src/features/auth/ui/ResetPasswordForm.js"))).toBe(false);
        expect(existsSync(path.join(ROOT, "src/lib/email.js"))).toBe(false);
    });

    it("kept auth routes still exist", () => {
        expect(existsSync(path.join(ROOT, "src/app/(auth)/login/page.js"))).toBe(true);
        expect(existsSync(path.join(ROOT, "src/app/(auth)/signup/page.js"))).toBe(true);
    });
});

describe("Better Auth configuration (no confirmation step, no reset)", () => {
    const authSource = readSrc("lib/auth.js");

    it("enables email + password without an account gate or mailer hooks", () => {
        expect(authSource).toContain("emailAndPassword");
        expect(authSource).toContain("enabled: true");
    });

    it("configures no email-sending or password-reset hooks", () => {
        expect(authSource).not.toMatch(/sendVerificationEmail|sendOnSignUp|sendResetPassword/i);
        expect(authSource).not.toMatch(/requireEmailVerification|emailVerification/i);
    });

    it("keeps Google OAuth and the JWT plugin", () => {
        expect(authSource).toContain("google");
        expect(authSource).toContain("jwt(");
    });

    it("keeps rate-limit rules only for active sign-in/sign-up endpoints", () => {
        expect(authSource).toContain("/sign-in/email");
        expect(authSource).toContain("/sign-up/email");
        expect(authSource).not.toMatch(/forget-password|reset-password|send-verification-email/i);
    });
});

describe("auth client surface (email/password + Google only)", () => {
    const clientSource = readSrc("lib/auth-client.js");

    it("exposes only the core sign in/up/out and session actions", () => {
        for (const action of ["signIn", "signUp", "signOut", "useSession", "getSession"]) {
            expect(clientSource).toContain(action);
        }
    });

    it("exposes no confirmation/reset helpers", () => {
        expect(clientSource).not.toMatch(/sendVerificationEmail|verifyEmail|forgetPassword|resetPassword|sendResetPassword/i);
    });
});

describe("login UI (email/password + Google, no reset entry point)", () => {
    const loginSource = readSrc("features/auth/ui/LoginForm.js");

    it("keeps email/password login and Google login", () => {
        expect(loginSource).toMatch(/loginEmail|signIn/i);
        expect(loginSource).toMatch(/loginGoogle|Continue with Google/i);
    });

    it("has no forgot-password link or route reference", () => {
        expect(loginSource).not.toMatch(/forgot-password|reset-password|forgot password/i);
    });
});

describe("signup UI (immediate account, no confirmation step)", () => {
    const signupSource = readSrc("features/auth/ui/SignupForm.js");

    it("keeps the approved minimal fields", () => {
        for (const field of ["fullName", "email", "password", "confirmPassword", "age", "phone", "rulesAgreed"]) {
            expect(signupSource).toContain(field);
        }
    });

    it("redirects to login after signup (no confirmation page)", () => {
        expect(signupSource).toContain('router.push("/login")');
        expect(signupSource).not.toContain("/verify-email");
    });

    it("shows no confirmation-step UI copy", () => {
        expect(signupSource).not.toMatch(/verify-email|verification|resend|countdown|confetti/i);
    });
});

describe("auth context (simple loading/authenticated/unauthenticated states)", () => {
    const contextSource = readSrc("features/auth/context/AuthContext.js");

    it("uses only the three simple auth states", () => {
        expect(contextSource).toContain('"loading"');
        expect(contextSource).toContain('"authenticated"');
        expect(contextSource).toContain('"unauthenticated"');
    });

    it("has no confirmation-gated states", () => {
        expect(contextSource).not.toMatch(/email_not_verified|verification_pending|isEmailVerified/i);
    });

    it("signup does not auto sign in and has no confirmation redirect", () => {
        expect(contextSource).toContain("autoSignIn: false");
        expect(contextSource).not.toContain("/verify-email");
    });
});
