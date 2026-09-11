"use client";

import { useForm } from "react-hook-form";
import { UserCheck, Loader2 } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";

export function UnblockUserModal({ isOpen, onClose, user, onConfirm, loading }) {
    const {
        register,
        handleSubmit,
        reset,
    } = useForm({
        defaultValues: {
            reason: "Admin unblock after review",
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
            title={`Unblock Account: ${user.name || user.handle || user.id}`}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
                    <p className="font-semibold text-emerald-200">Restore Account Access</p>
                    <p className="mt-1 text-emerald-300/80 leading-relaxed">
                        Unblocking will restore access to all platform features for this user. Their previous tweets, videos, followers, and direct messages remain intact.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="unblock-reason" className="text-xs font-semibold text-foreground">
                        Restoration Note (Optional)
                    </label>
                    <input
                        id="unblock-reason"
                        type="text"
                        placeholder="e.g. Account reinstated after appeal"
                        {...register("reason")}
                        className="w-full rounded-xl border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
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
                        size="sm"
                        disabled={loading}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {loading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <UserCheck size={14} />
                        )}
                        Confirm Unblock
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
