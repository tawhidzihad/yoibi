"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserX, AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";

const blockSchema = z.object({
    reason: z
        .string()
        .min(3, "Please provide a reason (minimum 3 characters).")
        .max(500, "Reason cannot exceed 500 characters."),
});

export function BlockUserModal({ isOpen, onClose, user, onConfirm, loading }) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(blockSchema),
        defaultValues: {
            reason: "",
        },
    });

    const onSubmit = async (data) => {
        const res = await onConfirm(data.reason);
        if (res?.success) {
            reset();
            onClose();
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!user) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Block Account: ${user.name || user.handle || user.id}`}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
                    <div className="flex items-start gap-2.5">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                        <div>
                            <p className="font-semibold text-amber-200">Reversible Suspension</p>
                            <p className="mt-1 text-amber-300/80 leading-relaxed">
                                Blocking suspends the user&apos;s active sessions and prevents access. All tweets, videos, followers, and messages will be preserved. You can unblock this user at any time.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="block-reason" className="text-xs font-semibold text-foreground">
                        Suspension Reason <span className="text-destructive">*</span>
                    </label>
                    <textarea
                        id="block-reason"
                        rows={3}
                        placeholder="e.g. Inappropriate behavior in Meet-Up rooms, pending investigation"
                        {...register("reason")}
                        className="w-full rounded-xl border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    {errors.reason && (
                        <p className="text-xs text-destructive">{errors.reason.message}</p>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        disabled={loading}
                        className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        {loading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <UserX size={14} />
                        )}
                        Confirm Block
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
