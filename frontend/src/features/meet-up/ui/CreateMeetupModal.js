"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Video, Users, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { meetupApi } from "../api/meetupApi";

const createMeetupSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Room name must be at least 3 characters")
        .max(100, "Room name cannot exceed 100 characters"),
    topic: z
        .string()
        .trim()
        .max(100, "Topic cannot exceed 100 characters")
        .optional()
        .default(""),
    maxParticipants: z.coerce
        .number()
        .int("Participants must be an integer")
        .min(2, "Minimum participants is 2")
        .max(50, "Maximum participants is 50")
        .default(12)
});

export function CreateMeetupModal({ isOpen, onClose, onCreated }) {
    const router = useRouter();
    const [serverError, setServerError] = useState(null);
    const [maxParticipants, setMaxParticipants] = useState(12);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(createMeetupSchema),
        defaultValues: {
            name: "",
            topic: "",
            maxParticipants: 12
        }
    });

    if (!isOpen) return null;

    async function onSubmit(data) {
        setServerError(null);
        try {
            const res = await meetupApi.createMeetupRoom({
                name: data.name.trim(),
                topic: data.topic ? data.topic.trim() : "",
                maxParticipants: Number(data.maxParticipants || maxParticipants)
            });

            const createdRoom = res.data?.room || res.data;
            const roomId = createdRoom?.id || createdRoom?._id;

            reset();
            onClose();

            if (onCreated) {
                onCreated(createdRoom);
            }

            if (roomId) {
                router.push(`/meetup/${roomId}`);
            }
        } catch (err) {
            const errorMsg =
                err?.response?.data?.error?.message ||
                err?.message ||
                "Failed to create Meet-Up room. Please check inputs and try again.";
            setServerError(errorMsg);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Dialog */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-card/95 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                    aria-label="Close modal"
                >
                    <X size={18} aria-hidden="true" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/20 shadow-inner">
                        <Video size={22} aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Create Meet-Up Room</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Realtime collaborative audio, video, and screen sharing
                        </p>
                    </div>
                </div>

                {serverError && (
                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                        {serverError}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5">
                    {/* Room Name */}
                    <div>
                        <label htmlFor="meetup-name" className="block text-xs font-semibold text-foreground mb-1.5">
                            Room Name <span className="text-cyan-400">*</span>
                        </label>
                        <input
                            id="meetup-name"
                            type="text"
                            placeholder="e.g. Design Critique & Architecture Jam"
                            {...register("name")}
                            className="w-full rounded-xl border border-white/10 bg-background/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Topic (Optional) */}
                    <div>
                        <label htmlFor="meetup-topic" className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                            <span>Topic / Focus</span>
                            <span className="text-[11px] text-muted-foreground font-normal">Optional</span>
                        </label>
                        <input
                            id="meetup-topic"
                            type="text"
                            placeholder="e.g. Next.js 15, State Management, UI/UX"
                            {...register("topic")}
                            className="w-full rounded-xl border border-white/10 bg-background/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        />
                        {errors.topic && (
                            <p className="mt-1 text-xs text-red-400">{errors.topic.message}</p>
                        )}
                    </div>

                    {/* Max Participants Slider */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="meetup-max-participants" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Users size={13} className="text-cyan-400" aria-hidden="true" />
                                Max Capacity
                            </label>
                            <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/20">
                                {maxParticipants} Participants
                            </span>
                        </div>
                        <input
                            id="meetup-max-participants"
                            type="range"
                            min={2}
                            max={50}
                            step={1}
                            value={maxParticipants}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setMaxParticipants(val);
                                setValue("maxParticipants", val);
                            }}
                            className="w-full accent-cyan-400 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            <span>2 (Duo)</span>
                            <span>12 (Standard)</span>
                            <span>50 (Large)</span>
                        </div>
                        {errors.maxParticipants && (
                            <p className="mt-1 text-xs text-red-400">{errors.maxParticipants.message}</p>
                        )}
                    </div>

                    {/* Architecture Notice */}
                    <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2.5">
                        <Sparkles size={14} className="text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>
                            You will join as the room host with interactive media permissions. When you leave, the room stays active for peers until you explicitly end it.
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            id="submit-create-meetup-btn"
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={isSubmitting}
                            className="shadow-lg shadow-cyan-500/20 min-w-[130px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="mr-2 animate-spin" aria-hidden="true" />
                                    Creating...
                                </>
                            ) : (
                                "Create & Enter"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
