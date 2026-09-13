"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Video, Radio, RefreshCw, Sparkles } from "lucide-react";
import { meetupApi } from "../api/meetupApi";
import { MeetupList } from "./MeetupList";
import { CreateMeetupModal } from "./CreateMeetupModal";
import { Button } from "@/shared/ui/Button";

export function MeetupView() {
    const [statusFilter, setStatusFilter] = useState("active");
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await meetupApi.getMeetupRooms({
                    status: statusFilter,
                    page: 1,
                    limit: 12
                });
                if (isCancelled) return;
                const items = res.data?.rooms || res.data?.items || [];
                const pagination = res.data?.pagination || {};
                setRooms(items);
                setPage(1);
                setHasNextPage(Boolean(pagination.page < pagination.totalPages));
            } catch (err) {
                if (isCancelled) return;
                setError(err?.response?.data?.error?.message || err?.message || "Failed to load Meet-Up rooms.");
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        }

        load();
        return () => {
            isCancelled = true;
        };
    }, [statusFilter]);

    const handleRefresh = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await meetupApi.getMeetupRooms({
                status: statusFilter,
                page: 1,
                limit: 12
            });
            const items = res.data?.rooms || res.data?.items || [];
            const pagination = res.data?.pagination || {};
            setRooms(items);
            setPage(1);
            setHasNextPage(Boolean(pagination.page < pagination.totalPages));
        } catch (err) {
            setError(err?.response?.data?.error?.message || err?.message || "Failed to refresh Meet-Up rooms.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadMore = async () => {
        if (isLoadingMore || !hasNextPage) return;
        setIsLoadingMore(true);
        const nextPage = page + 1;
        try {
            const res = await meetupApi.getMeetupRooms({
                status: statusFilter,
                page: nextPage,
                limit: 12
            });
            const items = res.data?.rooms || res.data?.items || [];
            const pagination = res.data?.pagination || {};
            setRooms((prev) => [...prev, ...items]);
            setPage(nextPage);
            setHasNextPage(Boolean(pagination.page < pagination.totalPages));
        } catch (err) {
            setError(err?.response?.data?.error?.message || err?.message || "Failed to load more rooms.");
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleRoomCreated = (newRoom) => {
        // Prepend newly created room if on active tab
        if (statusFilter === "active" || statusFilter === "all") {
            setRooms((prev) => [newRoom, ...prev]);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
            {/* Header Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/20 shadow-sm">
                            <Video size={19} aria-hidden="true" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                            Meet Up
                        </h1>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                        Connect and meet live
                    </p>
                </div>

                <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
                    <Button
                        id="refresh-meetups-btn"
                        size="sm"
                        variant="ghost"
                        onClick={handleRefresh}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        title="Refresh rooms"
                    >
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} aria-hidden="true" />
                        <span className="sr-only">Refresh rooms</span>
                    </Button>

                    <Button
                        id="create-meetup-btn"
                        size="sm"
                        variant="primary"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="shadow-lg shadow-cyan-500/20 gap-1.5 whitespace-nowrap"
                    >
                        <Plus size={15} aria-hidden="true" />
                        <span className="whitespace-nowrap">Start Meet-Up</span>
                    </Button>
                </div>
            </div>

            {/* Status Tabs Toolbar */}
            <div className="flex items-center gap-2 border-b border-border/40 pb-3 overflow-x-auto no-scrollbar">
                <button
                    type="button"
                    onClick={() => setStatusFilter("active")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        statusFilter === "active"
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent"
                    }`}
                >
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" aria-hidden="true" />
                    <span>Active Rooms</span>
                </button>

                <button
                    type="button"
                    onClick={() => setStatusFilter("ended")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        statusFilter === "ended"
                            ? "bg-secondary text-foreground border border-border shadow-sm"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent"
                    }`}
                >
                    <Radio size={13} className="shrink-0" aria-hidden="true" />
                    <span>Past Rooms</span>
                </button>
            </div>

            {/* Room List */}
            <MeetupList
                rooms={rooms}
                isLoading={isLoading}
                error={error}
                onRetry={handleRefresh}
                onCreateClick={() => setIsCreateModalOpen(true)}
                hasNextPage={hasNextPage}
                onLoadMore={handleLoadMore}
                isLoadingMore={isLoadingMore}
            />

            {/* Create Modal */}
            <CreateMeetupModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={handleRoomCreated}
            />
        </div>
    );
}
