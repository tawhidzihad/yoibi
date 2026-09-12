"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSession, signIn, signUp, signOut } from "@/lib/auth-client";
import { authApi } from "@/lib/api/authApi";
import { PROFILE_CHANGED_EVENT } from "@/lib/profileSync";

const AuthContext = createContext({
    status: "loading", // "loading" | "authenticated" | "unauthenticated"
    user: null,
    session: null,
    refreshUser: async () => {},
    loginEmail: async () => {},
    signupEmail: async () => {},
    logout: async () => {},
    loginGoogle: async () => {},
});

export function AuthProvider({ children }) {
    const { data: sessionData, isPending: isSessionPending } = useSession();
    const [status, setStatus] = useState("loading");
    const [user, setUser] = useState(null);

    useEffect(() => {
        let isCancelled = false;

        async function hydrate() {
            if (isSessionPending) {
                return;
            }

            if (!sessionData?.user) {
                if (!isCancelled) {
                    setUser(null);
                    setStatus("unauthenticated");
                }
                return;
            }

            try {
                const res = await authApi.getMe();
                if (!isCancelled) {
                    if (res.success && res.data) {
                        setUser(res.data);
                        setStatus("authenticated");
                    } else {
                        const fallbackUser = {
                            id: sessionData.user.id,
                            email: sessionData.user.email,
                            name: sessionData.user.name || "",
                            handle: sessionData.user.handle || (sessionData.user.email ? `@${sessionData.user.email.split("@")[0]}` : ""),
                            avatarUrl: sessionData.user.image || "",
                            role: sessionData.user.role || "user",
                        };
                        setUser(fallbackUser);
                        setStatus("authenticated");
                    }
                }
            } catch (err) {
                console.warn("[AuthContext] Hydration error:", err?.message);
                if (!isCancelled) {
                    setUser(null);
                    setStatus("unauthenticated");
                }
            }
        }

        hydrate();

        return () => {
            isCancelled = true;
        };
    }, [sessionData, isSessionPending]);

    const refreshUser = useCallback(async () => {
        const res = await authApi.getMe();
        if (res.success && res.data) {
            setUser(res.data);
            setStatus("authenticated");
        }
        return res;
    }, []);

    // Sidebar / right-side user card synchronization: features that change the
    // authenticated user's canonical data (tweet create/delete, follow/unfollow,
    // profile update) emit `yoibi:profile-changed` and AuthContext refetches
    // /auth/me — no duplicated count state anywhere in the app.
    useEffect(() => {
        const handler = () => {
            refreshUser().catch(() => {});
        };
        window.addEventListener(PROFILE_CHANGED_EVENT, handler);
        return () => window.removeEventListener(PROFILE_CHANGED_EVENT, handler);
    }, [refreshUser]);

    const loginEmail = async ({ email, password }) => {
        const result = await signIn.email({
            email,
            password,
        });

        if (result.error) {
            throw new Error(result.error.message || "Invalid credentials.");
        }

        // Better Auth's email/password session is now active (immediate login
        // is allowed — no verification step). Hydrate the authenticated YOIBI
        // profile from the backend BEFORE any navigation: the backend derives
        // identity from the verified JWT and upserts the canonical `users`
        // profile server-side, so `/auth/me` must be 200 before feed entry.
        try {
            const res = await authApi.getMe();
            if (res.success && res.data) {
                setUser(res.data);
                setStatus("authenticated");
            }
        } catch (err) {
            console.warn("[AuthContext] Post-login hydration retry:", err?.message);
            await refreshUser();
        }
        return result;
    };

    const signupEmail = async ({ email, password, name, onboarding }) => {
        const result = await signUp.email({
            email,
            password,
            name,
            // Signup creates an immediately usable authenticated account
            // (email verification is removed): autoSignIn establishes the
            // session so the caller can synchronize the YOIBI profile and
            // enter the app without a separate manual login step.
            autoSignIn: true,
        });
        const pendingOnboarding = onboarding || null;

        if (result.error) {
            throw new Error(result.error.message || "Signup failed.");
        }

        // Immediately hydrate: the first authenticated request upserts the
        // canonical `users` profile from the verified identity (idempotent —
        // no duplicate on later re-login). Then persist the signup onboarding
        // fields (country/age/phone/bio) through the authenticated profile
        // endpoint so the backend stores the canonical values.
        try {
            await authApi.getMe();
            if (pendingOnboarding) {
                const { usersApi } = await import("@/features/users/api/usersApi");
                await usersApi.updateUserProfile(pendingOnboarding);
            }
            await refreshUser();
        } catch (err) {
            console.warn("[AuthContext] Post-signup profile sync warning:", err?.message);
        }

        return result;
    };

    const loginGoogle = async () => {
        const result = await signIn.social({
            provider: "google",
            callbackURL: "/feed",
        });

        if (result?.error) {
            throw new Error(result.error.message || "Google sign in failed.");
        }
        return result;
    };

    const logout = async () => {
        await signOut();
        setUser(null);
        setStatus("unauthenticated");
    };

    return (
        <AuthContext.Provider
            value={{
                status,
                user,
                session: sessionData,
                refreshUser,
                loginEmail,
                signupEmail,
                logout,
                loginGoogle,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
