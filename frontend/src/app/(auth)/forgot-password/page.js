import { Suspense } from "react";
import { ForgotPasswordForm } from "../../../features/auth/ui/ForgotPasswordForm";
import { LoadingFallback } from "../../../shared/feedback/LoadingFallback";

export const metadata = {
    title: "Reset Password",
    description: "Reset your Yoibi account password.",
};

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ForgotPasswordForm />
        </Suspense>
    );
}
