import { Suspense } from "react";
import { LoginForm } from "../../../features/auth/ui/LoginForm";
import { LoadingFallback } from "../../../shared/feedback/LoadingFallback";

export const metadata = {
    title: "Sign In",
    description: "Sign in to your Yoibi account.",
};

export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <LoginForm />
        </Suspense>
    );
}
