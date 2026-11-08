import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-zinc-900 dark:text-zinc-100 shadow-xl transition-all",
          className
        )}
      >
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-5">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">{title}</h2>
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white h-7 w-7 p-0 rounded-lg"
          >
            ✕
          </Button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
