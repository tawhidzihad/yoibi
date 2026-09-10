import { Suspense } from "react";
import { ResetPasswordForm } from "../../../features/auth/ui/ResetPasswordForm";
import { LoadingFallback } from "../../../shared/feedback/LoadingFallback";

export const metadata = {
    title: "Set New Password",
    description: "Set a new password for your Yoibi account.",
};

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ResetPasswordForm />
        </Suspense>
    );
}
