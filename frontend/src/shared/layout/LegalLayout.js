import Link from "next/link";
import { YoibiLogo } from "../ui/YoibiLogo";
import { cn } from "../utils/cn";

const container = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2";

function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
            <div className={cn(container, "flex h-16 items-center justify-between")}>
                <Link
                    href="/"
                    aria-label="Yoibi home"
                    className={cn("flex items-center gap-2.5 rounded-lg", focusRing)}
                >
                    <YoibiLogo className="h-8 w-8 text-cyan-500" />
                    <span className="text-lg font-bold tracking-tight text-foreground">Yoibi</span>
                </Link>
                <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
                    <Link
                        href="/login"
                        className={cn(
                            "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                            focusRing
                        )}
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/signup"
                        className={cn(
                            "inline-flex items-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700",
                            focusRing
                        )}
                    >
                        Join Yoibi
                    </Link>
                </nav>
            </div>
        </header>
    );
}

function SiteFooter() {
    return (
        <footer className="border-t border-border/60 bg-card/40">
            <div className={cn(container, "flex flex-col items-center gap-4 py-10 text-center")}>
                <div className="flex items-center gap-2">
                    <YoibiLogo className="h-6 w-6 text-cyan-500" />
                    <span className="text-base font-bold tracking-tight text-foreground">Yoibi</span>
                </div>
                <p className="text-sm text-muted-foreground">
                    Be you, be Yoibi. No algorithms. No manipulation. Just people.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                    <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
                        Privacy Policy
                    </Link>
                    <span aria-hidden="true" className="text-border">·</span>
                    <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                        Terms of Service
                    </Link>
                    <span aria-hidden="true" className="text-border">·</span>
                    <Link href="/" className="underline underline-offset-2 hover:text-foreground">
                        Home
                    </Link>
                </div>
            </div>
        </footer>
    );
}

export function LegalLayout({ children }) {
    return (
        <>
            <a
                href="#legal-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg"
            >
                Skip to content
            </a>
            <SiteHeader />
            <main
                id="legal-content"
                className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8"
            >
                {children}
            </main>
            <SiteFooter />
        </>
    );
}

export function LegalProse({ children }) {
    return (
        <div
            className={cn(
                "prose-legal",
                "text-[15px] leading-7 text-foreground/90",
                "[&>h2]:mt-10 [&>h2]:scroll-mt-20 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:tracking-tight [&>h2]:text-foreground sm:[&>h2]:text-[22px]",
                "[&>h3]:mt-8 [&>h3]:scroll-mt-20 [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-foreground sm:[&>h3]:text-[17px]",
                "[&>p]:mt-4 [&>p]:text-[15px] [&>p]:leading-7 [&>p]:text-foreground/85",
                "[&>ul]:mt-4 [&>ul]:list-disc [&>ul]:space-y-1.5 [&>ul]:pl-6 [&>ul]:text-[15px] [&>ul]:leading-7",
                "[&>ol]:mt-4 [&>ol]:list-decimal [&>ol]:space-y-1.5 [&>ol]:pl-6 [&>ol]:text-[15px] [&>ol]:leading-7",
                "[&>ul>li]:marker:text-muted-foreground [&>ol>li]:marker:text-muted-foreground [&>ol>li]:marker:font-medium",
                "[&>p>a]:text-cyan-700 [&>p>a]:underline [&>p>a]:decoration-cyan-500/30 [&>p>a]:underline-offset-2 hover:[&>p>a]:text-cyan-800 hover:[&>p>a]:decoration-cyan-600/60",
                "[&>ul>li>a]:text-cyan-700 [&>ul>li>a]:underline [&>ul>li>a]:decoration-cyan-500/30 [&>ul>li>a]:underline-offset-2",
                "[&>hr]:my-8 [&>hr]:border-border/60",
                "[&_mark]:rounded [&_mark]:bg-amber-100 [&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:text-amber-900"
            )}
        >
            {children}
        </div>
    );
}

export function Toc({ items }) {
    if (!items?.length) return null;
    return (
        <nav
            aria-label="On this page"
            className="rounded-2xl border border-border/60 bg-card/60 px-5 py-5 backdrop-blur-sm sm:px-6 sm:py-6"
        >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                On this page
            </p>
            <ol className="flex flex-col gap-1.5">
                {items.map(({ id, label }) => (
                    <li key={id}>
                        <a
                            href={`#${id}`}
                            className="text-sm leading-6 text-muted-foreground underline decoration-border underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                        >
                            {label}
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}

export const legalMetaBase = {
    openGraph: { type: "website" },
};