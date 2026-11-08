import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono",
  {
    variants: {
      variant: {
        default:
          "border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100",
        secondary:
          "border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300",
        destructive:
          "border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300",
        outline:
          "border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300",
        success:
          "border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300",
        warning:
          "border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300",
        info:
          "border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
