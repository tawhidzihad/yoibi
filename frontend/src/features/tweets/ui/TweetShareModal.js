"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/utils/cn";

/**
 * Canonical, shareable URL for a tweet — its individual dynamic page
 * (`/tweets/[tweetId]`).
 *
 * NOTE: the previous implementation copied `<origin>/feed#<tweetId>`, a hash
 * fragment on the feed. Individual tweets are real dynamic routes now, so that
 * fragment never resolved to a tweet. Every share path (copy + social) must go
 * through this single helper.
 */
export function buildTweetShareUrl(tweetId) {
    const origin =
        typeof window !== "undefined" && window.location
            ? window.location.origin
            : "";
    return `${origin}/tweets/${tweetId}`;
}

/**
 * lucide-react no longer ships brand marks, so the platform glyphs below are
 * inline single-path icons rendered at the app's standard 16px inline size and
 * inherit `currentColor` like every other icon in the design system.
 */
function BrandIcon({ children }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
            className="shrink-0"
        >
            {children}
        </svg>
    );
}

function XIcon() {
    return (
        <BrandIcon>
            <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
        </BrandIcon>
    );
}

function FacebookIcon() {
    return (
        <BrandIcon>
            <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
        </BrandIcon>
    );
}

function WhatsAppIcon() {
    return (
        <BrandIcon>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </BrandIcon>
    );
}

function LinkedInIcon() {
    return (
        <BrandIcon>
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </BrandIcon>
    );
}

/**
 * Share targets that work with plain share-URL schemes (no OAuth, no SDK):
 * each opens the platform's own composer in a new tab.
 */
const SOCIAL_TARGETS = [
    {
        id: "x",
        label: "X",
        Icon: XIcon,
        hoverClassName: "hover:border-foreground/30 hover:text-foreground",
        buildHref: ({ url, text }) =>
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
        id: "facebook",
        label: "Facebook",
        Icon: FacebookIcon,
        hoverClassName: "hover:border-blue-500/40 hover:text-blue-500",
        buildHref: ({ url }) =>
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
        id: "whatsapp",
        label: "WhatsApp",
        Icon: WhatsAppIcon,
        hoverClassName: "hover:border-emerald-500/40 hover:text-emerald-500",
        buildHref: ({ url, text }) =>
            `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    },
    {
        id: "linkedin",
        label: "LinkedIn",
        Icon: LinkedInIcon,
        hoverClassName: "hover:border-sky-500/40 hover:text-sky-500",
        buildHref: ({ url }) =>
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
];

/**
 * Share sheet for a tweet: copy the canonical tweet URL, or hand the tweet to a
 * social platform's own composer. Opens in place of the old instant
 * clipboard copy, reusing the shared Modal primitive (backdrop click, close
 * button and Escape all dismiss it).
 */
export function TweetShareModal({
    isOpen,
    onClose,
    tweetId,
    tweetContent = "",
    authorHandle = "",
}) {
    const [copied, setCopied] = useState(false);
    const copyTimerRef = useRef(null);

    // Never leave a pending "Copied" reset timer behind on unmount.
    useEffect(() => {
        return () => {
            if (copyTimerRef.current) {
                clearTimeout(copyTimerRef.current);
            }
        };
    }, []);

    const shareUrl = buildTweetShareUrl(tweetId);
    const cleanHandle = String(authorHandle || "").replace(/^@/, "");
    const excerpt = tweetContent.trim().slice(0, 200);
    const shareText = [excerpt, cleanHandle ? `— @${cleanHandle} on Yoibi` : "on Yoibi"]
        .filter(Boolean)
        .join(" ");

    const handleClose = () => {
        if (copyTimerRef.current) {
            clearTimeout(copyTimerRef.current);
            copyTimerRef.current = null;
        }
        setCopied(false);
        onClose?.();
    };

    const handleCopyLink = async () => {
        if (typeof navigator === "undefined" || !navigator.clipboard) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
            copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.warn("[TweetShareModal] Copy link failed:", err);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Share tweet" size="md">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    {SOCIAL_TARGETS.map(({ id, label, Icon, buildHref, hoverClassName }) => (
                        <a
                            key={id}
                            href={buildHref({ url: shareUrl, text: shareText })}
                            target="_blank"
                            rel="noopener noreferrer"
                            id={`tweet-share-${id}-${tweetId}`}
                            className={cn(
                                "flex cursor-pointer items-center gap-2 rounded-xl border border-border/70 bg-secondary/20 px-3 py-2.5 text-xs font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                                hoverClassName
                            )}
                        >
                            <Icon />
                            <span>{label}</span>
                        </a>
                    ))}
                </div>

                <div className="space-y-2 border-t border-border/60 pt-4">
                    <p className="text-xs font-medium text-foreground">Copy link</p>
                    <div className="flex items-center gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border/70 bg-secondary/20 px-3 py-2">
                            <Link2
                                size={14}
                                className="shrink-0 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <span
                                className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
                                title={shareUrl}
                            >
                                {shareUrl}
                            </span>
                        </div>
                        <Button
                            variant={copied ? "secondary" : "primary"}
                            size="sm"
                            onClick={handleCopyLink}
                            className="shrink-0"
                            id={`tweet-copy-link-${tweetId}`}
                        >
                            {copied ? (
                                <Check
                                    size={14}
                                    className="text-emerald-500"
                                    aria-hidden="true"
                                />
                            ) : (
                                <Copy size={14} aria-hidden="true" />
                            )}
                            <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
