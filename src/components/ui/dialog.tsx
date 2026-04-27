import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
} as const;

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="dialog-overlay"
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            key="dialog-panel"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl",
              sizeMap[size],
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border/50 px-6 pb-4 pt-5">
              <div>
                <h2 className="font-serif text-2xl font-light leading-tight tracking-tight">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-border/60 bg-background/40 text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-border/50 bg-background/40 px-6 py-3">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-stone-700/50 dark:focus:border-stone-300/50";

export const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50";

export const buttonGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/40 px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-background/70";

export const buttonDanger =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-red-700/40 bg-red-600/10 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-600/20 dark:text-red-300";
