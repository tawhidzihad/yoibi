"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldAlert, AlertOctagon, Loader2, CheckCircle2 } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";

export function BanUserModal({ isOpen, onClose, user, onConfirm, loading }) {
    const [confirmInput, setConfirmInput] = useState("");
    const rawTargetHandle = user?.handle ? user.handle.replace(/^@/, "") : "";

    const banSchema = z.object({
        reason: z
            .string()
            .min(5, "Please provide a detailed reason for the permanent ban (minimum 5 characters).")
            .max(500, "Reason cannot exceed 500 characters."),
        confirmationHandle: z
            .string()
            .min(1, "You must enter the target user handle to confirm.")
            .refine(
                (val) => val.trim().replace(/^@/, "").toLowerCase() === rawTargetHandle.toLowerCase(),
                `Handle must exactly match "${rawTargetHandle}".`
            ),
    });

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(banSchema),
        defaultValues: {
            reason: "",
            confirmationHandle: "",
        },
    });

    const isHandleMatched = confirmInput.trim().replace(/^@/, "").toLowerCase() === rawTargetHandle.toLowerCase();

    const onSubmit = async (data) => {
        const res = await onConfirm({
            reason: data.reason,
            confirmationHandle: rawTargetHandle,
        });
        if (res?.success) {
            reset();
            setConfirmInput("");
            onClose();
        }
    };

    const handleClose = () => {
        reset();
        setConfirmInput("");
        onClose();
    };

    if (!user) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`PERMANENT BAN: @${rawTargetHandle}`}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Critical Warning Callout */}
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
                    <div className="flex items-start gap-3">
                        <AlertOctagon size={20} className="mt-0.5 shrink-0 text-destructive" />
                        <div className="space-y-2">
                            <p className="font-bold text-sm text-destructive">
                                Irreversible Destruction Warning
                            </p>
                            <p className="text-destructive/90 leading-relaxed">
                                Executing a Ban invokes the canonical 5-phase data purge orchestrator. This action <strong>cannot be undone or restored</strong>:
                            </p>
                            <ul className="list-disc pl-4 space-y-1 text-destructive/90 font-medium">
                                <li>The Better Auth user account and authentication sessions are permanently destroyed.</li>
                                <li>All owned Tweets and replies are permanently deleted, repairing parent reply counters.</li>
                                <li>All owned Videos and associated Cloudinary assets are permanently purged.</li>
                                <li>Active LiveKit broadcast and Meet-Up rooms are immediately terminated and deleted.</li>
                                <li>Follow relationships are bidirectionally severed and counters repaired.</li>
                                <li>Moderation reports are permanently preserved for legal and audit history.</li>
                                <li>A permanent audit log entry is finalized.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Reason Input */}
                <div className="space-y-1.5">
                    <label htmlFor="ban-reason" className="text-xs font-semibold text-foreground">
                        Detailed Ban Reason <span className="text-destructive">*</span>
                    </label>
                    <textarea
                        id="ban-reason"
                        rows={3}
                        placeholder="State the specific safety/terms violations justifying permanent erasure..."
                        {...register("reason")}
                        className="w-full rounded-xl border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
                    />
                    {errors.reason && (
                        <p className="text-xs text-destructive">{errors.reason.message}</p>
                    )}
                </div>

                {/* Confirmation Handle Input */}
                <div className="space-y-1.5 rounded-xl border border-border/50 bg-secondary/30 p-3.5">
                    <label htmlFor="confirm-handle" className="text-xs font-semibold text-foreground">
                        Type <code className="bg-secondary px-1.5 py-0.5 rounded text-cyan-400 font-bold">{rawTargetHandle}</code> to confirm:
                    </label>
                    <div className="relative">
                        <input
                            id="confirm-handle"
                            type="text"
                            placeholder={rawTargetHandle}
                            value={confirmInput}
                            onChange={(e) => {
                                setConfirmInput(e.target.value);
                                setValue("confirmationHandle", e.target.value, { shouldValidate: true });
                            }}
                            className="w-full rounded-xl border border-border/60 bg-secondary/50 px-3 py-2 pr-9 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
                        />
                        {isHandleMatched && (
                            <CheckCircle2 size={16} className="absolute right-3 top-3 text-emerald-400" />
                        )}
                    </div>
                    {errors.confirmationHandle && (
                        <p className="text-xs text-destructive">{errors.confirmationHandle.message}</p>
                    )}
                </div>

                {/* Actions */}
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
                        disabled={loading || !isHandleMatched}
                        className="gap-2 bg-destructive hover:bg-destructive/90 text-white font-bold cursor-pointer"
                    >
                        {loading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <ShieldAlert size={14} />
                        )}
                        Permanently Purge & Ban Account
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
