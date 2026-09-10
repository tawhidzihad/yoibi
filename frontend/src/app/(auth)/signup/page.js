import { Suspense } from "react";
import { SignupForm } from "../../../features/auth/ui/SignupForm";
import { LoadingFallback } from "../../../shared/feedback/LoadingFallback";

export const metadata = {
    title: "Create Account",
    description: "Create your free Yoibi account. Be you, be Yoibi.",
};

export default function SignupPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <SignupForm />
        </Suspense>
    );
}
