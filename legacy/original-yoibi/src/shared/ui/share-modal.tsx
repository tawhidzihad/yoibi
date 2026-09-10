import { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  Link2,
  Copy,
  Check,
  Mail,
  AtSign,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ShareOption {
  icon: LucideIcon;
  label: string;
  action: () => void;
}

interface ShareModalProps {
  content: { id: number; text: string };
  urlPrefix?: string;
  onClose: () => void;
}

export function ShareModal({ content, urlPrefix = "post", onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const fakeUrl = `https://yoibi.com/${urlPrefix}/${content.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fakeUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions: ShareOption[] = [
    { icon: Link2, label: "Copy Link", action: handleCopy },
    { icon: Mail, label: "Email", action: () => {} },
    { icon: AtSign, label: "Twitter / X", action: () => {} },
    { icon: Send, label: "Direct Message", action: () => {} },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Share Post</h3>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-secondary/50 p-3">
          <p className="line-clamp-2 text-sm text-foreground/80">{content.text}</p>
        </div>

        <div className="space-y-1">
          {shareOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
            >
              <opt.icon size={18} className="text-muted-foreground" />
              {opt.label === "Copy Link" && copied ? (
                <span className="flex items-center gap-1.5 text-green-400">
                  <Check size={14} /> Copied!
                </span>
              ) : (
                opt.label
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <span className="flex-1 truncate text-xs text-muted-foreground">
            {fakeUrl}
          </span>
          <button
            onClick={handleCopy}
            className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
