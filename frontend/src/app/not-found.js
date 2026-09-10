import Link from "next/link";
import { YoibiLogo } from "../shared/ui/YoibiLogo";

export const metadata = {
    title: "404 — Page Not Found",
};

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
            <YoibiLogo className="mb-6 h-16 w-16 text-cyan-500 opacity-40" />
            <h1 className="mb-2 text-5xl font-bold text-foreground">404</h1>
            <p className="mb-1 text-xl font-semibold text-foreground">Page not found</p>
            <p className="mb-8 text-sm text-muted-foreground">
                The page you are looking for does not exist or has been moved.
            </p>
            <Link
                href="/"
                className="rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
                Back to home
            </Link>
        </div>
    );
}
