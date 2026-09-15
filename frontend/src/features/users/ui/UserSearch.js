"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, UserX } from "lucide-react";
import { usersApi } from "../api/usersApi";
import { Avatar } from "@/shared/ui/Avatar";
import { EmptyState } from "@/shared/feedback/EmptyState";
import { ErrorState } from "@/shared/feedback/ErrorState";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_LIMIT = 10;

/**
 * Loading skeleton for a search result row — same idiom as the other
 * feature skeletons (TweetSkeleton, StreamCardSkeleton, ...).
 */
function SearchResultSkeleton() {
    return (
        <div className="flex items-center gap-3 p-3 animate-pulse">
            <div className="h-10 w-10 shrink-0 rounded-full bg-secondary/80" />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 w-28 rounded bg-secondary/80" />
                <div className="h-3 w-20 rounded bg-secondary/60" />
            </div>
        </div>
    );
}

function SearchResultsList({ users }) {
    return (
        <ul className="divide-y divide-border/50" aria-label="People search results">
            {users.map((user) => {
                const handle = user.handle ? String(user.handle).replace(/^@/, "").trim() : "";
                return (
                    <li key={user.id || handle}>
                        <Link
                            href={handle ? `/profile/${handle}` : "/feed"}
                            className="flex items-center gap-3 p-3 transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 rounded-lg"
                        >
                            <Avatar
                                src={user.avatarUrl || ""}
                                name={user.name || ""}
                                handle={handle}
                                size={40}
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {user.name || handle || "User"}
                                </p>
                                {handle && (
                                    <p className="truncate text-xs text-muted-foreground">
                                        @{handle}
                                    </p>
                                )}
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * People search — ONE shared search bar for desktop and mobile.
 *
 * Variants (only the results container differs; search logic, styling,
 * skeleton, result rows, and empty/error states are identical):
 *   - "inline"   (desktop right sidebar): results render in the column,
 *                 directly below the search bar.
 *   - "dropdown" (mobile top bar): results render in a scrollable panel
 *                 anchored to the top, directly under the search bar —
 *                 never a centered modal.
 *
 * @param {Object} props
 * @param {"inline"|"dropdown"} [props.variant] - Results container placement.
 * @param {import("react").ReactNode} [props.idleContent] - Rendered below the
 *   search bar while no query is active (desktop sidebar usage).
 */
export function UserSearch({ variant = "inline", idleContent = null }) {
    const [query, setQuery] = useState("");
    const [deferredQuery, setDeferredQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [retryToken, setRetryToken] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const requestIdRef = useRef(0);
    const rootRef = useRef(null);

    const trimmedQuery = deferredQuery.trim();
    const isDropdown = variant === "dropdown";

    // Debounce keystrokes so typing does not spam the search endpoint.
    useEffect(() => {
        const timer = setTimeout(() => setDeferredQuery(query), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [query]);

    // Dropdown only: a tap outside the search area dismisses the results
    // panel; typing again or re-focusing the bar brings it straight back.
    useEffect(() => {
        if (!isDropdown) return undefined;
        const handlePointerDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setDismissed(true);
            }
        };
        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [isDropdown]);

    useEffect(() => {
        async function search() {
            // An empty query never reaches the API; the latest request id also
            // cancels any in-flight response for the previous query.
            const requestId = ++requestIdRef.current;
            if (!trimmedQuery) return;

            setLoading(true);
            setError("");
            const res = await usersApi.searchUsers(trimmedQuery, SEARCH_LIMIT);
            // Ignore stale/out-of-order responses (fast typing, cleared input).
            if (requestIdRef.current !== requestId) return;
            setLoading(false);
            if (res.success && res.data) {
                setUsers(Array.isArray(res.data.users) ? res.data.users : []);
            } else {
                setUsers([]);
                setError(res.error?.message || "Search is unavailable right now. Please try again.");
            }
        }

        search().catch(() => {
            setLoading(false);
            setError("Search is unavailable right now. Please try again.");
        });
    }, [trimmedQuery, retryToken]);

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
        setDismissed(false);
    };

    const showResults = Boolean(trimmedQuery) && !(isDropdown && dismissed);

    // Shared search bar — the single styling source for desktop AND mobile.
    // Plain text input: no native clear/"x" button on any platform.
    const searchBar = (
        <div className="relative w-full">
            <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                onFocus={isDropdown ? () => setDismissed(false) : undefined}
                placeholder="Search people"
                aria-label="Search people by name or username"
                className="w-full rounded-full border border-border bg-secondary/50 py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-cyan-500 focus:bg-background focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
        </div>
    );

    // Shared results body — skeleton / error / empty / result rows.
    const resultsBody = loading ? (
        <div className="divide-y divide-border/50">
            <SearchResultSkeleton />
            <SearchResultSkeleton />
            <SearchResultSkeleton />
        </div>
    ) : error ? (
        <div className="p-3">
            <ErrorState
                title="Search failed"
                message={error}
                onRetry={() => setRetryToken((n) => n + 1)}
            />
        </div>
    ) : users.length === 0 ? (
        <div className="p-3">
            <EmptyState
                icon={UserX}
                title="No people found"
                description={`No one on YOIBI matches "${trimmedQuery}". Try a different name or username.`}
            />
        </div>
    ) : (
        <SearchResultsList users={users} />
    );

    // Desktop — inline results in the sidebar column (unchanged behavior).
    if (!isDropdown) {
        return (
            <div className="flex flex-col gap-3">
                {searchBar}
                {showResults ? (
                    <div aria-busy={loading} className="overflow-hidden rounded-xl border border-border/50 bg-card">
                        {resultsBody}
                    </div>
                ) : (
                    idleContent
                )}
            </div>
        );
    }

    // Mobile — dropdown panel anchored to the top, flush under the search
    // bar (the parent stretches to the header height, so top-full sits at
    // the header's bottom edge), aligned to the search bar's width.
    return (
        <div ref={rootRef} className="relative flex h-full w-full items-center">
            {searchBar}
            {showResults ? (
                <div
                    aria-busy={loading}
                    aria-label="People search results"
                    className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain rounded-b-2xl border border-t-0 border-border/60 bg-card shadow-xl animate-dropdown-in"
                >
                    {resultsBody}
                </div>
            ) : null}
        </div>
    );
}
