"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession, signIn, signUp, signOut } from "@/lib/auth-client";
import { authApi } from "@/lib/api/authApi";

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
                            isEmailVerified: Boolean(sessionData.user.emailVerified),
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

    const refreshUser = async () => {
        const res = await authApi.getMe();
        if (res.success && res.data) {
            setUser(res.data);
        }
    };

    const loginEmail = async ({ email, password }) => {
        const result = await signIn.email({
            email,
            password,
        });

        if (result.error) {
            throw new Error(result.error.message || "Invalid credentials.");
        }

        await refreshUser();
        return result;
    };

    const signupEmail = async ({ email, password, name, handle }) => {
        const result = await signUp.email({
            email,
            password,
            name,
            handle,
            // Signup must NOT automatically log the user in (approved rule).
            autoSignIn: false,
            // After the user clicks the verification link, Better Auth marks
            // the email verified and redirects here -> the login flow.
            callbackURL: "/login",
        });

        if (result.error) {
            throw new Error(result.error.message || "Signup failed.");
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
