import { Suspense } from "react";
import { VerifyEmailView } from "../../../features/auth/ui/VerifyEmailView";
import { LoadingFallback } from "../../../shared/feedback/LoadingFallback";

export const metadata = {
    title: "Verify Your Email",
    description: "Verify your email to activate your Yoibi account.",
};

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <VerifyEmailView />
        </Suspense>
    );
}
